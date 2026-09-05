import { getConstellationGraph } from '@/shared/content/constellation';
import { daystarViewboxPoint } from '@/shared/content/skyWalk';
import { readReveal, registerBackdropPitcher, skyPitchFor } from '@/shared/dom/lookUp';
import type { CameraBasis } from '@/shared/geometry/camera';
import { heavensPhase } from '@/shared/geometry/heavens';
import { rotateAboutAxis, type UnitVector3, type Vec3 } from '@/shared/geometry/sphere';
import { warmDaystarMagic } from '@/shared/hooks/useDaystarMagic';
import { atmosphereDpr } from '@/shared/hooks/useWebGLFirmament';
import { VIEWBOX } from '@/shared/organisms/Constellation/layout';
import { getSkyCamera } from '@/shared/state/skyCamera';
import { IDENTITY_AFFINE, fitViewboxToCanvas, projectPointsToCanvas } from './atmosphereProjection';
import type { AtmosphereFrameInput, AtmosphereHandles } from './atmosphereRenderer';
import { buildAtmosphericScene, type AtmosphericScene } from './atmosphereScene';
import { buildSkyPalette } from './palette';
import { holdAtmosphere, prepareAtmosphere, shouldRenderWebGL } from './warmAtmosphere';

// Make the sky ahead of its mount (hooks/useSkyReadiness.ts): the
// graph, its scene, and the atmosphere prepared for it — context,
// programs, and all — painted once and set into the Foyer's
// backdrop, so the pull reveals the sky itself behind the turning
// room and the look-up adopts that very canvas (the seventh pass,
// with Danny: *it should be pre-mounted, so there's no jank*). Plus
// the magic's chunk. Fetched lazily itself, so the Foyer's own path
// carries none of this.
//
// The eighth pass: the backdrop is a dome, not a picture. Its camera
// is the sky's own, pitched down by the whole lift at the Foyer's
// rest, and the Foyer turns it up with each reveal (dom/lookUp.ts) —
// so the heavens the room falls away from are the heavens the eye
// arrives in, turning about the same eye at the same rate.

function unit(v: Vec3): UnitVector3 {
  const m = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / m, y: v.y / m, z: v.z / m };
}

/** The camera's basis tilted back about its own right — the eye
 *  looking up by `pitch` (radians, up positive). The basis is a
 *  right-handed frame with right = up × forward, so a positive turn
 *  about right takes forward toward down; up is the negative turn. */
function pitched(basis: CameraBasis, pitch: number): CameraBasis {
  if (pitch === 0) return basis;
  return {
    right: basis.right,
    forward: unit(rotateAboutAxis(basis.forward, basis.right, -pitch)),
    up: unit(rotateAboutAxis(basis.up, basis.right, -pitch)),
  };
}

/** One frame of the sky at rest, seen at a pitch: the camera where
 *  it stands at the pole, tilted; the heavens at the wall clock's
 *  phase; nothing attended, everything present; the daystar in its
 *  corner. */
function restFrame(
  scene: AtmosphericScene,
  width: number,
  height: number,
  dpr: number,
  pitch: number,
): AtmosphereFrameInput {
  const { camera, basis: level } = getSkyCamera();
  const basis = pitched(level, pitch);
  const inner = fitViewboxToCanvas(width, height, VIEWBOX, 'cover');
  const fit = {
    scale: inner.scale * dpr,
    offsetX: inner.offsetX * dpr,
    offsetY: inner.offsetY * dpr,
  };
  const starCenters = new Float32Array(scene.stars.length * 2);
  const moteCenters = new Float32Array(scene.motes.length * 2);
  projectPointsToCanvas(
    scene.stars.map((star) => star.unitPosition),
    camera,
    basis,
    IDENTITY_AFFINE,
    fit,
    VIEWBOX,
    starCenters,
  );
  projectPointsToCanvas(
    scene.motes.map((mote) => mote.basePosition),
    camera,
    basis,
    IDENTITY_AFFINE,
    fit,
    VIEWBOX,
    moteCenters,
  );
  const seat = daystarViewboxPoint(width, height, VIEWBOX, 'cover');
  return {
    timeSeconds: 0,
    motion: 1,
    camera,
    basis,
    fit,
    domeShift: { x: 0, y: 0 },
    spin: heavensPhase(Date.now()),
    travel: { x: 0, y: 0, z: 0 },
    pool: { x: 0, y: 0, strength: 0 },
    daystar: { x: fit.offsetX + seat.x * fit.scale, y: fit.offsetY + seat.y * fit.scale },
    starCenters,
    starActive: new Float32Array(scene.stars.length),
    starPresence: Float32Array.from({ length: scene.stars.length }, () => 1),
    moteCenters,
  };
}

/** Paint the prepared sky at the viewport's size, turned to the
 *  reveal's pitch. */
function paintAt(handles: AtmosphereHandles, scene: AtmosphericScene, reveal: number): void {
  const width = globalThis.innerWidth || 1;
  const height = globalThis.innerHeight || 1;
  handles.setSize(width, height);
  handles.render(restFrame(scene, width, height, atmosphereDpr(), skyPitchFor(reveal)));
}

/** Paint the prepared sky at the room's current reveal (rest, unless
 *  a descent is settling) and set its canvas into the backdrop behind
 *  the room, if the room has one; then let the Foyer turn it. The
 *  turning stops being the backdrop's the moment the look-up adopts
 *  the canvas — the sky drives it then. */
function setIntoBackdrop(handles: AtmosphereHandles, scene: AtmosphericScene): void {
  const backdrop = document.querySelector<HTMLElement>('.sky-backdrop');
  if (!backdrop) return;
  paintAt(handles, scene, readReveal());
  const canvas = handles.canvas;
  canvas.dataset.prepared = 'true';
  backdrop.replaceChildren(canvas);
  let painted = readReveal();
  registerBackdropPitcher((reveal) => {
    if (!canvas.closest('.sky-backdrop')) return;
    // A spring's tail writes reveals a hair apart; below a twentieth of
    // a degree the dome does not repaint for them.
    if (Math.abs(reveal - painted) < 0.003) return;
    painted = reveal;
    paintAt(handles, scene, reveal);
  });
}

export async function readySky(): Promise<void> {
  warmDaystarMagic();
  // The seat's character (layout/DaystarSeat.tsx) is the sky's own
  // molecule behind a default-export facade; its chunk is fetched here
  // with the rest, so the seat holds it at once when a look-up begins.
  void import('@/shared/molecules/Daystar/character');
  if (!shouldRenderWebGL()) return;
  const graph = await getConstellationGraph();
  const scene = buildAtmosphericScene(graph);
  const root = document.documentElement;
  const readToken = (token: string) => getComputedStyle(root).getPropertyValue(token);
  const palette = buildSkyPalette(readToken, root.classList.contains('dk'));
  const handles = await prepareAtmosphere(scene, palette, atmosphereDpr());
  if (handles) setIntoBackdrop(handles, scene);
}

/** The sky's own atmosphere, handed back on the way down
 *  (hooks/useWebGLFirmament.ts): held as prepared for the next
 *  readiness, set into the backdrop behind the settling room, and
 *  turned with its reveal — the descent as the ascent in reverse, on
 *  the very same canvas. */
export function keepSkyForDescent(handles: AtmosphereHandles, scene: AtmosphericScene): void {
  holdAtmosphere(scene, handles);
  setIntoBackdrop(handles, scene);
}
