import { createApp } from 'vue'
import '../../shared/theme.css'
import { redirectIfAuthed } from '../../shared/auth.js'
import LoginApp from './LoginApp.vue'

// 已登入就直接前往首頁；否則顯示登入畫面
const redirected = await redirectIfAuthed()
if (!redirected) createApp(LoginApp).mount('#app')
