<script setup>
// 賽博龐克森林背景：深綠夜空漸層 + 月亮 / 暈光 + 3 層樹木剪影（inline SVG，緩慢左右搖曳，
// 只用 transform / opacity）+ 地面霧 + 落葉與螢火蟲（ForestCanvas）
// + CRT 掃描線 / 掃過的亮帶 / 暈邊（沿用首頁 NeonBackdrop 的 utility）。
// token 與關鍵影格在 src/styles/forest.css（這裡的顏色盡量用 var(--forest-*)；樹影漸層與地平線亮色等單一用途色碼直接寫在本檔）。
import '../../styles/forest.css'
import ForestCanvas from './ForestCanvas.vue'

// 固定公式產生的偽亂數（不用 Math.random，重繪 / 重新整理都穩定）
const rnd = (i, k) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return v - Math.floor(v)
}
const f1 = (n) => Math.round(n * 10) / 10

// 一棵松樹的鋸齒剪影（右半邊往下、左半邊鏡射回來），底部 base 為樹幹落地處
function pine(cx, base, h, w) {
  const tiers = 5
  const top = base - h
  const R = []
  const L = []
  let inner = 0
  for (let k = 0; k < tiers; k++) {
    const yb = top + h * 0.86 * ((k + 1) / tiers)
    const hw = (w / 2) * (0.38 + 0.62 * ((k + 1) / tiers))
    R.push([cx + hw, yb], [cx + hw * 0.42, yb])
    L.unshift([cx - hw * 0.42, yb], [cx - hw, yb])
    inner = hw * 0.42
  }
  const t = Math.max(w * 0.045, 2)
  R.push([cx + t, base])
  L.unshift([cx - t, base])
  const pts = [[cx, top], ...R, ...L]
  return 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z'
}

// 在 2400x600 的 viewBox 內等距分布並加上抖動；最後補一條地面帶，讓樹根連成一片。
// viewBox 寬 2400：slice 縮放比 = max(寬/2400, 高/600)，16:9 ~ 21:9 螢幕都是「高度」主導，
// 所以整棵樹（含樹尖）都看得到，只會裁掉左右多餘的樹；更寬的螢幕才會開始裁樹尖。
function forestPath({ n, hMin, hMax, wMin, wMax, seed, ground }) {
  const step = 2440 / n
  let d = ''
  for (let i = 0; i < n; i++) {
    const cx = step * (i + 0.5) - 20 + (rnd(i, seed) - 0.5) * step * 0.7
    const h = hMin + rnd(i, seed + 1) * (hMax - hMin)
    const w = wMin + rnd(i, seed + 2) * (wMax - wMin)
    d += pine(cx, 600, h, w)
  }
  return d + `M-20 ${600 - ground}H2420V600H-20Z`
}

