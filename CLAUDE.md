# CLAUDE.md

NEON//GRID：賽博龐克霓虹風格的 Vue 3 + Vite + Tailwind CSS 多頁應用（MPA），純前端登入（Web Crypto HMAC-SHA-256），登入後進入首頁 "This is Your World!"，部署到 GitHub Pages。

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

## 環境變數

複製 `.env.example` 為 `.env`（已被 `.gitignore` 忽略）。**絕對不要提交真實的值。**

- `VITE_AUTH_HASH_KEY`：密碼雜湊用的 key
- `VITE_ADMIN_USERNAME`：管理員帳號
- `VITE_ADMIN_PASSWORD_HASH`：管理員密碼的 hash（建議；`npm run hash -- <password>` 產生）
- `VITE_ADMIN_PASSWORD`：（選填備援）明文密碼，僅在沒有設定 hash 時使用

## 流程

- PR 一律以 `main` 為目標分支。
- push 到 `main` 後由 GitHub Actions（`.github/workflows/deploy.yml`）建置並部署到 GitHub Pages；PR 會跑 `ci.yml` 的 build 檢查。

## 維護文件的規則

- 新增文件分類時：在 `docs/README.md` 的索引加上連結，並在本檔「需要了解專案時請閱讀」加上引用。
- 變更使用的技術、專案目的或環境變數時，同步更新 `docs/` 與本檔。
