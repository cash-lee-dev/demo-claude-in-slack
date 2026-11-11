/**
 * 整頁切換引擎（Screen Engine）
 *
 * 一次切換一整屏：不可停在半屏、切換進行中忽略所有輸入。
 * 輸入來源：滾輪 / 觸控滑動（GSAP Observer）、鍵盤、屏數點、網址 hash、程式呼叫 goTo()。
 * 轉場語彙（與頁面間的 View Transition 一致）：星空曲速 + 圓形遮罩擴散 + 內容視差，
 * prefers-reduced-motion 時降級為單純淡入淡出。
 *
 * 屏的 DOM 約定與公開 API 請見 docs/architecture.md「整頁切換引擎」。
 */
import { gsap, Observer, SplitText } from '../gsap';
import { prefersReducedMotion } from '../motion';
import { kickWarp } from '../warp';
import { HookRegistry } from './hooks';
import type { ScreenContext, ScreenInfo, ScreenSource } from './types';

/** 屏切換總時長（秒），與 tokens.css 的 --dur-screen 同步 */
export const DURATION = 1.05;
/** 滾輪：同一次手勢累積多少 delta 才算一次切換（滑鼠滾輪一格約 100） */
const WHEEL_THRESHOLD = 40;
/** 滾輪：兩個事件間隔超過此毫秒，視為新的一次手勢（慣性滾動的尾巴間隔都很短） */
const WHEEL_GESTURE_GAP = 120;
/** 觸控：Observer 的滑動距離門檻（px） */
const SWIPE_TOLERANCE = 48;

type Origin = [number, number]; // 遮罩擴散中心（視窗百分比）
const CENTER: Origin = [50, 52];
const DOTS_ORIGIN: Origin = [96, 50];

const emit = (name: string, detail: unknown) => document.dispatchEvent(new CustomEvent(name, { detail }));

interface Group {
  el: HTMLElement;
  depth: number;
  kind: 'up' | 'fade' | 'scale';
  split?: SplitText;
  mode?: string;
}

export class ScreenEngine {
  readonly root: HTMLElement;
  readonly hooks = new HookRegistry();
  screens: ScreenInfo[] = [];
  index = -1;
  /** 單一鎖：切換進行中為 true，期間所有輸入都被忽略 */
  animating = false;
  /** 外部鎖（例如頁面正在導覽中） */
  locked = false;

  private tl: gsap.core.Timeline | null = null;
  private observer: Observer | null = null;
  private cleanups: Array<() => void> = [];
  private destroyed = false;
  private ring: HTMLElement | null = null;
  private hashEnabled = true;
  private gesture = { last: 0, consumed: false, acc: 0, touchConsumed: false };

  constructor(root: HTMLElement) {
    this.root = root;
  }

  get count(): number {
    return this.screens.length;
  }
  get current(): ScreenInfo | undefined {
    return this.screens[this.index];
  }

  // ── 初始化 ────────────────────────────────────────────────────────
  init(): void {
    const els = [...this.root.querySelectorAll<HTMLElement>('[data-screen]')];
    if (!els.length) return;
    this.hashEnabled = this.root.dataset.screenHash !== 'false';
    this.ring = document.getElementById('warp-ring');

    this.screens = els.map((el, i) => {
      if (!el.id) el.id = el.dataset.screen || `screen-${i + 1}`;
      const splits: SplitText[] = [];
      el.querySelectorAll<HTMLElement>('[data-split]').forEach((host) => {
        const mode = host.dataset.split || 'lines';
        splits.push(
          SplitText.create(host, {
            type: mode === 'chars' ? 'chars' : mode === 'words' ? 'words' : 'lines',
            mask: mode === 'lines' ? 'lines' : undefined,
            autoSplit: mode === 'lines',
            onSplit: () => undefined,
            charsClass: 'split-char',
            wordsClass: 'split-word',
            linesClass: 'split-line',
          }),
        );
      });
      el.setAttribute('tabindex', '-1');
      return { index: i, id: el.id, label: el.dataset.screenLabel || el.id, el, splits };
    });

    // 初始屏：網址 hash > 0
    const initial = this.indexFromHash() ?? 0;
    this.index = initial;
    this.screens.forEach((s, i) => this.setState(s, i === initial ? 'active' : 'idle'));
    this.syncRootAttrs();
    this.bindInput();

    const ctx = this.context(null, this.screens[initial], 1, 'init');
    this.hooks.run('beforeEnter', ctx.to, ctx);
    this.playIntro(ctx);
    this.root.setAttribute('data-ready', '');
    emit('screen:ready', ctx);
    emit('screen:enter', ctx);
    this.syncHash(true);
  }

