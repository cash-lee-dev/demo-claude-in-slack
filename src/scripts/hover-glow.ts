/**
 * hover 光暈：把游標在元素內的位置寫成 --mx / --my，CSS 用 radial-gradient 畫出跟隨游標的光。
 * 套用在 .btn / .card / .nav-dropdown__item / [data-glow]。單一委派的 pointermove，只註冊一次。
 */
import { onPointerMove } from './pointer';

const SELECTOR = '.btn, .card, .nav-dropdown__item, [data-glow]';
let started = false;

export function initHoverGlow(): void {
  if (started) return;
  started = true;
  onPointerMove((e) => {
    const el = (e.target as Element | null)?.closest?.<HTMLElement>(SELECTOR);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}
