import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Vec3 } from '@/shared/geometry/sphere';
import type { AtmosphericScene } from '@/shared/webgl/atmosphereScene';
import type { AtmosphereHandles } from '@/shared/webgl/atmosphereRenderer';
import type { Affine2D } from '@/shared/webgl/atmosphereProjection';
import {
  affineRotation,
  composeAffine,
  fitViewboxToCanvas,
  parseCssMatrix,
  projectPointsToCanvas,
  withOrigin,
  applyAffine,
} from '@/shared/webgl/atmosphereProjection';
import { buildSkyPalette } from '@/shared/webgl/palette';
import { getConstellationCursor } from '@/shared/state/constellationCursor';
import { getSkyCamera, subscribeSkyCamera } from '@/shared/state/skyCamera';

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

interface ChainReads {
  readonly world: Affine2D;
  readonly glyphChain: Affine2D;
  readonly firmamentChain: Affine2D;
  readonly spin: number;
}

/** Read the SVG's live CSS transform stack — the cursor parallax,
 *  the camera yaw, the 600s heavens rotation — so the WebGL paint
 *  replays exactly what the browser composites for the SVG stars. */
function readChains(els: SkyDomElements): ChainReads {
  const mPar = parseCssMatrix(getComputedStyle(els.parallaxSky).transform);
  const mCam = withOrigin(
    parseCssMatrix(getComputedStyle(els.cameraGroup).transform),
    VIEWBOX_CENTER,
    VIEWBOX_CENTER,
  );
  const mRotRaw = parseCssMatrix(getComputedStyle(els.rotates).transform);
  const glyphChain = composeAffine(mPar, mCam);
  return {
    world: composeAffine(glyphChain, withOrigin(mRotRaw, VIEWBOX_CENTER, VIEWBOX_CENTER)),
    glyphChain,
    firmamentChain: parseCssMatrix(getComputedStyle(els.parallaxFirmament).transform),
    spin: affineRotation(mRotRaw),
  };
}

function easeActivations(state: LoopState, k: number): void {
  const active = state.buffers.starActive;
  const target = state.activeIndexRef.current;
  for (const i of active.keys()) {
    active[i] = active[i]! + ((i === target ? 1 : 0) - active[i]!) * k;
  }
}

/** Assemble and paint one atmosphere frame. `timeSeconds` is the
 *  loop clock (0 and frozen under reduced motion). The fit is
 *  computed against the drawing buffer, so every position handed
 *  to the shader is already in buffer pixels. */
function renderAtmosphereFrame(state: LoopState, timeSeconds: number, motion: number): void {
  const { els, handles, buffers, fit } = state;
  const chains = readChains(els);
  const { camera, basis } = getSkyCamera();
  const dt = state.lastTime === 0 ? 0.016 : Math.min(timeSeconds - state.lastTime, 0.1);
  state.lastTime = timeSeconds;
  projectPointsToCanvas(
    buffers.starPositions,
    camera,
    basis,
    chains.world,
    fit,
    VIEWBOX,
    buffers.starCenters,
  );
  driftMotes(state, timeSeconds);
  projectPointsToCanvas(
    buffers.motePositions,
    camera,
    basis,
    chains.glyphChain,
    fit,
    VIEWBOX,
    buffers.moteCenters,
  );
  easeActivations(state, motion === 0 ? 1 : 1 - Math.exp(-ACTIVE_EASE_RATE * dt));
  const cursor = getConstellationCursor();
  state.poolStrength +=
    ((cursor.active ? 1 : 0) - state.poolStrength) * (1 - Math.exp(-POOL_EASE_RATE * dt));
  const glyphViewbox = els.glyph
    ? { x: els.glyph.cx.baseVal.value, y: els.glyph.cy.baseVal.value }
    : { x: VIEWBOX_CENTER, y: VIEWBOX_CENTER };
  const poolViewbox = applyAffine(chains.glyphChain, glyphViewbox.x, glyphViewbox.y);
  const daystarViewbox = applyAffine(chains.firmamentChain, DAYSTAR_VIEWBOX.x, DAYSTAR_VIEWBOX.y);
  // The firmament group's translate, replayed as a ray offset so
  // the painted backdrop drifts with the cursor parallax.
  const fe = chains.firmamentChain.e;
  const ff = chains.firmamentChain.f;
  handles.render({
    timeSeconds,
    motion,
    camera,
    basis,
    fit,
    domeShift: { x: -fe / 440, y: ff / 440 },
    spin: chains.spin,
    pool: {
      x: fit.offsetX + poolViewbox.x * fit.scale,
      y: fit.offsetY + poolViewbox.y * fit.scale,
      strength: state.poolStrength * motion,
    },
    daystar: {
      x: fit.offsetX + daystarViewbox.x * fit.scale,
      y: fit.offsetY + daystarViewbox.y * fit.scale,
    },
    starCenters: buffers.starCenters,
    starActive: buffers.starActive,
    moteCenters: buffers.moteCenters,
  });
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
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  const handles = await createAtmosphere(scene, buildSkyPalette(readToken, isDark()), dpr);
  if (!handles) return null;
  const still = prefersStillAtmosphere();
  const state: LoopState = {
    buffers: allocateBuffers(scene),
    scene,
    els,
    handles,
    fitMode,
    activeIndexRef,
    fit: { scale: 1, offsetX: 0, offsetY: 0 },
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
  });
  const paint = (timeSeconds: number) => {
    try {
      renderAtmosphereFrame(state, timeSeconds, env.still ? 0 : 1);
    } catch {
      halted = true;
      canvas.style.display = 'none';
      delete els.frame.dataset.atmosphere;
    }
  };
  const repaint = () => {
    if (halted) return;
    paint(env.still ? 0 : (performance.now() - startTime) / 1000);
  };
  const tick = () => {
    if (halted) return;
    const now = performance.now();
    watchBudget(now);
    paint((now - startTime) / 1000);
    raf = requestAnimationFrame(tick);
  };
  if (env.still) {
    repaint();
  } else {
    raf = requestAnimationFrame(tick);
  }
  els.frame.dataset.atmosphere = 'webgl';
  const unsubscribeCamera = env.still ? subscribeSkyCamera(repaint) : undefined;
  const themeObserver = new MutationObserver(() => {
    handles.setPalette(buildSkyPalette(env.readToken, env.isDark()), env.still);
    if (env.still) repaint();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (env.still) repaint();
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
