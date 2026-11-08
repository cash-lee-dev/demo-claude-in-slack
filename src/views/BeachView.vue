<script setup>
// 海灘世界：純氛圍頁面（動態海灘背景 + 標題 + 返回主頁），沒有功能性內容。
import { useRouter } from 'vue-router'
import BeachBackdrop from '../shared/components/BeachBackdrop.vue'

const router = useRouter()
</script>

<template>
  <BeachBackdrop />
  <main class="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-5 px-4 pt-[6vh] pb-[10vh] text-center">
    <p class="m-0 font-display text-[0.8rem] tracking-[0.4em] text-white [text-shadow:0_0_6px_rgb(1_87_155/0.9),0_1px_12px_rgb(1_87_155/0.8)]">// SUNNY SHORE</p>
    <h1 class="m-0 animate-float font-display text-[clamp(2.6rem,11vw,7.5rem)] leading-[1.05] font-black tracking-[0.08em] text-white [text-shadow:0_2px_0_#0288d1,0_6px_24px_rgb(1_87_155/0.55),0_0_50px_rgb(255_255_255/0.5)]">
      BEACH
    </h1>
    <p class="m-0 font-display text-[clamp(1.1rem,3vw,1.6rem)] font-bold tracking-[0.5em] indent-[0.5em] text-white [text-shadow:0_1px_10px_rgb(1_87_155/0.7)]">海灘</p>
    <button
      type="button"
      class="mt-4 inline-flex items-center justify-center rounded-full border-2 border-white bg-white/85 px-[2em] py-[0.8em] font-display text-sm font-bold uppercase tracking-[0.28em] indent-[0.28em] text-beach-deep shadow-[0_6px_24px_rgb(1_87_155/0.35)] backdrop-blur-sm transition duration-200 hover:-translate-y-px hover:bg-white hover:shadow-[0_8px_30px_rgb(1_87_155/0.5)] active:translate-y-px active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-beach-deep"
      @click="router.push('/home')"
    >
      返回主頁
    </button>
  </main>
</template>
