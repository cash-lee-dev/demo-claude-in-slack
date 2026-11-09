<script setup>
defineProps({
  title: { type: String, required: true },
  beach: Boolean, // 海灘世界配色（天藍 / 白）
  space: Boolean, // 宇宙世界配色（黑 / 紅）：角標與 hover 邊框也改成紅色
})

// 角標（::before / ::after）與 hover 邊框的顏色：預設 / beach 用青色，space 用霓虹紅
const cornerCyan = 'before:border-neon-cyan before:drop-shadow-[0_0_4px_var(--color-neon-cyan)] after:border-neon-cyan after:drop-shadow-[0_0_4px_var(--color-neon-cyan)] hover:border-neon-cyan'
const cornerRed = 'before:border-space-neon before:drop-shadow-[0_0_4px_var(--color-space-neon)] after:border-space-neon after:drop-shadow-[0_0_4px_var(--color-space-neon)] hover:border-space-neon'
</script>

<template>
  <article
    class="chamfer-hud relative border px-3 pt-3 pb-2.5 backdrop-blur-[10px] transition duration-200 before:absolute before:top-0 before:left-0 before:size-3.5 before:border-2 before:border-r-0 before:border-b-0 after:absolute after:right-0 after:bottom-0 after:size-3.5 after:border-2 after:border-t-0 after:border-l-0 hover:-translate-y-[3px] sm:px-[18px] sm:pt-4 sm:pb-3.5"
    :class="[
      space ? cornerRed : cornerCyan,
      space
        ? 'border-space-neon/40 bg-[rgb(18_4_12/0.6)] shadow-space-hud'
        : beach
          ? 'border-beach-neon/40 bg-[rgb(1_11_38/0.6)] shadow-beach-hud'
          : 'border-neon-violet/35 bg-[rgb(10_8_40/0.62)] shadow-neon-hud',
    ]"
  >
    <h2
      class="m-0 mb-2 font-display text-[0.68rem] tracking-[0.28em]"
      :class="space ? 'text-space-neon text-shadow-space-sm' : beach ? 'text-beach-neon text-shadow-beach-sm' : 'text-neon-violet text-shadow-neon-label'"
    >{{ title }}</h2>
    <slot />
  </article>
</template>
