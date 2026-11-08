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
  <span aria-live="off">{{ shown
    }}<i
      class="ml-0.5 inline-block h-[1.05em] w-[0.6em] animate-blink bg-neon-cyan align-text-bottom shadow-[0_0_10px_var(--color-neon-cyan)]"
      aria-hidden="true"
    /></span>
</template>
