import { useEffect, useRef } from 'react';

// Inline GLSL — embedded at build time via the JS bundler. Splitting
// shader code into separate .glsl files would require a Vite raw-text
// import; for one shader we bundle inline. If a second shader earns
// its place, the extraction earns its place too.

const VERTEX_SHADER = /* glsl */ `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
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
    // gaze. Centered at uCursor (mapped from [-1,1] to [0,1]),
    // smoothstep gives the falloff. uActive gates the pool to zero
    // when the cursor is outside the surface so the firmament is
    // calm by default.
    vec2 cursorUv = uCursor * 0.5 + 0.5;
    float dist = distance(vUv, cursorUv);
    float pool = smoothstep(0.55, 0.0, dist) * uActive * 0.4;

    // Theme palette — warm-glow in light mode, cool-silver in dark.
    vec3 lightTone = vec3(0.95, 0.85, 0.65);
    vec3 darkTone  = vec3(0.55, 0.6, 0.85);
    vec3 tone = mix(lightTone, darkTone, uTheme);

    // Composite: the noise gives texture; the pool gives focus. The
    // theme tone shifts the whole layer warm or cool. Output alpha
    // stays low so the SVG underneath always carries the structure.
    vec3 color = tone * (n * 0.18 + pool);
    float alpha = (n * 0.12) + pool * 0.7;
    gl_FragColor = vec4(color, alpha);
  }
`;

interface FirmamentHandles {
  canvas: HTMLCanvasElement;
  dispose: () => void;
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
    void initWebGL(container).then((handles) => {
      if (cancelled || !handles) return;
      handlesRef.current = handles;
    });

    return () => {
      cancelled = true;
      handlesRef.current?.dispose();
      handlesRef.current = null;
    };
  }, [containerRef]);
}

function shouldRenderWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof document === 'undefined') return false;
  // Reduced motion: silence the firmament's animation loop entirely.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  // Save-Data: don't ship the WebGL atmospheric layer when the
  // visitor has signaled bandwidth conservation. The SVG firmament
  // is sufficient.
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return true;
}

async function initWebGL(container: HTMLDivElement): Promise<FirmamentHandles | null> {
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

  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

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

  const onPointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    program.uniforms['uCursor']!.value = [x, -y]; // flip Y for shader space
    program.uniforms['uActive']!.value = 1;
  };
  const onPointerLeave = () => {
    program.uniforms['uActive']!.value = 0;
  };

  const themeObserver = new MutationObserver(() => {
    program.uniforms['uTheme']!.value = document.documentElement.classList.contains('dk') ? 1 : 0;
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerleave', onPointerLeave);

  let raf = 0;
  const startTime = performance.now();
  const tick = () => {
    program.uniforms['uTime']!.value = (performance.now() - startTime) / 1000;
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const dispose = () => {
    cancelAnimationFrame(raf);
    themeObserver.disconnect();
    resizeObserver.disconnect();
    container.removeEventListener('pointermove', onPointerMove);
    container.removeEventListener('pointerleave', onPointerLeave);
    if (canvas.parentNode === container) container.removeChild(canvas);
  };

  return { canvas, dispose };
}
