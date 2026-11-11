/**
 * 磁吸按鈕：帶有 [data-magnetic] 的元素，滑鼠靠近時會被「吸」向游標。
 *   <a class="btn" data-magnetic>…</a>           預設強度 0.35
 *   <a class="btn" data-magnetic="0.5">…</a>     自訂強度（0~1）
 * 觸控裝置與 prefers-reduced-motion 時停用。實作為單一全域 pointermove（事件委派），不對每個按鈕綁事件。
 */
import { gsap } from './gsap';
import { hasFinePointer, prefersReducedMotion } from './motion';
import { onPointerMove } from './pointer';

interface Item {
  el: HTMLElement;
  strength: number;
  x: (v: number) => void;
  y: (v: number) => void;
  active: boolean;
}

const RANGE = 64; // 距離按鈕邊緣多遠開始吸附（px）
let items: Item[] = [];
let started = false;

/** 每次頁面載入後重新蒐集 */
export function refreshMagnetic(): void {
  items.forEach((i) => gsap.set(i.el, { clearProps: 'transform' }));
  items = [];
  if (!hasFinePointer()) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    items.push({
      el,
      strength: Number(el.dataset.magnetic) || 0.35,
      x: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' }),
      y: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' }),
      active: false,
    });
  });
  document.documentElement.dataset.magnetic = items.length ? 'on' : 'off';
  if (started) return;
  started = true;
  onPointerMove((e) => {
    if (prefersReducedMotion() || e.pointerType !== 'mouse') return;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const inside =
        e.clientX > r.left - RANGE && e.clientX < r.right + RANGE && e.clientY > r.top - RANGE && e.clientY < r.bottom + RANGE;
      if (inside) {
        it.active = true;
        it.x((e.clientX - cx) * it.strength);
        it.y((e.clientY - cy) * it.strength);
      } else if (it.active) {
        it.active = false;
        it.x(0);
        it.y(0);
      }
    }
  });
}
