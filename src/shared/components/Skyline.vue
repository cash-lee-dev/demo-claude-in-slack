<script setup>
// 霓虹城市天際線：建築預先畫在離屏 canvas，每幀只更新星星、閃爍的窗戶與飛行車燈。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref(null)
const FRAME_MS = 60
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

let ctx, w, h, dpr, raf = 0, last = 0, ro
let layer, stars = [], windows = [], cars = [], antennas = []

// 簡單的可重現亂數，避免每次 resize 城市都長得不一樣
function rng(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

function build() {
  const rand = rng(20771)
  layer = document.createElement('canvas')
  layer.width = Math.floor(w * dpr)
  layer.height = Math.floor(h * dpr)
  const g = layer.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  windows = []
  antennas = []

  const layers = [
    { minW: 38, maxW: 90, minH: 0.22, maxH: 0.5, body: '#0b0933', edge: 'rgba(77,107,255,0.55)', win: 0.0 },
    { minW: 46, maxW: 110, minH: 0.3, maxH: 0.78, body: '#0a0828', edge: 'rgba(123,97,255,0.9)', win: 1 },
    { minW: 40, maxW: 80, minH: 0.18, maxH: 0.42, body: '#08061f', edge: 'rgba(0,229,255,0.85)', win: 1 },
  ]

  layers.forEach((L, li) => {
    let x = -20 - rand() * 40
    while (x < w + 20) {
      const bw = L.minW + rand() * (L.maxW - L.minW)
      const bh = h * (L.minH + rand() * (L.maxH - L.minH))
      const top = h - bh
      const grad = g.createLinearGradient(0, top, 0, h)
      grad.addColorStop(0, L.body)
      grad.addColorStop(1, '#07061a')
      g.fillStyle = grad
      g.fillRect(x, top, bw, bh)
      // 霓虹輪廓
      g.strokeStyle = L.edge
      g.lineWidth = 1.5
      g.shadowColor = L.edge
      g.shadowBlur = 10
      g.beginPath()
      g.moveTo(x, h)
      g.lineTo(x, top)
      g.lineTo(x + bw, top)
      g.lineTo(x + bw, h)
      g.stroke()
      g.shadowBlur = 0
      if (L.win) {
        const cols = Math.max(2, Math.floor(bw / 12))
        const rows = Math.floor(bh / 16)
        for (let r = 1; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (rand() > 0.28) continue
            const wx = x + 6 + c * ((bw - 12) / cols)
            const wy = top + 6 + r * 16
            const color = rand() > 0.7 ? '#00e5ff' : rand() > 0.5 ? '#ff2bd6' : '#a99bff'
            windows.push({ x: wx, y: wy, color, phase: rand() * 10, speed: 0.3 + rand() * 1.2, on: rand() > 0.3 })
          }
        }
        if (li === 1 && rand() > 0.6) antennas.push({ x: x + bw / 2, y: top - 14, phase: rand() * 6 })
        if (li === 1 && antennas.length) {
          const a = antennas[antennas.length - 1]
          if (a.x === x + bw / 2) {
            g.strokeStyle = 'rgba(169,155,255,0.8)'
            g.lineWidth = 1
            g.beginPath()
            g.moveTo(a.x, top)
            g.lineTo(a.x, a.y)
            g.stroke()
          }
        }
      }
      x += bw + rand() * 8
    }
  })
}

function resize() {
  const c = canvas.value
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = c.clientWidth
  h = c.clientHeight
  if (!w || !h) return
  c.width = Math.floor(w * dpr)
  c.height = Math.floor(h * dpr)
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const rand = rng(99)
  stars = Array.from({ length: Math.floor(w / 9) }, () => ({
    x: rand() * w,
    y: rand() * h * 0.7,
    r: 0.4 + rand() * 1.1,
    phase: rand() * 10,
    speed: 0.5 + rand() * 2,
  }))
  cars = Array.from({ length: 5 }, (_, i) => ({
    x: rand() * w,
    y: h * (0.18 + rand() * 0.45),
    v: (30 + rand() * 60) * (i % 2 ? 1 : -1),
    color: i % 2 ? '#00e5ff' : '#ff2bd6',
  }))
  build()
  draw(performance.now() / 1000, 0)
}

function draw(t, dt) {
  ctx.clearRect(0, 0, w, h)
  // 星星
  ctx.fillStyle = '#cfc8ff'
  for (const s of stars) {
    ctx.globalAlpha = reduce ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed + s.phase))
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, 6.2832)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  // 建築
  ctx.drawImage(layer, 0, 0, w, h)
  // 窗戶
  for (const win of windows) {
    const on = reduce ? win.on : Math.sin(t * win.speed + win.phase) > -0.35
    if (!on) continue
    ctx.fillStyle = win.color
    ctx.globalAlpha = 0.85
    ctx.fillRect(win.x, win.y, 4, 6)
  }
  ctx.globalAlpha = 1
  // 天線警示燈
  for (const a of antennas) {
    ctx.fillStyle = reduce || Math.sin(t * 3 + a.phase) > 0 ? '#ff2b55' : 'rgba(255,43,85,0.2)'
    ctx.shadowColor = '#ff2b55'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(a.x, a.y, 2.2, 0, 6.2832)
    ctx.fill()
  }
  ctx.shadowBlur = 0
  // 飛行車燈
  if (!reduce) {
    for (const c of cars) {
      c.x += c.v * dt
      if (c.x > w + 40) c.x = -40
      if (c.x < -40) c.x = w + 40
      const tail = c.v > 0 ? -1 : 1
      const grad = ctx.createLinearGradient(c.x, 0, c.x + tail * 46, 0)
      grad.addColorStop(0, c.color)
      grad.addColorStop(1, 'transparent')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.shadowColor = c.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(c.x, c.y)
      ctx.lineTo(c.x + tail * 46, c.y)
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  }
}

function loop(ms) {
  raf = requestAnimationFrame(loop)
  if (document.hidden || ms - last < FRAME_MS) return
  const dt = Math.min((ms - last) / 1000, 0.2)
  last = ms
  draw(ms / 1000, dt)
}

onMounted(() => {
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(canvas.value)
  if (!reduce) raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <canvas ref="canvas" class="absolute inset-x-0 w-full" />
</template>
