/**
 * 屏數導覽點（右側 dots）：顯示目前第幾屏並可點擊跳屏。
 * DOM 骨架由 <ScreenDots /> 提供，這裡依引擎事件動態建立 / 更新按鈕。
 * 只聽事件、不直接依賴引擎內部，示範 screen:* 事件的用法。
 */
import { getEngine } from './index';
import type { ScreenContext } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
let bound = false;

function nav(): HTMLElement | null {
  return document.getElementById('screen-dots');
}

function build(ctx: ScreenContext) {
  const el = nav();
  if (!el) return;
  const list = el.querySelector<HTMLElement>('.screen-dots__list')!;
  const { engine } = ctx;
  el.hidden = engine.count < 2;
  list.replaceChildren(
    ...engine.screens.map((s) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'screen-dot';
      btn.dataset.index = String(s.index);
      btn.setAttribute('aria-label', `前往第 ${s.index + 1} 屏：${s.label}`);
      const label = document.createElement('span');
      label.className = 'screen-dot__label';
      label.textContent = s.label;
      label.setAttribute('aria-hidden', 'true');
      btn.append(label);
      li.append(btn);
      return li;
    }),
  );
  update(ctx);
}

function update(ctx: ScreenContext) {
  const el = nav();
  if (!el) return;
  const i = ctx.to.index;
  el.querySelectorAll<HTMLElement>('.screen-dot').forEach((b, idx) => {
    if (idx === i) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  });
  const cur = el.querySelector('[data-dots-current]');
  const total = el.querySelector('[data-dots-total]');
  if (cur) cur.textContent = pad(i + 1);
  if (total) total.textContent = pad(ctx.count);
  const live = el.querySelector('[data-dots-live]');
  if (live) live.textContent = `第 ${i + 1} 屏，共 ${ctx.count} 屏：${ctx.to.label}`;
}

export function initDots(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('screen:ready', (e) => build((e as CustomEvent<ScreenContext>).detail));
  document.addEventListener('screen:enter', (e) => update((e as CustomEvent<ScreenContext>).detail));
  // 事件委派：點擊屏數點 → 跳到該屏
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('#screen-dots .screen-dot');
    if (!btn) return;
    getEngine()?.goTo(Number(btn.dataset.index), 'dot');
  });
}
