/**
 * 全域指標狀態：只註冊一次 pointermove，供游標、磁吸按鈕、hover 光暈、星空視差共用。
 * nx / ny 為相對視窗中心的正規化座標（-1 ~ 1）。
 */
export const pointer = { x: 0, y: 0, nx: 0, ny: 0, moved: false, type: 'mouse' as string };

type Sub = (e: PointerEvent) => void;
const subs = new Set<Sub>();

export function onPointerMove(fn: Sub): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}

let started = false;
export function startPointerTracking(): void {
  if (started) return;
  started = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.moved = true;
      pointer.type = e.pointerType;
      subs.forEach((fn) => fn(e));
    },
    { passive: true },
  );
}
