/**
 * 全站進入點（由 BaseLayout 引入，Astro 只會執行一次；換頁不會重跑）。
 *
 *   - 一次性的全域模組（星空、游標、事件委派）在這裡初始化
 *   - 每個頁面（首次載入與每次 View Transition swap 之後）要重新做的事在 bootPage()
 */
import './gsap';
import { initCursor, applyRootClass, cursorDebug } from './cursor';
import { initHoverGlow } from './hover-glow';
import { refreshMagnetic } from './magnetic';
import { initNavbar } from './navbar';
import { startPointerTracking } from './pointer';
import { initChrome } from './chrome';
import { initDots } from './screens/dots';
import { bootScreens, destroyScreens } from './screens';
import { getStarfieldStatus, initStarfield } from './starfield';
import { applyRootState, initTransitions } from './transitions';
import { resetWarp } from './warp';

function bootPage() {
  applyRootState();
  applyRootClass();
  initNavbar();
  bootScreens();
  refreshMagnetic();
}

function bootGlobal() {
  // 供除錯 / 自動化測試讀取的唯讀狀態（window.may4s.screens 由屏引擎設定）
  window.may4s = Object.assign(window.may4s ?? {}, { cursor: cursorDebug, starfield: getStarfieldStatus });
  startPointerTracking();
  initHoverGlow();
  initDots();
  initChrome();
  initCursor();
  initStarfield();
  initTransitions();

  // 換頁：舊頁面在 swap 之前清理（舊畫面的快照已被瀏覽器擷取，不受影響）
  document.addEventListener('astro:before-swap', () => destroyScreens());
  document.addEventListener('astro:after-swap', bootPage);
  // 使用者按了「上一頁」等導致導覽被中止時，確保不會卡在鎖定狀態
  window.addEventListener('pagehide', () => resetWarp());
}

bootGlobal();
bootPage();
