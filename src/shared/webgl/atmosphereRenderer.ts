// The atmosphere's WebGL orchestration — context, programs, meshes,
// per-frame uniform and attribute writes. Framework-free: the hook
// owns DOM reads and the render loop's lifetime; this module owns
// the GL objects and how a frame's numbers become paint.
//
// ogl over Three.js per CONSTELLATION_HORIZON.md §"The Stack": a
// 12KB wrapper that hands us a context and gets out of the way.
// Lazy-imported so only /sky visitors pay for it.
//
// Hot path: render() runs once per frame and mutates pre-allocated
// GL-side buffers in place. The FP exemption in eslint.config.js
// names this file for that reason.

import type { Mesh, OGLRenderingContext, Program, Renderer, Transform } from 'ogl';
import type * as Ogl from 'ogl';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import type { AtmosphericScene } from './atmosphereScene';
import type { SkyPalette } from './palette';
import { blendSkyPalettes } from './palette';
import {
  DOME_FRAGMENT,
  DOME_VERTEX,
  GLOW_FRAGMENT,
  MOTE_FRAGMENT,
  MOTE_VERTEX,
  PIGMENT_FRAGMENT,
  SPRITE_VERTEX,
} from './atmosphereShaders';

/** One frame's inputs. Deliberately mutable: the hook owns a single
 *  instance and rewrites it in place each paint, so the steady-state
 *  loop allocates nothing. */
export interface AtmosphereFrameInput {
  timeSeconds: number;
  /** 0 under reduced motion (drift and twinkle hold), 1 otherwise. */
  motion: number;
  camera: Camera;
  basis: CameraBasis;
  fit: { scale: number; offsetX: number; offsetY: number };
  /** Firmament-layer parallax in normalized screen units. */
  domeShift: { x: number; y: number };
  /** The heavens' current rotation phase in radians. */
  spin: number;
  /** Cursor pool in buffer px + smoothed strength ∈ [0, 1]. */
  pool: { x: number; y: number; strength: number };
  /** Daystar anchor in buffer px. */
  daystar: { x: number; y: number };
  /** Caller-projected star centers (2·N) and eased activation (N). */
  starCenters: Float32Array;
  starActive: Float32Array;
  /** Caller-projected mote centers (2·M). */
  moteCenters: Float32Array;
}

export interface AtmosphereHandles {
  readonly canvas: HTMLCanvasElement;
  setSize(width: number, height: number): void;
  /** Lower the render resolution — the budget's first concession.
   *  PERFORMANCE_BUDGET / CONSTELLATION_HORIZON: the atmospheric
   *  shader simplifies before any structural cut. */
  setDpr(dpr: number): void;
  /** Retarget the palette. Animated over the site's 500ms theme
   *  transition unless `instant`. */
  setPalette(target: SkyPalette, instant: boolean): void;
  render(frame: AtmosphereFrameInput): void;
  dispose(): void;
}

const THEME_FADE_SECONDS = 0.5;
// Halo, mote, and pool extents in viewbox units — scaled to pixels
// through the live fit so the paint keeps its proportion to the
// structural layer at every viewport.
const STAR_HALO_VIEWBOX_RADIUS = 36;
// The day pigment bleed is a tighter mark than the night glow —
// a blot of color, not a luminous field.
const STAR_PIGMENT_VIEWBOX_RADIUS = 15;
const MOTE_VIEWBOX_RADIUS = 3.4;
const POOL_VIEWBOX_RADIUS = 320;

interface PaletteFade {
  from: SkyPalette;
  to: SkyPalette;
  startTime: number | null;
  instant: boolean;
}

// Only the six constructors the atmosphere uses. The dynamic import
// destructures immediately so the bundler tree-shakes the rest of
// ogl out of the lazy chunk (a namespace import would pin the whole
// library, GLTF loaders and all, into the bundle).
type OglModule = Pick<
  typeof Ogl,
  'Renderer' | 'Program' | 'Mesh' | 'Triangle' | 'Geometry' | 'Transform'
