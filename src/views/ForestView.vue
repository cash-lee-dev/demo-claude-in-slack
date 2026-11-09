<script setup>
// 森林世界：純氛圍頁面（賽博龐克森林背景 + HUD 外框 + 故障標題 + 返回主頁），沒有功能性內容。
// 背景見 ForestBackdrop / ForestCanvas；token 在 src/styles/forest.css（由 ForestBackdrop import，這裡不重複 import）。
// 返回按鈕在這裡以 scoped class 自行上色（不在共用 NeonButton / HudCard 加森林變體）。
import { useRouter } from 'vue-router'
import ForestBackdrop from '../shared/components/ForestBackdrop.vue'
import GlitchText from '../shared/components/GlitchText.vue'

const router = useRouter()
</script>

<template>
  <ForestBackdrop />

  <!-- HUD 外框：四個發光角標（純裝飾） -->
  <div class="forest-corners pointer-events-none fixed inset-2.5 z-20 sm:inset-4" aria-hidden="true">
    <i class="absolute top-0 left-0 size-6 border-2 border-r-0 border-b-0" />
    <i class="absolute top-0 right-0 size-6 border-2 border-b-0 border-l-0" />
    <i class="absolute bottom-0 left-0 size-6 border-2 border-t-0 border-r-0" />
    <i class="absolute right-0 bottom-0 size-6 border-2 border-t-0 border-l-0" />
  </div>

  <div class="relative z-10 grid min-h-dvh grid-rows-[auto_1fr] px-[clamp(20px,4vw,56px)] pt-[clamp(20px,4vw,40px)] pb-[clamp(36px,9vh,90px)]">
    <!-- HUD 狀態列（純裝飾） -->
    <div class="forest-hud mx-auto flex w-full max-w-[860px] items-center justify-between gap-2 font-display text-[0.6rem] font-bold tracking-[0.1em] whitespace-nowrap uppercase sm:gap-3 sm:text-[0.75rem] sm:tracking-[0.26em]" aria-hidden="true">
      <span>// SECTOR 03</span>
      <span class="flex items-center gap-2"><i class="forest-dot size-1.5 animate-pulse-dot rounded-full" />BIO-SCAN</span>
      <span>CANOPY 92%</span>
    </div>

    <main class="forest-main flex flex-col items-center justify-end gap-3 pt-4 text-center sm:gap-4">
      <h1 class="m-0 animate-float font-display text-[clamp(3rem,13vw,8rem)] leading-[1.02] font-black tracking-[0.04em]">
        <GlitchText class="forest-title animate-glitch-skew [--glitch-a:var(--forest-light)] [--glitch-b:var(--forest-moss)]" text="FOREST" />
      </h1>
      <p class="forest-sub m-0 font-display text-[clamp(1rem,3vw,1.5rem)] font-bold tracking-[0.5em] indent-[0.5em]">森林</p>
      <p class="forest-line m-0 font-sans text-[clamp(0.95rem,2vw,1.2rem)] font-semibold tracking-[0.14em]">
        <span class="forest-prompt mr-[0.4em]" aria-hidden="true">&gt;</span>the canopy is listening.
      </p>
      <!-- chamfer 的 clip-path 會裁掉外發光，所以光暈用外層 wrapper 的 drop-shadow，按鈕本身只留內發光 -->
      <div class="forest-btn-wrap mt-3">
        <button type="button" class="forest-btn chamfer" @click="router.push('/home')">返回主頁</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.forest-corners i {
  border-color: var(--forest-bright);
  filter: drop-shadow(0 0 5px var(--forest-bright));
}
.forest-hud {
  color: color-mix(in srgb, var(--forest-cream) 70%, transparent);
  text-shadow: var(--forest-text-shadow-sm);
}
.forest-dot {
  background: var(--forest-bright);
  box-shadow: 0 0 8px var(--forest-bright);
}

/* 標題後方的柔和暗色罩，讓粒子與樹影不影響文字可讀性 */
.forest-main {
  position: relative;
}
.forest-main::before {
  content: '';
  position: absolute;
  inset: 8% -6% 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse 60% 55% at 50% 52%, rgb(6 24 10 / 0.6), transparent 72%);
}

.forest-title {
  color: var(--forest-cream);
  text-shadow: var(--forest-text-glow);
}
.forest-sub {
  color: var(--forest-cream);
  text-shadow: var(--forest-text-shadow-sm);
}
.forest-line {
  color: color-mix(in srgb, var(--forest-cream) 88%, transparent);
  text-shadow: var(--forest-text-shadow-sm);
}
.forest-prompt {
  color: var(--forest-bright);
}

.forest-btn-wrap {
  filter: drop-shadow(0 0 8px rgb(124 179 66 / 0.55));
  transition: filter 0.2s;
}
.forest-btn-wrap:hover {
  filter: drop-shadow(0 0 14px var(--forest-bright));
}
.forest-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.95em 1.8em;
  border: 1px solid var(--forest-bright);
  background: linear-gradient(135deg, rgb(124 179 66 / 0.25), rgb(27 94 32 / 0.35));
  color: var(--forest-cream);
  font-family: var(--font-display, 'Orbitron', sans-serif);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-indent: 0.28em;
  text-transform: uppercase;
  box-shadow: var(--forest-shadow-inset);
  transition:
    transform 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}
.forest-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-120%);
  background: linear-gradient(100deg, transparent 30%, rgb(245 235 208 / 0.4) 50%, transparent 70%);
  transition: transform 0.7s;
}
.forest-btn:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, var(--forest-bright), var(--forest-deep));
  box-shadow: var(--forest-shadow-inset-lg);
}
.forest-btn:hover::before {
  transform: translateX(120%);
}
.forest-btn:active {
  transform: translateY(1px) scale(0.985);
  filter: brightness(1.2);
}
.forest-btn:focus-visible {
  /* chamfer 的 clip-path 會裁掉外側，所以 focus 框畫在按鈕內側（-8px 才不會被切角吃掉） */
  outline: 2px solid var(--forest-cream);
  outline-offset: -8px;
}
</style>
