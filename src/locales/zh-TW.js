// 繁體中文語系檔（zh-TW）。key 結構必須與 en.js 完全一致。
// 注意：vue-i18n 的訊息語法中 `{ } @ | $` 有特殊意義，文字中要用請以 {'...'} 跳脫。
// 品牌 / 賽博龐克用語（NEON//GRID、NEON GRID、SEC-NODE、HMAC-SHA256 等）刻意保留英文。
export default {
  meta: {
    description: 'NEON GRID 存取終端。請驗證身分以接入系統。',
  },
  routes: {
    login: { title: '// 存取終端 :: NEON GRID' },
    home: { title: '// 你的世界 :: NEON GRID' },
    beach: { title: '// 海灘 :: NEON GRID' },
    space: { title: '// 宇宙 :: NEON GRID' },
    forest: { title: '// 森林 :: NEON GRID' },
  },
  switcher: {
    group: '語言',
  },
  login: {
    title: '存取終端',
    typewriter: [
      '正在建立安全連線...',
      '神經握手等待中...',
      '請驗證身分以進入網格',
      '請登入以進入系統',
    ],
    notConfigured:
      '尚未設定驗證 // 尚未設定 VITE_AUTH_HASH_KEY / VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD_HASH',
    username: '使用者名稱',
    password: '密碼',
    show: '顯示',
    hide: '隱藏',
    submit: '登入',
    hashing: '驗證中...',
    granted: '存取許可',
    footer: '連線安全 · HMAC-SHA256',
    codename: 'SEC-NODE 07 · v3.0',
    errors: {
      denied: '存取遭拒 // 帳號或密碼錯誤',
      fault: '系統故障 // 無法完成驗證',
    },
  },
}
