/**
 * 星空背景控制器（全站只初始化一次；DOM 節點由 <Starfield /> 提供並以 transition:persist 保留）
 *
 * 載入策略（效能）：
 *   1. 首屏先靠 CSS 星空 + 星雲漸層呈現，文字立即可讀。
 *   2. window load 之後等瀏覽器 idle，才動態 import('./starfield-gl')（Three.js 在獨立 chunk）。
 *   3. 失敗（不支援 WebGL / 建立 context 失敗 / context lost）→ 維持 CSS 星空。
 *
 * 狀態以 data-starfield 屬性公開：pending → webgl | css
 */
import { gsap } from './gsap';
import { isMobileLike, onReducedMotionChange, prefersReducedMotion } from './motion';
import { onPointerMove, pointer } from './pointer';
import { warpState } from './warp';
import type { StarfieldGL } from './starfield-gl';

export const DESKTOP_STARS = 3000;
export const MOBILE_STARS = 1000;

let started = false;
let gl: StarfieldGL | null = null;

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    const ctx = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!ctx) return false;
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const whenIdle = (fn: () => void) => {
  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: { timeout: number }) => number);
  if (ric) ric(fn, { timeout: 2500 });
  else setTimeout(fn, 800);
};

export function initStarfield(): void {
  if (started) return;
  const host = document.getElementById('starfield');
  const canvas = host?.querySelector<HTMLCanvasElement>('canvas.sf-canvas');
  if (!host || !canvas) return;
  started = true;
  host.dataset.starfield = 'pending';

  // ── CSS 星雲 / 星點的滑鼠視差（WebGL 前後都適用，成本極低） ──
  const movers = [...host.querySelectorAll<HTMLElement>('.sf-px[data-px]')].map((el) => ({
    x: gsap.quickTo(el, 'x', { duration: 1.6, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 1.6, ease: 'power3.out' }),
    k: Number(el.dataset.px),
  }));
  onPointerMove(() => {
    if (prefersReducedMotion()) return;
    movers.forEach((m) => {
      m.x(pointer.nx * m.k);
      m.y(pointer.ny * m.k);
    });
  });

  const fallback = (reason: string) => {
    host.dataset.starfield = 'css';
    host.dataset.starfieldReason = reason;
  };

  const load = async () => {
    if (!webglAvailable()) return fallback('no-webgl');
    try {
      const mod = await import('./starfield-gl');
      const mobile = isMobileLike();
      const count = mobile ? MOBILE_STARS : DESKTOP_STARS;
      gl = mod.createStarfieldGL(canvas, {
        count,
        maxDpr: mobile ? 1.5 : 2,
        onLost: () => {
          gl?.dispose();
          gl = null;
          gsap.ticker.remove(tick);
          fallback('context-lost');
        },
      });
      host.dataset.starCount = String(count);
      host.dataset.starfield = 'webgl';
      gsap.ticker.add(tick);
      window.addEventListener('resize', onResize, { passive: true });
      onReducedMotionChange(() => gl?.renderStatic(pointer));
    } catch (err) {
      console.warn('[starfield] WebGL 初始化失敗，改用 CSS 星空', err);
      fallback('init-error');
    }
  };

  const tick = (_time: number, deltaMs: number) => {
    if (!gl) return;
    if (prefersReducedMotion()) return; // 靜態一幀，不跑動畫
    gl.render(Math.min(deltaMs, 50) / 1000, warpState, pointer, deltaMs / 1000);
  };
  const onResize = () => gl?.resize();

  const start = () => whenIdle(load);
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

/** 供除錯 / 測試：目前星空狀態 */
export const getStarfieldStatus = () => ({
  mode: document.getElementById('starfield')?.dataset.starfield ?? 'none',
  stars: Number(document.getElementById('starfield')?.dataset.starCount ?? 0),
});
