# 專案架構

## 專案目的

May4s 伊原力科技（Salesforce / Slack / Agentforce 顧問，主張「企業 Agentic OS」）官網的前端改版。

- 純前端、靜態輸出，沒有後端；目前只有繁體中文。
- 風格：深色科技風（底色 `#030712`、品牌黃 `#ffd400`、品牌藍 `#00a1e0`、Noto Sans TC），**不是**霓虹賽博龐克；用動態與「浩瀚星空」營造深度。
- CTCC-13（本文件描述的範圍）只建立**基礎建設**：Astro 專案、設計 token、共用版型（導覽列 / 頁尾 / 屏數點）、星空背景、整頁切換引擎、頁面間轉場、共用互動元件。`/`、`/solutions/`、`/contact/` 只是驗證引擎用的示範頁，正式設計由 CTCC-14（首頁）、CTCC-15（解決方案）、CTCC-16（聯絡）接手，它們都重用這裡的「屏」元件與 API。

## 使用的技術

| 項目 | 技術 | 說明 |
| --- | --- | --- |
| 框架 | Astro 5（`output: 'static'`） | 刻意停在 5.x：Astro 6+ 要求 Node 22，專案維持 Node 20（`package.json` engines、CI / deploy 都是 20） |
| 動畫 | GSAP 3（npm `gsap`，免費含所有外掛） | `Observer`（輸入）、`SplitText`（逐字 / 逐行）、`ScrollTrigger`（已註冊，引擎本身不依賴捲動位置，保留給屏內自有捲動區） |
| 星空 | Three.js | 只在 idle 後以動態 `import()` 載入，獨立 chunk（約 130 KB gzip） |
| 頁面轉場 | Astro View Transitions（`<ClientRouter fallback="swap" />`） | 搭配 `transition:persist` 讓星空 / 游標層跨頁不重建 |
| 字體 | `@fontsource-variable/noto-sans-tc` | 自架（不連 Google Fonts）；unicode-range 切片，瀏覽器只下載用到的字 |
| 樣式 | 原生 CSS + CSS 變數 | token 在 `src/styles/tokens.css`，沒有 CSS 框架 |
| 部署 | GitHub Pages + GitHub Actions | `base: '/demo-claude-in-slack'`；push 到 `main` 部署，PR 跑 build 檢查；不需要任何 secrets |
| 執行環境 | Node.js 20 以上、npm | |

## 目錄結構

```
astro.config.mjs               site / base（GitHub Pages）、靜態輸出、prefetch
public/favicon.svg
src/
  layouts/BaseLayout.astro     全站版型：head、<ClientRouter>、Starfield、FxLayer、Navbar、<main data-screens>、ScreenDots、Footer
  components/
    Screen.astro               「屏」元件（頁面唯一該用的版面單位）
    Navbar.astro               導覽列 + 解決方案下拉（資料來自 data/site.ts）
    Footer.astro               頁尾（固定在底部，只在最後一屏出現）
    ScreenDots.astro           右側屏數點骨架（按鈕由 JS 建立）
    Starfield.astro            CSS 星雲 / CSS 星空 / <canvas>（transition:persist）
    FxLayer.astro              自訂游標 + 星塵拖尾層（transition:persist）
  data/site.ts                 導覽 / 頁尾連結、解決方案清單、url() helper
  pages/                       index.astro、solutions/index.astro、contact/index.astro（CTCC-13 示範頁）
  styles/
    tokens.css                 設計 token（唯一事實來源）
    base.css                   reset、排版、a11y
    screens.css                屏版面 / 狀態、View Transition CSS、reduced-motion 轉場
    components.css             星空層、按鈕、卡片、導覽列、屏數點、頁尾、游標層
    demo.css                   示範頁樣式（正式頁面會取代，可刪）
  scripts/
    main.ts                    全站進入點（只執行一次）；每頁要重做的事在 bootPage()
    gsap.ts                    GSAP 外掛註冊（其他模組一律從這裡 import）
    motion.ts                  prefers-reduced-motion / 指標能力 / 手機判斷
    warp.ts                    曲速狀態（kickWarp）
    starfield.ts               星空控制器：idle 後載入、WebGL 偵測、CSS 退路、視差
    starfield-gl.ts            Three.js 星空（動態 import 的 chunk）
    cursor.ts / magnetic.ts / hover-glow.ts / pointer.ts   共用互動元件
    navbar.ts                  下拉選單 / 手機選單
    chrome.ts                  頁尾隨屏顯示、切屏時收起下拉
    transitions.ts             View Transition 的 JS 輔助
    screens/                   整頁切換引擎（engine / hooks / dots / index / types）
```

## 設計 token（`src/styles/tokens.css`）

