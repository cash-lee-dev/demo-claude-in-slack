<script setup>
// 海洋 canvas：多層正弦波 + 發光霓虹浪頭 + 海岸沙灘（含霓虹透視格線）與來回的浪花。
// 只畫下半部（由外層決定高度），天空 / 太陽 / 雲 / 掃描線由 CSS 負責。
// 省電：限制約 30fps、DPR 上限 2；分頁隱藏時取消 rAF、回到前景再恢復；
// prefers-reduced-motion 時只畫一張靜態畫面（並會即時響應設定變更）；卸載時清掉 rAF / observer / listener。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref(null)
const FRAME_MS = 33
const STATIC_T = 2400 // 靜態畫面使用的時間點（ms），挑一個波形好看的位置

// 配色與 tailwind.css 的 --color-beach-* 一致：遠處夜藍 -> 近岸最深，浪頭是發光的天藍 / 白色霓虹線
const SEA_FAR = [4, 52, 112] // 夜藍偏亮（靠地平線，反射天光）
const SEA_NEAR = [1, 14, 44] // #010e2c 近岸最深
const NEON = '79,195,247' // #4fc3f7
const SAND = '#f6e7c1' // 沙色只用在窄窄的沙灘（小面積點綴）
const SAND_DARK = '#3a3f5c'

// y：基準位置（占 canvas 高度）、a：振幅（px）、wl：波長（px）、s：速度（rad/ms）、p：相位
const LAYERS = [
  { y: 0.02, a: 2.5, wl: 260, s: 0.0005, p: 0 },
  { y: 0.14, a: 4, wl: 330, s: 0.0007, p: 1.7 },
  { y: 0.27, a: 5, wl: 300, s: 0.0006, p: 3.1 },
  { y: 0.4, a: 6, wl: 380, s: 0.0009, p: 4.6 },
  { y: 0.53, a: 7, wl: 340, s: 0.0008, p: 0.9 },
  { y: 0.66, a: 8, wl: 420, s: 0.001, p: 2.4 },
]
const SAND_TOP = 0.89

const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
let reduce = !!mq?.matches
let ctx, w = 0, h = 0, raf = 0, last = 0, ro

const mix = (t) => `rgb(${SEA_FAR.map((v, i) => Math.round(v + (SEA_NEAR[i] - v) * t)).join(',')})`

