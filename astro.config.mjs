// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages（專案頁）部署在 https://cash-lee-dev.github.io/demo-claude-in-slack/
// 所有站內連結請用 src/data/site.ts 的 url() 產生，不要手寫 '/'。
export default defineConfig({
  site: 'https://cash-lee-dev.github.io',
  base: '/demo-claude-in-slack',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // 滑鼠移到連結上就預先抓下一頁，讓 View Transitions 切換更即時
  vite: {
    build: {
      // Three.js 星空在獨立 chunk、idle 後才載入，體積警告可放寬
      chunkSizeWarningLimit: 600,
    },
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
