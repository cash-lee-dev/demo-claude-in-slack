# CLAUDE.md

NEON//GRID：賽博龐克霓虹風格的 Vue 3 + Vite + Tailwind CSS 單頁應用（SPA，vue-router hash 模式），純前端登入（Web Crypto HMAC-SHA-256），登入後進入首頁 "This is Your World!"，所有頁面切換有雙開門轉場，部署到 GitHub Pages。

## 需要了解專案時請閱讀

專案文件都放在 [`docs/`](./docs/README.md)，先看索引，再依需要閱讀各分類：

- @docs/README.md — 文件索引與維護規則
- @docs/architecture.md — 專案架構：專案目的與使用的技術

## 常用指令

```bash
npm ci               # 安裝依賴（Node 20+）
npm run dev          # 開發伺服器（base 為 /）
npm run build        # 打包到 dist/（base 預設 /demo-claude-in-slack/）
npm run preview      # 預覽打包結果
npm run hash -- <password>   # 以 hash key 產生密碼 hash
```

## SPA 結構速查

- 單一入口：`index.html` + `src/main.js`（單一 Vue app，`App.vue` 內是 `<router-view>` 與全域 `DoorTransition`）。**不要**再新增 HTML 入口，CI 會檢查 `dist` 只有一個 HTML。
- 路由：`src/router/index.js`（hash 模式）。每個路由都要有 `meta.theme`，需登入的加 `meta.requiresAuth: true`；導覽一律用 `router.push/replace`，不要用 `window.location`。
- 守衛：`router.beforeEach` 使用 `src/shared/auth.js` 的 `getSession()`（auth 行為不可改）；未登入 -> `/login`、已登入造訪 `/login` -> `/home`、未知路徑 -> `/home`。session 過期（`exp` 計時）/ 跨分頁登出由 `useSessionWatcher`（`composables/useSession.js`）踢回 `/login`。
- 轉場：`composables/useDoorTransition.js` 把「畫面路由（`displayRoute`）」與「URL 路由」分離，門合上時才切換畫面；進行中的導覽會排隊、不重疊；reduced-motion 改淡入淡出。
- 世界與門主題：`/home`、`/login` 用 `neon`；`/beach` 已實作（賽博龐克海灘，主色天藍 / 白，重用 `GlitchText` / `NeonButton beach` / `HudCard beach`；`BeachView` + `shared/components/BeachBackdrop.vue` / `WaveCanvas.vue`，主題 `beach`，`door-themes/beach.css`，token 為 `tailwind.css` 的 `--color-beach-*`）；`/space`、`/forest` 仍是 `WorldPlaceholder`（門色退回 neon）。Canvas 元件須遵守：DPR 上限 2、分頁隱藏暫停、reduced-motion 靜態、卸載時清掉 rAF / listener。
- 新增世界 / 主題：新增 `src/views/XxxView.vue`、在路由表加獨立一行（lazy import：`component: () => import('../views/XxxView.vue')`，`meta.theme: 'xxx'`）、新增 `src/styles/door-themes/xxx.css` 定義 `[data-theme='xxx']` 的 `--door-bg` / `--door-edge` / `--door-glow`（自動載入，不必改其他檔案）。詳見 @docs/architecture.md。

## 環境變數

複製 `.env.example` 為 `.env`（已被 `.gitignore` 忽略）。**絕對不要提交真實的值。**

- `VITE_AUTH_HASH_KEY`：密碼雜湊用的 key
- `VITE_ADMIN_USERNAME`：管理員帳號
- `VITE_ADMIN_PASSWORD_HASH`：管理員密碼的 hash（建議；`npm run hash -- <password>` 產生）
- `VITE_ADMIN_PASSWORD`：（選填備援）明文密碼，僅在沒有設定 hash 時使用

## 流程

- PR 一律以 `main` 為目標分支。
- push 到 `main` 後由 GitHub Actions（`.github/workflows/deploy.yml`）建置並部署到 GitHub Pages；PR 會跑 `ci.yml` 的 build 檢查。
- 部署環境是 GitHub Environment **`Prod`**（`deploy.yml` 的 `build` job 指定 `environment: Prod`）：三個 `VITE_*` 值（hash key、管理員帳號、管理員密碼 hash；明文密碼為選填備援）要設定在 Settings → Environments → Prod 的 Environment secrets，不是 repository secrets。Pages Source 需為 GitHub Actions。

## 維護文件的規則

- 新增文件分類時：在 `docs/README.md` 的索引加上連結，並在本檔「需要了解專案時請閱讀」加上引用。
- 變更使用的技術、專案目的或環境變數時，同步更新 `docs/` 與本檔。