| 類別 | token | 說明 |
| --- | --- | --- |
| 色彩 | `--c-space-950…400` | 藍黑底色階，`950 = #030712` 為品牌底色 |
| | `--c-yellow-50…800` | 品牌黃階，`400 = #ffd400`。**只用在重點**（主要 CTA、目前位置、點綴） |
| | `--c-blue-50…900` | 品牌藍階，`500 = #00a1e0`；互動色、光暈、連結 |
| | `--color-bg / surface / border / text / text-muted / text-faint / accent / link / focus` | 語意別名，元件請用這一層 |
| 字體 | `--font-sans`、`--fw-*`（300–800）、`--fs-xs…display`（流體）、`--lh-*`、`--ls-*` | Noto Sans TC Variable |
| 間距 | `--sp-1…16`（4px 基準）、`--gutter` | |
| 圓角 | `--r-xs…xl`、`--r-pill` | |
| 陰影 / 光暈 | `--shadow-sm/md/lg`、`--glow-blue`、`--glow-yellow`、`--glow-soft`、`--ring-focus` | |
| 動態 | `--ease-out / in-out / warp`、`--dur-fast/base/slow/screen` | `--dur-screen` 與 `screens/engine.ts` 的 `DURATION` 同步 |
| 版面 | `--nav-h`、`--dots-gap`、`--footer-reserve`、`--content-max`、`--z-*` | |

規則：元件與頁面只使用 `var(--token)`；要新增顏色 / 間距先加 token。

## 整頁切換引擎

### 約定（頁面作者要做的事）

頁面只需要用 `<Screen>` 組版（`BaseLayout` 已提供容器 `<main data-screens>`）：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Screen from '../components/Screen.astro';
---
<BaseLayout title="頁面名稱">
  <Screen id="hero" label="首屏">
    <h1 class="display" data-split="chars">標題</h1>
    <p class="lead" data-split="lines">內文…</p>
    <a class="btn btn--primary" href="…" data-magnetic data-enter>按鈕</a>
  </Screen>
  <Screen id="next" label="第二屏">…</Screen>
</BaseLayout>
```

`<Screen>` 輸出 `<section id data-screen data-screen-label data-align>`。資料屬性：

| 屬性 | 位置 | 說明 |
| --- | --- | --- |
| `data-screen` | section | 標記一屏（`<Screen>` 已加）。值 = id |
| `id` | section | **必填**。是深連結 hash（`/page/#id`）與事件的識別；另外也支援 `#screen-N`（1 起算） |
| `data-screen-label` | section | 屏數點 tooltip 與 aria-label |
| `data-align` | section | `center`（預設）/ `start` / `end` |
| `data-split="lines｜words｜chars"` | 文字元素 | SplitText 入場：`lines`（預設，行遮罩上滑）/ `words` / `chars`（逐字，適合大標題；拉丁字母可能在窄螢幕斷在字中，只用在短標題） |
| `data-enter="up｜fade｜scale"` | 任意元素 | 整塊入場（預設 `up`：淡入 + 位移） |
| `data-depth="n"` | 任意元素 | 視差深度倍率（預設 1）；數字越大，進出場位移越多 |
| `data-no-screen-nav` | 任意元素 | 其內的滾輪 / 觸控不切屏（例如屏內自己的捲動區） |
| `data-no-screen-keys` | 任意元素 | 其內的鍵盤事件不切屏（例如下拉選單） |
| `data-screen-hash="false"` | `<main data-screens>` | 關閉網址 hash 同步 |

限制：**一屏的內容必須在一個視窗高度內放得下**；引擎不處理屏內捲動。手機請用 `svh` / 流體字級確認小螢幕。

### 行為

- **一次一屏、不停半屏**：單一 `animating` 旗標。切換進行中所有輸入（滾輪、觸控、鍵盤、點、hash）都被忽略。
- **滾輪**：GSAP Observer。同一次手勢累積 `|deltaY| ≥ 40` 才切換；兩個 wheel 事件間隔 > 120ms 才算新手勢，所以觸控板慣性滾動的尾巴不會連切多屏。
- **觸控**：Observer，滑動距離 ≥ 48px 切一屏，一次滑動只切一屏。
- **鍵盤**：`↓ / PageDown / Space` 下一屏，`↑ / PageUp / Shift+Space` 上一屏，`Home / End` 首 / 末屏。在輸入框、可編輯區、`data-no-screen-keys` 內不攔截；Space 在按鈕 / 連結上保留原本的「啟動」行為；`e.repeat` 忽略。
- **屏數點**：右側 dots，顯示 `目前/總數`，可點擊跳屏（一次跳多屏也只做一次轉場）；`aria-current="step"`，有 `aria-live` 播報。
- **網址 hash**：載入時 `#id` → 對應屏；切屏後以 `history.replaceState`（保留 Astro 存在 `history.state` 的資料）更新 hash；同頁 hash 連結由引擎在 click 捕獲階段接手（Astro 對同頁 hash 只 pushState，不觸發 `hashchange`）；`hashchange` 也有處理。第一屏不加 hash。
- **焦點管理**：非作用中的屏設 `inert` + `aria-hidden`，離開的屏的內容不可被 Tab 到；若焦點原本在屏內，切換完成後移到新屏。
- **頁面不捲動**：`html.js` 時 `overflow: hidden`；沒有 JS 時退回一般直向捲動頁面。
- **View Transitions**：`astro:before-swap` 清除舊引擎（含還原 SplitText）、`astro:after-swap` 建立新引擎；導覽進行中（`astro:before-preparation`）引擎被鎖定。

