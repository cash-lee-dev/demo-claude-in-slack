import { ref, shallowRef } from 'vue'

/** 時間軸（毫秒）：關門 -> 停留（此時切換路由元件）-> 開門，總長約 1.4s */
export const DOOR_TIMING = { close: 600, hold: 200, open: 600 }
/** prefers-reduced-motion：簡單淡入淡出 */
export const DOOR_TIMING_REDUCED = { close: 300, hold: 100, open: 300 }

/**
 * 雙開門狀態（模組層級單例，DoorTransition.vue 讀取後渲染）
 * - active：overlay 是否啟用（啟用時全螢幕擋住指標輸入）
 * - closed：門板是否合上（CSS transition 依此切換）
 * - theme：門板主題，對應 [data-theme] CSS 變數
 * - duration：本次轉場的 close/open 秒數，供 CSS 使用
 */
export const doorState = {
  active: ref(false),
  closed: ref(false),
  theme: ref('neon'),
  duration: ref(DOOR_TIMING.close),
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 播放一次完整的開關門；swap() 在門完全合上時被呼叫 */
async function playDoors(theme, swap) {
  const t = prefersReducedMotion() ? DOOR_TIMING_REDUCED : DOOR_TIMING
  doorState.theme.value = theme
  doorState.duration.value = t.close
  doorState.active.value = true
  doorState.closed.value = true
  await sleep(t.close)
  swap()
  await sleep(t.hold)
  doorState.closed.value = false
  await sleep(t.open)
  doorState.active.value = false
}

/**
 * 把「路由實際顯示的畫面」與「URL 上的路由」分離，讓轉場掛在 App 層級：
 * - router 照常（含守衛、上一頁/下一頁）立刻完成導覽，currentRoute 馬上更新；
 * - 但 `<router-view :route="displayRoute">` 要等門板合上後才切換到新路由；
 * - 轉場進行中又發生導覽（快速連點、上一頁）：不重疊、不中斷，等這一輪結束後
 *   若 currentRoute 與畫面不同，再播一輪到最新的路由，因此不會卡死。
 * - 首次載入不播放轉場。
 */
export function useRouteDoorTransition(router) {
  const displayRoute = shallowRef(router.currentRoute.value)
  let playing = false

  function show(route) {
    displayRoute.value = route
    if (route.meta.title) document.title = route.meta.title
  }
  show(router.currentRoute.value)

  async function run() {
    if (playing) return // 進行中；結束時會檢查是否還有落差
    playing = true
    try {
      while (router.currentRoute.value !== displayRoute.value) {
        const target = router.currentRoute.value
        // 只有 query/hash 等沒換元件的更新也會走這裡，但本專案路由都以 path 區分
        await playDoors(target.meta.theme ?? 'neon', () => show(router.currentRoute.value))
      }
    } finally {
      playing = false
    }
  }

  router.afterEach((to, from, failure) => {
    if (failure) return
    if (from.matched.length === 0) return // 首次載入（START_LOCATION）：直接顯示，不播放
    run()
  })

  return displayRoute
}
