<script setup>
// 宇宙 canvas：閃爍的星空 + 偶爾劃過的流星（紅白色拖尾）。星雲 / 星球 / 掃描線由 CSS 負責（SpaceBackdrop）。
// 省電：限制約 30fps、DPR 上限 2；分頁隱藏時取消 rAF、回到前景再恢復；
// prefers-reduced-motion 時只畫一張靜態畫面（含一顆凍結的流星，並會即時響應設定變更）；卸載時清掉 rAF / observer / listener。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref(null)
const FRAME_MS = 33
const STATIC_T = 4000 // 靜態畫面使用的時間點（ms）
const TAU = Math.PI * 2
const MAX_STARS = 260
const MAX_METEORS = 3

// 星色與 tailwind.css 的 --color-space-* 一致：白、淡紅（ember）、霓虹紅
const TINTS = ['#ffffff', '#ffd2d9', '#ff5252', '#ff1744']

// 固定種子的亂數：星點位置在每次進頁面、每次縮放都一致（不用 Math.random）
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(0x5ace)
// x / y：占畫面比例；r：半徑（多數很小、少數較亮）；speed：閃爍速度（rad/s）
const STARS = Array.from({ length: MAX_STARS }, () => {
  const r = 0.45 + rnd() ** 3 * 1.5
  const k = rnd()
  return {
    x: rnd(),
    y: rnd(),
    r,
    base: 0.4 + rnd() * 0.6,
    speed: 0.7 + rnd() * 2.6,
    phase: rnd() * TAU,
    tint: k < 0.62 ? 0 : k < 0.84 ? 1 : k < 0.95 ? 2 : 3,
  }
})

const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
let reduce = !!mq?.matches
let ctx, w = 0, h = 0, count = 0, raf = 0, last = 0, prev = 0, nextAt = 0, ro
let meteors = []

function spawnMeteor() {
  const ang = ((24 + Math.random() * 20) * Math.PI) / 180 // 往左下飛
  const speed = 520 + Math.random() * 380
  meteors.push({
    x: w * (0.25 + Math.random() * 0.85),
    y: -20 + Math.random() * h * 0.35,
    vx: -Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    len: 90 + Math.random() * 110,
    age: 0,
    ttl: 1.3 + Math.random() * 0.9,
  })
}

function drawMeteor(m, alpha) {
  const sp = Math.hypot(m.vx, m.vy)
  const dx = m.vx / sp
  const dy = m.vy / sp
  const tx = m.x - dx * m.len
  const ty = m.y - dy * m.len
  const g = ctx.createLinearGradient(tx, ty, m.x, m.y)
  g.addColorStop(0, 'rgba(183,28,28,0)')
  g.addColorStop(0.65, 'rgba(255,23,68,0.5)')
  g.addColorStop(1, 'rgba(255,240,242,1)')
  ctx.globalAlpha = alpha
  ctx.lineCap = 'round'
  ctx.strokeStyle = g
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(tx, ty)
  ctx.lineTo(m.x, m.y)
  ctx.stroke()
  // 流星頭：紅色暈光 + 白色亮點
  ctx.fillStyle = 'rgba(255,23,68,0.35)'
  ctx.beginPath()
  ctx.arc(m.x, m.y, 4.5, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(m.x, m.y, 1.5, 0, TAU)
  ctx.fill()
  ctx.globalAlpha = 1
}

function draw(t, still) {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  const sec = t / 1000
  for (let i = 0; i < count; i++) {
    const s = STARS[i]
    const a = s.base * (0.5 + 0.5 * Math.sin(sec * s.speed + s.phase))
    const x = s.x * w
    const y = s.y * h
    ctx.fillStyle = TINTS[s.tint]
    // 較大的星加一圈淡淡的光暈（比 shadowBlur 省效能）
    if (s.r > 1.2) {
      ctx.globalAlpha = a * 0.22
      ctx.beginPath()
      ctx.arc(x, y, s.r * 3.4, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = a
    ctx.beginPath()
    ctx.arc(x, y, s.r, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  if (still) {
    // 靜態畫面：一顆凍結在天空上方的流星，保留氛圍
    drawMeteor({ x: w * 0.74, y: h * 0.2, vx: -0.82, vy: 0.57, len: Math.min(170, w * 0.3) }, 0.85)
    return
  }
  for (const m of meteors) {
    const fade = Math.min(1, m.age / 0.12, (m.ttl - m.age) / 0.35)
    drawMeteor(m, Math.max(0, fade))
  }
}

function step(t, dt) {
  if (!nextAt) nextAt = t + 700
  if (t >= nextAt && meteors.length < MAX_METEORS) {
    spawnMeteor()
    nextAt = t + 1400 + Math.random() * 3200
  }
  for (const m of meteors) {
    m.age += dt
    m.x += m.vx * dt
    m.y += m.vy * dt
  }
  meteors = meteors.filter((m) => m.age < m.ttl && m.x > -m.len && m.y < h + m.len)
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
  count = Math.min(MAX_STARS, Math.max(80, Math.round((w * h) / 5500)))
  // 動畫中下一幀就會重畫；靜態模式（或暫停中）需要立刻補畫，否則 canvas 被清空會一片空白
  if (reduce) draw(STATIC_T, true)
  else if (!raf) draw(performance.now(), false)
}

function loop(t) {
  raf = requestAnimationFrame(loop)
  if (t - last < FRAME_MS) return
  const dt = prev ? Math.min((t - prev) / 1000, 0.1) : 0
  last = t
  prev = t
  step(t, dt)
  draw(t, false)
}
function start() {
  if (!reduce && !document.hidden && !raf) raf = requestAnimationFrame(loop)
}
function stop() {
  cancelAnimationFrame(raf)
  raf = 0
  prev = 0 // 恢復時第一幀 dt 歸零，流星不會瞬移
  nextAt = 0 // 恢復後重新計時，不會一回到分頁就立刻冒出流星
}
function onVisibility() {
  document.hidden ? stop() : start()
}
function onMotionChange() {
  reduce = !!mq?.matches
  if (reduce) {
    stop()
    meteors = []
    nextAt = 0
    draw(STATIC_T, true)
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
  <canvas ref="canvas" class="absolute inset-0 h-full w-full" />
</template>
