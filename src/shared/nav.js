import { PAGES } from './config.js'

// 一律以 BASE_URL 組網址，dev（/）與 GitHub Pages（/demo-claude-in-slack/）都能正確跳轉。
export function pageUrl(page) {
  return new URL(`${import.meta.env.BASE_URL}${PAGES[page] ?? page}`, window.location.origin).href
}

export function goTo(page) {
  window.location.replace(pageUrl(page))
}
