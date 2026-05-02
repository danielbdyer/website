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

import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { project } from '@/shared/geometry/camera';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { setConstellationCursor } from '@/shared/state/constellationCursor';
import type { NavigableNode } from '@/shared/geometry/wellPhysics';

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

/**
 * Position every star's wrapper group via the data-node-key
 * selector. Behind-camera points (theoretically possible if a node
 * sits on the far side of the sphere from the current camera
 * target) are hidden by a translate-far-offscreen trick rather
 * than added complexity in the DOM.
 *
 * @bigO Time: O(N) per call (one querySelector + one matrix-multiply
 *       + one setAttribute per node). Hot path: called once per
 *       RAF tick. Don't accumulate a stars-by-key cache — the
 *       camera moves every tick so the projection has to rerun
 *       anyway, and the per-tick selector lookup is cheap on the
 *       small node count Stage holds.
 *       Space: O(1).
 */
export function projectStars(
  cameraGroup: SVGGElement,
  nodes: readonly NavigableNode[],
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  for (const node of nodes) {
    const el = cameraGroup.querySelector(`[data-node-key="${node.key}"]`);
    if (!el) continue;
    const proj = projectToViewbox(node.unitPos, camera, basis, viewboxSize);
    el.setAttribute(
      'transform',
      proj.inFront
        ? `translate(${proj.x.toFixed(2)} ${proj.y.toFixed(2)})`
        : 'translate(-9999 -9999)',
    );
  }
}

/**
 * Position every thread's endpoints via the data-thread-id
 * selector. Threads connecting behind-camera endpoints render
 * off-canvas through the same far-offscreen trick.
 *
 * @bigO Time: O(E) per call (one querySelector + two matrix-
 *       multiplies per edge). Hot path: called once per RAF tick
 *       alongside projectStars.
 *       Space: O(1).
 */
export function projectThreads(
  cameraGroup: SVGGElement,
  edges: readonly NavigableEdge[],
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  for (const edge of edges) {
    const el = cameraGroup.querySelector(`[data-thread-id="${edge.id}"]`);
    if (!el) continue;
    const ps = projectToViewbox(edge.sourcePos, camera, basis, viewboxSize);
    const pt = projectToViewbox(edge.targetPos, camera, basis, viewboxSize);
    el.setAttribute('x1', ps.x.toFixed(2));
    el.setAttribute('y1', ps.y.toFixed(2));
    el.setAttribute('x2', pt.x.toFixed(2));
    el.setAttribute('y2', pt.y.toFixed(2));
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
 * @bigO Time: O(TRAIL_LENGTH) per call — fixed at 4. The
 *       querySelector inside the loop is acceptable because the
 *       count is small and the parent group is local.
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
    const trailEl = cameraGroup.querySelector(`[data-companion-trail="${i}"]`);
    i += 1;
    if (!trailEl) continue;
    const proj = projectToViewbox(entry, camera, basis, viewboxSize);
    trailEl.setAttribute('cx', proj.inFront ? proj.x.toFixed(2) : (-9999).toString());
    trailEl.setAttribute('cy', proj.inFront ? proj.y.toFixed(2) : (-9999).toString());
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
