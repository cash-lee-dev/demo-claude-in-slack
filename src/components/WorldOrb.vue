<script setup>
// 圓形霓虹按鈕：沿用 NeonButton 的手感（漸層 + 外發光 + 掃光 + hover 亮起 + 按下回彈），外形為圓形。
// 注意：掃光參數（100deg 漸層、translateX -120% -> 120%、0.7s）與按下的 brightness 是從 NeonButton 複製而來，
// 為了不動 NeonButton / tailwind.css（降低與其他並行 PR 的衝突）而寫在 scoped CSS；調整 NeonButton 手感時需同步這裡。
// 以 router-link 導覽（不重新載入頁面），讓全域雙開門轉場得以播放。
// aria-label 等屬性由呼叫端傳入，會透傳到根元素 RouterLink。
// 圖示由 slot 提供：只需放圖形元素（<circle>/<path>/<g>），共用的 svg 屬性（viewBox、白色線條）在這裡。
defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  sub: { type: String, default: '' },
  accent: { type: String, required: true }, // 邊框與發光色
  base: { type: String, required: true }, // 球體漸層外緣底色（宇宙用近黑色以呈現「黑 + 紅」）
})
</script>

<template>
  <RouterLink
    :to="to"
    class="world-orb group flex w-[clamp(5rem,26vw,10rem)] flex-col items-center gap-3 no-underline"
    :style="{ '--orb-accent': accent, '--orb-base': base }"
  >
    <span class="world-orb__disc relative grid aspect-square w-full place-items-center overflow-hidden rounded-full border-2 text-white">
      <svg class="world-orb__icon size-[46%]" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <slot />
      </svg>
    </span>
    <span class="flex flex-col items-center leading-tight">
      <span class="font-display text-base font-bold tracking-[0.2em] text-white indent-[0.2em] [text-shadow:0_0_8px_#000,0_0_3px_#000]">{{ label }}</span>
      <span v-if="sub" class="font-display text-xs tracking-[0.3em] text-dim indent-[0.3em] [text-shadow:0_0_8px_#000,0_0_3px_#000]">{{ sub }}</span>
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
/* 減少動態：不縮放、不掃光，只保留光暈變化（transition 時間已由 tailwind.css 全域規則壓到 0） */
@media (prefers-reduced-motion: reduce) {
  .world-orb:hover .world-orb__disc,
  .world-orb:focus-visible .world-orb__disc,
  .world-orb:active .world-orb__disc {
    transform: none;
  }
  .world-orb__disc::before {
    display: none;
  }
}
</style>
