import { useEffect, useRef } from 'react';
import { getConstellationCursor } from '@/shared/state/constellationCursor';

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
// layer over the SVG firmament. Capability that SVG filters cannot
// deliver:
//
//  - Continuous procedural noise via simplex (the standard Ashima
//    Arts WebGL implementation) sampled at a slow drift, so the
//    paper-grain breathes rather than sitting frozen as feTurbulence
//    does.
//  - A cursor-following luminous "pool of attention" — areas near
//    the visitor's gaze brighten softly, like cupping a hand over a
//    candle. Fades with a smoothstep so the boundary is honest weather,
//    not a hard edge.
//  - Theme-aware tone via `uTheme` mixed between warm (light) and cool
//    (dark) palettes. The theme transition's 500ms crossfade animates
//    the uniform on toggle.
//
// All output is additive — `gl_FragColor` is composited via the
// canvas's `mix-blend-mode: soft-light` so it deepens the SVG layer
// rather than replacing it. If WebGL is unavailable, the canvas
// doesn't render and the SVG firmament is still complete.

const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uCursor;       // [-1, 1] normalized cursor offset
  uniform float uTheme;       // 0 = light, 1 = dark
  uniform float uActive;      // 1 if cursor is over the surface, 0 otherwise

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

  void main() {
    // Noise at two octaves, drifting slowly. The drift is bounded by
    // a low time multiplier so the motion is felt rather than seen
    // — a sky breathing, not a sky scrolling.
    float t = uTime * 0.05;
    vec2 p = vUv * 4.0 + vec2(t, t * 0.7);
    float n = snoise(p) * 0.5 + snoise(p * 2.3) * 0.25;
    n = n * 0.5 + 0.5;

    // Cursor pool — a soft luminous disc that follows the visitor's
    // sphere-surface position (driven by the navigation cursor, not
    // the raw pointer). smoothstep gives the falloff; squaring it
    // gives a slightly rotund (bulb-like) profile rather than a
    // linear ramp, so the pool feels held rather than flat — the
    // Galaxy hint Pass 2 is reaching for. uActive gates the pool
    // to zero when the cursor is outside the surface.
    vec2 cursorUv = uCursor * 0.5 + 0.5;
    float dist = distance(vUv, cursorUv);
    float poolBase = smoothstep(0.55, 0.0, dist);
    float pool = poolBase * poolBase * uActive * 0.45;

    // Theme palette — warm-glow in light mode, cool-silver in dark.
    vec3 lightTone = vec3(0.95, 0.85, 0.65);
    vec3 darkTone  = vec3(0.55, 0.6, 0.85);
    vec3 tone = mix(lightTone, darkTone, uTheme);

    // Saturation boost in the pool — pushes the tone toward a richer
    // chroma where the visitor's attention sits. Computed as a soft
    // shift away from the noise's mid-grey toward the saturated
    // tone; pool * 0.35 keeps the boost subtle.
    vec3 saturatedTone = tone + (tone - vec3(0.5)) * 0.4;
    vec3 baseTone = mix(tone, saturatedTone, pool * 0.35);

    // Composite: the noise gives texture; the pool gives focus. The
    // theme tone shifts the whole layer warm or cool; the pool both
    // brightens and saturates near the cursor.
    vec3 color = baseTone * (n * 0.18 + pool);
    float alpha = (n * 0.12) + pool * 0.7;

    // Vignette — a vignette/painted sense of attention, not a
    // photographic darkening. Centered distance maps via smoothstep
    // so the corners fall off softly toward the umber ground rather
    // than hard-clipping. Multiplies into both the color and the
    // alpha so the WebGL contribution simply *recedes* at the edges
    // and the SVG firmament beneath becomes the final paint there.
    // Concentrates attention toward the polestar at the center.
    vec2 centered = vUv - 0.5;
    float vignetteDist = length(centered) * 1.4;
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
}
interface RenderLoopArgs {
  uniforms: UniformsShape;
  renderer: Renderer;
  mesh: Mesh;
  canvas: HTMLCanvasElement;
}

// Drives the rAF render loop, with a try/catch around the per-frame
// work so a GPU-context loss or ogl-internal throw halts the loop
// (and hides the canvas) rather than escaping as a recurring
// pageerror. Returns a `stop` callback the disposer calls on
// unmount. Extracted so initWebGL stays under the 80-line ceiling
// per REACT_NORTH_STAR.md §"Threshold System".
//
// Reads the navigation cursor signal each frame so the firmament's
// luminous pool of attention follows the visitor's surface position
// on the latent sphere — not the raw pointer. The pool now lives
// where the cursor lives, which means it stays anchored after a
// flick releases (the cursor's spring carries the pool along) and
// settles into the active well when the navigation does.
function startRenderLoop({ uniforms, renderer, mesh, canvas }: RenderLoopArgs): () => void {
  let raf = 0;
  let halted = false;
  const startTime = performance.now();
  const tick = () => {
    if (halted) return;
    try {
      uniforms.uTime.value = (performance.now() - startTime) / 1000;
      const cursor = getConstellationCursor();
      uniforms.uCursor.value = [cursor.x, cursor.y];
      uniforms.uActive.value = cursor.active ? 1 : 0;
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

// Sets up an ogl-driven WebGL canvas inside the given container,
// running the fragment shader above with cursor + theme uniforms.
// The hook handles: canvas creation, shader compilation, animation
// loop, resize observer, theme observation, cursor tracking, and
// cleanup. If WebGL is unsupported or any of the fallback gates is
// active (Save-Data, reduced-motion, no JS), the hook does not
// initialize and the container stays empty — the SVG firmament
// already provides the baseline.
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
  const program = new Program(gl, {
    vertex: VERTEX_SHADER,
    fragment: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uCursor: { value: [0, 0] },
      uTheme: { value: document.documentElement.classList.contains('dk') ? 1 : 0 },
      uActive: { value: 0 },
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
  const uniforms = program.uniforms as Record<
    'uTime' | 'uCursor' | 'uTheme' | 'uActive',
    { value: number | readonly number[] }
  >;

  // Cursor + active state are no longer driven by raw pointer
  // events; the navigation hook writes the visitor's sphere-
  // surface cursor to the constellationCursor signal, which the
  // render loop reads each frame. This means the luminous pool
  // follows the visitor's *intent* (where they are on the latent
  // sphere) rather than the device pointer's screen position.

  const themeObserver = new MutationObserver(() => {
    uniforms.uTheme.value = document.documentElement.classList.contains('dk') ? 1 : 0;
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