  // ── 公開操作 ──────────────────────────────────────────────────────
  next(source: ScreenSource = 'api'): boolean {
    return this.goTo(this.index + 1, source);
  }
  prev(source: ScreenSource = 'api'): boolean {
    return this.goTo(this.index - 1, source);
  }

  /**
   * 切換到指定屏。被拒絕（切換中 / 被鎖定 / 索引無效 / 已在該屏）時回傳 false。
   * 一次切換就是一次完整的轉場，即使跨多屏（例如點屏數點）也只做一次。
   */
  goTo(target: number, source: ScreenSource = 'api', origin?: Origin): boolean {
    if (this.destroyed || this.animating || this.isBlocked()) return false;
    if (!Number.isInteger(target) || target < 0 || target >= this.count || target === this.index) return false;

    const from = this.screens[this.index];
    const to = this.screens[target];
    const direction: 1 | -1 = target > this.index ? 1 : -1;
    const ctx = this.context(from, to, direction, source);
    this.animating = true;
    this.index = target;
    this.root.setAttribute('data-screen-animating', '');

    // 狀態與無障礙：離開的屏立刻 inert，進入的屏立刻可被輔助科技讀到
    const hadFocus = this.root.contains(document.activeElement) && document.activeElement !== document.body;
    this.setState(from, 'leaving');
    this.setState(to, 'entering');
    from.el.style.zIndex = '1';
    to.el.style.zIndex = '2';
    this.syncRootAttrs();
    this.syncHash();

    this.hooks.run('beforeEnter', to, ctx);
    emit('screen:leave', ctx);
    emit('screen:enter', ctx);

    this.tl?.kill();
    const tl = gsap.timeline({ onComplete: () => this.finish(ctx, hadFocus) });
    this.tl = tl;
    if (ctx.reduced) this.buildReduced(tl, ctx);
    else this.buildTransition(tl, ctx, origin ?? (source === 'dot' ? DOTS_ORIGIN : CENTER));
    return true;
  }

