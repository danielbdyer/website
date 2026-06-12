import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Vec3 } from '@/shared/geometry/sphere';
import type { AtmosphericScene } from '@/shared/webgl/atmosphereScene';
import type { AtmosphereFrameInput, AtmosphereHandles } from '@/shared/webgl/atmosphereRenderer';
import {
  fitViewboxToCanvas,
  projectPointsToCanvas,
  applyAffine,
} from '@/shared/webgl/atmosphereProjection';
import { buildSkyPalette } from '@/shared/webgl/palette';
import { getConstellationCursor } from '@/shared/state/constellationCursor';
import { getSkyCamera, getSkyCameraVersion, subscribeSkyCamera } from '@/shared/state/skyCamera';

// The atmospheric layer's runtime — CONSTELLATION_HORIZON.md's
// Layer 1, in its full Phase 2 + 3 form. The hook owns what the
// renderer cannot: the fallback gates, the DOM reads that keep the
// WebGL paint registered with the structural SVG (computed-style
// transforms, the companion glyph's live position), the camera
// signal, the theme observer, and the loop's lifetime.
//
// Composition contract: the canvas paints the complete firmament
// (dome, halos, motes) behind the structural SVG. When the first
// frame lands, the constellation frame gains data-atmosphere="webgl"
// and the SVG's own firmament crossfades out; if the context is
// lost or the layer unmounts, the attribute lifts and the SVG
// firmament returns. The structural layer never notices either way.
//
// Reduced motion holds the shader on a still frame (the horizon
// doc's exact wording) and repaints only when the camera snaps,
// the theme flips, or the viewport resizes. Save-Data, forced
// colors, and prefers-contrast: more skip the layer entirely — the
// SVG firmament is the honest fallback for each.

const VIEWBOX = 1000;
const VIEWBOX_CENTER = VIEWBOX / 2;
const DAYSTAR_VIEWBOX = { x: 500, y: 240 };
const ACTIVE_EASE_RATE = 7;
const POOL_EASE_RATE = 5;
// The parallax multipliers tokens.css applies to the two layered
// groups (.constellation-parallax--sky / --firmament). The chain
// replay computes the same translate from the raw vars; if the CSS
// multipliers tune, these tune with them.
const PARALLAX_SKY_PX = -14;
const PARALLAX_FIRMAMENT_PX = -6;
// Rate matching the 800ms signature ease the CSS consumers carry —
// an exponential at 6/s reaches ~95% by 500ms, the same felt arrival.
const PARALLAX_EASE_RATE = 6;
// Consecutive still frames before the loop halves its cadence.
const CALM_AFTER_FRAMES = 45;

interface SkyDomElements {
  readonly frame: HTMLElement;
  readonly svg: SVGSVGElement;
  readonly parallaxFirmament: Element;
  readonly parallaxSky: Element;
  readonly cameraGroup: Element;
  readonly rotates: Element;
  readonly glyph: SVGCircleElement | null;
}

interface MutableVec3 {
  x: number;
  y: number;
  z: number;
}

interface FrameBuffers {
  readonly starPositions: readonly Vec3[];
  readonly starCenters: Float32Array;
  readonly starActive: Float32Array;
  readonly motePositions: MutableVec3[];
  readonly moteCenters: Float32Array;
}

