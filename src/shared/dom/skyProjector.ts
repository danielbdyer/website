// The DOM-mutation layer for the constellation surface.
//
// The navigation hook owns physics + state; this module owns the
// per-frame writes to the SVG: positioning stars, threads, the
// companion glyph, the trail ghosts, and the camera yaw, plus the
// CSS-variable channels the glyph reads (--companion-claim,
// --trail-strength). Each function is small, has a narrow data
// dependency, and never reaches into navigation state.
//
// CONSTELLATION_HORIZON.md §"Layer 3: Structural" names the
// commitment: every star is a real DOM `<a>` with focus, aria,
// keyboard tab order. This module keeps that contract honest by
// only ever mutating projected coordinates — never the elements'
// identity, role, or addressability.

import type { Camera, CameraBasis, ProjectedPointMut } from '@/shared/geometry/camera';
import { project, projectInto } from '@/shared/geometry/camera';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { NORTH_POLE } from '@/shared/geometry/sphere';
import { setConstellationCursor } from '@/shared/state/constellationCursor';
import { setSkyCamera } from '@/shared/state/skyCamera';
import type { NavigableNode } from '@/shared/geometry/wellPhysics';
import type { Vec3 } from '@/shared/geometry/sphere';
import type { Axis } from '@/shared/content/constellation';
import { daystarViewboxPoint } from '@/shared/content/skyWalk';
import { chooseLabelSlots, slotOffset, type LabelItem } from './labelLayout';
import { fitViewboxToCanvas } from '@/shared/webgl/atmosphereProjection';

// Per-frame element lookups were the navigation tick's hidden cost:
// ~100 querySelector walks per frame at production density (one per
// star, two-per-thread ids, the trail, the glyph). The cache below
// resolves each selector once per element and revalidates only by
// isConnected — if React remounts a node the stale entry misses and
// the selector runs again for that key alone.
const elementCaches = new WeakMap<Element, Map<string, Element>>();

function cachedElement(root: Element, selector: string): Element | null {
  let cache = elementCaches.get(root);
  if (!cache) {
    cache = new Map();
    elementCaches.set(root, cache);
  }
  const hit = cache.get(selector);
  if (hit?.isConnected) return hit;
  const found = root.querySelector(selector);
  if (found) {
    cache.set(selector, found);
  } else {
    cache.delete(selector);
  }
  return found;
}

// Shared scratch for the per-element projections below — one
// allocation for the module's lifetime instead of two per element
// per tick.
const SCRATCH: ProjectedPointMut = { screenX: 0, screenY: 0, depth: 1, inFront: false };

/** Number of ghost positions trailing the cursor for the companion
 *  glyph's fade-tail. Stage renders this many trail circles; the
 *  hook holds an equal-length history of past positions. Both
 *  sides must agree on the count, so it lives here as the single
 *  source of truth. */
export const TRAIL_LENGTH = 4;

/** Angular speed (rad/s) at which --trail-strength reaches 1. The
 *  trail asserts itself only during real motion; this constant
 *  tunes the threshold. */
export const TRAIL_FULL_SPEED_RAD = 3;

/** An edge in the navigable scene. The hook re-projects each
 *  endpoint per frame and writes the line element's x1/y1/x2/y2
 *  attributes. The id matches the rendered Thread's
 *  data-thread-id. */
export interface NavigableEdge {
  readonly id: string;
  readonly sourcePos: UnitVector3;
  readonly targetPos: UnitVector3;
}

interface ScreenProj {
  readonly x: number;
  readonly y: number;
  readonly inFront: boolean;
}

/** Project a 3D unit-sphere position into viewbox coords. Helper
 *  shared by every per-frame DOM-mutation path. SVG +Y grows down,
 *  screen +Y grows up — the negation handles the convention shift. */
export function projectToViewbox(
  point: UnitVector3,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): ScreenProj {
  const proj = project(point, camera, basis, 1);
  const center = viewboxSize / 2;
  const radius = viewboxSize * 0.44;
  return {
    x: center + proj.screenX * radius,
    y: center - proj.screenY * radius,
    inFront: proj.inFront,
  };
}

