# demo-claude-in-slack — NEON//GRID

賽博龐克霓虹風格的 **Vue 3 多頁應用（MPA）**：整個系統需要登入，登入頁驗證通過後進入首頁，首頁顯示巨大的故障風霓虹標題 **"This is Your World!"**。

- 純前端、無後端：帳密完全在瀏覽器內驗證（比對的是 hash，不是明文）
- 技術：Vue 3 + Vite + `@vitejs/plugin-vue`（除此之外沒有其他執行期依賴）
- 視覺：霓虹藍紫主色、透視網格地板、數位雨、霓虹城市天際線、CRT 掃描線、故障文字、玻璃擬態登入卡、打字機副標；支援 `prefers-reduced-motion` 與手機版面

## 快速開始

需要 Node.js 20 以上。

```bash
npm ci
cp .env.example .env     # 然後編輯 .env，填入自己的值
npm run dev              # http://localhost:5173/
```

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發伺服器（base 為 `/`） |
| `npm run build` | 打包到 `dist/`（base 預設 `/demo-claude-in-slack/`） |
| `npm run preview` | 預覽打包結果（網址含 `/demo-claude-in-slack/`） |
| `npm run hash -- <password>` | 以 `.env` 的 hash key 產生 passwordHash，供新增使用者用 |

## 環境變數

複製 `.env.example` 為 `.env`（已被 `.gitignore` 忽略，**請勿提交**）。

| 變數 | 說明 |
| --- | --- |
| `VITE_AUTH_HASH_KEY` | 密碼雜湊用的 key（HMAC-SHA-256） |
| `VITE_ADMIN_USERNAME` | 管理員帳號 |
| `VITE_ADMIN_PASSWORD` | 管理員密碼；執行時用 hash key 算出 hash 再比對，程式不做明文比較 |
| `VITE_EXTRA_USERS` | （選填）額外使用者 JSON：`[{"username":"neo","passwordHash":"<hex>","role":"operator"}]` |
| `VITE_BASE_PATH` | （選填）部署 base path；也可用 `BASE_PATH`。build 預設 `/demo-claude-in-slack/`，dev 為 `/` |

沒有設定前三個必填變數時，登入頁會顯示 `AUTH NOT CONFIGURED` 並禁止登入。

## 驗證流程

1. 輸入的密碼以 Web Crypto 計算 `HMAC-SHA-256(hashKey, password)`（hex）。
2. 與使用者清單中儲存的 hash 做定長比對。管理員的 hash 是用 `VITE_ADMIN_PASSWORD` 在執行時算出來的；要新增使用者，把 `{ username, passwordHash, role }` 加進 `src/shared/auth.js` 的 `getUsers()`，或使用 `VITE_EXTRA_USERS`。
3. 成功後把 session token（`base64url(payload).HMAC簽章`，payload 含 username、角色、簽發/到期時間，預設 8 小時）寫入 `localStorage`。
4. 每個受保護頁面在掛載前先驗證 token 的簽章與效期，失敗就導向登入頁；登入頁若已登入則直接導向首頁。首頁右上角有 LOGOUT，跨分頁登出也會同步。

> `crypto.subtle` 只能在安全環境（HTTPS 或 `localhost`）使用，GitHub Pages 與本機開發都符合。

## MPA 結構

```
index.html                 登入頁入口
home.html                  登入後的首頁入口
vite.config.js             build.rollupOptions.input 設定兩個入口 + base 設定
scripts/hash.mjs           產生 passwordHash 的小工具
src/
  pages/
    login/  main.js  LoginApp.vue
    home/   main.js  HomeApp.vue
  shared/
    auth.js                雜湊、登入、session、頁面守衛
    config.js              讀取環境變數、頁面名稱
    nav.js                 以 import.meta.env.BASE_URL 組頁面網址
    theme.css              霓虹主題、glitch、按鈕等共用樣式
    components/            NeonBackdrop / RainCanvas / Skyline / GlitchText / Typewriter / NeonButton
```

頁面之間的跳轉一律透過 `src/shared/nav.js`（`import.meta.env.BASE_URL`），所以在本機 `/` 與 GitHub Pages `/demo-claude-in-slack/` 都能正確運作。要新增頁面：在根目錄加 `xxx.html`、`src/pages/xxx/`，把它加進 `vite.config.js` 的 `input`，並在入口 `main.js` 呼叫 `requireAuth()`。

## 部署（GitHub Pages）

`.github/workflows/deploy.yml` 會在 **push 到 `main`**（也就是 PR 合併後）或手動 `workflow_dispatch` 時，執行 `npm ci` → `npm run build` → 上傳 `dist` → 部署到 GitHub Pages。`ci.yml` 會在 PR 上用假的環境變數跑一次 build 當檢查。

Repo 擁有者第一次需要做兩件事：

1. **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
2. **Settings → Secrets and variables → Actions** 新增三個 repository secrets：`VITE_AUTH_HASH_KEY`、`VITE_ADMIN_USERNAME`、`VITE_ADMIN_PASSWORD`。

部署後網址：`https://<owner>.github.io/demo-claude-in-slack/`

## 重要提醒：資安被刻意忽略

這是純前端專案，`VITE_` 開頭的環境變數（hash key、管理員帳號、管理員密碼）會在 build 時**被內嵌進前端 bundle**，任何人都能從瀏覽器取得。雜湊只是避免程式裡出現明文比對，並不能提供真正的安全性。這是依需求刻意為之；需要真正的存取控制請改用後端驗證。
