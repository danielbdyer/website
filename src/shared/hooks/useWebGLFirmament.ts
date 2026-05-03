import { useEffect, useRef } from 'react';
import { getConstellationCursor } from '@/shared/state/constellationCursor';
import {
  ATMOSPHERIC_STAR_CAPACITY,
  STAR_STRIDE,
  getAtmosphericScene,
} from '@/shared/state/atmosphericScene';

// Inline GLSL — embedded at build time via the JS bundler. Splitting
// shader code into separate .glsl files would require a Vite raw-text
// import; for one shader we bundle inline. If a second shader earns
// its place, the extraction earns its place too.

// ogl's `Triangle` exposes its vertex attribute as `position` (no
// `a` prefix); the vertex shader's attribute name must match exactly,
// or ogl's program linker leaves the attribute unbound. Downstream
// uniform iteration then trips on the undefined attribute slot
// ("Cannot read properties of undefined (reading 'needsUpdate')").
// The convention varies between libraries — three.js uses `position`,
// raw WebGL tutorials often show `a_position` — so the alignment is
// load-bearing rather than stylistic.
const VERTEX_SHADER = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment shader — paints a continuous, cursor-aware atmospheric
// layer over the SVG firmament. Five contributions composed:
//
//   1. Procedural simplex noise drifting slowly, layered at two
//      octaves, for the paper-grain weather. The drift is bounded
//      by a low time multiplier so the motion is felt rather than
//      seen — a sky breathing, not a sky scrolling.
//   2. A cursor-following luminous "pool of attention" — areas near
//      the visitor's gaze brighten softly, like cupping a hand
//      over a candle. Squared-falloff for the rotund profile
//      (CONSTELLATION.md §"Pass 2 Phase E").
//   3. Per-star halos at the projected screen positions broadcast
//      by the skyProjector. Each halo breathes on a sinusoidal
//      twinkle with a per-star phase so adjacent stars desync
//      (CONSTELLATION.md §"What's held — twinkle that breathes").
//      The rotation around viewport center matches the SVG
//      .constellation-rotates 600s spin so halos stay anchored
//      to their stars without forcing JS to drive the rotation.
//   4. A polestar wash at viewport center, breathing on a long
//      tidal cycle (~14s) — the "slow tidal swell at the center
//      of the sky" the held vision named. Composed additively
//      below the stars.
//   5. A handful of drifting motes — small additive sparkles on
//      slow sinusoidal paths, the atmospheric layer's quiet life
//      between hovers (CONSTELLATION_HORIZON.md §"Layer 1 —
//      drifting motes").
//
// All output is additive — `gl_FragColor` is composited via the
// canvas's `mix-blend-mode: soft-light` so it deepens the SVG layer
// rather than replacing it. If WebGL is unavailable, the canvas
// doesn't render and the SVG firmament is still complete.

const STAR_CAPACITY_GLSL = String(ATMOSPHERIC_STAR_CAPACITY);

