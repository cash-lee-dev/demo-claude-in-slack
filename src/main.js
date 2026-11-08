import { createApp } from 'vue'
import './shared/tailwind.css'
// 自動載入所有雙開門主題（src/styles/door-themes/<theme>.css）
import.meta.glob('./styles/door-themes/*.css', { eager: true })
import App from './App.vue'
import router from './router/index.js'

const app = createApp(App).use(router)
// 等第一次導覽（含守衛的登入判斷與轉址）完成再掛載，避免閃出錯誤的畫面；首次載入不播放轉場
await router.isReady()
app.mount('#app')
