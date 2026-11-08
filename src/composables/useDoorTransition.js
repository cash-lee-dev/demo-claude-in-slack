import { nextTick, onScopeDispose, ref, shallowRef } from 'vue'

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

/** 給螢幕閱讀器的路由宣告（App.vue 以 aria-live 區塊念出） */
export const routeAnnouncement = ref('')

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
    if (route.meta.title) {
      document.title = route.meta.title
      routeAnnouncement.value = route.meta.title
    }
  }

  // 轉場結束後把焦點移到新畫面的 main（inert 已解除），讓鍵盤 / 螢幕閱讀器使用者知道換了畫面
  async function focusNewView() {
    await nextTick()
    const el = document.querySelector('#app main')
    if (!el) return
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
  const sameView = () => router.currentRoute.value.fullPath === displayRoute.value.fullPath
  show(router.currentRoute.value)

  async function run() {
    if (playing) return // 進行中；結束時會檢查是否還有落差
    playing = true
    try {
      // 以 fullPath 比對（而非物件參考）：快速 B→A→B 回到畫面相同的路由時不會多播一輪
      while (!sameView()) {
        // 門色以「該輪開始時」的目的地為準；若期間又導覽到別處，下一輪再用新目的地
        const target = router.currentRoute.value
        await playDoors(target.meta.theme ?? 'neon', () => show(router.currentRoute.value))
      }
      await focusNewView()
    } finally {
      // 保險：任何例外（例如 swap 失敗）都不能讓全螢幕 overlay 卡住
      doorState.active.value = false
      doorState.closed.value = false
      playing = false
    }
  }

  // 元件卸載（含 dev 模式 HMR 重跑 setup）時移除監聽，避免累積多個重疊的轉場
  onScopeDispose(
    router.afterEach((to, from, failure) => {
      if (failure) return
      if (from.matched.length === 0) return // 首次載入（START_LOCATION）：直接顯示，不播放
      run()
    }),
  )

  return displayRoute
}
