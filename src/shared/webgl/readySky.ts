import { getConstellationGraph } from '@/shared/content/constellation';
import { daystarViewboxPoint } from '@/shared/content/skyWalk';
import { heavensPhase } from '@/shared/geometry/heavens';
import { warmDaystarMagic } from '@/shared/hooks/useDaystarMagic';
import { atmosphereDpr } from '@/shared/hooks/useWebGLFirmament';
import { VIEWBOX } from '@/shared/organisms/Constellation/layout';
import { getSkyCamera } from '@/shared/state/skyCamera';
import { IDENTITY_AFFINE, fitViewboxToCanvas, projectPointsToCanvas } from './atmosphereProjection';
import type { AtmosphereFrameInput, AtmosphereHandles } from './atmosphereRenderer';
import { buildAtmosphericScene, type AtmosphericScene } from './atmosphereScene';
import { buildSkyPalette } from './palette';
import { prepareAtmosphere, shouldRenderWebGL } from './warmAtmosphere';

// Make the sky ahead of its mount (hooks/useSkyReadiness.ts): the
// graph, its scene, and the atmosphere prepared for it — context,
// programs, and all — painted once at rest and set into the Foyer's
// backdrop, so the pull reveals the sky itself behind the tilting
// room and the look-up adopts that very canvas (the seventh pass,
// with Danny: *it should be pre-mounted, so there's no jank*). Plus
// the magic's chunk. Fetched lazily itself, so the Foyer's own path
// carries none of this.

/** One frame of the sky at rest: the camera where it stands at the
 *  pole, the heavens at the wall clock's phase, nothing attended,
 *  everything present, the daystar in its corner. */
function restFrame(
  scene: AtmosphericScene,
  width: number,
  height: number,
  dpr: number,
): AtmosphereFrameInput {
  const { camera, basis } = getSkyCamera();
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

/** Paint the prepared sky once, at the viewport's size, and set its
 *  canvas into the backdrop behind the room, if the room has one. */
function setIntoBackdrop(handles: AtmosphereHandles, scene: AtmosphericScene): void {
  const backdrop = document.querySelector<HTMLElement>('.sky-backdrop');
  if (!backdrop) return;
  const width = globalThis.innerWidth || 1;
  const height = globalThis.innerHeight || 1;
  handles.setSize(width, height);
  handles.render(restFrame(scene, width, height, atmosphereDpr()));
  const canvas = handles.canvas;
  canvas.dataset.prepared = 'true';
  backdrop.replaceChildren(canvas);
}

export async function readySky(): Promise<void> {
  warmDaystarMagic();
  if (!shouldRenderWebGL()) return;
  const graph = await getConstellationGraph();
  const scene = buildAtmosphericScene(graph);
  const root = document.documentElement;
  const readToken = (token: string) => getComputedStyle(root).getPropertyValue(token);
  const palette = buildSkyPalette(readToken, root.classList.contains('dk'));
  const handles = await prepareAtmosphere(scene, palette, atmosphereDpr());
  if (handles) setIntoBackdrop(handles, scene);
}
