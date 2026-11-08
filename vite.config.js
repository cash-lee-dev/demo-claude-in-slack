import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 專案站台網址為 https://<user>.github.io/demo-claude-in-slack/
// - build:  預設 /demo-claude-in-slack/（可用 VITE_BASE_PATH 或 BASE_PATH 覆寫）
// - preview: 與 build 相同（預覽的是 build 產物）
// - dev:    一律 /
// SPA：只有一個 index.html 入口（vue-router hash 模式），不需要多入口設定。
export default defineConfig(({ command, isPreview }) => {
  const envBase = process.env.VITE_BASE_PATH ?? process.env.BASE_PATH
  const base = command === 'build' || isPreview ? (envBase ?? '/demo-claude-in-slack/') : '/'

  return {
    base,
    plugins: [vue(), tailwindcss()],
  }
})
