# 專案架構

> 本文件只記錄「專案目的」與「使用的技術」。

## 專案目的

NEON//GRID 是一個賽博龐克霓虹風格的前端示範專案：整個系統需要登入，登入成功後進入首頁，首頁以巨大的故障風霓虹標題 **"This is Your World!"** 迎接使用者。所有頁面切換都有「雙開門」轉場。

- 純前端、沒有後端；帳號密碼完全在瀏覽器內驗證。
- 資安是刻意被忽略的（環境變數會被打包進前端 bundle），重點在前端架構與視覺呈現。

## 使用的技術

| 項目 | 技術 | 說明 |
| --- | --- | --- |
| UI 框架 | Vue 3（單檔元件、`<script setup>`） | 核心執行期依賴（另有 `vue-router`、`vue-i18n`） |
| 多語系 | `vue-i18n`（Composition 模式） | 支援 `zh-TW` / `en`，字串放在 `src/locales/`，見「多語系（i18n）」 |
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
  App.vue                          App 層級：<router-view :route="displayRoute">（包在 :inert 容器內）+ 全域 <DoorTransition> + 全域 <LocaleSwitcher>（在 :inert 之外）
  router/index.js                  路由表、meta、驗證守衛（beforeEach）
  views/                           route view：LoginView、HomeView、BeachView（海灘，純氛圍頁）、SpaceView（宇宙，純氛圍頁）、ForestView（森林，純氛圍頁）
  components/
    DoorTransition.vue             雙開門 overlay（門板、接縫、CSS）
    HudCard.vue                    首頁的 HUD 卡片
    LocaleSwitcher.vue             全域語系切換器（EN | 中）
  i18n/index.js                    vue-i18n 實例、語系偵測 / 持久化、setLocale、跨分頁同步
  locales/                         zh-TW.js、en.js（所有翻譯字串，key 結構必須一致）
  composables/
    useDoorTransition.js           轉場時間軸與「畫面路由 / URL 路由分離」機制
    useSession.js                  currentSession 與全域 session 監看（過期、跨分頁登出）
  styles/door-themes/<theme>.css   每個主題一個檔案，定義門的 CSS 變數（main.js 以 import.meta.glob 自動載入）
  shared/                          auth.js、config.js、tailwind.css、共用元件（NeonBackdrop、BeachBackdrop、WaveCanvas、SpaceBackdrop、StarCanvas、ForestBackdrop、ForestCanvas、NeonButton、WorldPlaceholder（目前沒有路由使用，保留作新世界的起手模板）…）
```

### Router

- `createWebHashHistory(import.meta.env.BASE_URL)`：網址為 `/#/home` 形式，GitHub Pages 重新整理任何路由都不會 404；Vite base 不變（build / preview 為 `/demo-claude-in-slack/`，dev 為 `/`）。
- 路由表（每個路由都有 `meta.theme` 與 `meta.title`（i18n key），需登入的有 `meta.requiresAuth`）：

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
5. 無障礙：轉場結束（`inert` 解除）後把焦點移到新畫面的 `main`，並以 `aria-live` 區塊念出新頁面的標題（`meta.title` 翻譯後的文字）；首次載入不搶焦點。語系切換器在 `:inert` 之外，轉場期間仍可操作（見「多語系（i18n）」）。
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
| `neon` | `neon.css` | `/login`、`/home` | 深藍紫底 + 青色邊 + 紫色光暈（同時掛在 `:root` 當預設值） |
| `beach` | `beach.css` | `/beach` | 夜藍 `#021A4D` -> 海藍 `#0277BD` -> 天藍 `#4FC3F7` 漸層底 + 淡天藍邊 + 天藍霓虹光暈 |
| `space` | `space.css` | `/space` | 黑 `#05020A` -> 暗紅 `#2A050C` -> 深紅 `#B71C1C` 漸層底 + 霓虹紅 `#FF1744` 邊與光暈 |
| `forest` | `forest.css` | `/forest` | 夜林綠 `#0B2A0F` -> 深草綠 `#1B5E20` -> 亮草綠 `#7CB342` 漸層底 + 淡草綠邊 `#AED581` + 草綠霓虹光暈 |

門色看的是「目的地」路由：進入 `/beach` 是海灘色，從 `/beach` 回 `/home` 則是 neon 色（`/space`、`/forest` 同理）。

### 如何新增世界 / 主題

