# 專案架構

> 本文件只記錄「專案目的」與「使用的技術」。

## 專案目的

NEON//GRID 是一個賽博龐克霓虹風格的前端示範專案：整個系統需要登入，登入成功後進入首頁，首頁以巨大的故障風霓虹標題 **"This is Your World!"** 迎接使用者。

- 純前端、沒有後端；帳號密碼完全在瀏覽器內驗證。
- 資安是刻意被忽略的（環境變數會被打包進前端 bundle），重點在前端架構與視覺呈現。

## 使用的技術

| 項目 | 技術 | 說明 |
| --- | --- | --- |
| UI 框架 | Vue 3（單檔元件、`<script setup>`） | 僅此一個執行期依賴 |
| 建置工具 | Vite + `@vitejs/plugin-vue` | 開發伺服器與打包 |
| 樣式 | Tailwind CSS v4（`tailwindcss` + `@tailwindcss/vite`） | 主題 token（配色、字型、動畫）定義在 `@theme`，以 utility class 撰寫樣式 |
| 頁面模式 | MPA（多頁應用） | 多個 HTML 入口，由 Vite `build.rollupOptions.input` 設定 |
| 驗證 | Web Crypto API（HMAC-SHA-256） | 以 hash key 對密碼做雜湊後比對，session 存在 `localStorage` |
| 設定 | Vite 環境變數（`VITE_*`） | hash key、管理員帳號與密碼 hash 皆由環境變數提供 |
| 視覺特效 | CSS 動畫與 Canvas 2D | 不使用額外的動畫或圖形套件 |
| 部署 | GitHub Pages + GitHub Actions | push 到 `main` 時自動建置並部署 |
| 執行環境 | Node.js 20 以上、npm | |
