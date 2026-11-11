/**
 * Three.js 星空（只在 idle 後由 starfield.ts 動態載入）
 *
 * 作法：一個 draw call 的 instanced quad。每顆星是面向鏡頭的小方塊，頂點著色器自己做透視投影：
 *   - 景深：星星有 z 深度，近大遠小，近處的星受滑鼠視差影響更大
 *   - 緩慢漂移：uTravel 隨時間緩慢累加，星星由遠而近、循環
 *   - 曲速：uWarp > 0 時沿「畫面中心向外」的方向把星星拉長成光軌，同時加速
 * 只 import 用到的 three 類別以利 tree-shaking。
 */
import {
  AdditiveBlending,
  DoubleSide,
  BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

export interface StarfieldGL {
  render(dt: number, warp: { value: number; dir: 1 | -1 }, pointer: { nx: number; ny: number }, rawDt?: number): void;
  renderStatic(pointer: { nx: number; ny: number }): void;
  resize(): void;
  dispose(): void;
}

export interface StarfieldOptions {
  count: number;
  maxDpr: number;
  onLost?: () => void;
}

const vertex = /* glsl */ `
  attribute vec3 aStar;    // x, y（散佈）、z（深度相位 0..1）
  attribute vec3 aColor;
  attribute vec2 aMeta;    // 大小、閃爍速度
  uniform float uTravel;
  uniform float uWarp;
  uniform float uTime;
  uniform float uPx;       // 顯示像素比
  uniform vec2 uRes;       // drawing buffer 尺寸
  uniform vec2 uCam;       // 滑鼠造成的鏡頭位移
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float depth = fract(aStar.z + uTravel);           // 0 遠 → 1 近
    float dist = mix(1.0, 0.035, depth);               // 與鏡頭距離
    float focal = 0.34 * uRes.y;
    vec2 p = (aStar.xy - uCam) / dist * focal;         // 螢幕像素座標（以中心為原點）

    // 近處放大、遠處縮小；曲速時再多放大一點
    float size = aMeta.x * uPx * (0.75 + depth * 1.7);
    float len = uWarp * uRes.y * 0.09 * (0.25 + depth * 2.2);

    vec2 dir = length(p) > 0.001 ? normalize(p) : vec2(0.0, 1.0);
    vec2 perp = vec2(-dir.y, dir.x);
    vec2 corner = position.xy;                         // -1..1
    vec2 off = perp * corner.x * size + dir * corner.y * (size + len);
    // 光軌向中心拖尾：把中心往「遠離中心」偏移一半長度
    p += dir * len * 0.5;

    gl_Position = vec4((p + off) / (uRes * 0.5), 0.0, 1.0);

    float fadeIn = smoothstep(0.0, 0.12, depth);
    float fadeOut = 1.0 - smoothstep(0.86, 1.0, depth);
    float twinkle = 0.78 + 0.22 * sin(uTime * aMeta.y + aStar.z * 40.0);
    vAlpha = fadeIn * fadeOut * twinkle * (0.55 + depth * 0.45);
    vColor = aColor;
    vUv = corner;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(vUv);
    if (r > 1.0) discard;
    float core = exp(-r * r * 6.0);
    float halo = exp(-r * r * 1.6) * 0.34;
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

// 以種子產生固定的亂數，重新整理後星空長得一樣、單元測試可重現
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WHITE: [number, number, number] = [0.86, 0.93, 1.0];
const BLUE: [number, number, number] = [0.2, 0.7, 0.95];
const YELLOW: [number, number, number] = [1.0, 0.83, 0.1];

export function createStarfieldGL(canvas: HTMLCanvasElement, opts: StarfieldOptions): StarfieldGL {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const { count } = opts;
  const rand = mulberry32(20260511);

  const geo = new InstancedBufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 2, 1, 3]);

  const star = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const meta = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    star[i * 3] = (rand() * 2 - 1) * 2.3;
    star[i * 3 + 1] = (rand() * 2 - 1) * 2.3;
    star[i * 3 + 2] = rand();
    // 色彩：約 6% 品牌黃（點綴）、約 28% 品牌藍、其餘冷白
    const k = rand();
    const c = k < 0.06 ? YELLOW : k < 0.34 ? BLUE : WHITE;
    const lift = 0.75 + rand() * 0.25;
    color.set([c[0] * lift, c[1] * lift, c[2] * lift], i * 3);
    // 少數大星 + 多數小星
    meta[i * 2] = rand() < 0.05 ? 3.4 + rand() * 2.4 : 1.1 + rand() * 1.7;
    meta[i * 2 + 1] = 0.6 + rand() * 2.4;
  }
  geo.setAttribute('aStar', new InstancedBufferAttribute(star, 3));
  geo.setAttribute('aColor', new InstancedBufferAttribute(color, 3));
  geo.setAttribute('aMeta', new InstancedBufferAttribute(meta, 2));
  geo.instanceCount = count;

  const uniforms = {
    uTravel: { value: rand() },
    uWarp: { value: 0 },
    uTime: { value: 0 },
    uPx: { value: 1 },
    uRes: { value: new Vector2(1, 1) },
    uCam: { value: new Vector2(0, 0) },
  };
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
    side: DoubleSide, // 頂點著色器的 (perp, dir) 座標系可能鏡像，不能剔除背面
  });
  const mesh = new Mesh(geo, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const cam = new Vector2();
  const BASE_SPEED = 0.006; // 漂移速度（每秒穿越深度比例）
  const WARP_SPEED = 0.55;

  // 自適應品質：連續掉幀（例如沒有 GPU 加速的環境）時，逐步降低解析度與粒子數
  let quality = 1;
  let slowFrames = 0;
  let ema = 0.016;
  function adapt(rawDt: number) {
    ema += (rawDt - ema) * 0.15;
    slowFrames = ema > 0.034 ? slowFrames + 1 : 0;
    if (slowFrames > 5 && quality > 0.3) {
      quality = Math.max(0.3, quality * 0.65);
      slowFrames = 0;
      ema = 0.025;
      geo.instanceCount = Math.round(count * Math.max(0.4, quality));
      resize();
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr) * quality;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * dpr, h * dpr);
    uniforms.uPx.value = dpr;
    renderer.render(scene, camera);
  }
  resize();

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  function draw(pointer: { nx: number; ny: number }, lerp: number) {
    // 滑鼠視差：平滑追隨
    cam.x += (pointer.nx * 0.16 - cam.x) * lerp;
    cam.y += (-pointer.ny * 0.16 - cam.y) * lerp;
    uniforms.uCam.value.copy(cam);
    renderer.render(scene, camera);
  }

  return {
    render(dt, warp, pointer, rawDt = dt) {
      adapt(rawDt);
      uniforms.uTime.value += dt;
      uniforms.uWarp.value = warp.value;
      uniforms.uTravel.value += dt * (BASE_SPEED + warp.value * WARP_SPEED) * warp.dir;
      draw(pointer, Math.min(1, dt * 3));
    },
    renderStatic(pointer) {
      uniforms.uWarp.value = 0;
      cam.set(0, 0);
      draw({ nx: 0, ny: 0 }, 1);
      void pointer;
    },
    resize,
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      geo.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