/** The frame the sky is drawn in: its box on the page and how the
 *  square viewbox fits it — `cover` for the full-viewport sky
 *  (xMidYMid slice), `contain` otherwise (xMidYMid meet). */
export interface SkyFrame {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly fit: 'cover' | 'contain';
}

/** Inverse of projectToViewbox's screen mapping: a client position →
 *  normalized image coords (±1 at the frustum edge, +y up), through
 *  the viewbox's actual preserveAspectRatio fit. A cover-fit landscape
 *  frame crops the square viewbox top and bottom, so normalizing over
 *  the box's own width and height — as the pointer mapping once did —
 *  stretched x and squeezed y, and every ray-cast named a place some
 *  distance from the one under the pointer. Null when the frame has
 *  no size. */
export function clientToNormalized(
  clientX: number,
  clientY: number,
  frame: SkyFrame,
  viewboxSize: number,
): { x: number; y: number } | null {
  if (frame.width === 0 || frame.height === 0) return null;
  const fit = fitViewboxToCanvas(frame.width, frame.height, viewboxSize, frame.fit);
  const vbX = (clientX - frame.left - fit.offsetX) / fit.scale;
  const vbY = (clientY - frame.top - fit.offsetY) / fit.scale;
  const center = viewboxSize / 2;
  const radius = viewboxSize * 0.44;
  return { x: (vbX - center) / radius, y: -(vbY - center) / radius };
}

/**
 * Position every star's wrapper group via the data-node-key
 * selector. Behind-camera points (theoretically possible if a node
 * sits on the far side of the sphere from the current camera
 * target) are hidden by a translate-far-offscreen trick rather
 * than added complexity in the DOM.
 *
 * @bigO Time: O(N) per call (one cached element lookup + one
 *       matrix-multiply + one setAttribute per node). Hot path:
 *       called once per RAF tick. Element references are cached
 *       per camera-group (revalidated by isConnected); the
 *       projection itself reruns every tick because the camera
 *       moves.
 *       Space: O(N) for the element cache, O(1) per tick.
 */
export function projectStars(
  cameraGroup: SVGGElement,
  nodes: readonly NavigableNode[],
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  const center = viewboxSize / 2;
  const radius = viewboxSize * 0.44;
  for (const node of nodes) {
    const el = cachedElement(cameraGroup, `[data-node-key="${node.key}"]`);
    if (!el) continue;
    projectInto(node.unitPos, camera, basis, 1, SCRATCH);
    el.setAttribute(
      'transform',
      SCRATCH.inFront
        ? `translate(${(center + SCRATCH.screenX * radius).toFixed(2)} ${(center - SCRATCH.screenY * radius).toFixed(2)})`
        : 'translate(-9999 -9999)',
    );
  }
}

/** Position the pole group — the geometric figure and its wash — at
 *  the world's north pole, so the still point stays where the sky
 *  turns rather than riding the center of view. Behind-camera (never,
 *  for a camera under the dome, but honest) parks it offscreen. */
export function projectPole(
  cameraGroup: SVGGElement,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  const el = cachedElement(cameraGroup, '[data-polestar]');
  if (!el) return;
  const proj = projectToViewbox(NORTH_POLE, camera, basis, viewboxSize);
  el.setAttribute(
    'transform',
    proj.inFront
      ? `translate(${proj.x.toFixed(2)} ${proj.y.toFixed(2)})`
      : 'translate(-9999 -9999)',
  );
}

function setEndpoints(el: Element, x1: string, y1: string, x2: string, y2: string): void {
  el.setAttribute('x1', x1);
  el.setAttribute('y1', y1);
  el.setAttribute('x2', x2);
  el.setAttribute('y2', y2);
}

/**
 * Position every thread's endpoints via the data-thread-id selector,
 * and the wide transparent hit twin beside it (data-thread-hit) that
 * makes the hairline able to be hovered and clicked. Threads connecting
 * behind-camera endpoints render off-canvas through the same
 * far-offscreen trick.
 *
 * @bigO Time: O(E) per call (two cached element lookups + two
 *       matrix-multiplies per edge). Hot path: called once per RAF
 *       tick alongside projectStars.
 *       Space: O(E) for the element cache, O(1) per tick.
 */
