// 產生額外使用者用的 passwordHash：npm run hash -- <password>
// hash key 讀取順序：環境變數 VITE_AUTH_HASH_KEY -> .env.local -> .env
import { createHmac } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'

function readKeyFromFiles() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue
    const m = readFileSync(file, 'utf8').match(/^VITE_AUTH_HASH_KEY=(.*)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return ''
}

const key = process.env.VITE_AUTH_HASH_KEY || readKeyFromFiles()
const password = process.argv[2]

if (!key || !password) {
  console.error('Usage: VITE_AUTH_HASH_KEY=<key> npm run hash -- <password>')
  process.exit(1)
}
console.log(createHmac('sha256', key).update(password).digest('hex'))
