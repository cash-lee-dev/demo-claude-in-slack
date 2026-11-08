<script setup>
// 數位雨（digital rain）：透明 canvas，用 destination-out 淡出拖尾，成本很低。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref(null)
const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789<>/\\|=+*'
const FONT_SIZE = 16
const FRAME_MS = 55

let ctx, w, h, drops = [], raf = 0, last = 0, ro
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function resize() {
  const c = canvas.value
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = c.clientWidth
  h = c.clientHeight
  c.width = Math.floor(w * dpr)
  c.height = Math.floor(h * dpr)
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.font = `${FONT_SIZE}px "Share Tech Mono", monospace`
  const cols = Math.ceil(w / FONT_SIZE)
  drops = Array.from({ length: cols }, (_, i) => drops[i] ?? Math.random() * -40)
  if (reduce) paintStatic()
}

function glyph() {
  return CHARS[(Math.random() * CHARS.length) | 0]
}

function step() {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
  for (let i = 0; i < drops.length; i++) {
    const x = i * FONT_SIZE
    const y = drops[i] * FONT_SIZE
    if (y > 0) {
      // 前一個字元變成紫色，最前端為青色
      ctx.fillStyle = 'rgba(123,97,255,0.9)'
      ctx.fillText(glyph(), x, y - FONT_SIZE)
      ctx.fillStyle = Math.random() > 0.96 ? '#ff2bd6' : '#00e5ff'
      ctx.fillText(glyph(), x, y)
    }
    if (y > h && Math.random() > 0.975) drops[i] = Math.random() * -20
    drops[i] += 1
  }
}

function paintStatic() {
  ctx.clearRect(0, 0, w, h)
  for (let i = 0; i < drops.length; i++) {
    for (let j = 0; j < 14; j++) {
      ctx.fillStyle = `rgba(123,97,255,${0.55 - j * 0.04})`
      ctx.fillText(glyph(), i * FONT_SIZE, ((i * 7 + j * 3) % Math.ceil(h / FONT_SIZE)) * FONT_SIZE)
    }
  }
}

function loop(t) {
  raf = requestAnimationFrame(loop)
  if (document.hidden || t - last < FRAME_MS) return
  last = t
  step()
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
  <canvas ref="canvas" class="rain" />
</template>

<style scoped>
.rain {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.5;
  mask-image: linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%);
}
</style>
