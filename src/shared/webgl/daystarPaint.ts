// The daystar's body, painted: a lit sphere of living pigment beneath
// the ink the SVG draws. The paint is a warped field that flows, and
// swirls that repaint as the body turns — a shimmer of rainbow in the
// swirls, fuller under the pointer and through the turn — the way the
// fish in Danny's reference shimmer as they swim. The sun is its own
// light, gold into warm with rose in the swirls, brightest toward the
// upper left, its limb warming and darkening; the moon is lit from
// the right, where its rim is, silver that shimmers, a terminator,
// the earthshine dim and blue in its hollow. One small WebGL context
// of the daystar's own — one triangle, one program — so the body
// paints above whatever the sky's canvas and svg put behind it, and
// so the same paint can one day ride the glyph in the nav. Mounted by
// the magic (dom/daystarMagic.ts), lazily; the CSS gradients on the
// drawn discs are the body until then, and wherever WebGL is not.
// CONSTELLATION.md §"The Sun and the Moon" (the fourth pass).

import { parseCssColor, type Rgb } from './palette';

export interface PaintTone {
  readonly gold: Rgb;
  readonly warm: Rgb;
  readonly rose: Rgb;
  readonly violet: Rgb;
  readonly paper: Rgb;
  readonly ink: Rgb;
}

export interface PaintInput {
  readonly time: number;
  /** 0 the sun, 1 the moon; the turn crossfades it. */
  readonly night: number;
  readonly energy: number;
  readonly whirl: number;
}

export interface PaintHandle {
  paint(input: PaintInput): void;
  setTone(tone: PaintTone): void;
  resize(): void;
  dispose(): void;
}

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uNight;
uniform float uEnergy;
uniform float uWhirl;
uniform vec3 uGold;
uniform vec3 uWarm;
uniform vec3 uRose;
uniform vec3 uViolet;
uniform vec3 uPaper;
uniform vec3 uInk;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int k = 0; k < 4; k++) {
    s += a * valueNoise(p);
    p = p * 2.02 + 11.3;
    a *= 0.5;
  }
  return s;
}

