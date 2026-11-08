<script setup>
// 海灘場景背景：天空漸層 + 太陽 + 飄動的雲（CSS，只用 transform / opacity）+ 海浪與沙灘（WaveCanvas）。
// --x：雲的 left；dur / delay：每朵雲不同速度與相位（負 delay 讓一進頁面就散布在天空各處）
import WaveCanvas from './WaveCanvas.vue'

const clouds = [
  { x: '8vw', top: '4%', scale: 1.1, dur: 110, delay: -30, op: 0.95 },
  { x: '52vw', top: '15%', scale: 0.6, dur: 150, delay: -95, op: 0.8 },
  { x: '28vw', top: '9%', scale: 0.9, dur: 180, delay: -60, op: 0.9 },
  { x: '74vw', top: '1%', scale: 0.55, dur: 130, delay: -10, op: 0.7 },
]
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-beach-sky" aria-hidden="true">
    <!-- 天空：上方海藍 -> 天藍 -> 地平線附近泛白 -->
    <div class="absolute inset-0 bg-[linear-gradient(180deg,#0288d1_0%,#4fc3f7_46%,#e1f5fe_100%)]" />

    <!-- 太陽：白色核心 + 沙色暈光（小面積點綴）+ 緩慢旋轉的光芒 -->
    <div class="absolute top-[7%] right-[12%] aspect-square w-[clamp(96px,16vw,190px)] max-sm:right-[8%]">
      <div class="absolute inset-[-70%] animate-sun-rays rounded-full bg-[repeating-conic-gradient(rgb(255_255_255/0.22)_0_6deg,transparent_6deg_20deg)] [mask-image:radial-gradient(circle,#000_20%,transparent_68%)]" />
      <div class="absolute inset-[-35%] animate-sun-glow rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.75)_0%,rgb(246_231_193/0.35)_45%,transparent_70%)]" />
      <div class="absolute inset-0 rounded-full bg-white shadow-[0_0_40px_14px_rgb(255_255_255/0.6)]" />
    </div>

    <!-- 雲 -->
    <div
      v-for="(c, i) in clouds"
      :key="i"
      class="absolute left-(--x) h-0 w-0 animate-cloud-drift will-change-transform"
      :style="{ '--x': c.x, top: c.top, animationDuration: c.dur + 's', animationDelay: c.delay + 's' }"
    >
      <svg
        viewBox="0 0 240 90"
        class="block w-[240px] origin-top-left fill-white max-sm:w-[180px]"
        :style="{ transform: `scale(${c.scale})`, opacity: c.op }"
      >
        <path d="M30 80c-17 0-30-11-30-26s13-25 29-25c3-16 18-27 36-27 17 0 30 9 35 22 6-5 14-8 22-8 18 0 31 12 33 29 22 1 35 12 35 26s-12 29-31 29z" />
      </svg>
    </div>

    <!-- 海浪與沙灘 -->
    <WaveCanvas />

    <!-- 輕微暈邊，讓中央標題更清楚 -->
    <div class="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_55%,rgb(1_87_155/0.28)_100%)]" />
  </div>
</template>
