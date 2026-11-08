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
  <div class="backdrop" aria-hidden="true">
    <div class="bd-sky" />
    <div v-if="sun" class="bd-sun" />
    <RainCanvas v-if="rain" class="bd-rain" />
    <Skyline v-if="skyline" class="bd-skyline" />
    <div class="bd-floor"><div class="bd-plane" /></div>
    <div class="bd-horizon" />
    <div class="bd-vignette" />
    <div class="bd-scan" />
    <div class="bd-bar" />
  </div>
</template>

<style scoped>
.backdrop {
  --floor: 38%;
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
  background: var(--bg);
}

.bd-sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 50% at 50% calc(100% - var(--floor)), rgba(255, 43, 214, 0.28), transparent 70%),
    radial-gradient(90% 70% at 50% 0%, rgba(77, 107, 255, 0.28), transparent 70%),
    linear-gradient(180deg, #0a0730 0%, #0e0a3a 55%, #1a0d4d 100%);
}

/* 合成波太陽 */
.bd-sun {
  position: absolute;
  left: 50%;
  bottom: var(--floor);
  width: min(54vw, 440px);
  aspect-ratio: 1;
  transform: translateX(-50%);
  border-radius: 50%;
  background: linear-gradient(180deg, #7b61ff 0%, #c13bff 45%, #ff2bd6 100%);
  box-shadow: 0 0 80px rgba(255, 43, 214, 0.55), 0 0 160px rgba(123, 97, 255, 0.45);
  opacity: 0.9;
  --stripes: linear-gradient(180deg, #000 0 50%, transparent 50% 54%, #000 54% 62%, transparent 62% 67%, #000 67% 74%, transparent 74% 80%, #000 80% 86%, transparent 86% 92%, #000 92%);
  -webkit-mask-image: var(--stripes);
  mask-image: var(--stripes);
  animation: sun-pulse 6s ease-in-out infinite;
}
@keyframes sun-pulse {
  50% { filter: brightness(1.2); }
}

.bd-rain {
  inset: 0;
}

.bd-skyline {
  bottom: var(--floor);
  top: 0;
  height: calc(100% - var(--floor));
}

/* 透視網格地板 */
.bd-floor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--floor);
  overflow: hidden;
  perspective: 380px;
  perspective-origin: 50% 0%;
  background: linear-gradient(180deg, #120a40 0%, #07061a 100%);
}
.bd-plane {
  position: absolute;
  left: -100%;
  right: -100%;
  top: 0;
  height: 300%;
  transform-origin: 50% 0;
  transform: rotateX(72deg);
  background-image:
    linear-gradient(var(--violet) 2px, transparent 2px),
    linear-gradient(90deg, var(--violet) 2px, transparent 2px);
  background-size: 90px 90px;
  filter: drop-shadow(0 0 6px var(--violet));
  animation: grid-move 1.8s linear infinite;
  mask-image: linear-gradient(180deg, transparent 0%, #000 10%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 10%);
}
@keyframes grid-move {
  to { background-position: 0 90px; }
}

.bd-horizon {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--floor);
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan), var(--magenta), var(--cyan), transparent);
  box-shadow: 0 0 18px var(--cyan), 0 0 42px var(--violet);
}

.bd-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(3, 2, 14, 0.85) 100%);
}

/* CRT 掃描線 + 掃過的亮帶 */
.bd-scan {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px);
  mix-blend-mode: multiply;
}
.bd-bar {
  position: absolute;
  left: 0;
  right: 0;
  top: -20%;
  height: 18%;
  background: linear-gradient(180deg, transparent, rgba(123, 97, 255, 0.08), transparent);
  animation: scan-bar 7s linear infinite;
}
@keyframes scan-bar {
  to { transform: translateY(650%); }
}

@media (max-width: 640px) {
  .backdrop { --floor: 32%; }
  .bd-plane { background-size: 60px 60px; }
}
</style>