1. 新增 `src/views/XxxView.vue`（可複製 `WorldPlaceholder` 當起手模板）。
2. 在 `src/router/index.js` 的路由表新增一行，各世界各佔獨立一行，世界 view 用 lazy import（不必改 import 區塊，並自動分 chunk；導覽會等 chunk 載入完才完成，之後才播門）：`{ path: '/xxx', name: 'xxx', component: () => import('../views/XxxView.vue'), meta: { theme: 'xxx', requiresAuth: true, title: 'routes.xxx.title' } }`，並在 `src/locales/zh-TW.js` 與 `en.js` 補上 `routes.xxx.title`。
3. 新增 `src/styles/door-themes/xxx.css`：

```css
[data-theme='xxx'] {
  --door-bg: linear-gradient(180deg, #..., #...);
  --door-edge: #...;
  --door-glow: rgb(... / 0.7);
}
```

不需要修改 `main.js`、`DoorTransition.vue` 或 vite 設定。

## 多語系（i18n）

使用 `vue-i18n`（Composition 模式，`legacy: false`），只支援 **`zh-TW`（繁體中文）** 與 **`en`**；`fallbackLocale` 為 `en`。

### 檔案位置

| 檔案 | 內容 |
| --- | --- |
| `src/locales/zh-TW.js`、`src/locales/en.js` | 所有翻譯字串（巢狀物件，兩個檔案的 key 結構必須完全一致） |
| `src/i18n/index.js` | `createI18n` 實例、`SUPPORTED_LOCALES`、語系偵測與持久化、`setLocale()`、`t()`（元件外使用）、`onLocaleStorageChange()`（跨分頁同步） |
| `src/components/LocaleSwitcher.vue` | 全域切換器 |
| `src/main.js` | `app.use(i18n)` |

Key 命名：`meta.*`（描述）、`routes.<name>.title`（頁籤標題）、`switcher.*`、`login.*`（登入頁；之後各頁用自己的前綴，例如 `home.*`）。

### 偵測與持久化

1. 首次造訪（`localStorage` 沒有 `neon.locale.v1`）：`navigator.language` 以 `zh` 開頭 -> `zh-TW`，否則 `en`。
2. 使用者手動切換時才寫入 `localStorage` 的 **`neon.locale.v1`**（值為 `zh-TW` 或 `en`）；之後儲存值優先於瀏覽器語言。無效的儲存值視為沒有。
3. `localStorage` 的讀寫一律包 `try/catch`；不可用時（隱私模式等）app 仍可運作，只是無法記住選擇。
4. 跨分頁同步：`App.vue` 掛載後監聽 `storage` 事件，**只處理 `key === 'neon.locale.v1'`**，其他 key（尤其是 auth 的 `neon.session.v1`，否則會干擾登入狀態）與 `clear()`（key 為 `null`）都忽略；同步進來的切換不再回寫。

### 切換器（`LocaleSwitcher.vue`）

- 固定在畫面右下角（`position: fixed`，並避開 safe-area），緊湊的霓虹風 `EN | 中` 兩段式切換；所有頁面（login、home、beach、space、forest）都看得到。
- 放在 `App.vue` 的 `:inert` 包裝**之外**，`z-index: 10000`（高於 `DoorTransition` 的 9999）：雙開門轉場期間仍浮在門之上，可點擊、可用鍵盤操作（切換語系不會中斷轉場、不改路由、不影響 session）。
- 無障礙：外層 `role="group"` + 翻譯後的 `aria-label`；兩個 `<button>` 各自有原生語言名稱的 `aria-label`（`English` / `繁體中文`，不隨語系翻譯）與 `aria-pressed`，並以 `lang` 標示；可用 Tab / Enter / Space 操作；觸控裝置的點擊區放大到 44px；沒有切換動畫（只有顏色 transition，`prefers-reduced-motion` 由全域規則處理）。
- 切換時即時生效、不重新載入頁面。

### 文件層級

- `<html lang>`：隨語系即時更新為 `zh-TW` 或 `en`（`i18n/index.js` 的 `watch`）；`<meta name="description">` 同步。
- `document.title`：路由的 `meta.title` 是 i18n key；`useDoorTransition.js` 的 `show()`（門合上、真正切換畫面時）翻譯後設定標題，語系切換時也會立刻以目前**畫面**的路由重設標題（轉場中途切換時，標題仍屬於目前顯示的畫面，轉場完成後才換成目的地的標題）。aria-live 的頁面宣告只在換頁時更新，切換語系不會重念。
- `index.html` 的 `<title>`、meta description、`<html lang="en">`、`<noscript>` 是 JS 載入前（或停用 JS）的預設值，維持英文 / 雙語，JS 啟動後會被覆寫。