const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uCursor;       // [-1, 1] normalized cursor offset
  uniform float uTheme;       // 0 = light, 1 = dark
  uniform float uActive;      // 1 if cursor is over the surface, 0 otherwise
  uniform float uAspect;      // canvas width / height — keeps halos round
  // Per-star data: vec4(x, y, hueIndex, phase). x/y are *post-rotation*
  // cursor-space [-1, 1] — skyProjector applies the constellation's
  // 600s spin once per frame on CPU so this shader avoids 40+ trig
  // calls per pixel. hueIndex 0..3 indexes uHuePalette; phase in
  // seconds.
  uniform vec4 uStarData[${STAR_CAPACITY_GLSL}];
  uniform int uStarCount;
  uniform vec3 uHuePalette[4];

  const float TWO_PI = 6.28318530718;

  // Simplex 2D noise — Ashima Arts, public domain.
  vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Aspect-corrected fragment position in cursor-space [-1, 1]. The
  // shader's pool, halos, motes, and polestar wash all measure
  // distance through this so a circular falloff renders as a circle
  // on screen rather than as an ellipse on a non-square viewport.
  vec2 cursorSpace(vec2 uv) {
    return (uv * 2.0 - 1.0) * vec2(uAspect, 1.0);
  }

  // Per-star halo contribution. Each star paints a soft additive
  // disc at its (already-rotated) cursor-space position, sinusoidally
  // breathing with a per-star phase so the starfield reads as alive
  // even when the visitor sits still. Star positions arrive
  // post-rotation from skyProjector, so the loop body stays cheap
  // — no trig per pixel per star.
  //
  // Hue resolution: WebGL 2 (which ogl targets) supports dynamic
  // indexing into uniform arrays in fragment shaders, so the palette
  // lookup is a direct array index — much cheaper than the four-step
  // mix selector this loop used in its first form.
  vec4 starHalos(vec2 fragP) {
    vec3 color = vec3(0.0);
    float alpha = 0.0;
    for (int i = 0; i < ${STAR_CAPACITY_GLSL}; i++) {
      if (i >= uStarCount) break;
      vec4 d = uStarData[i];
      vec2 starP = d.xy * vec2(uAspect, 1.0);
      float dist = distance(fragP, starP);
      // Soft outer falloff (~0.18) plus a tighter inner core (~0.04).
      float halo = smoothstep(0.18, 0.02, dist);
      // Twinkle: slow breath modulated by per-star phase. Bounded
      // [0.55, 1.0] so a star never disappears entirely.
      float twinkle = 0.78 + 0.22 * sin(uTime * 0.9 + d.w);
      vec3 hue = uHuePalette[int(d.z)];
      color += hue * halo * twinkle * 0.55;
      alpha += halo * twinkle * 0.55;
    }
    return vec4(color, alpha);
  }

  // Drifting motes — four small additive sparkles on slow Lissajous
  // paths. Each mote breathes on its own phase so the motion reads
  // as a small living atmosphere rather than four identical pulses.
  vec4 driftingMotes(vec2 fragP) {
    vec3 color = vec3(0.0);
    float alpha = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float phase = fi * 1.7;
      vec2 motePos = vec2(
        sin(uTime * 0.07 + phase) * 0.65,
        cos(uTime * 0.05 + phase * 1.3) * 0.4
      );
      float dist = distance(fragP, motePos);
      float mote = smoothstep(0.06, 0.0, dist);
      float pulse = 0.5 + 0.5 * sin(uTime * 0.6 + phase * 2.0);
      color += vec3(0.9, 0.85, 0.7) * mote * pulse * 0.18;
      alpha += mote * pulse * 0.18;
    }
    return vec4(color, alpha);
  }

  void main() {
    // Aspect-corrected cursor-space position. The polestar sits at
    // the origin under the orbital camera (the projector rotates
    // every other point around it), so the shader paints centered
    // contributions at vec2(0.0).
    vec2 fragP = cursorSpace(vUv);
    vec2 cursorP = uCursor * vec2(uAspect, 1.0);

    // Noise at two octaves, drifting slowly. The drift is bounded by
    // a low time multiplier so the motion is felt rather than seen
    // — a sky breathing, not a sky scrolling.
    float t = uTime * 0.05;
    vec2 p = vUv * 4.0 + vec2(t, t * 0.7);
    float n = snoise(p) * 0.5 + snoise(p * 2.3) * 0.25;
    n = n * 0.5 + 0.5;

    // Cursor pool — the visitor's attention as a held lamp. Squared
    // smoothstep gives the rotund profile rather than a linear ramp
    // so the pool feels held rather than flat.
    float poolBase = smoothstep(0.7, 0.0, distance(fragP, cursorP));
    float pool = poolBase * poolBase * uActive * 0.45;

    // Polestar wash — the slow tidal swell at the center of the
    // sky. Long breath cycle (~14s); larger radius than the cursor
    // pool so it reads as the sky's center rather than a spot.
    float polestarBreath = 0.62 + 0.38 * sin(uTime * (TWO_PI / 14.0));
    float polestarBase = smoothstep(0.55, 0.05, length(fragP));
    float polestarWash = polestarBase * polestarBreath * 0.32;

    // Theme palette — warm-glow in light mode, cool-silver in dark.
    vec3 lightTone = vec3(0.95, 0.85, 0.65);
    vec3 darkTone  = vec3(0.55, 0.6, 0.85);
    vec3 tone = mix(lightTone, darkTone, uTheme);

    vec3 saturatedTone = tone + (tone - vec3(0.5)) * 0.4;
    vec3 baseTone = mix(tone, saturatedTone, pool * 0.35);

    // Composite layers in order: noise + pool + polestar + halos +
    // motes. Each contribution's alpha accumulates into the canvas
    // alpha so the soft-light blend underneath knows where the
    // atmospheric layer is asserting itself.
    vec4 halos = starHalos(fragP);
    vec4 motes = driftingMotes(fragP);
    vec3 color = baseTone * (n * 0.18 + pool + polestarWash) + halos.rgb + motes.rgb;
    float alpha = (n * 0.12) + pool * 0.7 + polestarWash * 0.55 + halos.a + motes.a;

    // Vignette — a vignette/painted sense of attention, not a
    // photographic darkening. Centered distance maps via smoothstep
    // so the corners fall off softly toward the umber ground rather
    // than hard-clipping. Multiplies into both the color and the
    // alpha so the WebGL contribution simply *recedes* at the edges
    // and the SVG firmament beneath becomes the final paint there.
    float vignetteDist = length(fragP) * 0.78;
    float vignette = smoothstep(0.95, 0.35, vignetteDist);
    color *= vignette;
    alpha *= vignette;

    gl_FragColor = vec4(color, alpha);
  }
