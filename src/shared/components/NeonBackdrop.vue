<script setup>
import RainCanvas from './RainCanvas.vue'
import Skyline from './Skyline.vue'

defineProps({
  sun: Boolean,
  skyline: Boolean,
  rain: { type: Boolean, default: true },
})
</script>

<template>
  <!-- --floor：網格地板佔畫面高度的比例，太陽/天際線/地平線都以它為基準 -->
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink [--floor:38%] max-sm:[--floor:32%]" aria-hidden="true">
    <div class="absolute inset-0 bg-neon-sky" />
    <div
      v-if="sun"
      class="absolute bottom-(--floor) left-1/2 aspect-square w-[min(54vw,440px)] -translate-x-1/2 animate-sun-pulse rounded-full bg-neon-sun opacity-90 shadow-[0_0_80px_rgb(255_43_214/0.55),0_0_160px_rgb(123_97_255/0.45)]"
    />
    <RainCanvas v-if="rain" />
    <Skyline v-if="skyline" class="bottom-(--floor) h-[calc(100%-var(--floor))]" />
    <!-- 透視網格地板 -->
    <div class="absolute inset-x-0 bottom-0 h-(--floor) overflow-hidden bg-linear-to-b from-[#120a40] to-ink [perspective-origin:50%_0%] [perspective:380px]">
      <div
        class="absolute inset-x-[-100%] top-0 h-[300%] origin-[50%_0] animate-grid-move bg-neon-grid [--grid-size:90px] [transform:rotateX(72deg)] [mask-image:linear-gradient(180deg,transparent_0%,#000_10%)] drop-shadow-[0_0_6px_var(--color-neon-violet)] max-sm:[--grid-size:60px]"
      />
    </div>
    <!-- 地平線光帶 -->
    <div class="absolute inset-x-0 bottom-(--floor) h-0.5 bg-[linear-gradient(90deg,transparent,#00e5ff,#ff2bd6,#00e5ff,transparent)] shadow-[0_0_18px_var(--color-neon-cyan),0_0_42px_var(--color-neon-violet)]" />
    <div class="absolute inset-0 bg-vignette" />
    <!-- CRT 掃描線 + 掃過的亮帶 -->
    <div class="absolute inset-0 bg-scanlines mix-blend-multiply" />
    <div class="absolute inset-x-0 -top-1/5 h-[18%] animate-scan-bar bg-linear-to-b from-transparent via-neon-violet/10 to-transparent" />
  </div>
</template>
