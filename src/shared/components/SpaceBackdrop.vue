<script setup>
// 賽博龐克宇宙背景：黑色深空 + 紅色星雲光暈（CSS，只用 transform / opacity）+ 閃爍星空與流星（StarCanvas）
// + 底部暗紅星球弧線（CSS）+ CRT 掃描線 / 掃過的亮帶 / 暈邊（沿用首頁 NeonBackdrop 的 utility）。
import StarCanvas from './StarCanvas.vue'
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-space-void" aria-hidden="true">
    <!-- 紅色星雲：三團模糊的徑向光暈，緩慢飄移 / 呼吸 -->
    <div class="absolute inset-[-10%] animate-nebula-drift will-change-transform bg-[radial-gradient(48%_38%_at_22%_28%,color-mix(in_srgb,var(--color-space-crimson)_50%,transparent),transparent_70%),radial-gradient(42%_34%_at_78%_20%,color-mix(in_srgb,var(--color-space-neon)_30%,transparent),transparent_70%)]" />
    <div class="absolute inset-[-10%] animate-nebula-drift [animation-delay:-23s] [animation-direction:alternate-reverse] will-change-transform bg-[radial-gradient(55%_40%_at_58%_62%,rgb(120_10_30/0.4),transparent_72%)]" />

    <!-- 星空 + 流星 -->
    <StarCanvas />

    <!-- 底部暗紅星球：超大圓只露出上緣的弧線（微弱的大氣光暈 + 邊緣亮線） -->
    <div class="absolute top-[calc(100%-clamp(110px,19vh,190px))] left-1/2 aspect-square w-[min(max(190vw,1500px),4000px)] -translate-x-1/2">
      <div class="absolute inset-[-3%] animate-planet-glow rounded-full bg-[radial-gradient(circle,transparent_62%,color-mix(in_srgb,var(--color-space-neon)_20%,transparent)_66%,transparent_71%)]" />
      <div class="absolute inset-0 rounded-full bg-[radial-gradient(120%_60%_at_50%_0%,#4a0b14_0%,#1c050c_28%,#07020a_62%)] shadow-[inset_0_2px_0_color-mix(in_srgb,var(--color-space-neon)_75%,transparent),inset_0_10px_40px_color-mix(in_srgb,var(--color-space-neon)_35%,transparent),0_-8px_60px_color-mix(in_srgb,var(--color-space-crimson)_45%,transparent)]" />
    </div>

    <!-- 暈邊 + CRT 掃描線 + 掃過的亮帶（同首頁） -->
    <div class="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,color-mix(in_srgb,var(--color-space-void)_85%,transparent)_100%)]" />
    <div class="absolute inset-0 bg-scanlines mix-blend-multiply" />
    <div class="absolute inset-x-0 -top-1/5 h-[18%] animate-scan-bar bg-linear-to-b from-transparent via-space-neon/10 to-transparent" />
  </div>
</template>
