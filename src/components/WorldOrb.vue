<script setup>
// 圓形霓虹按鈕：沿用 NeonButton 的手感（漸層 + 外發光 + 掃光 + hover 亮起 + 按下回彈），外形為圓形。
// 以 router-link 導覽（不重新載入頁面），讓全域雙開門轉場得以播放。
// 配色由 accent（亮色）/ deep（深色）兩個 CSS 變數決定，圖示由 slot 提供。
defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  sub: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  accent: { type: String, required: true },
  deep: { type: String, required: true },
  // 球體底色（漸層外緣）；預設由 deep 加深，宇宙用近黑色以呈現「黑 + 紅」
  base: { type: String, default: '' },
})
</script>

<template>
  <RouterLink
    :to="to"
    :aria-label="ariaLabel || label"
    class="world-orb group flex w-[clamp(7.5rem,26vw,10rem)] flex-col items-center gap-3 no-underline"
    :style="{ '--orb-accent': accent, '--orb-deep': deep, '--orb-base': base || `color-mix(in srgb, ${deep} 55%, #000 45%)` }"
  >
    <span class="world-orb__disc relative grid aspect-square w-full place-items-center overflow-hidden rounded-full border-2 text-white">
      <span class="world-orb__icon size-[46%]" aria-hidden="true"><slot /></span>
    </span>
    <span class="flex flex-col items-center leading-tight">
      <span class="font-display text-base font-bold tracking-[0.2em] text-white indent-[0.2em] [text-shadow:0_0_8px_#000,0_0_3px_#000]">{{ label }}</span>
      <span v-if="sub" class="font-display text-[0.65rem] tracking-[0.3em] text-dim indent-[0.3em]">{{ sub }}</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.world-orb__disc {
  border-color: var(--orb-accent);
  background: radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--orb-accent) 45%, transparent), var(--orb-base) 78%);
  box-shadow:
    0 0 18px color-mix(in srgb, var(--orb-accent) 50%, transparent),
    inset 0 0 18px color-mix(in srgb, var(--orb-accent) 25%, transparent);
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
}
/* 掃光 */
.world-orb__disc::before {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-120%);
  background: linear-gradient(100deg, transparent 30%, rgb(255 255 255 / 0.45) 50%, transparent 70%);
  transition: transform 0.7s;
}
.world-orb__icon {
  filter: drop-shadow(0 0 6px var(--orb-accent));
}
.world-orb:hover .world-orb__disc {
  transform: scale(1.08);
  box-shadow:
    0 0 30px var(--orb-accent),
    0 0 60px color-mix(in srgb, var(--orb-accent) 45%, transparent),
    inset 0 0 22px color-mix(in srgb, var(--orb-accent) 40%, transparent);
}
.world-orb:hover .world-orb__disc::before {
  transform: translateX(120%);
}
.world-orb:active .world-orb__disc {
  transform: scale(0.97);
  filter: brightness(1.25);
}
.world-orb:focus-visible {
  outline: none;
}
.world-orb:focus-visible .world-orb__disc {
  transform: scale(1.08);
  outline: 3px solid var(--color-neon-cyan);
  outline-offset: 4px;
  box-shadow:
    0 0 30px var(--orb-accent),
    0 0 60px color-mix(in srgb, var(--orb-accent) 45%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .world-orb__disc,
  .world-orb__disc::before {
    transition: none;
  }
}
</style>