void main() {
  // The disc is half the square (r = 60 of 240): |p| = 1 is the rim.
  vec2 p = (gl_FragCoord.xy / uRes * 2.0 - 1.0) * 2.0;
  float r = length(p);
  if (r > 1.06) { gl_FragColor = vec4(0.0); return; }
  float z = sqrt(max(1.0 - r * r, 0.0));
  vec3 n = vec3(p, z);

  // The body turns — slowly at rest, quicker under the pointer, fast
  // through the whirl — and the paint is read off its surface.
  float spin = uTime * (0.07 + uEnergy * 0.12 + uWhirl * 0.8);
  float cs = cos(spin);
  float sn = sin(spin);
  vec3 s = vec3(n.x * cs + n.z * sn, n.y, -n.x * sn + n.z * cs);
  vec2 uv = vec2(atan(s.x, s.z), asin(clamp(s.y, -1.0, 1.0)));

  // The paint: a field warped by a slower field, flowing; a finer
  // grain over it; and the swirls repainting as the body turns.
  vec2 q = vec2(fbm(uv * 2.0 + uTime * 0.06), fbm(uv * 2.0 - uTime * 0.05 + 3.1));
  float f = fbm(uv * 3.4 + 1.9 * q + uTime * 0.03);
  float g = fbm(uv * 9.0 - 1.4 * q + uTime * 0.02);
  vec3 iris = 0.5 + 0.5 * cos(6.2832 * (f + q.x * 0.5) + uTime * 0.25 + vec3(0.0, 2.09, 4.19));
  float shimmer = 0.14 + uEnergy * 0.3 + uWhirl * 0.45;

  // The sun, its own light.
  vec3 L = normalize(vec3(-0.45, 0.55, 0.7));
  float lit = max(dot(n, L), 0.0);
  vec3 sun = mix(uGold, uWarm, smoothstep(0.32, 0.78, f));
  sun = mix(sun, uRose, smoothstep(0.5, 0.9, q.y) * 0.45);
  sun = mix(sun, iris * uGold * 1.5, shimmer * smoothstep(0.3, 0.75, g));
  sun *= 0.82 + 0.38 * lit + 0.12 * z;
  sun = mix(sun, uWarm * 0.5, (1.0 - pow(z, 0.6)) * 0.65);
  sun += (g - 0.5) * 0.08;

  // The moon, lit from the right.
  vec3 M = normalize(vec3(0.85, 0.2, 0.48));
  float moonLit = max(dot(n, M), 0.0);
  vec3 silver = mix(uPaper * 0.96, mix(uPaper, uViolet, 0.4), smoothstep(0.35, 0.8, f));
  silver = mix(silver, mix(uPaper, iris, 0.55), shimmer * 0.7 * smoothstep(0.4, 0.8, g));
  vec3 earth = mix(uInk * 1.3, uViolet * 0.6, 0.45) * 0.45;
  vec3 moon = mix(earth, silver, smoothstep(0.02, 0.6, moonLit));
  moon += (g - 0.5) * 0.05;

  vec3 col = mix(sun, moon, uNight);
  // A soft, wet edge; premultiplied alpha.
  float edge = 1.0 - smoothstep(0.975, 1.06, r);
  gl_FragColor = vec4(col * edge, edge);
}
`;

const TONE_TOKENS: Record<keyof PaintTone, string> = {
  gold: '--accent-gold',
  warm: '--accent-warm',
  rose: '--accent-rose',
  violet: '--accent-violet',
  paper: '--daystar-paper',
  ink: '--daystar-ink',
};

const FALLBACK_TONE: PaintTone = {
  gold: [0.75, 0.63, 0.3],
  warm: [0.78, 0.46, 0.3],
  rose: [0.72, 0.44, 0.44],
  violet: [0.54, 0.44, 0.69],
  paper: [0.99, 0.98, 0.97],
  ink: [0.17, 0.13, 0.1],
};

/** The tone from the live tokens on an element (the daystar's own
 *  paper and ink live on it; the accents on the root). */
export function readPaintTone(el: Element): PaintTone {
  const style = getComputedStyle(el);
  const read = (key: keyof PaintTone): Rgb =>
    parseCssColor(style.getPropertyValue(TONE_TOKENS[key]))?.rgb ?? FALLBACK_TONE[key];
  return {
    gold: read('gold'),
    warm: read('warm'),
    rose: read('rose'),
    violet: read('violet'),
    paper: read('paper'),
    ink: read('ink'),
  };
}

function compile(gl: WebGLRenderingContext, kind: number, source: string): WebGLShader | null {
  const shader = gl.createShader(kind);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

function locateUniforms(gl: WebGLRenderingContext, program: WebGLProgram): Uniforms {
  const names = [
    'uRes',
    'uTime',
    'uNight',
    'uEnergy',
    'uWhirl',
    'uGold',
    'uWarm',
    'uRose',
    'uViolet',
    'uPaper',
    'uInk',
  ];
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
}

function writeTone(gl: WebGLRenderingContext, u: Uniforms, tone: PaintTone): void {
  gl.uniform3fv(u.uGold!, tone.gold);
  gl.uniform3fv(u.uWarm!, tone.warm);
  gl.uniform3fv(u.uRose!, tone.rose);
  gl.uniform3fv(u.uViolet!, tone.violet);
  gl.uniform3fv(u.uPaper!, tone.paper);
  gl.uniform3fv(u.uInk!, tone.ink);
}

/** Mount the painter on the daystar's canvas. Null where WebGL is
 *  not to be had; the drawn discs stay the body then. */
export function mountDaystarPaint(canvas: HTMLCanvasElement, tone: PaintTone): PaintHandle | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;
  const program = link(gl);
  if (!program) return null;
  const u = locateUniforms(gl, program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // One triangle that covers the clip square.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  writeTone(gl, u, tone);
  const resize = () => {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const size = Math.max(1, Math.round(canvas.clientWidth * dpr));
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    gl.viewport(0, 0, size, size);
    gl.uniform2f(u.uRes!, size, size);
  };
  resize();
  return {
    paint(input) {
      gl.uniform1f(u.uTime!, input.time);
      gl.uniform1f(u.uNight!, input.night);
      gl.uniform1f(u.uEnergy!, input.energy);
      gl.uniform1f(u.uWhirl!, input.whirl);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    setTone(next) {
      writeTone(gl, u, next);
    },
    resize,
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