interface MutableFit {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface LoopState {
  readonly buffers: FrameBuffers;
  readonly scene: AtmosphericScene;
  readonly els: SkyDomElements;
  readonly handles: AtmosphereHandles;
  readonly fitMode: 'cover' | 'contain';
  readonly activeIndexRef: RefObject<number>;
  /** Viewbox→buffer-px mapping, measured against the SVG's actual
   *  box (not the canvas box — the two can differ by chrome above
   *  the SVG). Recomputed on resize, read every frame. */
  readonly fit: MutableFit;
  readonly chain: ChainState;
  /** The one frame-input object, mutated in place per paint — the
   *  steady-state loop allocates nothing. */
  readonly frame: AtmosphereFrameInput;
  poolStrength: number;
  lastTime: number;
}

/** Measure the viewbox→buffer-px fit through the SVG's own layout
 *  box, then re-anchor it to the canvas. This keeps the WebGL paint
 *  registered with the structural layer even when the two boxes
 *  disagree (the perf harness mounts without the host's utility
 *  CSS, for example). */
function measureFit(state: LoopState): void {
  const canvas = state.handles.canvas;
  const canvasRect = canvas.getBoundingClientRect();
  const svgRect = state.els.svg.getBoundingClientRect();
  if (canvasRect.width === 0 || svgRect.width === 0) {
    const fallback = fitViewboxToCanvas(canvas.width, canvas.height, VIEWBOX, state.fitMode);
    state.fit.scale = fallback.scale;
    state.fit.offsetX = fallback.offsetX;
    state.fit.offsetY = fallback.offsetY;
    return;
  }
  const dpr = canvas.width / canvasRect.width;
  const inner = fitViewboxToCanvas(svgRect.width, svgRect.height, VIEWBOX, state.fitMode);
  state.fit.scale = inner.scale * dpr;
  state.fit.offsetX = (svgRect.left - canvasRect.left + inner.offsetX) * dpr;
  state.fit.offsetY = (svgRect.top - canvasRect.top + inner.offsetY) * dpr;
}

function locateSkyDom(container: HTMLElement): SkyDomElements | null {
  const frame = container.closest<HTMLElement>('.constellation-frame');
  if (!frame) return null;
  const svg = frame.querySelector<SVGSVGElement>('svg.constellation');
  const parallaxFirmament = frame.querySelector('.constellation-parallax--firmament');
  const parallaxSky = frame.querySelector('.constellation-parallax--sky');
  const cameraGroup = frame.querySelector('.constellation-camera');
  const rotates = frame.querySelector('.constellation-rotates');
  if (!svg || !parallaxFirmament || !parallaxSky || !cameraGroup || !rotates) return null;
  return {
    frame,
    svg,
    parallaxFirmament,
    parallaxSky,
    cameraGroup,
    rotates,
    glyph: frame.querySelector<SVGCircleElement>('[data-companion]'),
  };
}

function allocateBuffers(scene: AtmosphericScene): FrameBuffers {
  return {
    starPositions: scene.stars.map((star) => star.unitPosition),
    starCenters: new Float32Array(scene.stars.length * 2),
    starActive: new Float32Array(scene.stars.length),
    motePositions: scene.motes.map((mote) => ({ ...mote.basePosition })),
    moteCenters: new Float32Array(scene.motes.length * 2),
  };
}

/** Drift each mote around its rest position — slow tangent bobbing,
 *  frozen at t = 0 under reduced motion. Mutates the scratch
 *  positions in place (hot path, once per frame). */
function driftMotes(state: LoopState, t: number): void {
  const { motes } = state.scene;
  const out = state.buffers.motePositions;
  for (const [i, m] of motes.entries()) {
    const swingA = Math.sin(m.frequencyA * t + m.phase) * m.amplitude;
    const swingB = Math.cos(m.frequencyB * t + m.phase * 1.7) * m.amplitude * 0.8;
    const p = out[i]!;
    p.x = m.basePosition.x + m.driftA.x * swingA + m.driftB.x * swingB;
    p.y = m.basePosition.y + m.driftA.y * swingA + m.driftB.y * swingB;
    p.z = m.basePosition.z + m.driftA.z * swingA + m.driftB.z * swingB;
  }
}

interface MutableAffine {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/** The live transform stack, replayed numerically. Persistent and
 *  mutated in place each frame — the loop's chain reads allocate
 *  nothing and, critically, never call getComputedStyle: a computed-
 *  style read inside an animating subtree forces a synchronous style
 *  recalc every frame, which was the loop's main-thread spike. */
interface ChainState {
  parSkyX: number;
  parSkyY: number;
  parFirX: number;
  parFirY: number;
  spin: number;
  rotation: Animation | null;
  rotationDurationMs: number;
  world: MutableAffine;
  glyphChain: MutableAffine;
}

function newChainState(): ChainState {
  return {
    parSkyX: 0,
    parSkyY: 0,
    parFirX: 0,
    parFirY: 0,
    spin: 0,
    rotation: null,
    rotationDurationMs: 0,
    world: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    glyphChain: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  };
}

function inlineVar(el: Element, name: string): number {
  const raw = (el as Element & ElementCSSInlineStyle).style.getPropertyValue(name);
  const value = Number.parseFloat(raw);
  return Number.isNaN(value) ? 0 : value;
}

/** Locate the 600s heavens animation once; read its clock per frame.
 *  Animation.currentTime is a plain property — unlike a computed
 *  transform it costs no style recalc. Under reduced motion the
 *  global CSS collapses the duration and the angle parks near 0. */
function readSpin(els: SkyDomElements, chain: ChainState): number {
  if (!chain.rotation) {
    const animations = els.rotates.getAnimations?.() ?? [];
    chain.rotation = animations[0] ?? null;
    if (chain.rotation) {
      const timing = chain.rotation.effect?.getTiming();
      chain.rotationDurationMs = typeof timing?.duration === 'number' ? timing.duration : 600_000;
    }
  }
  const t = chain.rotation?.currentTime;
  if (typeof t !== 'number' || chain.rotationDurationMs <= 0) return 0;
  return ((t % chain.rotationDurationMs) / chain.rotationDurationMs) * Math.PI * 2;
}

/** Build a rotation-about-viewbox-center plus translate, in place. */
function writeRotationAffine(out: MutableAffine, angle: number, tx: number, ty: number): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  out.a = cos;
  out.b = sin;
  out.c = -sin;
  out.d = cos;
  out.e = VIEWBOX_CENTER - (cos * VIEWBOX_CENTER - sin * VIEWBOX_CENTER) + tx;
  out.f = VIEWBOX_CENTER - (sin * VIEWBOX_CENTER + cos * VIEWBOX_CENTER) + ty;
}

/** Advance the chain replay one frame: smooth the parallax vars
 *  toward their targets (matching the CSS consumers' 800ms arrival),
 *  read the heavens' clock, and rebuild the two affines. The camera
 *  group's yaw and the rotates group's spin share the same pivot, so
 *  their rotations compose by addition. (--cam-x/--cam-y are part of
 *  the camera transform's vocabulary but nothing writes them today;
 *  if they come alive, read them here the same way.) */
function advanceChains(els: SkyDomElements, chain: ChainState, dt: number): number {
  const k = 1 - Math.exp(-PARALLAX_EASE_RATE * dt);
  const targetX = inlineVar(els.svg, '--parallax-x') * PARALLAX_SKY_PX;
  const targetY = inlineVar(els.svg, '--parallax-y') * PARALLAX_SKY_PX;
  chain.parSkyX += (targetX - chain.parSkyX) * k;
  chain.parSkyY += (targetY - chain.parSkyY) * k;
  chain.parFirX = (chain.parSkyX * PARALLAX_FIRMAMENT_PX) / PARALLAX_SKY_PX;
  chain.parFirY = (chain.parSkyY * PARALLAX_FIRMAMENT_PX) / PARALLAX_SKY_PX;
  const yaw = (inlineVar(els.cameraGroup, '--cam-yaw') * Math.PI) / 180;
  chain.spin = readSpin(els, chain);
  writeRotationAffine(chain.world, yaw + chain.spin, chain.parSkyX, chain.parSkyY);
  writeRotationAffine(chain.glyphChain, yaw, chain.parSkyX, chain.parSkyY);
  // Residual in viewbox px, normalized so ~0.07px reads as settled.
  return (Math.abs(targetX - chain.parSkyX) + Math.abs(targetY - chain.parSkyY)) / 14;
}

/** Ease per-star activation toward its target; returns the largest
 *  remaining delta so the loop knows when the claim has settled. */
function easeActivations(state: LoopState, k: number): number {
  const active = state.buffers.starActive;
  const target = state.activeIndexRef.current;
  let residual = 0;
  for (const i of active.keys()) {
    const goal = i === target ? 1 : 0;
    const next = active[i]! + (goal - active[i]!) * k;
    active[i] = next;
    const delta = Math.abs(goal - next);
    if (delta > residual) residual = delta;
  }
  return residual;
}

/** Assemble and paint one atmosphere frame. `timeSeconds` is the
 *  loop clock (0 and frozen under reduced motion). The fit is
 *  computed against the drawing buffer, so every position handed to
 *  the shader is already in buffer pixels. Returns the frame's
 *  unsettledness (0 = nothing but ambient time is moving) so the
 *  loop can halve its cadence when the sky is calm. */
function renderAtmosphereFrame(state: LoopState, timeSeconds: number, motion: number): number {
  const { els, handles, buffers, fit, chain, frame } = state;
  const { camera, basis } = getSkyCamera();
  const dt = state.lastTime === 0 ? 0.016 : Math.min(timeSeconds - state.lastTime, 0.1);
  state.lastTime = timeSeconds;
  const parallaxResidual = advanceChains(els, chain, dt);
  projectPointsToCanvas(
    buffers.starPositions,
    camera,
    basis,
    chain.world,
    fit,
    VIEWBOX,
    buffers.starCenters,
  );
  driftMotes(state, timeSeconds);
  projectPointsToCanvas(
    buffers.motePositions,
    camera,
    basis,
    chain.glyphChain,
    fit,
    VIEWBOX,
    buffers.moteCenters,
  );
  const activeResidual = easeActivations(
    state,
    motion === 0 ? 1 : 1 - Math.exp(-ACTIVE_EASE_RATE * dt),
  );
  const cursor = getConstellationCursor();
  const poolTarget = cursor.active ? 1 : 0;
  state.poolStrength += (poolTarget - state.poolStrength) * (1 - Math.exp(-POOL_EASE_RATE * dt));
  const glyphX = els.glyph ? els.glyph.cx.baseVal.value : VIEWBOX_CENTER;
  const glyphY = els.glyph ? els.glyph.cy.baseVal.value : VIEWBOX_CENTER;
  const pool = applyAffine(chain.glyphChain, glyphX, glyphY);
  frame.timeSeconds = timeSeconds;
  frame.motion = motion;
  frame.camera = camera;
  frame.basis = basis;
  frame.fit.scale = fit.scale;
  frame.fit.offsetX = fit.offsetX;
  frame.fit.offsetY = fit.offsetY;
  // The firmament group's translate, replayed as a ray offset so
  // the painted backdrop drifts with the cursor parallax.
  frame.domeShift.x = -chain.parFirX / 440;
  frame.domeShift.y = chain.parFirY / 440;
  frame.spin = chain.spin;
  frame.pool.x = fit.offsetX + pool.x * fit.scale;
  frame.pool.y = fit.offsetY + pool.y * fit.scale;
  frame.pool.strength = state.poolStrength * motion;
  frame.daystar.x = fit.offsetX + (DAYSTAR_VIEWBOX.x + chain.parFirX) * fit.scale;
  frame.daystar.y = fit.offsetY + (DAYSTAR_VIEWBOX.y + chain.parFirY) * fit.scale;
  handles.render(frame);
  return Math.max(activeResidual, parallaxResidual, Math.abs(poolTarget - state.poolStrength));
}

function prefersStillAtmosphere(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function shouldRenderWebGL(): boolean {
  if (globalThis.window === undefined || typeof document === 'undefined') return false;
  // The perf probe's deterministic knob — CI measures the SVG
  // surface against calibrated thresholds; SwiftShader WebGL would
  // skew them. Visitors never carry this param.
  if (new URLSearchParams(globalThis.location.search).get('atmosphere') === 'off') return false;
  // Save-Data: the painted weather is exactly the weight to shed.
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  // Forced colors / prefers-contrast: the painterly layer softens
  // contrast by nature; the SVG firmament is the honest form.
  if (globalThis.matchMedia?.('(forced-colors: active)').matches) return false;
  if (globalThis.matchMedia?.('(prefers-contrast: more)').matches) return false;
  return true;
}

interface MountedAtmosphere {
  dispose: () => void;
  repaint: () => void;
}

async function mountAtmosphere(
  container: HTMLDivElement,
  scene: AtmosphericScene,
  fitMode: 'cover' | 'contain',
  activeIndexRef: RefObject<number>,
): Promise<MountedAtmosphere | null> {
  // Probe with our own canvas before ogl gets the chance to
  // console.error on context failure (headless CI without GPU).
  const probe = document.createElement('canvas');
  if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return null;
  const els = locateSkyDom(container);
  if (!els) return null;
  const { createAtmosphere } = await import('@/shared/webgl/atmosphereRenderer');
  const root = document.documentElement;
  const readToken = (token: string) => getComputedStyle(root).getPropertyValue(token);
  const isDark = () => root.classList.contains('dk');
  // 1.5 is the sweet spot for a layer that is entirely soft paint:
  // the structural SVG above carries every crisp mark, so the
  // atmosphere's pixels can be 44% fewer than a dpr-2 buffer with no
  // visible cost. The budget watcher can still drop to 1.
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
  const handles = await createAtmosphere(scene, buildSkyPalette(readToken, isDark()), dpr);
  if (!handles) return null;
  const still = prefersStillAtmosphere();
  const buffers = allocateBuffers(scene);
  const state: LoopState = {
    buffers,
    scene,
    els,
    handles,
    fitMode,
    activeIndexRef,
    fit: { scale: 1, offsetX: 0, offsetY: 0 },
    chain: newChainState(),
    frame: {
      timeSeconds: 0,
      motion: 1,
      camera: getSkyCamera().camera,
      basis: getSkyCamera().basis,
      fit: { scale: 1, offsetX: 0, offsetY: 0 },
      domeShift: { x: 0, y: 0 },
      spin: 0,
      pool: { x: 0, y: 0, strength: 0 },
      daystar: { x: 0, y: 0 },
      starCenters: buffers.starCenters,
      starActive: buffers.starActive,
      moteCenters: buffers.moteCenters,
    },
    poolStrength: 0,
    lastTime: 0,
  };
  return wireAtmosphere(container, state, { still, readToken, isDark });
}

interface AtmosphereEnv {
  readonly still: boolean;
  readonly readToken: (token: string) => string;
  readonly isDark: () => boolean;
}

/** Frame-budget guard: if the device can't hold the budget at full
 *  resolution, the caller's downgrade runs once and the watcher
 *  retires. The shader simplifies before anything structural does. */
function createBudgetWatcher(onDegrade: () => void): (now: number) => void {
  let frameCount = 0;
  let slowFrames = 0;
  let degraded = false;
  let lastFrameAt = 0;
  return (now: number) => {
    if (degraded) return;
    const dt = lastFrameAt === 0 ? 0 : now - lastFrameAt;
    lastFrameAt = now;
    frameCount += 1;
    if (dt > 26) slowFrames += 1;
    if (frameCount >= 90) {
      if (slowFrames > frameCount * 0.5) {
        degraded = true;
        onDegrade();
      }
      frameCount = 0;
      slowFrames = 0;
    }
  };
}

interface PaintLoop {
  step(now: number): void;
  repaint(): void;
  /** Break the calm — full cadence resumes (theme fades, etc.). */
  wake(): void;
}

/** The paint scheduler. Owns the calm cadence: when the world is
 *  still (no camera writes, pool and halo claim settled, parallax
 *  arrived, no theme fade), the loop paints every other frame —
 *  twinkle and drift at 30fps are indistinguishable at their
 *  periods, and the GPU rests with the sky. Any disturbance
 *  restores the full rate on the next frame. */
function createPaintLoop(
  state: LoopState,
  env: AtmosphereEnv,
  startTime: number,
  onPaintFailure: () => void,
): PaintLoop {
  let unsettled = 1;
  let calmFrames = 0;
  let frameParity = 0;
  let lastCameraVersion = -1;
  const paint = (timeSeconds: number) => {
    try {
      unsettled = renderAtmosphereFrame(state, timeSeconds, env.still ? 0 : 1);
    } catch {
      onPaintFailure();
    }
  };
  return {
    step(now: number) {
      const cameraVersion = getSkyCameraVersion();
      const still = cameraVersion === lastCameraVersion && unsettled < 0.005;
      lastCameraVersion = cameraVersion;
      calmFrames = still ? calmFrames + 1 : 0;
      frameParity ^= 1;
      if (calmFrames < CALM_AFTER_FRAMES || frameParity === 0) {
        paint((now - startTime) / 1000);
      }
    },
    repaint() {
      paint(env.still ? 0 : (performance.now() - startTime) / 1000);
    },
    wake() {
      calmFrames = 0;
      unsettled = 1;
    },
  };
}

function dressCanvas(canvas: HTMLCanvasElement): void {
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.setAttribute('aria-hidden', 'true');
}

function wireAtmosphere(
  container: HTMLDivElement,
  state: LoopState,
  env: AtmosphereEnv,
): MountedAtmosphere {
  const { handles, els } = state;
  const canvas = handles.canvas;
  dressCanvas(canvas);
  container.append(canvas);
  const resize = () => {
    const rect = container.getBoundingClientRect();
    handles.setSize(rect.width || 1, rect.height || 1);
    measureFit(state);
  };
  resize();
  let raf = 0;
  let halted = false;
  const startTime = performance.now();
  const watchBudget = createBudgetWatcher(() => {
    handles.setDpr(1);
    resize();
    // The buffer reallocation clears to black (opaque context);
    // repaint in the same task so no composite can catch it empty.
    loop.wake();
    loop.repaint();
  });
  const loop = createPaintLoop(state, env, startTime, () => {
    halted = true;
    canvas.style.display = 'none';
    delete els.frame.dataset.atmosphere;
  });
  const repaint = () => {
    if (halted) return;
    loop.repaint();
  };
  if (env.still) {
    repaint();
  } else {
    const tick = () => {
      if (halted) return;
      const now = performance.now();
      watchBudget(now);
      loop.step(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  els.frame.dataset.atmosphere = 'webgl';
  const unsubscribeCamera = env.still ? subscribeSkyCamera(repaint) : undefined;
  const themeObserver = new MutationObserver(() => {
    handles.setPalette(buildSkyPalette(env.readToken, env.isDark()), env.still);
    loop.wake();
    if (env.still) repaint();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const resizeObserver = new ResizeObserver(() => {
    resize();
    // Same reallocation hazard as the budget downgrade: never leave
    // a cleared buffer on screen waiting for the next scheduled
    // paint (the calm cadence may be skipping that very frame).
    loop.wake();
    repaint();
  });
  resizeObserver.observe(container);
  const onContextLost = () => {
    halted = true;
    canvas.style.display = 'none';
    delete els.frame.dataset.atmosphere;
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  return {
    repaint,
    dispose() {
      halted = true;
      cancelAnimationFrame(raf);
      unsubscribeCamera?.();
      themeObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      delete els.frame.dataset.atmosphere;
      handles.dispose();
    },
  };
}

/** Mount the WebGL atmosphere inside `containerRef`'s div. The
 *  scene is the precomputed atmospheric contract for the current
 *  graph; `activeIndex` names the star whose halo is claimed
 *  (-1 for none); `fit` mirrors the SVG's preserveAspectRatio. */
export function useWebGLFirmament(
  containerRef: RefObject<HTMLDivElement | null>,
  scene: AtmosphericScene,
  activeIndex: number,
  fit: 'cover' | 'contain',
) {
  const mountedRef = useRef<MountedAtmosphere | null>(null);
  const activeIndexRef = useRef(activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    mountedRef.current?.repaint();
  }, [activeIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!shouldRenderWebGL()) return;
    let cancelled = false;
    void mountAtmosphere(container, scene, fit, activeIndexRef)
      .then((mounted) => {
        if (!mounted) return;
        if (cancelled) {
          mounted.dispose();
          return;
        }
        mountedRef.current = mounted;
      })
      .catch(() => {
        // Init failed (context creation, shader compile, ogl
        // internals on a particular GPU). Stay silent: the SVG
        // firmament beneath is the complete fallback, and the
        // error-boundary e2e gate treats console noise as failure.
      });
    return () => {
      cancelled = true;
      mountedRef.current?.dispose();
      mountedRef.current = null;
    };
  }, [containerRef, scene, fit]);
}
