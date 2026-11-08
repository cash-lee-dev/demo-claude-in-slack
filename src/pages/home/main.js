import { createApp } from 'vue'
import '../../shared/theme.css'
import { requireAuth } from '../../shared/auth.js'
import HomeApp from './HomeApp.vue'

// 頁面守衛：沒有有效 session 就導向登入頁，不會渲染任何內容
const session = await requireAuth()
if (session) createApp(HomeApp, { session }).mount('#app')
