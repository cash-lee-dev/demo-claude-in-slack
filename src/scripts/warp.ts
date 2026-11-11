/**
 * 曲速（warp）狀態：屏切換 / 頁面切換時，星空「向前衝刺」的強度。
 *
 * - state.value：0 = 靜止漂移，1 = 全速曲速（可大於 1）
 * - state.dir：+1 往前（下一屏），-1 往後（上一屏）
 * - 每次變動會同步寫入 #starfield 的 CSS 變數 --warp（供 CSS 星空 / 光暈使用），Three.js 星空則每幀直接讀 state。
 */
import { gsap } from './gsap';
import { prefersReducedMotion } from './motion';

export const warpState = { value: 0, dir: 1 as 1 | -1 };

let tween: gsap.core.Timeline | null = null;

/** --warp 只寫在 #starfield（transition:persist，換頁不會被覆寫），避免每幀讓整份文件重算樣式 */
function apply() {
  document.getElementById('starfield')?.style.setProperty('--warp', warpState.value.toFixed(3));
}

/**
 * 觸發一次曲速：加速（約 35% 時間）→ 減速回到漂移。
 * reduced-motion 時直接略過（不改變任何狀態）。
 */
export function kickWarp(strength = 1, duration = 1.1, dir: 1 | -1 = 1): void {
  if (prefersReducedMotion()) return;
  tween?.kill();
  warpState.dir = dir;
  tween = gsap
    .timeline({ onUpdate: apply, onComplete: apply })
    .to(warpState, { value: strength, duration: duration * 0.35, ease: 'power2.in' })
    .to(warpState, { value: 0, duration: duration * 0.65, ease: 'power3.out' });
}

/** 立即停止曲速（reduced-motion 切換、頁面離開時使用） */
export function resetWarp(): void {
  tween?.kill();
  warpState.value = 0;
  apply();
}