### 如何新增字串

1. 在 `src/locales/zh-TW.js` **與** `src/locales/en.js` 加上相同的 key。
2. 元件內：`const { t } = useI18n()`，template 用 `{{ t('login.title') }}`、屬性用 `:aria-label="t('...')"`；元件外（router、composable）用 `import { t } from '../i18n/index.js'`。
3. 不要把翻譯後的文字存進 ref（會在切換語系時卡在舊語言）；改存 key 或用 `computed`（例如 `LoginView` 的 `errorKey`、`typewriterLines`）。
4. 訊息語法中 `{ } @ | $` 有特殊意義，要顯示這些字元請用 `{'@'}` 跳脫。
5. 品牌 / 賽博龐克用語（`NEON//GRID`、`NEON GRID`、`SEC-NODE`、`HMAC-SHA256` 等）可保留英文。
6. 英文語系不放中文（不要再寫「USERNAME 使用者名稱」這種雙語字串）。

### 如何新增語言

1. 新增 `src/locales/<code>.js`（複製 `en.js` 後翻譯，key 完全一致）。
2. 在 `src/i18n/index.js`：`import` 它、加進 `messages` 與 `SUPPORTED_LOCALES`，並視需要調整 `browserLocale()` 的偵測規則。
3. 在 `LocaleSwitcher.vue` 的 `options` 加一個選項（`code`、顯示文字、原生語言名稱 `label`、`lang`），並補上 `switcher.*` 字串（若需要）。
4. 更新本節與 `CLAUDE.md`。

### 目前的翻譯範圍

- 已翻譯：頁籤標題（所有路由）、`<html lang>`、LoginView 的所有可見文字、錯誤訊息、Typewriter 台詞與 aria 文字。
- 尚未翻譯（CTCC-12）：首頁與海灘 / 宇宙 / 森林世界頁的內文。

## 首頁世界入口

- `src/components/WorldOrb.vue`：圓形霓虹按鈕（沿用 NeonButton 的手感；`accent` 邊框發光色、`base` 球體底色、slot 放 SVG 圖形；`router-link` 導覽，aria-label 由呼叫端傳入）。掃光等參數複製自 NeonButton，調整時需同步。
- `src/components/WorldOrbs.vue`：首頁的三個入口（海灘 `/beach`、宇宙 `/space`、森林 `/forest`），以 `worlds` 陣列（每個世界一個物件，含配色與內嵌 SVG 圖示）+ `v-for` 產生。

## 海灘世界（/beach）

`src/views/BeachView.vue`：純氛圍頁面，沒有功能性內容——**賽博龐克海灘**：夜藍天空 + 合成波條紋太陽 + 發光霓虹海浪 + HUD 外框 + 故障標題（BEACH / 海灘）+ 「返回主頁」按鈕（`router.push('/home')`，因此會播放雙開門轉場）。路由 `meta.theme` 為 `beach`，需登入。

