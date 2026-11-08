import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

// GitHub Pages 專案站台網址為 https://<user>.github.io/demo-claude-in-slack/
// - build:  預設 /demo-claude-in-slack/（可用 VITE_BASE_PATH 或 BASE_PATH 覆寫）
// - preview: 與 build 相同（預覽的是 build 產物）
// - dev:    一律 /
export default defineConfig(({ command, isPreview }) => {
  const envBase = process.env.VITE_BASE_PATH ?? process.env.BASE_PATH
  const base = command === 'build' || isPreview ? (envBase ?? '/demo-claude-in-slack/') : '/'

  return {
    base,
    plugins: [vue(), tailwindcss()],
    build: {
      // MPA：每個 HTML 都是獨立入口
      rollupOptions: {
        input: {
          index: r('./index.html'), // 登入頁
          home: r('./home.html'), // 登入後的首頁
        },
      },
    },
  }
})
