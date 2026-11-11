/**
 * 版面外殼隨「屏」變化的行為（全部透過 screen:* 事件）：
 *   - 頁尾只在最後一屏出現（同時切換 inert，避免不可見時還能 Tab 到）
 *   - 切換屏時收起導覽列的下拉選單
 */
import type { ScreenContext } from './screens/types';

let bound = false;

function syncFooter(ctx: ScreenContext) {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  const last = ctx.to.index === ctx.count - 1;
  footer.toggleAttribute('data-visible', last);
  footer.toggleAttribute('inert', !last);
}

export function initChrome(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('screen:ready', (e) => syncFooter((e as CustomEvent<ScreenContext>).detail));
  document.addEventListener('screen:enter', (e) => {
    syncFooter((e as CustomEvent<ScreenContext>).detail);
    document.dispatchEvent(new CustomEvent('nav:close'));
  });
}
