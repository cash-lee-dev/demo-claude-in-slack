/**
 * 首頁（CTCC-14）的屏內互動。由 pages/index.astro 引入（模組只執行一次；換頁後 onScreensReady 會再呼叫）。
 *   - 軌道行星：hover（滑鼠）/ 點選（觸控）/ 聚焦（鍵盤）切換選取的行星與簡介
 *   - 軌道視差：只在 (hover: hover) and (pointer: fine) 且非 reduced-motion 時啟用（共用 pointer.ts 的單一 pointermove）
 *   - 首屏「向下探索」：呼叫引擎的 next()，不另外監聽 wheel / touch / 鍵盤
 * 其餘動畫（逐字、節點匯聚、徽章）都是 CSS（依 [data-state] 觸發）或引擎的 data-split / data-enter。
 */
import { gsap } from './gsap';
import { hasFinePointer, prefersReducedMotion } from './motion';
import { onPointerMove } from './pointer';
import { onScreensReady } from './screens';

onScreensReady((engine) => {
  const cleanups: Array<() => void> = [];
  const root = engine.root;

  // ── 向下探索 ────────────────────────────────────────────────────
  root.querySelectorAll<HTMLElement>('[data-scroll-next]').forEach((btn) => {
    const onClick = () => void engine.next('api');
    btn.addEventListener('click', onClick);
    cleanups.push(() => btn.removeEventListener('click', onClick));
  });

  // ── Salesforce 生態系軌道 ────────────────────────────────────────
  const orbit = root.querySelector<HTMLElement>('[data-orbit]');
  if (orbit) {
    const buttons = [...orbit.querySelectorAll<HTMLButtonElement>('[data-planet]')];
    const infos = [...root.querySelectorAll<HTMLElement>('[data-planet-info]')];

    const select = (id: string) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.planet === id)));
      infos.forEach((i) => i.toggleAttribute('data-active', i.dataset.planetInfo === id));
    };

    buttons.forEach((btn) => {
      const id = btn.dataset.planet ?? '';
      const onEnter = (e: PointerEvent) => {
        if (e.pointerType === 'mouse') select(id); // 觸控沒有 hover，改由 click（點選展開）
      };
      const onSelect = () => select(id);
      btn.addEventListener('pointerenter', onEnter);
      btn.addEventListener('focus', onSelect);
      btn.addEventListener('click', onSelect);
      cleanups.push(() => {
        btn.removeEventListener('pointerenter', onEnter);
        btn.removeEventListener('focus', onSelect);
        btn.removeEventListener('click', onSelect);
      });
    });

    // 視差：每一層（行星軌道 / 核心）依 data-par 位移不同幅度，越外圈越明顯
    if (hasFinePointer()) {
      const layers = [...orbit.querySelectorAll<HTMLElement>('[data-par]')].map((el) => ({
        factor: Number(el.dataset.par) || 0,
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
        el,
      }));
      const off = onPointerMove((e) => {
        if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        for (const l of layers) {
          l.x(-nx * l.factor);
          l.y(-ny * l.factor);
        }
      });
      cleanups.push(() => {
        off();
        layers.forEach((l) => gsap.set(l.el, { clearProps: 'transform' }));
      });
    }
  }

  return () => cleanups.forEach((fn) => fn());
});
