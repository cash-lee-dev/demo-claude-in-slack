<script setup>
// 森林 canvas：飄落的葉子 + 螢火蟲（慢速漂移、閃爍、柔光）。
// 樹影 / 霧 / 月亮 / 掃描線由 ForestBackdrop 的 CSS 負責，這裡只畫粒子。
// 省電與清理規則（沿用 WaveCanvas / RainCanvas 模式）：
//   DPR 上限 2、約 30fps、ResizeObserver；發光用預先畫好的柔光 sprite（不用 shadowBlur）；
//   分頁隱藏（visibilitychange）時取消 rAF、回到前景再恢復；
//   prefers-reduced-motion 時只畫一張靜態畫面（並即時響應設定變更）；
//   卸載時取消 rAF、斷開 observer、移除所有 listener。
// 位置全部由固定公式（seeded，不用 Math.random）決定，所以靜態畫面每次都一樣。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref(null)
const FRAME_MS = 33
const STATIC_T = 6000 // 靜態畫面使用的時間點（ms）

// 配色與 src/styles/forest.css 的 --forest-* 一致
const LEAF_COLORS = ['#7cb342', '#9ccc65', '#558b2f', '#aed581', '#33691e']
const LEAF_VEIN = 'rgba(11,42,15,0.55)'
const FIREFLY_CORE = '245,235,208' // 奶油
const FIREFLY_GLOW = '174,213,129' // 淡草綠

// 粒子數量上限：桌機 20 + 28 = 48（<= 50）；手機更少
const DESKTOP = { leaves: 20, flies: 28 }
const MOBILE = { leaves: 8, flies: 12 }

const rnd = (i, k) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return v - Math.floor(v)
}

// 葉子：x0/y0 為起點比例、v 下落速度（px/ms）、amp/f/p 為左右擺動、spin 為自轉
const leaves = Array.from({ length: DESKTOP.leaves }, (_, i) => ({
  x0: rnd(i, 1),
  y0: rnd(i, 2),
  v: 0.022 + rnd(i, 3) * 0.03,
  amp: 18 + rnd(i, 4) * 34,
  f: 0.0006 + rnd(i, 5) * 0.0007,
  p: rnd(i, 6) * Math.PI * 2,
  spin: (rnd(i, 7) - 0.5) * 0.0016,
  size: 5 + rnd(i, 8) * 5,
  color: LEAF_COLORS[i % LEAF_COLORS.length],
  alpha: 0.55 + rnd(i, 9) * 0.35,
}))

// 螢火蟲：集中在畫面下 2/3；bx/by 為中心比例、ax/ay 漂移幅度（px）、g 為柔光半徑
const flies = Array.from({ length: DESKTOP.flies }, (_, i) => ({
  bx: rnd(i, 11),
  by: 0.3 + rnd(i, 12) * 0.62,
  ax: 14 + rnd(i, 13) * 40,
  ay: 10 + rnd(i, 14) * 26,
  fx: 0.00018 + rnd(i, 15) * 0.0003,
  fy: 0.00022 + rnd(i, 16) * 0.0003,
  px: rnd(i, 17) * Math.PI * 2,
  py: rnd(i, 18) * Math.PI * 2,
  ft: 0.0007 + rnd(i, 19) * 0.0012,
  pt: rnd(i, 20) * Math.PI * 2,
  g: 9 + rnd(i, 21) * 9,
}))

const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
let reduce = !!mq?.matches
let ctx, sprite, dpr = 1, w = 0, h = 0, nLeaves = DESKTOP.leaves, nFlies = DESKTOP.flies
let raf = 0, last = 0, ro

// 柔光 sprite：預先畫一次徑向漸層，之後用 drawImage 縮放，比每幀 shadowBlur / 建漸層省
function makeSprite() {
  const s = document.createElement('canvas')
  s.width = s.height = 64
  const c = s.getContext('2d')
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, `rgba(${FIREFLY_CORE},1)`)
  g.addColorStop(0.12, `rgba(${FIREFLY_CORE},0.85)`)
  g.addColorStop(0.35, `rgba(${FIREFLY_GLOW},0.35)`)
  g.addColorStop(1, `rgba(${FIREFLY_GLOW},0)`)
  c.fillStyle = g
  c.fillRect(0, 0, 64, 64)
  return s
}

// 標題區（畫面中央偏下）的粒子調暗，避免干擾文字可讀性
function calm(x, y) {
  const dx = (x / w - 0.5) / 0.34
  const dy = (y / h - 0.56) / 0.2
  const d = dx * dx + dy * dy
  return d >= 1 ? 1 : 0.3 + 0.7 * d
}

function draw(t) {
  if (!ctx || !w || !h) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // 螢火蟲（柔光 sprite，先畫，葉子蓋在上面）
  for (let i = 0; i < nFlies; i++) {
    const f = flies[i]
    const x = f.bx * w + Math.sin(t * f.fx + f.px) * f.ax
    const y = f.by * h + Math.cos(t * f.fy + f.py) * f.ay
    const tw = 0.5 + 0.5 * Math.sin(t * f.ft + f.pt)
    const a = (0.12 + 0.88 * tw * tw) * calm(x, y)
    const r = f.g * (0.75 + 0.25 * tw)
    ctx.globalAlpha = a
    ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2)
  }

  // 落葉：由上往下、左右正弦擺動 + 自轉（setTransform 一次設好旋轉與位置）
  const span = h + 60
  for (let i = 0; i < nLeaves; i++) {
    const l = leaves[i]
    const y = ((l.y0 * span + t * l.v) % span) - 30
    const x = ((l.x0 * w + Math.sin(t * l.f + l.p) * l.amp) % w + w) % w
    const rot = t * l.spin + l.p
    const c = Math.cos(rot) * dpr
    const s = Math.sin(rot) * dpr
    // 沿 x 軸壓扁一點，模擬葉子翻面
    const flip = 0.55 + 0.45 * Math.abs(Math.sin(t * l.f * 1.7 + l.p))
    ctx.setTransform(c * flip, s * flip, -s, c, x * dpr, y * dpr)
    ctx.globalAlpha = l.alpha * calm(x, y)
    const z = l.size
    ctx.beginPath()
    ctx.moveTo(0, -z)
    ctx.quadraticCurveTo(z * 0.85, -z * 0.15, 0, z)
    ctx.quadraticCurveTo(-z * 0.85, -z * 0.15, 0, -z)
    ctx.fillStyle = l.color
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, -z * 0.8)
    ctx.lineTo(0, z * 1.1)
    ctx.lineWidth = 0.8
    ctx.strokeStyle = LEAF_VEIN
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = c.clientWidth
  h = c.clientHeight
  c.width = Math.floor(w * dpr)
  c.height = Math.floor(h * dpr)
  ctx = c.getContext('2d')
  const n = w < 640 ? MOBILE : DESKTOP
  nLeaves = n.leaves
  nFlies = n.flies
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
  sprite = makeSprite()
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
