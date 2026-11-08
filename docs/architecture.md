# 專案架構

> 本文件只記錄「專案目的」與「使用的技術」。

## 專案目的

NEON//GRID 是一個賽博龐克霓虹風格的前端示範專案：整個系統需要登入，登入成功後進入首頁，首頁以巨大的故障風霓虹標題 **"This is Your World!"** 迎接使用者。所有頁面切換都有「雙開門」轉場。

- 純前端、沒有後端；帳號密碼完全在瀏覽器內驗證。
- 資安是刻意被忽略的（環境變數會被打包進前端 bundle），重點在前端架構與視覺呈現。

## 使用的技術

| 項目 | 技術 | 說明 |
| --- | --- | --- |
| UI 框架 | Vue 3（單檔元件、`<script setup>`） | 僅此一個執行期依賴 |
| 建置工具 | Vite + `@vitejs/plugin-vue` | 開發伺服器與打包 |
| 樣式 | Tailwind CSS v4（`tailwindcss` + `@tailwindcss/vite`） | 主題 token（配色、字型、動畫）定義在 `@theme`，以 utility class 撰寫樣式 |
| 頁面模式 | SPA（單頁應用）+ `vue-router`（hash 模式） | 單一 `index.html` 入口與單一 Vue app，頁面是 `<router-view>` 內的 route view |
| 驗證 | Web Crypto API（HMAC-SHA-256） | 以 hash key 對密碼做雜湊後比對，session 存在 `localStorage` |
| 設定 | Vite 環境變數（`VITE_*`） | hash key、管理員帳號與密碼 hash 皆由環境變數提供 |
| 視覺特效 | CSS 動畫與 Canvas 2D | 不使用額外的動畫或圖形套件 |
| 部署 | GitHub Pages + GitHub Actions | push 到 `main` 時自動建置並部署；建置用的環境變數來自 GitHub Environment `Prod` |
| 執行環境 | Node.js 20 以上、npm | |

## SPA 結構

```
index.html                         唯一的 HTML 入口，載入 /src/main.js
src/
  main.js                          建立單一 Vue app：install router → await router.isReady() → mount；載入 tailwind.css 與所有門主題
  App.vue                          App 層級：<router-view :route="displayRoute"> + 全域 <DoorTransition>
  router/index.js                  路由表、meta、驗證守衛（beforeEach）
  views/                           route view：LoginView、HomeView、BeachView（海灘，純氛圍頁）、SpaceView、ForestView（後兩者為「建構中」placeholder）
  components/
    DoorTransition.vue             雙開門 overlay（門板、接縫、CSS）
    HudCard.vue                    首頁的 HUD 卡片
  composables/
    useDoorTransition.js           轉場時間軸與「畫面路由 / URL 路由分離」機制
    useSession.js                  currentSession 與全域 session 監看（過期、跨分頁登出）
  styles/door-themes/<theme>.css   每個主題一個檔案，定義門的 CSS 變數（main.js 以 import.meta.glob 自動載入）
  shared/                          auth.js、config.js、tailwind.css、共用元件（NeonBackdrop、BeachBackdrop、WaveCanvas、NeonButton、WorldPlaceholder…）
```

### Router

- `createWebHashHistory(import.meta.env.BASE_URL)`：網址為 `/#/home` 形式，GitHub Pages 重新整理任何路由都不會 404；Vite base 不變（build / preview 為 `/demo-claude-in-slack/`，dev 為 `/`）。
- 路由表（每個路由都有 `meta.theme`，需登入的有 `meta.requiresAuth`）：

| 路徑 | View | `meta.theme` | 需登入 |
| --- | --- | --- | --- |
| `/` | redirect 到 `/home` | | |
| `/login` | `LoginView` | `neon` | 否 |
| `/home` | `HomeView` | `neon` | 是 |
| `/beach` | `BeachView` | `beach` | 是 |
| `/space` | `SpaceView` | `space` | 是 |
| `/forest` | `ForestView` | `forest` | 是 |
| 其他任何路徑 | redirect 到 `/home` | | |

### 驗證守衛

`router.beforeEach` 以 `auth.js` 的 `getSession()`（HMAC 簽章 + 效期，行為未改）判斷：

- 未登入存取 `meta.requiresAuth` 的路由 -> `/login`（`/` 與未知路徑先 redirect 到 `/home`，再由守衛轉到 `/login`）。
- 已登入造訪 `/login` -> `/home`。
- 登出（`logout()` 清除 session 後 `router.replace('/login')`）-> `/login`。
- `App.vue` 的 `useSessionWatcher`：以 `session.exp` 設定單次 `setTimeout` 偵測過期 + 監聽 `storage`（`onSessionStorageChange`）偵測其他分頁登出，若目前在需登入的路由就 `router.replace('/login')`。`currentSession` 只由守衛寫入。

### 雙開門轉場

每次路由切換（login↔home、home↔世界、登出、瀏覽器上一頁 / 下一頁）都播放：左右門板從兩側滑入在中央合上（0.6s）-> 停留 0.2s（此時才切換底下的 route view）-> 從中央向兩側打開（0.6s）。首次載入頁面不播放。

機制（`composables/useDoorTransition.js`）：

