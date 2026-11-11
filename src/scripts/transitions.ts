/**
 * 頁面間轉場（Astro View Transitions / ClientRouter）的 JS 部分。
 * 視覺主要由 CSS（styles/screens.css 的 ::view-transition-*）負責；這裡處理：
 *   - 記錄點擊位置，讓新頁以圓形遮罩從點擊處擴散（--vt-x / --vt-y）
 *   - 導覽開始時鎖住目前的屏引擎、讓星空曲速（星空是 transition:persist，不會重建，所以曲速能跨頁連續）
 *   - 換頁後重新套用被 Astro 覆寫掉的 <html> 屬性
 */
import { prefersReducedMotion } from './motion';
import { applyWarpVar, kickWarp } from './warp';
import { getEngine } from './screens';

let vt = { x: '50%', y: '45%' };

/** <html> 的 class / style 每次換頁都會被新頁面的內容覆寫，需要重新套用 */
export function applyRootState(): void {
  const root = document.documentElement;
  root.classList.add('js');
  root.style.setProperty('--vt-x', vt.x);
  root.style.setProperty('--vt-y', vt.y);
  applyWarpVar();
}

export function initTransitions(): void {
  // 記錄點擊位置（鍵盤觸發的 click，座標為 0，視為沒有位置 → 用預設中心偏上）
  document.addEventListener(
    'click',
    (e) => {
      if (!(e.target as Element | null)?.closest?.('a[href]')) return;
      vt = e.detail === 0 && e.clientX === 0 ? { x: '50%', y: '45%' } : { x: `${e.clientX}px`, y: `${e.clientY}px` };
      document.documentElement.style.setProperty('--vt-x', vt.x);
      document.documentElement.style.setProperty('--vt-y', vt.y);
    },
    true,
  );

  document.addEventListener('astro:before-preparation', (e) => {
    const engine = getEngine();
    if (engine) engine.locked = true; // 導覽中，忽略滾輪 / 鍵盤 / 觸控
    const back = (e as Event & { direction?: string }).direction === 'back';
    if (!prefersReducedMotion()) kickWarp(1.5, 1.6, back ? -1 : 1);
  });

  document.addEventListener('astro:after-swap', applyRootState);
}
