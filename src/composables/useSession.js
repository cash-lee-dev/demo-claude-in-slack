import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { getSession, onSessionStorageChange } from '../shared/auth.js'

/** 目前有效的 session（由 router.beforeEach 守衛在每次導覽時更新），未登入為 null */
export const currentSession = shallowRef(null)

/**
 * 全域 session 監看：session 過期、或其他分頁登出（storage 變更）時，
 * 若目前在需要登入的路由，就把使用者踢回 /login。放在 App 層級使用一次即可。
 */
export function useSessionWatcher(router) {
  let timer = 0
  let stopStorage = () => {}

  async function check() {
    if (!router.currentRoute.value.meta.requiresAuth) return
    const session = await getSession()
    currentSession.value = session
    if (!session) router.replace('/login')
  }

  onMounted(() => {
    timer = setInterval(check, 1000)
    stopStorage = onSessionStorageChange(check)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    stopStorage()
  })
}