export function projectThreads(
  cameraGroup: SVGGElement,
  edges: readonly NavigableEdge[],
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  const center = viewboxSize / 2;
  const radius = viewboxSize * 0.44;
  for (const edge of edges) {
    const el = cachedElement(cameraGroup, `[data-thread-id="${edge.id}"]`);
    if (!el) continue;
    projectInto(edge.sourcePos, camera, basis, 1, SCRATCH);
    const sourceInFront = SCRATCH.inFront;
    const x1 = (center + SCRATCH.screenX * radius).toFixed(2);
    const y1 = (center - SCRATCH.screenY * radius).toFixed(2);
    projectInto(edge.targetPos, camera, basis, 1, SCRATCH);
    const x2 = (center + SCRATCH.screenX * radius).toFixed(2);
    const y2 = (center - SCRATCH.screenY * radius).toFixed(2);
    const hit = cachedElement(cameraGroup, `[data-thread-hit="${edge.id}"]`);
    // Standing inside the sphere, a thread with an end behind the
    // camera has no honest line to draw; it parks with the star.
    if (!sourceInFront || !SCRATCH.inFront) {
      setEndpoints(el, '-9999', '-9999', '-9999', '-9999');
      if (hit) setEndpoints(hit, '-9999', '-9999', '-9999', '-9999');
      continue;
    }
    setEndpoints(el, x1, y1, x2, y2);
    if (hit) setEndpoints(hit, x1, y1, x2, y2);
  }
}

/** Position the companion glyph at the cursor's projected screen
 *  position. Returns the projection so the caller can broadcast
 *  the normalized cursor to the firmament shader. */
export function projectGlyph(
  glyph: SVGCircleElement | null,
  cursorPos: UnitVector3,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): ScreenProj {
  const proj = projectToViewbox(cursorPos, camera, basis, viewboxSize);
  if (glyph && proj.inFront) {
    glyph.setAttribute('cx', proj.x.toFixed(2));
    glyph.setAttribute('cy', proj.y.toFixed(2));
  }
  return proj;
}

/**
 * Position each trail ghost via [data-companion-trail="N"]. Ghosts
 * inherit their opacity from CSS (`--trail-strength` multiplied
 * by per-ghost base opacity) so the trail asserts itself only
 * during fast travel.
 *
 * @bigO Time: O(TRAIL_LENGTH) per call — fixed at 4, served from
 *       the element cache.
 *       Space: O(1).
 */
export function projectTrail(
  cameraGroup: SVGGElement,
  history: readonly UnitVector3[],
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  let i = 0;
  for (const entry of history) {
    const trailEl = cachedElement(cameraGroup, `[data-companion-trail="${i}"]`);
    i += 1;
    if (!trailEl) continue;
    const proj = projectToViewbox(entry, camera, basis, viewboxSize);
    trailEl.setAttribute('cx', proj.inFront ? proj.x.toFixed(2) : '-9999');
    trailEl.setAttribute('cy', proj.inFront ? proj.y.toFixed(2) : '-9999');
  }
}

/** Hand the cursor's normalized screen position to the WebGL
 *  firmament so its luminous pool of attention follows the
 *  visitor's surface position rather than the raw pointer.
 *  Normalize: viewbox center → 0, edges → ±1; flip Y for shader
 *  space (shader convention is +y up, SVG is +y down). */
export function broadcastCursorToFirmament(proj: ScreenProj, viewboxSize: number): void {
  const center = viewboxSize / 2;
  setConstellationCursor((proj.x - center) / center, -(proj.y - center) / center, proj.inFront);
}

/** Hand the live camera to the WebGL atmosphere so its dome casts
 *  view rays through the same pinhole the structural projection
 *  uses. Broadcast once per tick alongside the cursor. */
export function broadcastCameraToFirmament(
  camera: Camera,
  basis: CameraBasis,
  travel?: Vec3,
): void {
  setSkyCamera(camera, basis, travel);
}

/** Write the per-frame style channels the companion glyph reads:
 *    --companion-claim — 0 at rest / off-well, 1 at well center.
 *    --trail-strength  — 0 at rest, 1 at fast travel. */