// 由遠到近：越近越深、越高、越稀疏；dur 為搖曳週期（秒），delay 讓各層相位不同
const layers = [
  { id: 'far', top: '#1f6b27', bottom: '#0d3414', opacity: 0.9, height: '64%', dur: 52, delay: -10, d: forestPath({ n: 34, hMin: 200, hMax: 330, wMin: 70, wMax: 115, seed: 3, ground: 26 }) },
  { id: 'mid', top: '#14481b', bottom: '#082410', opacity: 1, height: '72%', dur: 38, delay: -22, d: forestPath({ n: 22, hMin: 290, hMax: 440, wMin: 100, wMax: 160, seed: 9, ground: 22 }) },
  { id: 'near', top: '#06180a', bottom: '#06180a', opacity: 1, height: '78%', dur: 28, delay: -4, d: forestPath({ n: 10, hMin: 400, hMax: 570, wMin: 150, wMax: 230, seed: 21, ground: 14 }) },
]
const [far, mid, near] = layers
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-(--forest-abyss)" aria-hidden="true">
    <!-- 夜空：最深的林影 -> 夜林綠 -> 地平線的深草綠，底部泛一點亮草綠 -->
    <div class="absolute inset-0 bg-[linear-gradient(180deg,var(--forest-abyss)_0%,var(--forest-night)_38%,var(--forest-deep)_82%,#2f7a2c_100%)]" />

    <!-- 月亮：暈光呼吸 + 奶油色圓盤 -->
    <div class="absolute top-[7%] right-[14%] aspect-square w-[min(24vw,150px)] max-sm:right-[10%] max-sm:w-[84px]">
      <div class="forest-moon-glow absolute inset-[-120%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--forest-cream)_30%,transparent)_0%,color-mix(in_srgb,var(--forest-pale)_12%,transparent)_32%,transparent_62%)]" />
      <div class="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fffaf0_0%,var(--forest-cream)_55%,#cfc7a0_100%)] opacity-90 shadow-[0_0_40px_color-mix(in_srgb,var(--forest-cream)_45%,transparent)]" />
    </div>

    <!-- 遠景樹影 -->
    <div class="forest-sway absolute -inset-x-[10%] bottom-0" :style="{ height: far.height, opacity: far.opacity, '--forest-dur': far.dur + 's', animationDelay: far.delay + 's' }">
      <svg viewBox="0 0 2400 600" preserveAspectRatio="xMidYMax slice" class="block h-full w-full">
        <defs>
          <linearGradient :id="'forest-g-' + far.id" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="600">
            <stop offset="0" :stop-color="far.top" />
            <stop offset="1" :stop-color="far.bottom" />
          </linearGradient>
        </defs>
        <path :d="far.d" :fill="`url(#forest-g-${far.id})`" />
      </svg>
    </div>

    <!-- 遠處的霧 -->
    <div class="forest-mist absolute -inset-x-1/2 bottom-[14%] h-[34%] [--forest-dur:46s] bg-[radial-gradient(ellipse_28%_50%_at_30%_50%,color-mix(in_srgb,var(--forest-bright)_20%,transparent),transparent),radial-gradient(ellipse_24%_50%_at_72%_50%,color-mix(in_srgb,var(--forest-pale)_14%,transparent),transparent)]" />

    <!-- 中景樹影 -->
    <div class="forest-sway absolute -inset-x-[10%] bottom-0" :style="{ height: mid.height, opacity: mid.opacity, '--forest-dur': mid.dur + 's', animationDelay: mid.delay + 's' }">
      <svg viewBox="0 0 2400 600" preserveAspectRatio="xMidYMax slice" class="block h-full w-full">
        <defs>
          <linearGradient :id="'forest-g-' + mid.id" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="600">
            <stop offset="0" :stop-color="mid.top" />
            <stop offset="1" :stop-color="mid.bottom" />
          </linearGradient>
        </defs>
        <path :d="mid.d" :fill="`url(#forest-g-${mid.id})`" />
      </svg>
    </div>

    <!-- 落葉與螢火蟲 -->
    <ForestCanvas />

    <!-- 地面霧 -->
    <div class="forest-mist absolute -inset-x-1/2 bottom-0 h-[26%] [--forest-dur:34s] bg-[radial-gradient(ellipse_30%_70%_at_25%_70%,color-mix(in_srgb,var(--forest-bright)_22%,transparent),transparent),radial-gradient(ellipse_26%_70%_at_68%_70%,color-mix(in_srgb,var(--forest-cream)_10%,transparent),transparent)]" />

    <!-- 地面暗化：讓樹根沉進黑暗，底部不露出亮色天空 -->
    <div class="absolute inset-x-0 bottom-0 h-[24%] bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--forest-abyss)_85%,transparent))]" />

    <!-- 近景樹影（最暗，壓在兩側） -->
    <div class="forest-sway absolute -inset-x-[10%] bottom-0" :style="{ height: near.height, opacity: near.opacity, '--forest-dur': near.dur + 's', animationDelay: near.delay + 's' }">
      <svg viewBox="0 0 2400 600" preserveAspectRatio="xMidYMax slice" class="block h-full w-full">
        <path :d="near.d" class="fill-(--forest-abyss)" />
      </svg>
    </div>

    <!-- 暈邊 + CRT 掃描線 + 掃過的亮帶（同首頁） -->
    <div class="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_50%,rgb(3_12_5/0.85)_100%)]" />
    <div class="absolute inset-0 bg-scanlines mix-blend-multiply" />
    <div class="absolute inset-x-0 -top-1/5 h-[18%] animate-scan-bar bg-linear-to-b from-transparent via-[color-mix(in_srgb,var(--forest-bright)_10%,transparent)] to-transparent" />
  </div>
</template>