1. router 照常、立即完成導覽（含守衛與上一頁 / 下一頁），`router.currentRoute` 馬上更新。
2. `App.vue` 不直接顯示 `currentRoute`，而是 `<router-view :route="displayRoute">`；`displayRoute` 只在門板完全合上時才被設為最新的 `currentRoute`。
3. 轉場進行中又發生導覽（快速連點、上一頁）時不會重疊也不會卡死：這一輪結束後若 `currentRoute.fullPath` 與畫面不同，再播一輪直接到最新路由。門色以「該輪開始時」的目的地為準（若期間又導覽到別的主題，下一輪才換色）。`finally` 會保證 overlay 一定被收起。
4. overlay 全螢幕、`z-index: 9999`、轉場期間 `pointer-events: auto` 擋住指標輸入，底下內容同時 `inert`（鍵盤也無法操作）。
5. 無障礙：轉場結束（`inert` 解除）後把焦點移到新畫面的 `main`，並以 `aria-live` 區塊念出新頁面的 `meta.title`；首次載入不搶焦點。
6. `prefers-reduced-motion: reduce`：門板不滑動，改為整片約 0.3s 淡入、淡出（`tailwind.css` 的全域減少動態規則已排除 `.door-overlay`）。

### 主題換色機制（門的顏色）

門的顏色由「**目的地**路由」的 `meta.theme` 決定：轉場時 overlay 會帶上 `data-theme="<theme>"`，門板 CSS 讀取以下變數：

| 變數 | 說明 |
| --- | --- |
| `--door-bg` | 門板底色，color 或 gradient（用於 `background`） |
| `--door-edge` | 門板內側邊框與中央接縫的顏色（color） |
| `--door-glow` | 光暈顏色（color，建議帶透明度） |

目前的門主題（`src/styles/door-themes/`）：

| 主題 | 檔案 | 使用的路由 | 門的配色 |
| --- | --- | --- | --- |
| `neon` | `neon.css` | `/login`、`/home` | 深藍紫底 + 青色邊 + 紫色光暈（同時掛在 `:root` 當預設值，尚未定義的主題 `space`、`forest` 會退回 neon 外觀） |
| `beach` | `beach.css` | `/beach` | 天藍 `#4FC3F7` -> 海藍 `#0288D1` -> 深藍漸層底 + 白色邊 + 天藍光暈 |

門色看的是「目的地」路由：進入 `/beach` 是海灘色，從 `/beach` 回 `/home` 則是 neon 色。

### 如何新增世界 / 主題

1. 新增 `src/views/XxxView.vue`（或取代對應 placeholder 的內容）。
2. 在 `src/router/index.js` 的路由表新增一行，各世界各佔獨立一行，世界 view 用 lazy import（不必改 import 區塊，並自動分 chunk；導覽會等 chunk 載入完才完成，之後才播門）：`{ path: '/xxx', name: 'xxx', component: () => import('../views/XxxView.vue'), meta: { theme: 'xxx', requiresAuth: true, title: '...' } }`。
3. 新增 `src/styles/door-themes/xxx.css`：

```css
[data-theme='xxx'] {
  --door-bg: linear-gradient(180deg, #..., #...);
  --door-edge: #...;
  --door-glow: rgb(... / 0.7);
}
```

不需要修改 `main.js`、`DoorTransition.vue` 或 vite 設定。

## 首頁世界入口

- `src/components/WorldOrb.vue`：圓形霓虹按鈕（沿用 NeonButton 的手感；`accent` 邊框發光色、`base` 球體底色、slot 放 SVG 圖形；`router-link` 導覽，aria-label 由呼叫端傳入）。掃光等參數複製自 NeonButton，調整時需同步。
- `src/components/WorldOrbs.vue`：首頁的三個入口（海灘 `/beach`、宇宙 `/space`、森林 `/forest`），以 `worlds` 陣列（每個世界一個物件，含配色與內嵌 SVG 圖示）+ `v-for` 產生。

## 海灘世界（/beach）

`src/views/BeachView.vue`：純氛圍頁面，沒有功能性內容——動態海灘背景 + 標題（BEACH / 海灘）+ 「返回主頁」按鈕（`router.push('/home')`，因此會播放雙開門轉場）。路由 `meta.theme` 為 `beach`，需登入。

- 配色：天藍 `#4FC3F7`、海藍 `#0288D1`、深藍 `#01579B`、淡天空 `#E1F5FE` + 白；沙色 `#F6E7C1` 只用在沙灘與太陽暈光的小面積點綴。token 定義在 `tailwind.css` 的 `@theme`：`--color-beach-sky` / `-sea` / `-deep` / `-mist` / `-sand`（utility 如 `bg-beach-sky`、`text-beach-deep`）；`WaveCanvas.vue` 裡的色碼需與這些 token 同步。字型沿用 Orbitron / Rajdhani，沒有新增字型。
- `src/shared/components/BeachBackdrop.vue`：場景外層。天空漸層、太陽（光芒緩慢旋轉、暈光呼吸）、4 朵飄動的雲（只用 `transform` / `opacity`；關鍵影格 `cloud-drift`、`sun-rays`、`sun-glow` 在 `tailwind.css`），下半部放 `WaveCanvas`。
- `src/shared/components/WaveCanvas.vue`：Canvas 2D 畫 6 層正弦海浪（遠深近淺、浪頭白線）、沙灘與來回漫過沙灘的浪花。效能 / 清理規則（沿用 `RainCanvas` 模式）：DPR 上限 2、約 30fps、`ResizeObserver`；分頁隱藏（`visibilitychange`）時取消 rAF、回到前景再恢復；`prefers-reduced-motion` 時只畫一張靜態畫面（也會即時響應系統設定變更）；卸載時取消 rAF、斷開 observer、移除所有 listener。
- 只改 `/beach`：`SpaceView`、`ForestView` 仍是 placeholder。
