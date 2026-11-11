# CLAUDE.md

May4s 伊原力科技官網改版（純前端、Astro 靜態站）：深色科技風 + 浩瀚星空（Three.js）+ 整頁切換（GSAP Observer / SplitText）+ 頁面間轉場（Astro View Transitions）。目前只有繁體中文。部署到 GitHub Pages。

## 需要了解專案時請閱讀

專案文件都放在 [`docs/`](./docs/README.md)，先看索引，再依需要閱讀各分類：

- @docs/README.md — 文件索引與維護規則
- @docs/architecture.md — 專案架構：目的、技術、目錄結構、設計 token、整頁切換引擎 API、如何新增頁面 / 屏

## 常用指令

```bash
npm ci               # 安裝依賴（Node 20+）
npm run dev          # 開發伺服器（http://localhost:4321/demo-claude-in-slack/）
npm run build        # 靜態輸出到 dist/（base 為 /demo-claude-in-slack/）
npm run preview      # 預覽 dist/
```

## 結構速查

- 技術：Astro 5（刻意停在 5.x，因為 Astro 6+ 需要 Node 22，專案維持 Node 20）、GSAP（`gsap` npm 套件，含 Observer / SplitText / ScrollTrigger）、Three.js、`@fontsource-variable/noto-sans-tc`（字體自架，不連外部）。
- 站內連結一律用 `src/data/site.ts` 的 `url()` / `solutionHref()`（會帶 GitHub Pages 的 base path）；導覽 / 頁尾資料也在這個檔案。
- 所有頁面都用 `src/layouts/BaseLayout.astro`，內容由 `<Screen id="…" label="…">`（`src/components/Screen.astro`）組成，**一個 `<Screen>` = 一屏**。屏內動畫用資料屬性：`data-split`（逐字 / 逐詞 / 逐行）、`data-enter`（整塊入場）、`data-depth`（視差深度）。一屏的內容必須在一個視窗高度內放得下。
- 設計 token 只在 `src/styles/tokens.css` 定義；元件與頁面只用 `var(--token)`，不要寫死色碼 / 間距。黃色 `#ffd400` 只用在重點（主要 CTA、目前位置），避免霓虹賽博龐克感。
- 整頁切換引擎在 `src/scripts/screens/`；進出場客製用 `onScreensReady((engine) => engine.hooks.register(id, {...}))`，事件為 `screen:ready|leave|enter|change|destroy`。**不要**另外在頁面裡自己監聽 wheel / touch / 方向鍵。
- 星空（`<Starfield>`）與游標層（`<FxLayer>`）使用 `transition:persist`，**不可**移除，也不要在頁面裡重複建立；Three.js 一定要維持動態 import（idle 後載入）。
- `prefers-reduced-motion` 必須降級：關閉游標拖尾 / 曲速 / 視差，屏切換與頁面轉場改為淡入淡出。新增動畫時要一併處理。
- 觸控裝置不啟用自訂游標與磁吸按鈕（以 `(hover: hover) and (pointer: fine)` 判斷）。
- 首頁 `/` 已是 CTCC-14 的正式設計（5 個整屏，樣式 `src/styles/home.css`、互動 `src/scripts/home.ts`）。目前只有 `/solutions/` 與 `/contact/` 是 CTCC-13 的**示範頁**（只為驗證引擎）；正式設計由 CTCC-15（解決方案）、CTCC-16（聯絡）取代，兩頁用的樣式在 `src/styles/demo.css`，兩頁都完成後可刪除。

## 流程

- PR 一律以 `main` 為目標分支；PR 會跑 `.github/workflows/ci.yml`（`npm ci` + `npm run build` + 檢查 dist 內容）。
- push 到 `main` 後由 `.github/workflows/deploy.yml` 建置並部署到 GitHub Pages（Settings → Pages → Source 需為 GitHub Actions；部署環境 `github-pages`）。純靜態站，不需要任何 secrets 或環境變數。

## 維護文件的規則

- 新增文件分類時：在 `docs/README.md` 的索引加上連結，並在本檔「需要了解專案時請閱讀」加上引用。
- 變更使用的技術、專案目的、引擎 API、設計 token 或 Node 版本時，同步更新 `docs/` 與本檔。