function wavePath(baseY, amp, wl, speed, phase, t) {
  const k = (Math.PI * 2) / wl
  ctx.beginPath()
  for (let x = 0; x <= w + 6; x += 6) {
    const y = baseY + amp * Math.sin(x * k + t * speed + phase) + amp * 0.45 * Math.sin(x * k * 2.3 - t * speed * 1.4 + phase * 2)
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
}

function draw(t) {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  ctx.lineJoin = 'round'

  LAYERS.forEach((l, i) => {
    const f = i / (LAYERS.length - 1)
    wavePath(l.y * h, l.a, l.wl, l.s, l.p, t)
    // 霓虹浪頭：先描一條寬而淡的光暈線，再描細亮線（比 shadowBlur 省效能），然後封閉路徑填色
    ctx.lineWidth = 6 + f * 4
    ctx.strokeStyle = `rgba(${NEON},${0.1 + f * 0.1})`
    ctx.stroke()
    ctx.lineWidth = 1.2 + f * 1.4
    ctx.strokeStyle = i % 2 ? `rgba(225,245,254,${0.55 + f * 0.4})` : `rgba(${NEON},${0.6 + f * 0.4})`
    ctx.stroke()
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fillStyle = mix(f)
    ctx.fill()
  })

  // 沙灘：頂緣略微起伏；沙色往下漸暗成夜色，只留一條窄窄的亮沙邊
  const sandY = SAND_TOP * h
  const sandPath = () => {
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, sandY + 4)
    ctx.bezierCurveTo(w * 0.3, sandY - 6, w * 0.65, sandY + 8, w, sandY - 2)
    ctx.lineTo(w, h)
    ctx.closePath()
  }
  sandPath()
  const g = ctx.createLinearGradient(0, sandY - 6, 0, h)
  g.addColorStop(0, SAND)
  g.addColorStop(0.35, '#b9b39a')
  g.addColorStop(1, SAND_DARK)
  ctx.fillStyle = g
  ctx.fill()

  // 濕沙、浪花水層與透視格線只畫在沙灘範圍內（clip），避免在海面上露出矩形邊緣
  ctx.save()
  sandPath()
  ctx.clip()

  // 沙灘上的霓虹透視格線（往下越寬鬆），呼應首頁的網格地板
  ctx.lineWidth = 1
  ctx.strokeStyle = `rgba(2,136,209,0.35)`
  ctx.beginPath()
  for (let k = 1; k <= 3; k++) {
    const y = sandY + (h - sandY) * (k / 3) ** 1.6
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
  }
  const cx = w / 2
  for (let k = -8; k <= 8; k++) {
    ctx.moveTo(cx + k * 22, sandY)
    ctx.lineTo(cx + k * 90, h)
  }
  ctx.stroke()

  // 浪花：半透明水層來回漫過沙灘，下緣是發光泡沫線，退去時留下一圈濕沙
  const phase = (Math.sin(t * 0.0009) + 1) / 2 // 0 退潮 -> 1 漲潮
  const reach = sandY - 4 + phase * (h - sandY) * 0.55
  const wash = (x) => reach + 5 * Math.sin(x * 0.02 + t * 0.002) + 3 * Math.sin(x * 0.05 - t * 0.0015)
  ctx.beginPath()
  ctx.moveTo(0, wash(0) + 10)
  for (let x = 0; x <= w + 6; x += 6) ctx.lineTo(x, wash(x) + 10)
  ctx.lineTo(w, wash(w) - 4)
  for (let x = w; x >= 0; x -= 6) ctx.lineTo(x, wash(x) - 4)
  ctx.closePath()
  ctx.fillStyle = 'rgba(2,60,120,0.5)'
  ctx.globalAlpha = 1 - phase * 0.4
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.beginPath()
  ctx.moveTo(0, sandY - 30)
  ctx.lineTo(w, sandY - 30)
  for (let x = w; x >= 0; x -= 6) ctx.lineTo(x, wash(x))
  ctx.closePath()
  ctx.fillStyle = `rgba(${NEON},0.3)`
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  for (let x = 0; x <= w + 6; x += 6) (x === 0 ? ctx.moveTo(x, wash(x)) : ctx.lineTo(x, wash(x)))
  ctx.lineWidth = 7
  ctx.strokeStyle = `rgba(${NEON},0.25)`
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.stroke()
}

function resize() {
  const c = canvas.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = c.clientWidth
  h = c.clientHeight
  c.width = Math.floor(w * dpr)
  c.height = Math.floor(h * dpr)
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // 動畫中下一幀就會重畫；靜態模式（或暫停中）需要立刻補畫，否則 canvas 被清空會一片空白
  if (reduce || !raf) draw(reduce ? STATIC_T : performance.now())
}

function loop(t) {
  raf = requestAnimationFrame(loop)
  if (t - last < FRAME_MS) return
  last = t
  draw(t)
}
function start() {
  if (!reduce && !document.hidden && !raf) raf = requestAnimationFrame(loop)
}
function stop() {
  cancelAnimationFrame(raf)
  raf = 0
}
function onVisibility() {
  document.hidden ? stop() : start()
}
function onMotionChange() {
  reduce = !!mq?.matches
  if (reduce) {
    stop()
    draw(STATIC_T)
  } else {
    start()
  }
}

onMounted(() => {
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(canvas.value)
  document.addEventListener('visibilitychange', onVisibility)
  mq?.addEventListener?.('change', onMotionChange)
  start()
})
onBeforeUnmount(() => {
  stop()
  ro?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
  mq?.removeEventListener?.('change', onMotionChange)
})
</script>

<template>
  <canvas ref="canvas" class="absolute inset-x-0 bottom-0 h-(--sea) w-full" />
</template>