- 風格：和首頁同一套賽博龐克語彙（霓虹發光、HUD 切角框、CRT 掃描線 + 掃過的亮帶、故障文字、合成波太陽、地平線光帶），但主色維持天藍 / 白，不使用首頁的紫 / 洋紅。重用首頁元件：`GlitchText`（標題；以 `--glitch-a` / `--glitch-b` 覆寫殘影顏色）、`NeonButton`（`beach` 變體）、`HudCard`（`beach` 變體，頂部三張狀態卡）、`bg-scanlines` / `animate-scan-bar` 等 utility；沒有直接用 `NeonBackdrop`（它綁定紫色天空 / 網格地板 / 數位雨），改由 `BeachBackdrop` 組裝同類圖層。
- 配色：天藍 `#4FC3F7`、海藍 `#0288D1`、深藍 `#01579B`、夜藍 `#021A4D` / `#010B26`、淡天空 `#E1F5FE` + 白；沙色 `#F6E7C1` 只用在窄窄的沙灘（小面積點綴）。token 定義在 `tailwind.css` 的 `@theme`：`--color-beach-sky` / `-sea` / `-deep` / `-mist` / `-sand` / `-night` / `-abyss` / `-neon`、發光 `--text-shadow-beach-*` / `--shadow-beach-*`（utility 如 `text-beach-neon`、`shadow-beach-glow`、`text-shadow-beach-glow`），以及 `bg-beach-sun`（條紋太陽）；`WaveCanvas.vue` 裡的色碼需與這些 token 同步。字型只用 Orbitron / Rajdhani（`font-display` / `font-sans`），沒有新增字型。
- `src/shared/components/BeachBackdrop.vue`：場景外層。天空漸層、星點（閃爍）、條紋太陽（暈光呼吸、下半沉進海面）、4 朵霓虹線框的雲（只用 `transform` / `opacity`；關鍵影格 `cloud-drift`、`sun-glow` 在 `tailwind.css`）、地平線光帶，下半部放 `WaveCanvas`，最上層是暈邊 + 掃描線 + 亮帶。`--sea` 變數是海面佔畫面高度的比例。
- `src/shared/components/WaveCanvas.vue`：Canvas 2D 畫 6 層正弦海浪（深藍填色 + 發光的天藍 / 白浪頭線）、窄沙灘（含霓虹透視格線）與來回漫過沙灘的發光浪花。效能 / 清理規則（沿用 `RainCanvas` 模式）：DPR 上限 2、約 30fps、`ResizeObserver`；發光用「寬淡線 + 細亮線」疊畫而不是 `shadowBlur`；分頁隱藏（`visibilitychange`）時取消 rAF、回到前景再恢復；`prefers-reduced-motion` 時只畫一張靜態畫面（也會即時響應系統設定變更）；卸載時取消 rAF、斷開 observer、移除所有 listener。

## 宇宙世界（/space）

`src/views/SpaceView.vue`：純氛圍頁面，沒有功能性內容——**賽博龐克宇宙**：黑色深空 + 紅色星雲光暈 + 閃爍星空與流星 + 底部暗紅星球弧線 + HUD 外框 + 故障標題（SPACE / 宇宙）+ 「返回主頁」按鈕（`router.push('/home')`，因此會播放雙開門轉場）。路由 `meta.theme` 為 `space`，需登入。結構完全比照 `/beach`。無障礙：DOM 順序是 `main`（h1 + 返回按鈕）在前，純裝飾的假資料狀態卡與 HUD 角標都是 `aria-hidden`，視覺上用 grid 的 `row-start` 維持卡片在標題上方。`NeonButton space` 的 focus 外框是紅色，hover 背景改為深紅（`#B71C1C` -> `#8E1212`）以維持白字對比。

- 風格：同一套賽博龐克語彙（霓虹發光、HUD 切角框、CRT 掃描線 + 掃過的亮帶、故障文字），主色為黑 + 紅，不使用首頁的紫 / 洋紅。重用 `GlitchText`（`--glitch-a` / `--glitch-b` 覆寫為紅色殘影）、`NeonButton`（`space` 變體）、`HudCard`（`space` 變體：邊框、標題、四角標與 hover 邊框都是紅色；頂部三張狀態卡 SECTOR / ORBIT / SIGNAL）。
- 配色：霓虹紅 `#FF1744`、深紅 `#B71C1C`、黑 `#05020A`。token 在 `tailwind.css` 的 `@theme`：`--color-space-void` / `-deep` / `-neon` / `-crimson` / `-ember` / `-mist`、發光 `--text-shadow-space-*` / `--shadow-space-*`（utility 如 `text-space-neon`、`shadow-space-glow`、`text-shadow-space-glow`）；`--color-space-deep` 用在 `HudCard space` 的卡片底色；`StarCanvas.vue` 裡的色碼需與這些 token 同步。字型只用 Orbitron / Rajdhani。
- `src/shared/components/SpaceBackdrop.vue`：場景外層。黑底 + 兩層紅色星雲（徑向漸層，只用 `transform` / `opacity` 緩慢飄移，關鍵影格 `nebula-drift`）、`StarCanvas`、底部超大圓只露出上緣的暗紅星球弧線（邊緣亮線 + 大氣光暈呼吸，關鍵影格 `planet-glow`），最上層是暈邊 + 掃描線 + 亮帶。
- `src/shared/components/StarCanvas.vue`：Canvas 2D 畫閃爍的星空（固定種子的亂數，位置每次一致；星數依畫面面積決定，上限 260；四種色調：白 `#ffffff`、淡紅 `#ffd2d9`（不是 token，只用在星點）、`--color-space-ember` `#ff5252`、`--color-space-neon` `#ff1744`）與偶爾劃過的紅白流星（同時最多 3 顆）。效能 / 清理規則同 `WaveCanvas`：DPR 上限 2、約 30fps、`ResizeObserver`；分頁隱藏時取消 rAF、回到前景再恢復（dt 歸零避免流星瞬移）；`prefers-reduced-motion` 時只畫一張靜態畫面（含一顆凍結的流星，也會即時響應設定變更）；卸載時取消 rAF、斷開 observer、移除所有 listener。
- 只改 `/beach`、`/space`：`/forest` 見下節。

