// 英文語系檔（en）。key 結構必須與 zh-TW.js 完全一致。
// 注意：vue-i18n 的訊息語法中 `{ } @ | $` 有特殊意義，文字中要用請以 {'...'} 跳脫。
export default {
  meta: {
    description: 'Neon Grid access terminal. Authenticate to jack in.',
  },
  // 路由的 meta.title 存的是這裡的 key（頁籤標題）
  routes: {
    login: { title: '// ACCESS TERMINAL :: NEON GRID' },
    home: { title: '// YOUR WORLD :: NEON GRID' },
    beach: { title: '// BEACH :: NEON GRID' },
    space: { title: '// SPACE :: NEON GRID' },
    forest: { title: '// FOREST :: NEON GRID' },
  },
  switcher: {
    group: 'Language',
    en: 'English',
    zh: '繁體中文',
  },
  login: {
    title: 'ACCESS TERMINAL',
    typewriter: [
      'establishing secure uplink...',
      'neural handshake pending...',
      'authenticate to enter the grid',
      'sign in to access the system',
    ],
    notConfigured:
      'AUTH NOT CONFIGURED // VITE_AUTH_HASH_KEY / VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD_HASH are not set',
    username: 'USERNAME',
    password: 'PASSWORD',
    show: 'SHOW',
    hide: 'HIDE',
    submit: 'JACK IN',
    hashing: 'HASHING...',
    granted: 'ACCESS GRANTED',
    footer: 'LINK SECURE · HMAC-SHA256',
    codename: 'SEC-NODE 07 · v3.0',
    errors: {
      denied: 'ACCESS DENIED // wrong username or password',
      fault: 'SYSTEM FAULT // unable to complete authentication',
    },
  },
}
