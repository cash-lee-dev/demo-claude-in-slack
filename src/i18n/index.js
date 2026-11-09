import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import zhTW from '../locales/zh-TW.js'
import en from '../locales/en.js'

/** 支援的語系（新增語言時：加進這裡 + 新增 src/locales/<code>.js + 在下方 messages 註冊） */
export const SUPPORTED_LOCALES = ['zh-TW', 'en']
export const FALLBACK_LOCALE = 'en'
/** localStorage key：只在使用者手動切換後才寫入；auth 用的是 neon.session.v1，兩者互不相干 */
export const LOCALE_STORAGE_KEY = 'neon.locale.v1'

const isSupported = (v) => SUPPORTED_LOCALES.includes(v)

// localStorage 可能不可用（隱私模式、被封鎖、配額已滿）：所有讀寫都 try/catch，失敗就當作沒有
function readStoredLocale() {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isSupported(v) ? v : null
  } catch {
    return null
  }
}
function writeStoredLocale(value) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, value)
  } catch {
    // 無法持久化：仍然可以在本次頁面生命週期內切換
  }
}

/** 首次造訪依 navigator.language：以 zh 開頭 -> zh-TW，否則 en */
function browserLocale() {
  try {
    return String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'
  } catch {
    return FALLBACK_LOCALE
  }
}

/** 已儲存的選擇優先；沒有才依瀏覽器語言 */
export function detectLocale() {
  return readStoredLocale() ?? browserLocale()
}

export const i18n = createI18n({
  legacy: false, // Composition API 模式：i18n.global.locale 是 ref
  locale: detectLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages: { 'zh-TW': zhTW, en },
})

/** 目前語系（ref，可直接 watch / 在 template 使用） */
export const locale = i18n.global.locale
/** 在元件之外翻譯（router meta、composable） */
export const t = (key) => i18n.global.t(key)

/**
 * 切換語系。使用者手動切換時 persist 為 true（寫入 localStorage）；
 * 跨分頁同步等「被動」情況傳 { persist: false }。
 * 不重新載入頁面、不碰路由與 session。
 */
export function setLocale(next, { persist = true } = {}) {
  if (!isSupported(next)) return
  locale.value = next
  if (persist) writeStoredLocale(next)
}

// <html lang> 與 meta description 隨語系即時更新（document.title 因為依路由而定，在 useDoorTransition.js 處理）
function syncDocument(l) {
  document.documentElement.lang = l
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
}
watch(locale, syncDocument, { immediate: true, flush: 'sync' })

/**
 * 跨分頁同步（選配）：其他分頁手動切換後，這個分頁跟著切。
 * 只處理 localStorage 的 neon.locale.v1；其他 key（含 sessionStorage 的事件）（例如 auth 的 neon.session.v1）與 clear()（key 為 null）一律忽略。
 * 回傳取消監聽的函式。
 */
export function onLocaleStorageChange() {
  const handler = (e) => {
    if (e.key !== LOCALE_STORAGE_KEY || e.storageArea !== localStorage) return
    if (isSupported(e.newValue)) setLocale(e.newValue, { persist: false })
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