### 轉場語彙

屏切換與頁面切換共用同一組語彙，讓整站感覺一致：

1. **星空曲速**：星星沿畫面中心向外拉長成光軌並加速（Three.js 讀 `warpState`；CSS 退路用 `--warp` 縮放）。
2. **遮罩擴散**：進入的屏以 `clip-path: circle()` 從起點（滾輪 / 鍵盤為畫面中心偏上；點擊屏數點從右側；換頁從點擊處）擴散，邊緣帶一圈光環。
3. **內容視差**：離開的屏往鏡頭放大 + 淡出 + 模糊；內容依 `data-depth` 位移；進入的內容逐字 / 逐行 / 位移入場。
4. 總時長約 1.05 秒（`DURATION`）。

**`prefers-reduced-motion`**：屏切換改為交叉淡入淡出（0.2 / 0.3s），不做曲速、遮罩、視差、逐字；頁面轉場改為 0.3s 淡入淡出（Astro 預設會在 reduced-motion 時 `!important` 關掉所有轉場動畫，`screens.css` 以 `html::view-transition-*` + `!important` 覆寫）；游標拖尾停用；星空不漂移（只畫一幀）。

### 頁面間轉場（`transition:persist`）

- `<Starfield>`（`#starfield`）與 `<FxLayer>`（`#fx-layer`）使用 `transition:persist`：換頁時 DOM 節點與 `<canvas>` 都是同一個，不閃爍、不重新建立 WebGL context，曲速也能跨頁連續。
- CSS（`screens.css`）：舊頁 `root` 快照隱藏、新頁 `root`（含活的星空）直接顯示；只有 `main`（`view-transition-name: page`）做轉場——舊內容放大淡出、新內容以圓形遮罩從點擊處擴散（`--vt-x / --vt-y`）。導覽列、屏數點、頁尾、游標層各自命名（`nav` / `dots` / `footer` / `fx`），固定在轉場內容之上。
- `<html>` 的屬性（class、style）每次換頁都會被新頁面覆寫，所以 `transitions.ts` 的 `applyRootState()` 會在 `astro:after-swap` 重新套用（`js` class、`--vt-*`、`--warp`）。**不要把需要跨頁保留的狀態放在 `<html>` 屬性上**，放在 persist 的元素上（例如 `#fx-layer[data-cursor]`）。
- 不支援 View Transitions 的瀏覽器：`fallback="swap"` 直接換頁，引擎仍會在新頁做入場動畫。

### 公開 API

```ts
import { onScreensReady, getEngine } from '../scripts/screens';
```

- `getEngine()` / `window.may4s.screens`：目前的 `ScreenEngine`。
  - 屬性：`index`、`count`、`screens`（`{ index, id, label, el, splits }[]`）、`animating`、`locked`、`current`、`root`、`hooks`
  - 方法：`goTo(index, source?)`、`next()`、`prev()`（被忽略時回傳 `false`）、`destroy()`
- `onScreensReady(cb)`：註冊「引擎就緒」回呼，**每次換頁都會再呼叫**；頁面腳本在模組頂層呼叫一次即可。回呼可回傳清理函式。
- `engine.hooks.register(target, hooks)`：`target` 為屏 id / element / `'*'`，`hooks` 可含 `beforeEnter`、`enter`、`afterEnter`、`leave`、`afterLeave`；`enter` / `leave` 可回傳 GSAP tween / timeline，引擎會放進主時間軸。`ctx` 為 `{ engine, from, to, direction, source, reduced, count }`；`reduced` 為 true 時不會呼叫 `enter` / `leave`。
- 事件（`document` 上，`detail` 為 `ctx`）：`screen:ready`（引擎初始化完成）、`screen:leave`、`screen:enter`（開始切換；初次進場也會觸發一次）、`screen:change`（動畫完全結束）、`screen:destroy`。
- DOM 狀態：`<section data-state="active｜entering｜leaving｜idle">`；`<main data-screens>` 上有 `data-screen-index`（0 起算）、`data-screen-count`、`data-screen-id`、`data-screen-animating`（切換中）、`data-ready`。
- 全域除錯物件：`window.may4s = { screens, cursor(), starfield() }`。