## 森林世界（/forest）

`src/views/ForestView.vue`：純氛圍頁面，沒有功能性內容——**賽博龐克森林**：深綠夜空 + 月亮 + 多層樹木剪影 + 落葉 + 螢火蟲 + HUD 外框（四角標與頂部狀態列）+ 故障標題（FOREST / 森林）+ 「返回主頁」按鈕（`router.push('/home')`，因此會播放雙開門轉場）。路由 `meta.theme` 為 `forest`，需登入。

- 風格：和首頁 / 海灘同一套賽博龐克語彙（霓虹發光、HUD 角標、CRT 掃描線 + 掃過的亮帶、故障文字），主色為草綠，不使用首頁的紫 / 洋紅。重用 `GlitchText`（以 `--glitch-a` / `--glitch-b` 覆寫殘影顏色為草綠）與 `bg-scanlines` / `animate-scan-bar` / `animate-float` 等 utility；**沒有**在共用的 `NeonButton` / `HudCard` 加森林變體，返回按鈕以 `ForestView` 內的 scoped class + `--forest-*` 變數自行上色。
- 配色：亮草綠 `#7CB342`、深草綠 `#1B5E20`、夜林綠 `#0B2A0F`、最深 `#06180A`；文字為中性奶油色 `#F5EBD0`（月亮、螢火蟲也用奶油色）。字型只用 Orbitron / Rajdhani（`font-display` / `font-sans`），沒有新增字型。
- Token：定義在獨立的 `src/styles/forest.css`（純 CSS 變數與 keyframes，**不改 `tailwind.css`**，避免與其他世界衝突）：`--forest-bright` / `-deep` / `-night` / `-abyss` / `-cream` / `-light` / `-pale` / `-moss`、`--forest-glow`、`--forest-shadow-glow(-lg)` / `--forest-shadow-inset(-lg)`、`--forest-text-glow`、`--forest-text-shadow-sm`，以及 `forest-sway` / `forest-mist` / `forest-moon` 關鍵影格。`[data-theme]` 只掛在門 overlay 上，所以 token 放在 `:root`，由 `ForestView` / `ForestBackdrop` import；`ForestBackdrop` / `ForestView` 以 `var(--forest-*)` 引用 token（只有樹影漸層、地平線亮色等單一用途色碼寫在元件內）；`ForestCanvas.vue` 的色碼與 `door-themes/forest.css`（`main.js` 全域載入，不能依賴只在進入 /forest 才載入的 `forest.css`）是寫死的，改 token 時需同步。
- `src/shared/components/ForestBackdrop.vue`：場景外層。夜空漸層、月亮（暈光呼吸）、3 層松樹剪影（遠 / 中 / 近，越近越深越高；inline SVG，由固定公式產生，以 `transform` 緩慢左右搖曳、各層週期與相位不同）、兩條緩慢飄移的霧，中間夾 `ForestCanvas`，最上層是暈邊 + 掃描線 + 亮帶。
- `src/shared/components/ForestCanvas.vue`：Canvas 2D 畫落葉（正弦左右擺動 + 自轉 + 翻面）與螢火蟲（慢速漂移、閃爍、柔光）。粒子總數桌機 48（落葉 20 + 螢火蟲 28）、手機（寬 < 640px）20，不超過 50；位置全由固定公式決定（不用 `Math.random`），所以靜態畫面穩定；標題區域的粒子會調暗以維持可讀性。
- 效能 / 清理規則（沿用 `WaveCanvas` 模式）：DPR 上限 2、約 30fps、`ResizeObserver`；發光用預先畫好的柔光 sprite + `drawImage`（不用 `shadowBlur`）；分頁隱藏（`visibilitychange`）時取消 rAF、回到前景再恢復；`prefers-reduced-motion` 時只畫一張靜態畫面（也會即時響應系統設定變更），CSS 的搖曳 / 霧 / 月亮動畫同時停掉；卸載時取消 rAF、斷開 observer、移除所有 listener。
- 只改 `/forest`：`/beach`、`/space`、首頁、router、`main.js`、`tailwind.css` 都沒有變動。
