<script setup>
import { useRouter } from 'vue-router'
import NeonBackdrop from './NeonBackdrop.vue'
import NeonButton from './NeonButton.vue'

defineProps({
  name: { type: String, required: true },
})

const router = useRouter()
</script>

<template>
  <NeonBackdrop />
  <main class="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
    <p class="m-0 font-display text-[0.8rem] tracking-[0.3em] text-neon-magenta text-shadow-neon-magenta">// {{ name }}</p>
    <h1 class="m-0 font-display text-[clamp(2rem,8vw,4.5rem)] leading-[1.1] font-black tracking-[0.08em] text-neon-white text-shadow-neon-violet">
      建構中
    </h1>
    <p class="m-0 font-mono text-[clamp(0.9rem,2vw,1.1rem)] text-neon-cyan text-shadow-neon-cyan">UNDER CONSTRUCTION</p>
    <NeonButton @click="router.push('/home')">返回主頁</NeonButton>
  </main>
</template>
