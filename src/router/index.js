import { createRouter, createWebHashHistory } from 'vue-router'
import { getSession } from '../shared/auth.js'
import { currentSession } from '../composables/useSession.js'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import BeachView from '../views/BeachView.vue'
import SpaceView from '../views/SpaceView.vue'
import ForestView from '../views/ForestView.vue'

// meta.theme：決定雙開門轉場的門板配色（對應 src/styles/door-themes/ 的 [data-theme] 區塊）
// meta.requiresAuth：需要登入才能進入，由下方 beforeEach 守衛處理
// meta.title：頁籤標題
// 新增世界：複製下面一行，各世界各佔獨立一行
const routes = [
  { path: '/', redirect: '/home' }, // 已登入 -> /home；未登入會被守衛轉到 /login
  { path: '/login', name: 'login', component: LoginView, meta: { theme: 'neon', title: '// ACCESS TERMINAL :: NEON GRID' } },
  { path: '/home', name: 'home', component: HomeView, meta: { theme: 'neon', requiresAuth: true, title: '// YOUR WORLD :: NEON GRID' } },
  { path: '/beach', name: 'beach', component: BeachView, meta: { theme: 'beach', requiresAuth: true, title: '// BEACH :: NEON GRID' } },
  { path: '/space', name: 'space', component: SpaceView, meta: { theme: 'space', requiresAuth: true, title: '// SPACE :: NEON GRID' } },
  { path: '/forest', name: 'forest', component: ForestView, meta: { theme: 'forest', requiresAuth: true, title: '// FOREST :: NEON GRID' } },
  { path: '/:pathMatch(.*)*', redirect: '/home' }, // 未知路徑 -> /home（之後再由守衛判斷是否登入）
]

const router = createRouter({
  // hash 模式：GitHub Pages 重新整理任何路由都不會 404。base 由 Vite 的 BASE_URL 決定。
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const session = await getSession()
  currentSession.value = session
  if (to.meta.requiresAuth && !session) return { path: '/login', replace: true }
  if (to.path === '/login' && session) return { path: '/home', replace: true }
})

export default router
