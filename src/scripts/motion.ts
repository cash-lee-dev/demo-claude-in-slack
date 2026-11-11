/** 使用者偏好與裝置能力偵測（全部以 matchMedia 為準，可即時反應變更） */

const mq = (q: string): MediaQueryList | null =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null;

const reducedMq = mq('(prefers-reduced-motion: reduce)');
const finePointerMq = mq('(hover: hover) and (pointer: fine)');
const narrowMq = mq('(max-width: 767px)');
const coarseMq = mq('(pointer: coarse)');

/** 使用者要求減少動態：關閉游標拖尾、曲速、視差，屏切換改為單純淡入淡出 */
export const prefersReducedMotion = (): boolean => !!reducedMq?.matches;

/** 有滑鼠等精確指標（桌機）：才啟用自訂游標與磁吸按鈕 */
export const hasFinePointer = (): boolean => !!finePointerMq?.matches;

/** 手機 / 平板（窄螢幕或觸控為主）：星空降低粒子數 */
export const isMobileLike = (): boolean => !!narrowMq?.matches || !!coarseMq?.matches;

type Listener = () => void;
export function onReducedMotionChange(fn: Listener): void {
  reducedMq?.addEventListener('change', fn);
}
export function onPointerCapabilityChange(fn: Listener): void {
  finePointerMq?.addEventListener('change', fn);
}