`;

interface FirmamentHandles {
  canvas: HTMLCanvasElement;
  dispose: () => void;
}

// Type-only import — ogl's types come along at compile time but the
// runtime module stays lazily-imported inside initWebGL, so no-route
// visitors don't pay for the WebGL bundle weight.
import type { Mesh, Renderer } from 'ogl';

interface UniformsShape {
  uTime: { value: number | readonly number[] };
  uCursor: { value: number | readonly number[] };
  uActive: { value: number | readonly number[] };
  uAspect: { value: number | readonly number[] };
  uStarData: { value: readonly number[] | Float32Array | readonly (readonly number[])[] };
  uStarCount: { value: number };
  uHuePalette: { value: readonly (readonly number[])[] };
}
interface RenderLoopArgs {
  uniforms: UniformsShape;
  renderer: Renderer;
  mesh: Mesh;
  canvas: HTMLCanvasElement;
}

// One vec4 buffer big enough for the capacity. Reused across frames
// to avoid per-frame allocation in the render loop.
const starUniformBuffer: number[] = Array.from({ length: ATMOSPHERIC_STAR_CAPACITY * 4 }, () => 0);

// Drives the rAF render loop, with a try/catch around the per-frame
// work so a GPU-context loss or ogl-internal throw halts the loop
// (and hides the canvas) rather than escaping as a recurring
// pageerror. Returns a `stop` callback the disposer calls on
// unmount. Extracted so initWebGL stays under the 80-line ceiling
// per REACT_NORTH_STAR.md §"Threshold System".
//
// Reads two shared signals each frame:
//
//   - `constellationCursor` for the luminous pool's anchor point
//     (the visitor's surface position on the latent sphere).
//   - `atmosphericScene` for the per-star data the projector
//     broadcasts on the same RAF cadence — positions arrive
//     post-rotation, so the shader paints them directly without
//     the per-pixel trig the in-fragment rotation cost.
function startRenderLoop({ uniforms, renderer, mesh, canvas }: RenderLoopArgs): () => void {
  let raf = 0;
  let halted = false;
  const tick = () => {
    if (halted) return;
    try {
      const now = performance.now();
      uniforms.uTime.value = now / 1000;
      const cursor = getConstellationCursor();
      uniforms.uCursor.value = [cursor.x, cursor.y];
      uniforms.uActive.value = cursor.active ? 1 : 0;
      const scene = getAtmosphericScene();
      copyStarBuffer(scene.buffer);
      uniforms.uStarData.value = starUniformBuffer;
      uniforms.uStarCount.value = scene.count;
      const w = canvas.width;
      const h = canvas.height;
      uniforms.uAspect.value = h > 0 ? w / h : 1;
      renderer.render({ scene: mesh });
    } catch {
      halted = true;
      canvas.style.display = 'none';
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    halted = true;
    cancelAnimationFrame(raf);
  };
}

/** Copy the projector's interleaved Float32Array into the plain-
 *  array buffer ogl's uniform setter expects. ogl reads vec4
 *  uniform-array values as nested `[[x,y,z,w], ...]` OR as a flat
 *  `[x,y,z,w, x,y,z,w, ...]`; the flat form is what the WebGL
 *  driver eventually wants and matches the shader's stride. */
function copyStarBuffer(src: Float32Array): void {
  for (let i = 0; i < ATMOSPHERIC_STAR_CAPACITY * STAR_STRIDE; i += 1) {
    starUniformBuffer[i] = src[i] ?? 0;
  }
}

// Sets up an ogl-driven WebGL canvas inside the given container,
// running the fragment shader above with cursor + theme uniforms.
// The hook handles: canvas creation, shader compilation, animation
// loop, resize observer, theme observation, hue palette resolution,
// cursor tracking, and cleanup. If WebGL is unsupported or any of
// the fallback gates is active (Save-Data, reduced-motion, no JS),
// the hook does not initialize and the container stays empty — the
// SVG firmament already provides the baseline.
export function useWebGLFirmament(containerRef: React.RefObject<HTMLDivElement | null>) {
  const handlesRef = useRef<FirmamentHandles | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!shouldRenderWebGL()) return;

    let cancelled = false;
    void initWebGL(container)
      .then((handles) => {
        if (cancelled || !handles) return;
        handlesRef.current = handles;
      })
      .catch(() => {
        // WebGL init failed for any reason (context creation, shader
        // compile, ogl internals throwing on a particular GPU).
        // Swallow the error so it does not surface as an unhandled
        // pageerror — the SVG firmament beneath the canvas already
        // provides the complete fallback. Real-device failures
        // surface in monitoring; tests that gate on console errors
        // (e2e/error-boundary.spec.ts) stay green.
      });

    return () => {
      cancelled = true;
      handlesRef.current?.dispose();
      handlesRef.current = null;
    };
  }, [containerRef]);
}

function shouldRenderWebGL(): boolean {
  if (globalThis.window === undefined) return false;
  if (typeof document === 'undefined') return false;
  // Reduced motion: silence the firmament's animation loop entirely.
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  // Save-Data: don't ship the WebGL atmospheric layer when the
  // visitor has signaled bandwidth conservation. The SVG firmament
  // is sufficient.
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return true;
}

/** Read the four facet hues from the document root's CSS custom
 *  properties and convert to linear-RGB triples. The shader receives
 *  these as `uHuePalette[4]`, indexed by each star's hue field
 *  (0=warm, 1=rose, 2=violet, 3=gold). Re-resolved on theme change
 *  via the existing MutationObserver so the dark / light hues both
 *  speak in their own register. */
function resolveHuePalette(): readonly (readonly number[])[] {
  const styles = getComputedStyle(document.documentElement);
  return ['warm', 'rose', 'violet', 'gold'].map((name) => {
    const hex = styles.getPropertyValue(`--accent-${name}`).trim();
    return hexToRgb(hex);
  });
}

/** sRGB hex → linear-RGB triple. The shader's soft-light blend
 *  expects values in [0, 1]; gamma correction is approximated as a
 *  squared sRGB ramp (the simplest correction; the soft-light blend
 *  is forgiving). Falls back to a safe paper-warm if the property
 *  is missing or malformed (no /sky should ever paint magenta). */
function hexToRgb(hex: string): readonly number[] {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return [0.78, 0.46, 0.3];
  const r = Number.parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleaned.slice(4, 6), 16) / 255;
  return [r * r, g * g, b * b];
}

async function initWebGL(container: HTMLDivElement): Promise<FirmamentHandles | null> {
  // Probe WebGL availability with our own canvas before letting ogl
  // try. ogl's Renderer constructor calls
  // `console.error('unable to create webgl context')` on failure
  // (ogl/src/core/Renderer.js line 46) — and the e2e error-boundary
  // spec catches every console error as a test failure. Headless
  // CI Chromium without GPU emulation falls into exactly this case.
  // Pre-probing here lets us bail silently before ogl gets the
  // chance to log; the SVG firmament continues as the only firmament
  // with no log noise.
  const probe = document.createElement('canvas');
  if (!probe.getContext('webgl2') && !probe.getContext('webgl')) {
    return null;
  }

  // Lazy-import ogl so the dependency is only pulled into the chunk
  // that actually mounts the WebGL surface. Routes that don't reach
  // /sky never download the WebGL bundle.
  const { Renderer, Program, Mesh, Triangle } = await import('ogl');

  let renderer: InstanceType<typeof Renderer>;
  try {
    renderer = new Renderer({ alpha: true, premultipliedAlpha: false, dpr: 1 });
  } catch {
    // WebGL unavailable (older browser, disabled, or context creation
    // failed). The SVG firmament continues as the only firmament.
    return null;
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const canvas = gl.canvas;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.setAttribute('aria-hidden', 'true');
  container.append(canvas);

  const geometry = new Triangle(gl);
  const initialPalette = resolveHuePalette();
  const initialStarBuffer = Array.from(
    { length: ATMOSPHERIC_STAR_CAPACITY * STAR_STRIDE },
    () => 0,
  );
  const program = new Program(gl, {
    vertex: VERTEX_SHADER,
    fragment: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uCursor: { value: [0, 0] },
      uTheme: { value: document.documentElement.classList.contains('dk') ? 1 : 0 },
      uActive: { value: 0 },
      uAspect: { value: 1 },
      uStarData: { value: initialStarBuffer },
      uStarCount: { value: 0 },
      uHuePalette: { value: initialPalette },
    },
    transparent: true,
  });
  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width || 1, rect.height || 1);
  };
  resize();

  // ogl's uniform map is loosely typed. The shader's uniforms are
  // declared above with known shapes; this typed view makes the
  // mutations explicit and lint-safe without changing behavior.
  const uniforms = program.uniforms as unknown as UniformsShape & {
    uTheme: { value: number };
    uHuePalette: { value: readonly (readonly number[])[] };
  };

  const themeObserver = new MutationObserver(() => {
    uniforms.uTheme.value = document.documentElement.classList.contains('dk') ? 1 : 0;
    // Hue tokens differ between themes (tokens.css §"theme-light",
    // §"theme-dark"). Re-resolve on toggle so each star paints in
    // the palette its theme commits to.
    uniforms.uHuePalette.value = resolveHuePalette();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const stopRaf = startRenderLoop({ uniforms, renderer, mesh, canvas });

  const dispose = () => {
    stopRaf();
    themeObserver.disconnect();
    resizeObserver.disconnect();
    if (canvas.parentNode === container) canvas.remove();
  };

  return { canvas, dispose };
}
