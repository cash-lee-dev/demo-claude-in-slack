<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  lines: { type: Array, required: true },
  speed: { type: Number, default: 55 },
  hold: { type: Number, default: 1600 },
})

const shown = ref('')
let timer = 0
let idx = 0
let pos = 0
let deleting = false
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function tick() {
  const line = props.lines[idx]
  if (!deleting) {
    pos++
    shown.value = line.slice(0, pos)
    if (pos >= line.length) {
      deleting = true
      timer = setTimeout(tick, props.hold)
      return
    }
    timer = setTimeout(tick, props.speed + Math.random() * 40)
  } else {
    pos -= 2
    shown.value = line.slice(0, Math.max(pos, 0))
    if (pos <= 0) {
      deleting = false
      pos = 0
      idx = (idx + 1) % props.lines.length
      timer = setTimeout(tick, 350)
      return
    }
    timer = setTimeout(tick, props.speed / 2.5)
  }
}

onMounted(() => {
  if (reduce) shown.value = props.lines[0]
  else tick()
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span class="typewriter" aria-live="off">{{ shown }}<i class="cursor" aria-hidden="true" /></span>
</template>

<style scoped>
.cursor {
  display: inline-block;
  width: 0.6em;
  height: 1.05em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--cyan);
  box-shadow: 0 0 10px var(--cyan);
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
</style>
