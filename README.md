# demo-claude-in-slack — NEON//GRID

賽博龐克霓虹風格的 **Vue 3 單頁應用（SPA，vue-router hash 模式）**：整個系統需要登入，登入頁驗證通過後進入首頁，首頁顯示巨大的故障風霓虹標題 **"This is Your World!"**；所有頁面切換都有「雙開門」轉場。

- 純前端、無後端：帳密完全在瀏覽器內驗證（比對的是 hash，不是明文）
- 技術：Vue 3 + vue-router + Vite + Tailwind CSS v4（執行期依賴只有 Vue 與 vue-router）
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
| `VITE_ADMIN_PASSWORD_HASH` | 管理員密碼的 hash（**建議**）：`HMAC-SHA-256(VITE_AUTH_HASH_KEY, 密碼)` 的 hex，見下方「產生密碼 hash」 |
| `VITE_ADMIN_PASSWORD` | （選填備援）管理員明文密碼；只有在沒設定 `VITE_ADMIN_PASSWORD_HASH` 時使用，執行時用 hash key 算出 hash 再比對 |
| `VITE_EXTRA_USERS` | （選填）額外使用者 JSON：`[{"username":"neo","passwordHash":"<hex>","role":"operator"}]` |
| `VITE_BASE_PATH` | （選填）部署 base path；也可用 `BASE_PATH`。build 預設 `/demo-claude-in-slack/`，dev 為 `/` |

`VITE_AUTH_HASH_KEY`、`VITE_ADMIN_USERNAME`，以及 `VITE_ADMIN_PASSWORD_HASH` / `VITE_ADMIN_PASSWORD` 其中之一缺少時，登入頁會顯示 `AUTH NOT CONFIGURED` 並禁止登入。

### 產生密碼 hash

hash key 必須與 `VITE_AUTH_HASH_KEY` 一致。以下兩種方式結果相同（已驗證輸出一致）：

```bash
# 1) 使用專案內建腳本（自動讀取 .env 的 VITE_AUTH_HASH_KEY）
npm run hash -- '<password>'

# 2) 使用 openssl；輸出會帶 "SHA2-256(stdin)= " 之類的前綴（依版本不同），用 sed 去掉
printf '%s' '<password>' | openssl dgst -sha256 -hmac '<hash key>' | sed 's/^.*= //'
```

把得到的 64 字元 hex 填入 `VITE_ADMIN_PASSWORD_HASH`（本機 `.env`；部署時放在 GitHub Environment `Prod` 的 secret）。

## 驗證流程

1. 輸入的密碼以 Web Crypto 計算 `HMAC-SHA-256(hashKey, password)`（hex）。
2. 與使用者清單中儲存的 hash 做定長比對。管理員的 hash 直接取自 `VITE_ADMIN_PASSWORD_HASH`（沒設定時才用 `VITE_ADMIN_PASSWORD` 在執行時算出來）；要新增使用者，把 `{ username, passwordHash, role }` 加進 `src/shared/auth.js` 的 `getUsers()`，或使用 `VITE_EXTRA_USERS`。
3. 成功後把 session token（`base64url(payload).HMAC簽章`，payload 含 username、角色、簽發/到期時間，預設 8 小時）寫入 `localStorage`。
4. `router.beforeEach` 守衛在每次導覽時驗證 token 的簽章與效期：未登入存取受保護路由導向 `/login`；已登入造訪 `/login` 導向 `/home`；未知路徑導向 `/home`。首頁右上角有 LOGOUT，跨分頁登出、session 過期也會由 App 層級的監看踢回 `/login`。

> `crypto.subtle` 只能在安全環境（HTTPS 或 `localhost`）使用，GitHub Pages 與本機開發都符合。

## SPA 結構

