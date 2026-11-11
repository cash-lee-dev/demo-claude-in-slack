# May4s 官網改版（前端）

[May4s 伊原力科技](https://may4s.com/tw/)（Salesforce / Slack / Agentforce 顧問）官網的前端改版專案。
主視覺：「企業 Agentic OS」——深色科技風、浩瀚星空、整頁切換動畫。純前端、靜態輸出，沒有後端。

- 技術：Astro（靜態輸出）· GSAP（Observer / SplitText / ScrollTrigger）· Three.js（星空）· Astro View Transitions
- 語系：目前只有繁體中文
- 部署：GitHub Pages（`https://cash-lee-dev.github.io/demo-claude-in-slack/`）

## 開發

```bash
npm ci            # 安裝依賴（Node 20+）
npm run dev       # 開發伺服器 http://localhost:4321/demo-claude-in-slack/
npm run build     # 靜態輸出到 dist/
npm run preview   # 預覽 dist/（同樣帶 /demo-claude-in-slack/ base path）
```

## 專案文件

給開發者與 AI agent 的文件在 [`docs/`](./docs/README.md)，從 [`docs/architecture.md`](./docs/architecture.md) 開始：
架構、設計 token、整頁切換引擎的 API、如何新增頁面 / 屏。