export function writeGlyphChannels(
  glyph: SVGCircleElement | null,
  claim: number,
  speed: number,
): void {
  if (!glyph) return;
  glyph.style.setProperty('--companion-claim', claim.toFixed(3));
  const strength = Math.max(0, Math.min(1, speed / TRAIL_FULL_SPEED_RAD));
  const parent = glyph.parentElement as SVGElement | HTMLElement | null;
  parent?.style.setProperty('--trail-strength', strength.toFixed(3));
}

/** Camera yaw flourish driven by the cursor's screen-space
 *  x-velocity. Bounded so it never reads as tilt. Phase D2's
 *  retired screen-space pan replaced by orbital camera; yaw is
 *  the small remnant. */
export function applyCameraYaw(el: SVGGElement, yaw: number): void {
  el.style.setProperty('--cam-yaw', yaw.toFixed(2));
}

/** Letter the compass — each axis's name at its bearing on the rim
 *  (Axis.rim, constellation.ts) — so the words turn with the heavens.
 *  Behind-camera names park offscreen. */
export function projectCompass(
  cameraGroup: SVGGElement,
  axes: readonly Axis[],
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  for (const axis of axes) {
    const el = cachedElement(cameraGroup, `[data-compass="${axis.id}"]`);
    if (!el) continue;
    const proj = projectToViewbox(axis.rim, camera, basis, viewboxSize);
    el.setAttribute('x', proj.inFront ? proj.x.toFixed(2) : '-9999');
    el.setAttribute('y', proj.inFront ? proj.y.toFixed(2) : '-9999');
  }
}

/**
 * Lay the labels out so none sits on another or on a star
 * (labelLayout.chooseLabelSlots), and write each label's anchor. The
 * first keys in `named` are the labels visible at rest, in priority
 * order; every other star's label gets a slot clear of those for when
 * hover shows it. Runs on arrival and at the idle cadence — not a
 * per-frame path.
 *
 * @bigO Time: O(N) projections + the layout's O(N · S · (K + N)).
 */
export function placeLabels(
  cameraGroup: SVGGElement,
  named: readonly string[],
  nodes: readonly NavigableNode[],
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  const labelOf = (key: string) =>
    cachedElement(cameraGroup, `[data-node-key="${key}"] .constellation-star__label`);
  const namedSet = new Set(named);
  const ordered = [...named, ...nodes.map((n) => n.key).filter((k) => !namedSet.has(k))];
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const items: LabelItem[] = ordered.flatMap((key) => {
    const node = byKey.get(key);
    const el = labelOf(key);
    if (!node || !el) return [];
    const proj = projectToViewbox(node.unitPos, camera, basis, viewboxSize);
    if (!proj.inFront) return [];
    return [{ key, x: proj.x, y: proj.y, chars: (el.textContent ?? '').length }];
  });
  const slots = chooseLabelSlots(items, named.length);
  const byItem = new Map(items.map((item) => [item.key, item]));
  for (const [key, side] of slots) {
    const el = labelOf(key) as SVGTextElement | null;
    const item = byItem.get(key);
    if (!el || !item) continue;
    // A translate, not x/y: CSS carries a change of side as a glide.
    const { dx, dy } = slotOffset(item, side);
    el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  }
}

/** Mark (or clear) the thread the visitor is scrubbing along by drag,
 *  so CSS can light it end to end while the hand holds it. */
export function markTrack(cameraGroup: SVGGElement, threadId: string | null): void {
  const previous = cameraGroup.querySelector('[data-thread][data-track]');
  previous?.removeAttribute('data-track');
  if (threadId === null) return;
  const next = cachedElement(cameraGroup, `[data-thread="${threadId}"]`);
  next?.setAttribute('data-track', 'true');
}

/** Seat the daystar on the page in the frame's upper right — the
 *  plate's corner emblem — wherever the live frame puts that corner.
 *  Writes the wrapper's transform; the WebGL atmosphere reads it back
 *  for the glow and the page light. */
export function projectDaystar(
  svg: SVGSVGElement | null,
  viewboxSize: number,
  fit: 'cover' | 'contain',
): void {
  if (!svg) return;
  const el = cachedElement(svg, '[data-daystar]');
  if (!el) return;
  const rect = svg.getBoundingClientRect();
  const p = daystarViewboxPoint(rect.width, rect.height, viewboxSize, fit);
  el.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
}
