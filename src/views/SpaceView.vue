<script setup>
// 宇宙世界：純氛圍頁面（賽博龐克深空背景 + HUD 外框 + 故障標題 + 返回主頁），沒有功能性內容。
// 重用首頁的 GlitchText / NeonButton / HudCard（space 配色變體），背景見 SpaceBackdrop。
import { useRouter } from 'vue-router'
import SpaceBackdrop from '../shared/components/SpaceBackdrop.vue'
import GlitchText from '../shared/components/GlitchText.vue'
import NeonButton from '../shared/components/NeonButton.vue'
import HudCard from '../components/HudCard.vue'

const router = useRouter()
const bigCls = 'm-0 font-display text-[clamp(0.8rem,2.2vw,1.4rem)] font-bold tracking-[0.04em] sm:tracking-[0.1em] text-white text-shadow-space-sm'
const metaCls = 'm-0 mt-1.5 font-sans text-[0.78rem] font-semibold tracking-[0.1em] text-space-mist/70 sm:text-[0.9rem] sm:tracking-[0.16em]'
</script>

<template>
  <SpaceBackdrop />

  <!-- HUD 外框：四個發光角標（純裝飾） -->
  <div class="pointer-events-none fixed inset-2.5 z-20 sm:inset-4" aria-hidden="true">
    <i class="absolute top-0 left-0 size-6 border-2 border-r-0 border-b-0 border-space-neon drop-shadow-[0_0_5px_#ff1744]" />
    <i class="absolute top-0 right-0 size-6 border-2 border-b-0 border-l-0 border-space-neon drop-shadow-[0_0_5px_#ff1744]" />
    <i class="absolute bottom-0 left-0 size-6 border-2 border-t-0 border-r-0 border-space-neon drop-shadow-[0_0_5px_#ff1744]" />
    <i class="absolute right-0 bottom-0 size-6 border-2 border-t-0 border-l-0 border-space-neon drop-shadow-[0_0_5px_#ff1744]" />
  </div>

  <div class="relative z-10 grid min-h-dvh grid-rows-[auto_1fr] px-[clamp(20px,4vw,56px)] pt-[clamp(20px,4vw,40px)] pb-[clamp(36px,9vh,90px)]">
    <section class="mx-auto grid w-full max-w-[860px] grid-cols-3 gap-2 sm:gap-4" aria-label="Space status">
      <HudCard space title="SECTOR">
        <p :class="bigCls">03</p>
        <p :class="metaCls">SPACE</p>
      </HudCard>
      <HudCard space title="ORBIT">
        <p :class="bigCls">408 KM</p>
        <p :class="metaCls">STABLE</p>
      </HudCard>
      <HudCard space title="SIGNAL">
        <p :class="[bigCls, 'flex items-center gap-2']">
          <span class="size-2 shrink-0 animate-pulse-dot rounded-full bg-white shadow-[0_0_10px_#fff,0_0_22px_#ff1744]" />LOCKED
        </p>
        <p :class="metaCls">ONLINE</p>
      </HudCard>
    </section>

    <main class="flex flex-col items-center justify-end gap-3 pt-4 text-center sm:gap-4">
      <h1 class="m-0 animate-float font-display text-[clamp(3rem,13vw,8rem)] leading-[1.02] font-black tracking-[0.04em]">
        <GlitchText class="animate-glitch-skew text-space-mist text-shadow-space-glow [--glitch-a:#ff1744] [--glitch-b:#b71c1c]" text="SPACE" />
      </h1>
      <p class="m-0 bg-space-void/50 px-3 py-0.5 font-display text-[clamp(1rem,3vw,1.5rem)] font-bold tracking-[0.5em] indent-[0.5em] text-white text-shadow-space-sm">宇宙</p>
      <p class="m-0 font-sans text-[clamp(0.95rem,2vw,1.2rem)] font-semibold tracking-[0.14em] text-space-mist text-shadow-space-sm">
        <span class="mr-[0.4em] text-space-neon">&gt;</span>silence is the loudest signal.
      </p>
      <NeonButton space class="mt-3" @click="router.push('/home')">返回主頁</NeonButton>
    </main>
  </div>
</template>