>;

function quadGeometry(ogl: OglModule, gl: OGLRenderingContext, instanced: Record<string, unknown>) {
  return new ogl.Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]) },
    index: { data: new Uint16Array([0, 1, 2, 2, 1, 3]) },
    ...instanced,
  });
}

function starAttributes(scene: AtmosphericScene) {
  const n = scene.stars.length;
  const hue = new Float32Array(n);
  const phase = new Float32Array(n);
  const seed = new Float32Array(n);
  const size = new Float32Array(n);
  for (const [i, star] of scene.stars.entries()) {
    hue[i] = star.hueIndex;
    phase[i] = star.twinklePhase;
    seed[i] = (Math.imul(i + 1, 2_654_435_761) >>> 0) / 2 ** 32;
    size[i] = star.sizeVariance;
  }
  return { hue, phase, seed, size };
}

function moteAttributes(scene: AtmosphericScene) {
  const m = scene.motes.length;
  const seed = new Float32Array(m);
  const size = new Float32Array(m);
  for (const [i, mote] of scene.motes.entries()) {
    seed[i] = mote.phase / (Math.PI * 2);
    size[i] = mote.sizeVariance;
  }
  return { seed, size };
}

function paletteUniforms(palette: SkyPalette) {
  return {
    uZenith: { value: [...palette.zenith] },
    uHorizon: { value: [...palette.horizon] },
    uGround: { value: [...palette.ground] },
    uGlowColor: { value: [...palette.glow] },
    uGlowStrength: { value: palette.glowStrength },
    uAccentWarm: { value: [...palette.accents[0]] },
    uAccentRose: { value: [...palette.accents[1]] },
    uAccentViolet: { value: [...palette.accents[2]] },
    uAccentGold: { value: [...palette.accents[3]] },
    uGrain: { value: palette.grain },
    uNight: { value: palette.night },
  };
}

/** ogl types `Program.uniforms` as `Record<string, any>`; this is
 *  the one typed view the writers below go through. Every uniform
 *  this renderer declares carries a number or a number[] value. */
interface UniformSlot {
  value: number | number[];
}

function uniformsOf(program: Program): Record<string, UniformSlot> {
  const typed: Record<string, UniformSlot> = program.uniforms;
  return typed;
}

/** Write a resolved palette into a program's uniform map. Only the
 *  uniforms the program declares are touched. */
function writePalette(program: Program, palette: SkyPalette): void {
  const u = uniformsOf(program);
  const colors: Record<string, readonly number[] | number> = {
    uZenith: palette.zenith,
    uHorizon: palette.horizon,
    uGround: palette.ground,
    uGlowColor: palette.glow,
    uGlowStrength: palette.glowStrength,
    uAccentWarm: palette.accents[0],
    uAccentRose: palette.accents[1],
    uAccentViolet: palette.accents[2],
    uAccentGold: palette.accents[3],
    uGrain: palette.grain,
    uNight: palette.night,
  };
  for (const [name, value] of Object.entries(colors)) {
    const slot = u[name];
    if (!slot) continue;
    if (typeof value === 'number') {
      slot.value = value;
    } else {
      const target = slot.value as number[];
      target[0] = value[0]!;
      target[1] = value[1]!;
      target[2] = value[2]!;
    }
  }
}

