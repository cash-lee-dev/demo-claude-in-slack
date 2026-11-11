import type { SplitText } from '../gsap';
import type { ScreenEngine } from './engine';

/** 觸發切換的來源 */
export type ScreenSource = 'wheel' | 'touch' | 'key' | 'dot' | 'hash' | 'api' | 'init';

export interface ScreenInfo {
  /** 0 起算的索引 */
  index: number;
  /** 取自 element 的 id（沒有 id 時用 data-screen 的值，再沒有就是 screen-N，並寫回 id） */
  id: string;
  /** data-screen-label，用於屏數點的 tooltip / aria-label */
  label: string;
  el: HTMLElement;
  /** 這一屏裡所有 [data-split] 的 SplitText 實例 */
  splits: SplitText[];
}

export interface ScreenContext {
  engine: ScreenEngine;
  /** 離開的那一屏（初次進場為 null） */
  from: ScreenInfo | null;
  /** 進入的那一屏 */
  to: ScreenInfo;
  /** +1 往下一屏（向前），-1 往上一屏（向後） */
  direction: 1 | -1;
  source: ScreenSource;
  /** 使用者偏好減少動態：此時不會呼叫 enter / leave 動畫 hook */
  reduced: boolean;
  count: number;
}

export type HookName = 'beforeEnter' | 'enter' | 'afterEnter' | 'leave' | 'afterLeave';

/**
 * 進出場 hook。
 * - beforeEnter / afterEnter / afterLeave：做事就好，不需要回傳
 * - enter / leave：可以回傳 GSAP tween / timeline，引擎會把它放進本次切換的主時間軸
 *   （enter 從轉場約 35% 處開始，leave 與轉場同時開始）
 */
export type ScreenHook = (ctx: ScreenContext) => gsap.core.Animation | void;

export type HookTarget = string | HTMLElement | '*';