```
index.html                 唯一的 HTML 入口
vite.config.js             base 設定（單一入口，不需要 rollupOptions.input）
scripts/hash.mjs           產生 passwordHash 的小工具
docs/                      給後續 agent 閱讀的專案文件（索引見 docs/README.md）
CLAUDE.md                  agent 入門指引，引用 docs/ 各文件
src/
  main.js                  單一 Vue app 入口
  App.vue                  <router-view> + 全域雙開門轉場
  router/index.js          路由表（含 meta.theme）與驗證守衛
  views/                   LoginView / HomeView / BeachView / SpaceView / ForestView（世界頁目前是「建構中」placeholder）
  components/              DoorTransition.vue（雙開門）、HudCard.vue
  composables/             useDoorTransition.js（轉場時間軸）、useSession.js（session 與監看）
  styles/door-themes/      每個主題一個 CSS 檔，定義門的 --door-bg / --door-edge / --door-glow
  shared/
    auth.js                雜湊、登入、session、storage 變更監聽
    config.js              讀取環境變數
    tailwind.css           Tailwind 入口：@theme（配色/字型/動畫 token）+ 少量無法用 utility 表達的具名小工具
    components/            NeonBackdrop / RainCanvas / Skyline / GlitchText / Typewriter / NeonButton / WorldPlaceholder
```

路由使用 hash 模式（`/#/home`），GitHub Pages 重新整理任何路由都不會 404；頁面切換一律用 router（`router.push` / `router.replace`）。

| 路徑 | 說明 | 需登入 |
| --- | --- | --- |
| `/login` | 登入頁 | 否 |
| `/home` | 首頁（`/` 與未知路徑都導向這裡，再由守衛判斷） | 是 |
| `/beach` `/space` `/forest` | 世界頁（目前為 placeholder） | 是 |

### 雙開門轉場

每次路由切換（含上一頁 / 下一頁、登出）都會播放：左右門板 0.6s 合上 -> 停留 0.2s（此時切換畫面）-> 0.6s 從中央打開；首次載入不播放；轉場中快速重複導覽會排隊、不重疊；`prefers-reduced-motion` 時改為約 0.3s 淡入淡出。門的顏色由目的地路由的 `meta.theme` 對應到 `[data-theme]` CSS 變數（`--door-bg`、`--door-edge`、`--door-glow`）。細節見 [docs/architecture.md](./docs/architecture.md)。

### 新增世界 / 主題

1. 新增 `src/views/XxxView.vue`；
2. 在 `src/router/index.js` 加一行路由（lazy import），`meta: { theme: 'xxx', requiresAuth: true }`；
3. 新增 `src/styles/door-themes/xxx.css`，在 `[data-theme='xxx']` 內定義三個門的變數（`main.js` 會自動載入該資料夾所有 CSS）。

## 部署（GitHub Pages）

`.github/workflows/deploy.yml` 會在 **push 到 `main`**（也就是 PR 合併後）或手動 `workflow_dispatch` 時，執行 `npm ci` → `npm run build` → 上傳 `dist` → 部署到 GitHub Pages。`ci.yml` 會在 PR 上用假的環境變數跑一次 build 當檢查。

Repo 擁有者第一次需要做兩件事（環境為 **Prod**）：

1. **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
2. **Settings → Environments → Prod**（沒有就先建立名為 `Prod` 的 environment，大小寫需一致），在該 environment 的 **Environment secrets** 新增：`VITE_AUTH_HASH_KEY`、`VITE_ADMIN_USERNAME`、`VITE_ADMIN_PASSWORD_HASH`（`VITE_ADMIN_PASSWORD` 為選填備援）。`deploy.yml` 的 `build` job 指定了 `environment: Prod`，所以這些值是從 Prod environment 讀取，而不是 repository secrets。

部署後網址：`https://<owner>.github.io/demo-claude-in-slack/`

## 重要提醒：資安被刻意忽略

這是純前端專案，`VITE_` 開頭的環境變數（hash key、管理員帳號、管理員密碼）會在 build 時**被內嵌進前端 bundle**，任何人都能從瀏覽器取得。雜湊只是避免程式裡出現明文比對，並不能提供真正的安全性。這是依需求刻意為之；需要真正的存取控制請改用後端驗證。