function easeTheme(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

interface PassSet {
  readonly renderer: Renderer;
  readonly scene: Transform;
  readonly dome: Mesh;
  readonly pigment: Mesh;
  readonly glow: Mesh;
  readonly motes: Mesh;
}

function resolvePalette(fade: PaletteFade, timeSeconds: number): SkyPalette {
  if (fade.instant) return fade.to;
  fade.startTime ??= timeSeconds;
  const t = Math.min((timeSeconds - fade.startTime) / THEME_FADE_SECONDS, 1);
  if (t >= 1) {
    // Fade complete — collapse to the target so steady-state frames
    // return a reference-stable palette and skip uniform writes.
    fade.instant = true;
    return fade.to;
  }
  return blendSkyPalettes(fade.from, fade.to, easeTheme(t));
}

function buildDomeMesh(ogl: OglModule, gl: OGLRenderingContext, palette: SkyPalette): Mesh {
  return new ogl.Mesh(gl, {
    geometry: new ogl.Triangle(gl),
    program: new ogl.Program(gl, {
      vertex: DOME_VERTEX,
      fragment: DOME_FRAGMENT,
      uniforms: {
        ...paletteUniforms(palette),
        uResolution: { value: [1, 1] },
        uFitScale: { value: 1 },
        uFitOffset: { value: [0, 0] },
        uTime: { value: 0 },
        uMotion: { value: 1 },
        uCamPos: { value: [0, 0, -2.5] },
        uCamRight: { value: [1, 0, 0] },
        uCamUp: { value: [0, 1, 0] },
        uCamFwd: { value: [0, 0, 1] },
        uTanHalfFov: { value: Math.tan(Math.PI / 8) },
        uDomeShift: { value: [0, 0] },
        uSpin: { value: 0 },
        uPool: { value: [0, 0, 0] },
        uPoolRadius: { value: 100 },
        uDaystar: { value: [0, 0] },
      },
      depthTest: false,
      depthWrite: false,
    }),
  });
}

function spriteUniforms(palette: SkyPalette) {
  return {
    uResolution: { value: [1, 1] },
    uTime: { value: 0 },
    uMotion: { value: 1 },
    uRadiusPx: { value: 24 },
    uNight: { value: palette.night },
    uAccentWarm: { value: [...palette.accents[0]] },
    uAccentRose: { value: [...palette.accents[1]] },
    uAccentViolet: { value: [...palette.accents[2]] },
    uAccentGold: { value: [...palette.accents[3]] },
  };
}

/** The two star passes share one instanced geometry; only the
 *  fragment program (pigment by day, glow by night) differs. */
function buildStarMeshes(
  ogl: OglModule,
  gl: OGLRenderingContext,
  scene: AtmosphericScene,
  palette: SkyPalette,
): { pigment: Mesh; glow: Mesh } {
  const stars = starAttributes(scene);
  const n = scene.stars.length;
  const starGeometry = quadGeometry(ogl, gl, {
    aCenter: { instanced: 1, size: 2, data: new Float32Array(n * 2) },
    aHueIndex: { instanced: 1, size: 1, data: stars.hue },
    aPhase: { instanced: 1, size: 1, data: stars.phase },
    aSeed: { instanced: 1, size: 1, data: stars.seed },
    aActive: { instanced: 1, size: 1, data: new Float32Array(n) },
    aSize: { instanced: 1, size: 1, data: stars.size },
  });
  const pigmentProgram = new ogl.Program(gl, {
    vertex: SPRITE_VERTEX,
    fragment: PIGMENT_FRAGMENT,
    uniforms: spriteUniforms(palette),
    transparent: true,
    cullFace: false,
    depthTest: false,
    depthWrite: false,
  });
  pigmentProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const glowProgram = new ogl.Program(gl, {
    vertex: SPRITE_VERTEX,
    fragment: GLOW_FRAGMENT,
    uniforms: spriteUniforms(palette),
    transparent: true,
    cullFace: false,
    depthTest: false,
    depthWrite: false,
  });
  glowProgram.setBlendFunc(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
  return {
    pigment: new ogl.Mesh(gl, { geometry: starGeometry, program: pigmentProgram }),
    glow: new ogl.Mesh(gl, { geometry: starGeometry, program: glowProgram }),
  };
}

function buildMoteMesh(
  ogl: OglModule,
  gl: OGLRenderingContext,
  scene: AtmosphericScene,
  palette: SkyPalette,
): Mesh {
  const moteAttrs = moteAttributes(scene);
  const moteProgram = new ogl.Program(gl, {
    vertex: MOTE_VERTEX,
    fragment: MOTE_FRAGMENT,
    uniforms: {
      uResolution: { value: [1, 1] },
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uRadiusPx: { value: 4 },
      uNight: { value: palette.night },
      uAccentWarm: { value: [...palette.accents[0]] },
    },
    transparent: true,
    cullFace: false,
    depthTest: false,
    depthWrite: false,
  });
  moteProgram.setBlendFunc(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
  return new ogl.Mesh(gl, {
    geometry: quadGeometry(ogl, gl, {
      aCenter: { instanced: 1, size: 2, data: new Float32Array(scene.motes.length * 2) },
      aSeed: { instanced: 1, size: 1, data: moteAttrs.seed },
      aSize: { instanced: 1, size: 1, data: moteAttrs.size },
    }),
    program: moteProgram,
  });
}

/** Yield to the next animation frame (or a macrotask outside a
 *  rendering context) so successive shader compiles never stack
 *  into one long main-thread block. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

async function buildPasses(
  ogl: OglModule,
  renderer: Renderer,
  scene: AtmosphericScene,
  palette: SkyPalette,
): Promise<PassSet> {
  const gl = renderer.gl;
  const root = new ogl.Transform();
  // One program per frame: driver-side shader compilation is the
  // single biggest main-thread block this layer can cause, and it
  // would land during the arrival animation. Spreading the four
  // compiles across frames keeps each under the frame budget.
  const dome = buildDomeMesh(ogl, gl, palette);
  await nextFrame();
  const { pigment, glow } = buildStarMeshes(ogl, gl, scene, palette);
  await nextFrame();
  const motes = buildMoteMesh(ogl, gl, scene, palette);
  // Paint order: the dome is the ground truth, dust behind the
  // halos, pigment beneath glow so the theme crossfade reads as one
  // continuous body of light.
  for (const mesh of [dome, motes, pigment, glow]) mesh.setParent(root);
  return { renderer, scene: root, dome, pigment, glow, motes };
}

function writeFrameUniforms(passes: PassSet, frame: AtmosphereFrameInput): void {
  const du = uniformsOf(passes.dome.program);
  const { camera, basis, fit } = frame;
  du.uTime!.value = frame.timeSeconds;
  du.uMotion!.value = frame.motion;
  du.uFitScale!.value = fit.scale;
  (du.uFitOffset!.value as number[])[0] = fit.offsetX;
  (du.uFitOffset!.value as number[])[1] = fit.offsetY;
  const writeVec3 = (
    slot: { value: number | number[] },
    v: { x: number; y: number; z: number },
  ) => {
    const target = slot.value as number[];
    target[0] = v.x;
    target[1] = v.y;
    target[2] = v.z;
  };
  writeVec3(du.uCamPos!, camera.position);
  writeVec3(du.uCamRight!, basis.right);
  writeVec3(du.uCamUp!, basis.up);
  writeVec3(du.uCamFwd!, basis.forward);
  du.uTanHalfFov!.value = Math.tan(camera.fovY / 2);
  (du.uDomeShift!.value as number[])[0] = frame.domeShift.x;
  (du.uDomeShift!.value as number[])[1] = frame.domeShift.y;
  du.uSpin!.value = frame.spin;
  const pool = du.uPool!.value as number[];
  pool[0] = frame.pool.x;
  pool[1] = frame.pool.y;
  pool[2] = frame.pool.strength;
  du.uPoolRadius!.value = POOL_VIEWBOX_RADIUS * fit.scale;
  (du.uDaystar!.value as number[])[0] = frame.daystar.x;
  (du.uDaystar!.value as number[])[1] = frame.daystar.y;
  for (const mesh of [passes.pigment, passes.glow]) {
    const su = uniformsOf(mesh.program);
    su.uTime!.value = frame.timeSeconds;
    su.uMotion!.value = frame.motion;
    su.uRadiusPx!.value =
      (mesh === passes.pigment ? STAR_PIGMENT_VIEWBOX_RADIUS : STAR_HALO_VIEWBOX_RADIUS) *
      fit.scale;
  }
  const mu = uniformsOf(passes.motes.program);
  mu.uTime!.value = frame.timeSeconds;
  mu.uMotion!.value = frame.motion;
  mu.uRadiusPx!.value = MOTE_VIEWBOX_RADIUS * fit.scale;
}

function writeFrameAttributes(passes: PassSet, frame: AtmosphereFrameInput): void {
  const starGeometry = passes.glow.geometry;
  const aCenter = starGeometry.attributes.aCenter!;
  (aCenter.data as Float32Array).set(frame.starCenters);
  aCenter.needsUpdate = true;
  const aActive = starGeometry.attributes.aActive!;
  (aActive.data as Float32Array).set(frame.starActive);
  aActive.needsUpdate = true;
  const moteCenter = passes.motes.geometry.attributes.aCenter!;
  (moteCenter.data as Float32Array).set(frame.moteCenters);
  moteCenter.needsUpdate = true;
}

/** Create the atmosphere against a probed-good WebGL context. The
 *  caller probes context availability first (so ogl never logs) and
 *  appends the returned canvas itself. */
export async function createAtmosphere(
  scene: AtmosphericScene,
  initialPalette: SkyPalette,
  dpr: number,
): Promise<AtmosphereHandles | null> {
  const { Renderer, Program, Mesh, Triangle, Geometry, Transform } = await import('ogl');
  const ogl: OglModule = { Renderer, Program, Mesh, Triangle, Geometry, Transform };
  let renderer: Renderer;
  try {
    // Opaque, depthless context: the dome repaints every pixel every
    // frame, so the canvas needs no alpha compositing against the
    // page, no depth buffer, and no clear pass.
    renderer = new ogl.Renderer({ alpha: false, depth: false, dpr });
  } catch {
    return null;
  }
  renderer.autoClear = false;
  const passes = await buildPasses(ogl, renderer, scene, initialPalette);
  const fade: PaletteFade = {
    from: initialPalette,
    to: initialPalette,
    startTime: 0,
    instant: true,
  };
  // The most recently resolved palette — the honest "from" when a
  // theme retarget arrives mid-fade. Tracked against the frame
  // clock so the fade never mixes time bases.
  let lastResolved = initialPalette;
  const setResolution = () => {
    const w = renderer.gl.drawingBufferWidth;
    const h = renderer.gl.drawingBufferHeight;
    for (const mesh of [passes.dome, passes.pigment, passes.glow, passes.motes]) {
      const u = uniformsOf(mesh.program);
      const resolution = u.uResolution!.value as number[];
      resolution[0] = w;
      resolution[1] = h;
    }
  };
  return {
    canvas: renderer.gl.canvas,
    setSize(width: number, height: number) {
      renderer.setSize(width || 1, height || 1);
      setResolution();
    },
    setDpr(dpr: number) {
      renderer.dpr = dpr;
    },
    setPalette(target: SkyPalette, instant: boolean) {
      fade.from = lastResolved;
      fade.to = target;
      fade.startTime = null;
      fade.instant = instant;
    },
    render(frame: AtmosphereFrameInput) {
      const palette = resolvePalette(fade, frame.timeSeconds);
      if (palette !== lastResolved) {
        // Palette uniforms change only while a theme fade is live
        // (the blend allocates a fresh object per frame); at rest
        // the reference is stable and the writes are skipped.
        lastResolved = palette;
        for (const mesh of [passes.dome, passes.pigment, passes.glow, passes.motes]) {
          writePalette(mesh.program, palette);
        }
      }
      writeFrameUniforms(passes, frame);
      writeFrameAttributes(passes, frame);
      renderer.render({ scene: passes.scene, sort: false });
    },
    dispose() {
      renderer.gl.canvas.remove();
    },
  };
}
