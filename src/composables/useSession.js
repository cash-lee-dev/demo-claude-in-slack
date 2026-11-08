import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { getSession, onSessionStorageChange } from '../shared/auth.js'

/** 目前有效的 session（由 router.beforeEach 守衛在每次導覽時更新），未登入為 null */
export const currentSession = shallowRef(null)

/**
 * 全域 session 監看：session 過期、或其他分頁登出（storage 變更）時，
 * 若目前在需要登入的路由，就把使用者踢回 /login。放在 App 層級使用一次即可。
 *
 * - currentSession 只由 router.beforeEach 守衛寫入（這裡只在確定失效時清成 null）。
 * - 過期：以 session.exp 設定單次 setTimeout，不需要每秒輪詢；跨分頁登出由 storage 事件涵蓋。
 */
export function useSessionWatcher(router) {
  let expTimer = 0
  let stopStorage = () => {}

  async function check() {
    if (!router.currentRoute.value.meta.requiresAuth) return
    if (await getSession()) return
    // await 期間狀態可能已變（例如剛按了 LOGOUT 已在前往 /login），再確認一次
    if (!router.currentRoute.value.meta.requiresAuth) return
    currentSession.value = null
    router.replace('/login')
  }

  function scheduleExpiry(session) {
    clearTimeout(expTimer)
    if (!session) return
    // +50ms 確保觸發時 getSession() 已判定過期；setTimeout 上限約 24.8 天，session 效期遠小於此
    expTimer = setTimeout(check, Math.max(0, session.exp - Date.now()) + 50)
  }

  watch(currentSession, scheduleExpiry, { immediate: true })

  onMounted(() => {
    stopStorage = onSessionStorageChange(check)
  })
  onBeforeUnmount(() => {
    clearTimeout(expTimer)
    stopStorage()
  })
}