範例（在頁面裡替某一屏加自訂動畫）：

```astro
<script>
  import { gsap } from '../scripts/gsap';
  import { onScreensReady } from '../scripts/screens';
  onScreensReady((engine) => {
    engine.hooks.register('hero', {
      enter: () => gsap.from('.my-orb', { scale: 0, duration: 1, ease: 'expo.out' }),
    });
  });
</script>
```

## 星空背景

- `<Starfield>`：CSS 星雲（三團漸層緩慢漂移）+ CSS 星空（`box-shadow` 星點，建置時以種子亂數產生）+ `<canvas>`。首屏只靠 CSS 就有完整背景，文字立即可讀。
- `starfield.ts`：`window load` → 瀏覽器 idle（`requestIdleCallback`，timeout 2.5s）→ 偵測 WebGL → 動態 `import('./starfield-gl')`。狀態寫在 `#starfield[data-starfield]`：`pending → webgl | css`（`data-starfield-reason` 為退路原因：`no-webgl` / `init-error` / `context-lost`）。
- `starfield-gl.ts`：單一 draw call 的 instanced quad；頂點著色器自己做透視投影（景深：近大遠小、近星受滑鼠視差影響大），`uTravel` 緩慢累加成漂移，`uWarp` 把星星沿向外方向拉長成光軌。桌機 3000 顆、手機（窄螢幕或觸控為主）1000 顆（`data-star-count`）。DPR 上限桌機 2 / 手機 1.5；連續掉幀時自動降低解析度與粒子數（自適應品質）。
- 不支援 WebGL / 初始化失敗 / context lost → 維持 CSS 星空（含 CSS 版曲速縮放）。
- `prefers-reduced-motion`：星空只畫一幀、無漂移、無滑鼠視差、無曲速。

## 共用互動元件

- **自訂游標 + 星塵拖尾**（`cursor.ts`、`<FxLayer>`）：只在 `(hover: hover) and (pointer: fine)` 啟用；觸控裝置 `#fx-layer` 保持 `hidden`、不綁任何事件。reduced-motion 時只留點 + 環，無拖尾。懸停在可互動元素上游標環放大。
- **磁吸按鈕**（`magnetic.ts`）：`<a class="btn" data-magnetic>`（可 `data-magnetic="0.5"` 調強度）；滑鼠靠近（邊緣外 64px）時被吸向游標，離開彈性回位。觸控 / reduced-motion 停用。
- **hover 光暈**（`hover-glow.ts` + CSS）：`.btn` / `.card` / `.nav-dropdown__item` / `[data-glow]` 會跟著游標位置顯示 radial-gradient 光暈（`--mx / --my`）。

## 如何新增

- **新增頁面**：在 `src/pages/xxx/index.astro` 用 `BaseLayout` + `<Screen>`；在 `src/data/site.ts` 加導覽項目；站內連結用 `url('/xxx/')`（目錄型路徑以 `/` 結尾）。
- **新增一屏**：加一個 `<Screen id="唯一id" label="屏數點文字">`；要被導覽深連結就把 id 放進 `site.ts`。
- **新增解決方案深連結**：`site.ts` 的 `industrySolutions` / `softwareSolutions` 加一筆（`id` 對應解決方案頁的屏 id）；下拉選單與示範頁會自動更新。
- **替換示範頁**：CTCC-14/15/16 直接改寫對應 `pages/*.astro`，保留 `<Screen>` 用法；完成後可刪除 `styles/demo.css`。

## 效能與無障礙規則

- 首屏不得依賴 Three.js；Three.js 必須維持動態 import 在 idle 之後。CI 會檢查 `dist/_astro/starfield-gl.*.js` 存在（確保仍是獨立 chunk）。
- 沒有外部請求（字體自架、無第三方腳本 / 分析）。
- Canvas / rAF 一律掛在 `gsap.ticker`（分頁隱藏時自動暫停）；DPR 設上限；游標拖尾粒子有數量上限且沒有粒子時停止迴圈。
- 所有動畫都要考慮 `prefers-reduced-motion`（見上）；新增動畫時用 `prefersReducedMotion()`（`scripts/motion.ts`）或 CSS media query 降級。
- 鍵盤：所有互動元素可 Tab 到並有 `:focus-visible` 外框；非作用中的屏 `inert`；導覽列下拉支援 ↓ / Esc；有「跳到主要內容」連結。
- 文字對比：內文與次要文字 token（`--color-text-muted` / `--color-text-faint`）在 `#030712` 上對比皆 > 5:1。
