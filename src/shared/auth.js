import { AUTH_CONFIG } from './config.js'
import { goTo } from './nav.js'

const enc = new TextEncoder()

/* ---------- 小工具 ---------- */

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

function b64urlEncode(str) {
  const bytes = enc.encode(str)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/* ---------- 雜湊：HMAC-SHA-256(hashKey, message) -> hex ---------- */

let keyPromise
function getHmacKey() {
  keyPromise ??= crypto.subtle.importKey('raw', enc.encode(AUTH_CONFIG.hashKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return keyPromise
}

async function hmacHex(message) {
  const sig = await crypto.subtle.sign('HMAC', await getHmacKey(), enc.encode(message))
  return toHex(sig)
}

export const hashPassword = (password) => hmacHex(password)

/* ---------- 使用者清單（想新增使用者就加在這裡） ---------- */

export function isAuthConfigured() {
  return Boolean(
    AUTH_CONFIG.hashKey &&
    AUTH_CONFIG.adminUsername &&
    (AUTH_CONFIG.adminPasswordHash || AUTH_CONFIG.adminPassword) &&
    globalThis.crypto?.subtle,
  )
}

let usersPromise
/** @returns {Promise<Array<{username:string, passwordHash:string, role:string}>>} */
export function getUsers() {
  usersPromise ??= (async () => {
    const users = []
    if (isAuthConfigured()) {
      // 管理員：優先使用環境變數預先算好的 hash；沒有才由明文密碼在執行時算出 hash。
      // 之後一律只比對 hash，不做明文比較。
      users.push({
        username: AUTH_CONFIG.adminUsername,
        passwordHash: AUTH_CONFIG.adminPasswordHash || (await hashPassword(AUTH_CONFIG.adminPassword)),
        role: 'admin',
      })
    }
    // 其他使用者（選填）：VITE_EXTRA_USERS=[{"username","passwordHash","role"}]
    if (AUTH_CONFIG.extraUsersJson) {
      try {
        const extra = JSON.parse(AUTH_CONFIG.extraUsersJson)
        for (const u of extra) {
          if (u?.username && u?.passwordHash) users.push({ role: 'operator', ...u })
        }
      } catch {
        console.warn('[auth] VITE_EXTRA_USERS 不是合法的 JSON，已忽略')
      }
    }
    return users
  })()
  return usersPromise
}

/* ---------- 登入 / Session ---------- */

/** 驗證帳密：回傳使用者，或 null */
export async function verifyCredentials(username, password) {
  if (!isAuthConfigured()) return null
  const [users, typedHash] = await Promise.all([getUsers(), hashPassword(password)])
  const user = users.find((u) => u.username === username.trim())
  // 不論帳號是否存在都做一次比對，避免明顯的時間差
  const ok = safeEqual(typedHash, user?.passwordHash ?? '0'.repeat(typedHash.length))
  return user && ok ? user : null
}

function writeSession(session, token) {
  try {
    localStorage.setItem(AUTH_CONFIG.storageKey, token)
  } catch {
    /* 無痕模式等情況：略過 */
  }
  return session
}

export async function login(username, password) {
  const user = await verifyCredentials(username, password)
  if (!user) return null
  const now = Date.now()
  const session = { u: user.username, role: user.role, iat: now, exp: now + AUTH_CONFIG.sessionTtlMs }
  const payload = b64urlEncode(JSON.stringify(session))
  const token = `${payload}.${await hmacHex(`session:${payload}`)}`
  return writeSession(session, token)
}

/** 讀取並驗證 session（簽章 + 效期）；無效則清除並回傳 null */
export async function getSession() {
  if (!isAuthConfigured()) return null
  let token
  try {
    token = localStorage.getItem(AUTH_CONFIG.storageKey)
  } catch {
    return null
  }
  if (!token) return null
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig || !safeEqual(sig, await hmacHex(`session:${payload}`))) throw new Error('bad signature')
    const session = JSON.parse(b64urlDecode(payload))
    if (!session.u || !(session.exp > Date.now())) throw new Error('expired')
    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(AUTH_CONFIG.storageKey)
  } catch {
    /* ignore */
  }
}

export function logout() {
  clearSession()
  goTo('login')
}

/* ---------- 頁面守衛 ---------- */

/** 受保護頁面使用：沒有有效 session 就導向登入頁並回傳 null */
export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    goTo('login')
    return null
  }
  return session
}

/** 登入頁使用：已登入就直接前往首頁 */
export async function redirectIfAuthed() {
  const session = await getSession()
  if (session) {
    goTo('home')
    return true
  }
  return false
}

/** 其他分頁登出 / 登入時同步 */
export function onSessionStorageChange(cb) {
  const handler = (e) => {
    if (e.key === AUTH_CONFIG.storageKey || e.key === null) cb()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
