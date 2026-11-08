// 所有設定都來自 Vite 的環境變數（會在 build 時被內嵌進前端 bundle）。
const env = import.meta.env

export const AUTH_CONFIG = {
  hashKey: env.VITE_AUTH_HASH_KEY ?? '',
  adminUsername: env.VITE_ADMIN_USERNAME ?? '',
  adminPassword: env.VITE_ADMIN_PASSWORD ?? '',
  extraUsersJson: env.VITE_EXTRA_USERS ?? '',
  storageKey: 'neon.session.v1',
  sessionTtlMs: 8 * 60 * 60 * 1000, // 8 小時
}

export const PAGES = {
  login: 'index.html',
  home: 'home.html',
}
