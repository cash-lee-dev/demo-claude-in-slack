/**
 * 自訂游標 + 星塵拖尾（只在桌機的精確指標啟用；觸控裝置完全不建立）
 *
 * DOM 由 <FxLayer /> 提供（transition:persist，跨頁不重建）。
 * 狀態寫在 #fx-layer 的 data 屬性：data-cursor=on|off、data-trail=on|off，方便測試與除錯。
 *   - prefers-reduced-motion：停用拖尾（改為單純的點 + 環，且不做彈性追隨）
 *   - 懸停在 a / button / [data-magnetic] 上時，游標環放大
 */
import { gsap } from './gsap';
import { hasFinePointer, onPointerCapabilityChange, onReducedMotionChange, prefersReducedMotion } from './motion';
import { onPointerMove, pointer } from './pointer';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  sprite: number;
}

const PALETTE = ['255,255,255', '255,212,0', '0,161,224', '146,214,241', '190,232,250'];
const MAX_PARTICLES = 140;
const INTERACTIVE = 'a[href], button, [role="button"], summary, [data-magnetic], input, select, textarea, label';

let layer: HTMLElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;
let canvas: HTMLCanvasElement | null = null;
let sprites: HTMLCanvasElement[] = [];
let particles: Particle[] = [];
let running = false;
let lastX = 0;
let lastY = 0;
let enabled = false;
let dpr = 1;
let moveX: (v: number) => void;
let moveY: (v: number) => void;
let ringX: (v: number) => void;
let ringY: (v: number) => void;

function makeSprites() {
  sprites = PALETTE.map((rgb) => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${rgb},1)`);
    grad.addColorStop(0.25, `rgba(${rgb},0.55)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return c;
  });
}

function resize() {
  if (!canvas || !ctx2d) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

const trailOn = () => enabled && !prefersReducedMotion();

function spawn(x: number, y: number, speed: number) {
  const n = Math.min(3, 1 + Math.floor(speed / 18));
  for (let i = 0; i < n; i++) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const a = Math.random() * Math.PI * 2;
    const v = 8 + Math.random() * 26;
    const r = Math.random();
    particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v + 6, // 微微下沉，像灑落的星塵
      life: 0,
      max: 0.7 + Math.random() * 0.7,
      size: 5 + Math.random() * 11,
      sprite: r < 0.18 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : r < 0.9 ? 4 : 0,
    });
  }
  if (!running) {
    running = true;
    gsap.ticker.add(tick);
  }
}

function tick(_t: number, dtMs: number) {
  if (!ctx2d || !canvas) return;
  const dt = Math.min(dtMs, 50) / 1000;
  ctx2d.setTransform(1, 0, 0, 1, 0, 0);
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx2d.globalCompositeOperation = 'lighter';
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.max) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;
    const k = 1 - p.life / p.max;
    const s = p.size * (0.4 + k * 0.6);
    ctx2d.globalAlpha = k * 0.9;
    ctx2d.drawImage(sprites[p.sprite], p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx2d.globalAlpha = 1;
  if (!particles.length) {
    running = false;
    gsap.ticker.remove(tick);
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function refreshFlags() {
  if (!layer) return;
  const shouldEnable = hasFinePointer();
  enabled = shouldEnable;
  layer.hidden = !shouldEnable;
  layer.dataset.cursorSupported = String(shouldEnable);
  if (!shouldEnable) layer.dataset.cursor = 'off';
  layer.dataset.trail = trailOn() ? 'on' : 'off';
  applyRootClass();
  if (!trailOn()) particles = [];
}

/** <html> 的屬性會在每次頁面切換被新頁面覆寫，所以每次 after-swap 都要重新套用 */
export function applyRootClass(): void {
  document.documentElement.classList.toggle('has-cursor', enabled);
}

export function initCursor(): void {
  if (layer) return;
  layer = document.getElementById('fx-layer');
  if (!layer) return;
  canvas = layer.querySelector<HTMLCanvasElement>('.fx-trail');
  const dot = layer.querySelector<HTMLElement>('.fx-dot');
  const ring = layer.querySelector<HTMLElement>('.fx-ring');
  if (!canvas || !dot || !ring) return;
  ctx2d = canvas.getContext('2d');

  refreshFlags();
  onReducedMotionChange(refreshFlags);
  onPointerCapabilityChange(refreshFlags);
  if (!enabled) {
    // 觸控裝置：不綁任何事件、不建立 sprite
    const watch = () => {
      if (enabled && !sprites.length) bind(dot, ring);
    };
    onPointerCapabilityChange(watch);
    return;
  }
  bind(dot, ring);
}

let bound = false;
function bind(dot: HTMLElement, ring: HTMLElement) {
  if (bound || !layer) return;
  bound = true;
  makeSprites();
  resize();
  window.addEventListener('resize', resize, { passive: true });

  moveX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3.out' });
  moveY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3.out' });
  ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

  onPointerMove((e) => {
    if (!enabled || e.pointerType !== 'mouse') return;
    layer!.dataset.cursor = 'on';
    moveX(e.clientX);
    moveY(e.clientY);
    if (prefersReducedMotion()) {
      gsap.set(ring, { x: e.clientX, y: e.clientY });
    } else {
      ringX(e.clientX);
      ringY(e.clientY);
    }
    layer!.dataset.hover = String(!!(e.target as Element | null)?.closest?.(INTERACTIVE));
    if (trailOn()) {
      const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (speed > 3) spawn(e.clientX, e.clientY, speed);
    }
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('pointerdown', () => layer && (layer.dataset.down = 'true'), { passive: true });
  window.addEventListener('pointerup', () => layer && (layer.dataset.down = 'false'), { passive: true });
  document.documentElement.addEventListener('mouseleave', () => layer && (layer.dataset.cursor = 'off'));
  document.documentElement.addEventListener('mouseenter', () => layer && enabled && pointer.moved && (layer.dataset.cursor = 'on'));
}

/** 測試 / 除錯用 */
export const cursorDebug = () => ({
  enabled,
  trail: trailOn(),
  particles: particles.length,
});
