<script setup>
import { doorState } from '../composables/useDoorTransition.js'

const { active, closed, theme, duration } = doorState
</script>

<template>
  <!--
    全域雙開門 overlay（App 層級，只掛一次）。
    顏色來自 [data-theme] 的 CSS 變數：--door-bg / --door-edge / --door-glow（見 src/styles/door-themes/）。
  -->
  <div
    class="door-overlay"
    :class="{ 'is-active': active, 'is-closed': closed }"
    :data-theme="theme"
    :style="{ '--door-dur': duration + 'ms' }"
    aria-hidden="true"
  >
    <div class="door door-left" />
    <div class="door door-right" />
    <div class="door-seam" />
  </div>
</template>

<style>
/* 轉場結束後程式把焦點移到 main（見 useDoorTransition.js），不顯示焦點框 */
main[tabindex='-1']:focus {
  outline: none;
}

.door-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  pointer-events: none;
  visibility: hidden; /* 閒置時完全不參與繪製與互動 */
  /* 轉場期間擋住所有指標輸入 */
  touch-action: none;
}
.door-overlay.is-active {
  visibility: visible;
  pointer-events: auto;
}

/* 門板：預設在畫面兩側之外；is-closed 時滑到中央合上 */
.door {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50.5%; /* 多 0.5% 蓋住中央接縫，避免合上時出現縫隙 */
  background: var(--door-bg);
  transition: transform var(--door-dur, 600ms) cubic-bezier(0.77, 0, 0.175, 1);
  will-change: transform;
}
/* 門面的細緻掃描格線，顏色跟著主題邊框色 */
.door::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, color-mix(in srgb, var(--door-edge) 10%, transparent) 0 1px, transparent 1px 6px),
    linear-gradient(90deg, transparent 60%, color-mix(in srgb, var(--door-edge) 14%, transparent));
  pointer-events: none;
}
.door-left {
  left: 0;
  transform: translateX(-101%);
  border-right: 3px solid var(--door-edge);
  box-shadow: 0 0 26px 4px var(--door-glow), inset -14px 0 36px -14px var(--door-glow);
}
.door-right {
  right: 0;
  transform: translateX(101%);
  border-left: 3px solid var(--door-edge);
  box-shadow: 0 0 26px 4px var(--door-glow), inset 14px 0 36px -14px var(--door-glow);
}
.door-right::before {
  transform: scaleX(-1);
}
.door-overlay.is-closed .door {
  transform: translateX(0);
}

/* 中央接縫：門合上時發光 */
.door-seam {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 4px;
  margin-left: -2px;
  background: var(--door-edge);
  box-shadow:
    0 0 10px 2px var(--door-edge),
    0 0 36px 10px var(--door-glow),
    0 0 90px 24px var(--door-glow);
  opacity: 0;
  transition: opacity calc(var(--door-dur, 600ms) * 0.5) ease-out;
}
.door-overlay.is-closed .door-seam {
  opacity: 1;
  transition-delay: calc(var(--door-dur, 600ms) * 0.5);
}

/* 開門時，接縫一開始就淡出 */
.door-overlay:not(.is-closed) .door-seam {
  transition-delay: 0s;
  transition-duration: calc(var(--door-dur, 600ms) * 0.3);
}

/* 減少動態：不滑動，改為整片淡入淡出（約 0.3s，時間由 composable 設定） */
@media (prefers-reduced-motion: reduce) {
  .door-overlay {
    opacity: 0;
    transition: opacity var(--door-dur, 300ms) linear;
  }
  .door-overlay.is-closed {
    opacity: 1;
  }
  .door,
  .door-overlay.is-closed .door {
    transform: none;
    transition: none;
  }
  .door-seam {
    transition: none;
  }
}
</style>
