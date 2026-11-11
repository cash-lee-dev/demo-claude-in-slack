import type { HookName, HookTarget, ScreenContext, ScreenHook, ScreenInfo } from './types';

interface Entry {
  target: HookTarget;
  hooks: Partial<Record<HookName, ScreenHook>>;
}

/** 每個 ScreenEngine 實例各有一份 hook 登錄表，engine.destroy() 時一併清掉 */
export class HookRegistry {
  private entries: Entry[] = [];

  /**
   * 註冊某一屏（以 id 或 element 指定，'*' 代表所有屏）的進出場 hook。
   * 回傳取消註冊的函式。
   */
  register(target: HookTarget, hooks: Entry['hooks']): () => void {
    const entry: Entry = { target, hooks };
    this.entries.push(entry);
    return () => {
      this.entries = this.entries.filter((e) => e !== entry);
    };
  }

  private matches(target: HookTarget, screen: ScreenInfo): boolean {
    if (target === '*') return true;
    if (typeof target === 'string') return screen.id === target;
    return screen.el === target;
  }

  /** 執行指定 hook，回傳所有 hook 回傳的動畫 */
  run(name: HookName, screen: ScreenInfo, ctx: ScreenContext): gsap.core.Animation[] {
    const out: gsap.core.Animation[] = [];
    for (const e of this.entries) {
      const fn = e.hooks[name];
      if (!fn || !this.matches(e.target, screen)) continue;
      try {
        const res = fn(ctx);
        if (res && typeof (res as gsap.core.Animation).duration === 'function') out.push(res as gsap.core.Animation);
      } catch (err) {
        console.error(`[screens] hook "${name}" 發生錯誤`, err);
      }
    }
    return out;
  }

  clear(): void {
    this.entries = [];
  }
}
