<script setup>
// 賽博龐克海灘背景：夜藍天空漸層 + 星點 + 合成波條紋太陽 + 霓虹線框的雲（CSS，只用 transform / opacity）
// + 發光海浪與沙灘（WaveCanvas）+ CRT 掃描線 / 掃過的亮帶 / 暈邊（沿用首頁 NeonBackdrop 的 utility）。
// --x：雲的 left；dur / delay：每朵雲不同速度與相位（負 delay 讓一進頁面就散布在天空各處）
import WaveCanvas from './WaveCanvas.vue'

const clouds = [
  { x: '8vw', top: '5%', scale: 1.1, dur: 110, delay: -30, op: 0.95 },
  { x: '52vw', top: '16%', scale: 0.6, dur: 150, delay: -95, op: 0.75 },
  { x: '28vw', top: '10%', scale: 0.9, dur: 180, delay: -60, op: 0.85 },
  { x: '74vw', top: '2%', scale: 0.55, dur: 130, delay: -10, op: 0.65 },
]

// 星點：用固定公式產生位置（不用 Math.random，SSR / 重繪都穩定）
const stars = Array.from({ length: 28 }, (_, i) => ({
  left: ((i * 37 + 11) % 97) + 1.5 + '%',
  top: ((i * 53 + 7) % 34) + 1 + '%',
  size: i % 5 === 0 ? 3 : 2,
  delay: -((i * 0.7) % 5),
}))
</script>

<template>
  <!-- --sea：海面（canvas）佔畫面高度的比例；太陽 / 地平線都以它為基準 -->
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-beach-abyss [--sea:52%]" aria-hidden="true">
    <!-- 天空：夜藍 -> 海藍 -> 地平線天藍泛白 -->
    <div class="absolute inset-0 bg-[linear-gradient(180deg,#010b26_0%,#021a4d_30%,#0277bd_66%,#4fc3f7_88%,#e1f5fe_100%)]" />

    <!-- 星點 -->
    <i
      v-for="(s, i) in stars"
      :key="i"
      class="absolute animate-pulse-soft rounded-full bg-white shadow-[0_0_6px_#fff]"
      :style="{ left: s.left, top: s.top, width: s.size + 'px', height: s.size + 'px', animationDelay: s.delay + 's' }"
    />

    <!-- 合成波太陽：暈光 + 條紋圓盤，下半沉進海面 -->
    <div class="absolute bottom-[calc(var(--sea)-var(--sun)*0.3)] left-1/2 aspect-square w-(--sun) -translate-x-1/2 [--sun:min(50vw,38vh,380px)]">
      <div class="absolute inset-[-45%] animate-sun-glow rounded-full bg-[radial-gradient(circle,rgb(129_212_250/0.7)_0%,rgb(79_195_247/0.35)_38%,transparent_68%)]" />
      <div class="absolute inset-0 rounded-full bg-beach-sun shadow-[0_0_80px_rgb(79_195_247/0.6)]" />
    </div>

    <!-- 霓虹線框的雲 -->
    <div
      v-for="(c, i) in clouds"
      :key="i"
      class="absolute left-(--x) h-0 w-0 animate-cloud-drift will-change-transform"
      :style="{ '--x': c.x, top: c.top, animationDuration: c.dur + 's', animationDelay: c.delay + 's' }"
    >
      <svg
        viewBox="0 0 240 90"
        class="block w-[240px] origin-top-left overflow-visible fill-[rgb(79_195_247/0.1)] stroke-[#b3e5fc] drop-shadow-[0_0_6px_#4fc3f7] max-sm:w-[180px]"
        :style="{ transform: `scale(${c.scale})`, opacity: c.op }"
      >
        <path
          vector-effect="non-scaling-stroke"
          stroke-width="1.5"
          d="M30 80c-17 0-30-11-30-26s13-25 29-25c3-16 18-27 36-27 17 0 30 9 35 22 6-5 14-8 22-8 18 0 31 12 33 29 22 1 35 12 35 26s-12 29-31 29z"
        />
      </svg>
    </div>

    <!-- 地平線光帶 -->
    <div class="absolute inset-x-0 bottom-(--sea) h-0.5 bg-[linear-gradient(90deg,transparent,#4fc3f7,#ffffff,#4fc3f7,transparent)] shadow-[0_0_18px_#4fc3f7,0_0_42px_#0288d1]" />

    <!-- 發光海浪與沙灘 -->
    <WaveCanvas />

    <!-- 暈邊 + CRT 掃描線 + 掃過的亮帶（同首頁） -->
    <div class="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgb(1_6_22/0.8)_100%)]" />
    <div class="absolute inset-0 bg-scanlines mix-blend-multiply" />
    <div class="absolute inset-x-0 -top-1/5 h-[18%] animate-scan-bar bg-linear-to-b from-transparent via-beach-neon/10 to-transparent" />
  </div>
</template>
