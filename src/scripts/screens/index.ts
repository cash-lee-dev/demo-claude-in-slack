/**
 * 整頁切換引擎的生命週期與對外 API（模組單例）
 *
 *   bootScreens()      每次頁面載入 / View Transition swap 之後呼叫：建立新的 ScreenEngine
 *   destroyScreens()   每次 swap 之前呼叫：清除舊引擎
 *   onScreensReady(cb) 註冊「引擎就緒」回呼（每次換頁都會再呼叫一次），頁面腳本用它註冊進出場 hook
 *   getEngine()        取得目前引擎（也掛在 window.may4s.screens）
 *
 * 事件（都在 document 上，detail 為 ScreenContext）：
 *   screen:ready   引擎初始化完成（含初次進場）
 *   screen:leave   開始離開某屏
 *   screen:enter   開始進入某屏（含初次進場）
 *   screen:change  切換動畫完全結束
 *   screen:destroy 引擎被清除（換頁）
 */
import { ScreenEngine } from './engine';

export { ScreenEngine } from './engine';
export type { HookName, ScreenContext, ScreenHook, ScreenInfo, ScreenSource } from './types';

type ReadyCb = (engine: ScreenEngine) => void | (() => void);
const readyCallbacks: ReadyCb[] = [];
let engine: ScreenEngine | null = null;
let readyCleanups: Array<() => void> = [];

/**
 * 註冊引擎就緒回呼。回呼會在「目前與之後每一次」引擎建立時被呼叫，所以頁面腳本只要在模組頂層呼叫一次：
 *
 *   onScreensReady((engine) => {
 *     engine.hooks.register('hero', { enter: (ctx) => gsap.from('.orb', { scale: 0 }) });
 *   });
 *
 * 回呼可回傳清理函式，引擎被清除時執行。
 */
export function onScreensReady(cb: ReadyCb): void {
  readyCallbacks.push(cb);
  if (engine) {
    const cleanup = cb(engine);
    if (cleanup) readyCleanups.push(cleanup);
  }
}

export const getEngine = (): ScreenEngine | null => engine;

export function bootScreens(): ScreenEngine | null {
  destroyScreens();
  const root = document.querySelector<HTMLElement>('[data-screens]');
  if (!root) return null;
  const e = new ScreenEngine(root);
  engine = e;
  window.may4s = Object.assign(window.may4s ?? {}, { screens: e });
  for (const cb of readyCallbacks) {
    const cleanup = cb(e);
    if (cleanup) readyCleanups.push(cleanup);
  }
  e.init();
  return e;
}

export function destroyScreens(): void {
  readyCleanups.forEach((fn) => fn());
  readyCleanups = [];
  engine?.destroy();
  engine = null;
  if (window.may4s) window.may4s.screens = null;
}

declare global {
  interface Window {
    may4s: {
      screens?: ScreenEngine | null;
      [key: string]: unknown;
    };
  }
}