  /** 解除所有監聽、動畫與 SplitText，還原 DOM。換頁（astro:before-swap）時由外部呼叫。 */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.tl?.kill();
    this.observer?.kill();
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.screens.forEach((s) => {
      s.splits.forEach((sp) => sp.revert());
      gsap.killTweensOf(s.el);
    });
    this.hooks.clear();
    emit('screen:destroy', { engine: this });
  }

  // ── 輸入 ──────────────────────────────────────────────────────────
  private isBlocked(): boolean {
    return this.locked || document.documentElement.hasAttribute('data-ui-lock');
  }

  private bindInput(): void {
    const g = this.gesture;

    // 滾輪 + 觸控：GSAP Observer（preventDefault 阻擋原生捲動 / 下拉重整）
    this.observer = Observer.create({
      target: window,
      type: 'wheel,touch',
      wheelSpeed: -1,
      tolerance: SWIPE_TOLERANCE,
      dragMinimum: 6,
      preventDefault: true,
      allowClicks: true,
      ignore: '[data-no-screen-nav], input, textarea, select',
      onPress: () => {
        g.touchConsumed = false;
      },
      onWheel: (self) => this.onWheel(self.event as WheelEvent),
      onUp: (self) => this.onSwipe(self, 1),
      onDown: (self) => this.onSwipe(self, -1),
    });

    const onKey = (e: KeyboardEvent) => this.onKey(e);
    window.addEventListener('keydown', onKey);
    this.cleanups.push(() => window.removeEventListener('keydown', onKey));

    const onHash = () => {
      const i = this.indexFromHash();
      if (i !== null && i !== this.index) this.goTo(i, 'hash');
    };
    window.addEventListener('hashchange', onHash);
    this.cleanups.push(() => window.removeEventListener('hashchange', onHash));

    // 同頁 hash 連結（例如導覽列「解決方案」下拉、頁內按鈕）：
    // Astro 對同頁 hash 只會 pushState，不會觸發 hashchange，所以在捕獲階段自己接手。
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!a || a.target === '_blank' || !a.hash) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname !== location.pathname) return;
      const i = this.indexFromHash(u.hash);
      if (i === null) return;
      e.preventDefault();
      if (i !== this.index) this.goTo(i, 'hash');
    };
    document.addEventListener('click', onClick, true);
    this.cleanups.push(() => document.removeEventListener('click', onClick, true));

    // 保險：scrollIntoView / 瀏覽器定位到錨點時，不讓容器真的被捲動
    const onScroll = () => {
      if (this.root.scrollTop || this.root.scrollLeft) this.root.scrollTo(0, 0);
    };
    this.root.addEventListener('scroll', onScroll, { passive: true });
    this.cleanups.push(() => this.root.removeEventListener('scroll', onScroll));
  }

  private onWheel(e: WheelEvent): void {
    const g = this.gesture;
    const now = performance.now();
    if (now - g.last > WHEEL_GESTURE_GAP) {
      g.consumed = false; // 事件之間出現空檔 = 新的一次手勢
      g.acc = 0;
    }
    g.last = now;
    if (g.consumed) return;
    if (this.animating || this.isBlocked()) {
      g.consumed = true; // 切換中的輸入屬於「當前手勢」，整段都忽略（含慣性尾巴）
      return;
    }
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    g.acc += e.deltaY * unit;
    if (Math.abs(g.acc) < WHEEL_THRESHOLD) return;
    const dir = g.acc > 0 ? 1 : -1;
    g.consumed = true;
    g.acc = 0;
    this.goTo(this.index + dir, 'wheel');
  }

  private onSwipe(self: Observer, dir: 1 | -1): void {
    const type = (self.event as Event | undefined)?.type ?? '';
    if (type === 'wheel') return; // 滾輪由 onWheel 處理
    const g = this.gesture;
    if (g.touchConsumed) return;
    g.touchConsumed = true; // 一次滑動只切一屏
    this.goTo(this.index + dir, 'touch');
  }

  private onKey(e: KeyboardEvent): void {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t) {
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (t.closest('[data-no-screen-keys]')) return;
    }
    const onControl = !!t?.closest('a[href], button, summary, [role="button"], [role="menuitem"]');
    let dir = 0;
    let to: number | null = null;
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        dir = 1;
        break;
      case 'ArrowUp':
      case 'PageUp':
        dir = -1;
        break;
      case ' ':
      case 'Spacebar':
        if (onControl) return; // 空白鍵在按鈕 / 連結上是「啟動」，不要攔截
        dir = e.shiftKey ? -1 : 1;
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = this.count - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (e.repeat) return;
    if (to !== null) this.goTo(to, 'key');
    else this.goTo(this.index + dir, 'key');
  }

  // ── 轉場 ──────────────────────────────────────────────────────────
  private context(from: ScreenInfo | null, to: ScreenInfo, direction: 1 | -1, source: ScreenSource): ScreenContext {
    return { engine: this, from, to, direction, source, reduced: prefersReducedMotion(), count: this.count };
  }

  /** 蒐集一屏裡需要入場動畫的群組（順序即 DOM 順序，不含巢狀重複） */
  private groups(s: ScreenInfo): Group[] {
    const hosts = [...s.el.querySelectorAll<HTMLElement>('[data-split], [data-enter]')];
    return hosts
      .filter((el) => !hosts.some((o) => o !== el && o.contains(el)))
      .map((el) => {
        const depth = parseFloat(el.closest<HTMLElement>('[data-depth]')?.dataset.depth ?? '1') || 1;
        const split = s.splits.find((sp) => sp.elements[0] === el);
        const kind = (el.dataset.enter as Group['kind']) || 'up';
        return { el, depth, kind: ['fade', 'scale'].includes(kind) ? kind : 'up', split, mode: el.dataset.split };
      });
  }

  /** 把一個群組的「入場」加到時間軸 */
  private addEnter(tl: gsap.core.Timeline, g: Group, d: 1 | -1, at: number, index: number): void {
    const start = at + index * 0.07;
    const dist = 64 * d * g.depth;
    if (g.split) {
      const sp = g.split as SplitText & { chars: Element[]; words: Element[]; lines: Element[] };
      if (g.mode === 'chars') {
        tl.fromTo(
          sp.chars,
          { opacity: 0, y: 36 * d * g.depth, scale: 1.45 },
          { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out', stagger: { amount: 0.55 } },
          start,
        );
      } else if (g.mode === 'words') {
        tl.fromTo(
          sp.words,
          { opacity: 0, y: 30 * d * g.depth },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: { amount: 0.4 } },
          start,
        );
      } else {
        tl.fromTo(
          sp.lines,
          { yPercent: 110 * d },
          { yPercent: 0, duration: 0.95, ease: 'power4.out', stagger: 0.09 },
          start,
        );
      }
      return;
    }
    const from: gsap.TweenVars = g.kind === 'fade' ? { opacity: 0 } : g.kind === 'scale' ? { opacity: 0, scale: 0.88 } : { opacity: 0, y: dist };
    tl.fromTo(g.el, from, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' }, start);
  }

  /** 初次進場（載入頁面 / 頁面轉場後）：只做內容入場 + 輕微減速的曲速 */
  private playIntro(ctx: ScreenContext): void {
    const s = ctx.to;
    if (ctx.reduced) {
      this.groups(s).forEach((g) => gsap.set(g.split ? this.splitTargets(g) : g.el, { clearProps: 'all' }));
      return;
    }
    const tl = gsap.timeline();
    this.tl = tl;
    this.groups(s).forEach((g, i) => this.addEnter(tl, g, 1, 0.12, i));
    this.hooks.run('enter', s, ctx).forEach((a) => tl.add(a, 0.12));
    kickWarp(0.9, 1.5, 1);
  }

  private splitTargets(g: Group): Element[] {
    const sp = g.split as unknown as { chars: Element[]; words: Element[]; lines: Element[] };
    return g.mode === 'chars' ? sp.chars : g.mode === 'words' ? sp.words : sp.lines;
  }

  private buildTransition(tl: gsap.core.Timeline, ctx: ScreenContext, origin: Origin): void {
    const { from, to, direction: d } = ctx;
    const [ox, oy] = origin;
    const ease = 'power3.inOut';

    // 1. 星空曲速（向前 / 向後）
    kickWarp(1, DURATION + 0.1, d);

    // 2. 離開：整屏往鏡頭飛出（放大 + 淡出 + 模糊），內容依 depth 各自視差位移
    if (from) {
      tl.to(from.el, { scale: d > 0 ? 1.16 : 0.9, opacity: 0, filter: 'blur(7px)', duration: 0.7, ease: 'power2.in' }, 0);
      this.groups(from).forEach((g) => {
        const targets = g.split ? this.splitTargets(g) : g.el;
        tl.to(targets, { y: -48 * d * g.depth, duration: 0.7, ease: 'power2.in' }, 0);
      });
      this.hooks.run('leave', from, ctx).forEach((a) => tl.add(a, 0));
    }

    // 3. 進入：圓形遮罩從 origin 擴散，並帶出光環
    const at = 0.18;
    tl.fromTo(
      to.el,
      { clipPath: `circle(0% at ${ox}% ${oy}%)`, scale: d > 0 ? 0.92 : 1.08, opacity: 1 },
      { clipPath: `circle(100% at ${ox}% ${oy}%)`, scale: 1, duration: DURATION - at, ease },
      at,
    );
    if (this.ring) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const R = Math.hypot(w, h) / Math.SQRT2; // clip-path circle(100%) 的實際半徑
      gsap.set(this.ring, { width: R * 2, height: R * 2, left: (ox / 100) * w - R, top: (oy / 100) * h - R });
      tl.fromTo(this.ring, { scale: 0, opacity: 0.9 }, { scale: 1, duration: DURATION - at, ease }, at);
      tl.to(this.ring, { opacity: 0, duration: (DURATION - at) * 0.6, ease: 'power1.in' }, at + (DURATION - at) * 0.4);
    }

    // 4. 進入的內容：逐字 / 逐行 / 視差入場
    this.groups(to).forEach((g, i) => this.addEnter(tl, g, d, at + 0.22, i));
    this.hooks.run('enter', to, ctx).forEach((a) => tl.add(a, at + 0.22));
    tl.set({}, {}, DURATION); // 確保時間軸至少長 DURATION
  }

  /** prefers-reduced-motion：單純交叉淡入淡出，不做曲速 / 遮罩 / 視差 / 逐字 */
  private buildReduced(tl: gsap.core.Timeline, ctx: ScreenContext): void {
    const { from, to } = ctx;
    this.groups(to).forEach((g) => gsap.set(g.split ? this.splitTargets(g) : g.el, { clearProps: 'all' }));
    if (from) tl.to(from.el, { opacity: 0, duration: 0.2, ease: 'none' }, 0);
    tl.fromTo(to.el, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0.12);
  }

  private finish(ctx: ScreenContext, hadFocus: boolean): void {
    const { from, to } = ctx;
    if (from) {
      this.setState(from, 'idle');
      gsap.set(from.el, { clearProps: 'transform,opacity,filter,clipPath,zIndex,scale' });
      this.groups(from).forEach((g) => gsap.set(g.split ? this.splitTargets(g) : g.el, { clearProps: 'transform,opacity,y,yPercent,scale' }));
    }
    this.setState(to, 'active');
    gsap.set(to.el, { clearProps: 'transform,opacity,filter,clipPath,zIndex,scale' });
    if (this.ring) gsap.set(this.ring, { opacity: 0, scale: 0 });
    if (hadFocus) to.el.focus({ preventScroll: true });
    this.animating = false;
    this.root.removeAttribute('data-screen-animating');
    this.hooks.run('afterLeave', from ?? to, ctx);
    this.hooks.run('afterEnter', to, ctx);
    emit('screen:change', ctx);
  }

  // ── 狀態同步 ──────────────────────────────────────────────────────
  private setState(s: ScreenInfo, state: 'active' | 'entering' | 'leaving' | 'idle'): void {
    s.el.dataset.state = state;
    const hidden = state === 'idle' || state === 'leaving';
    s.el.toggleAttribute('inert', hidden);
    s.el.setAttribute('aria-hidden', String(hidden));
  }

  private syncRootAttrs(): void {
    const s = this.screens[this.index];
    this.root.dataset.screenIndex = String(this.index);
    this.root.dataset.screenCount = String(this.count);
    this.root.dataset.screenId = s.id;
  }

  private indexFromHash(hash: string = location.hash): number | null {
    if (!this.hashEnabled) return null;
    const raw = decodeURIComponent(hash.slice(1));
    if (!raw) return null;
    const byId = this.screens.findIndex((s) => s.id === raw);
    if (byId >= 0) return byId;
    const m = /^screen-(\d+)$/.exec(raw);
    if (m && +m[1] >= 1 && +m[1] <= this.count) return +m[1] - 1;
    return null;
  }

  /** 把目前屏寫進網址 hash（replaceState：不新增歷史紀錄，並保留 Astro 存在 history.state 的資料） */
  private syncHash(initial = false): void {
    if (!this.hashEnabled) return;
    const s = this.screens[this.index];
    const wanted = this.index === 0 ? '' : `#${s.id}`;
    if (initial && this.index === 0 && !location.hash) return;
    if (location.hash === wanted || (!wanted && !location.hash)) return;
    try {
      history.replaceState(history.state, '', `${location.pathname}${location.search}${wanted}`);
    } catch {
      /* 忽略：例如 sandbox iframe */
    }
  }
}
