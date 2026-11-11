/**
 * 導覽列互動：解決方案下拉（hover / 點擊 / 鍵盤）與手機選單。
 * 導覽列在每次換頁都會重新渲染，所以 initNavbar() 每次頁面載入都要呼叫；
 * 全域監聽只註冊一次。
 */
const CLOSE_DELAY = 140;

let timer: number | undefined;
let globalBound = false;

function closeAll(except?: Element | null) {
  document.querySelectorAll<HTMLElement>('.has-dropdown[data-open]').forEach((li) => {
    if (li === except) return;
    li.removeAttribute('data-open');
    li.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false');
  });
}

function setOpen(li: HTMLElement, open: boolean) {
  window.clearTimeout(timer);
  if (open) closeAll(li);
  li.toggleAttribute('data-open', open);
  li.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', String(open));
}

function setMenu(header: HTMLElement, open: boolean) {
  header.toggleAttribute('data-menu-open', open);
  header.querySelector('.site-nav__toggle')?.setAttribute('aria-expanded', String(open));
  // 手機選單開啟時暫停整頁切換
  document.documentElement.toggleAttribute('data-ui-lock', open);
  if (!open) closeAll();
}

export function initNavbar(): void {
  const header = document.querySelector<HTMLElement>('.site-nav');
  if (!header) return;
  const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth > 960;

  header.querySelectorAll<HTMLElement>('.has-dropdown').forEach((li) => {
    const btn = li.querySelector<HTMLElement>('[aria-expanded]')!;
    btn.addEventListener('click', () => setOpen(li, !li.hasAttribute('data-open')));
    li.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && finePointer()) setOpen(li, true);
    });
    li.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || !finePointer()) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setOpen(li, false), CLOSE_DELAY);
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && li.hasAttribute('data-open')) {
        setOpen(li, false);
        btn.focus();
        e.stopPropagation();
      }
      if (e.key === 'ArrowDown' && document.activeElement === btn) {
        e.preventDefault();
        setOpen(li, true);
        li.querySelector<HTMLElement>('.nav-dropdown a')?.focus();
      }
    });
    li.addEventListener('focusout', (e) => {
      const next = (e as FocusEvent).relatedTarget as Node | null;
      if (next && !li.contains(next)) setOpen(li, false);
    });
  });

  const toggle = header.querySelector<HTMLElement>('.site-nav__toggle');
  toggle?.addEventListener('click', () => setMenu(header, !header.hasAttribute('data-menu-open')));
  // 點選單內的連結後收起手機選單（同頁 hash 連結不會觸發換頁）
  header.querySelectorAll('.site-nav__menu a').forEach((a) =>
    a.addEventListener('click', () => {
      setMenu(header, false);
      closeAll();
    }),
  );

  if (globalBound) return;
  globalBound = true;
  document.addEventListener('nav:close', () => {
    closeAll();
    const h = document.querySelector<HTMLElement>('.site-nav');
    if (h?.hasAttribute('data-menu-open')) setMenu(h, false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const h = document.querySelector<HTMLElement>('.site-nav');
    if (h?.hasAttribute('data-menu-open')) setMenu(h, false);
    else closeAll();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!(e.target as Element).closest('.has-dropdown')) closeAll();
  });
  window.addEventListener('resize', () => {
    const h = document.querySelector<HTMLElement>('.site-nav');
    if (h && window.innerWidth > 960 && h.hasAttribute('data-menu-open')) setMenu(h, false);
  });
}
