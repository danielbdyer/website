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
import { setAtmosphericStarPosition } from '@/shared/state/atmosphericScene';
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

/** Period of the SVG's CSS-driven `.constellation-rotates` 600s spin
 *  in milliseconds. The projector reads the wall clock to compute
 *  the same rotation angle CSS is currently applying and pre-rotates
 *  the broadcast positions so the shader can paint without doing
 *  the rotation per-pixel. Keeping the periods paired here and in
 *  tokens.css §"constellation-spin" is load-bearing: if one moves
 *  the other moves with it. */
const ROTATION_PERIOD_MS = 600_000;

/** A cached lookup map from data-node-key / data-thread-id to the
 *  rendered SVG element. The hook builds this once on mount + on
 *  graph change (the only times the underlying DOM identity shifts);
 *  the per-frame projectors look up by .get() rather than re-running
 *  cameraGroup.querySelector on every node and every edge. On the
 *  heavy fixture (40 stars + 469 threads × 60fps ≈ 30 thousand
 *  selectors per second) this is the difference between a smooth
 *  iPhone interaction and a stuttering one. */
export type ElementCache = ReadonlyMap<string, Element>;

/** Build the lookup map for a node/edge collection. Re-call when the
 *  DOM identity of the children changes (i.e. when the underlying
 *  graph changes); React keeps element identity stable for the same
 *  key, so the cache stays valid across re-renders driven by
 *  hover/active-state changes. */
export function buildElementCache(
  cameraGroup: SVGGElement,
  selectorAttr: 'data-node-key' | 'data-thread-id',
  keys: readonly string[],
): ElementCache {
  const cache = new Map<string, Element>();
  for (const key of keys) {
    const el = cameraGroup.querySelector(`[${selectorAttr}="${key}"]`);
    if (el) cache.set(key, el);
  }
  return cache;
}

/**
 * Position every star's wrapper group via the data-node-key
 * selector. Behind-camera points (theoretically possible if a node
 * sits on the far side of the sphere from the current camera
 * target) are hidden by a translate-far-offscreen trick rather
 * than added complexity in the DOM.
 *
 * Each star's *post-rotation* normalized cursor-space position is
 * also broadcast to the atmospheric scene buffer. The SVG transform
 * itself stays pre-rotation (CSS handles the rotation cheaply on
 * the GPU compositor); the broadcast applies the same rotation
 * angle on the CPU once per frame, so the shader receives positions
 * already rotated and avoids 40+ trig calls per pixel. Wall-clock
 * sync (vs. coupling the two paths to a shared loop) keeps the
 * SVG and shader within a single frame of each other — invisible
 * at 0.6°/sec rotation.
 *
 * @bigO Time: O(N) per call (one cache.get + one matrix-multiply +
 *       one setAttribute + one buffer write per node, plus one
 *       sin/cos at the head of the call). The cache argument is the
 *       hook's ElementCache, populated once on graph change; falling
 *       back to querySelector on cache miss keeps the path correct
 *       across the single transient frame between a graph edit and
 *       the cache rebuild. Hot path: called once per RAF tick.
 *       Space: O(1) per call (the cache itself is O(N), held by the
 *       hook, not allocated here).
 */
export function projectStars(
  cameraGroup: SVGGElement,
  nodes: readonly NavigableNode[],
  cache: ElementCache,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  const center = viewboxSize / 2;
  const rotation = ((performance.now() % ROTATION_PERIOD_MS) / ROTATION_PERIOD_MS) * Math.PI * 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  let i = 0;
  for (const node of nodes) {
    // Cache miss falls back to a live querySelector so a stale cache
    // (a graph change the hook hasn't seen yet) degrades to slow
    // rather than to broken. The fallback path runs only on the
    // tick after a graph change and is single-frame transient.
    const el = cache.get(node.key) ?? cameraGroup.querySelector(`[data-node-key="${node.key}"]`);
    if (!el) {
      i += 1;
      continue;
    }
    const proj = projectToViewbox(node.unitPos, camera, basis, viewboxSize);
    el.setAttribute(
      'transform',
      proj.inFront
        ? `translate(${proj.x.toFixed(2)} ${proj.y.toFixed(2)})`
        : 'translate(-9999 -9999)',
    );
    // Broadcast to the WebGL firmament. Behind-camera nodes get
    // far-offscreen normalized coords (the shader's halo falloff
    // zeros at any distance > ~0.5 in cursor-space, so a value of
    // ±20 paints nothing). The SVG y-axis flip (+y down → +y up)
    // is folded into the rotation by negating dy first.
    if (proj.inFront) {
      const dx = (proj.x - center) / center;
      const dy = -(proj.y - center) / center;
      setAtmosphericStarPosition(i, dx * cosR - dy * sinR, dx * sinR + dy * cosR);
    } else {
      setAtmosphericStarPosition(i, 20, 20);
    }
    i += 1;
  }
}

/**
 * Position every thread's endpoints via the data-thread-id
 * selector. Threads connecting behind-camera endpoints render
 * off-canvas through the same far-offscreen trick.
 *
 * @bigO Time: O(E) per call (one cache.get + two matrix-multiplies
 *       per edge). The cache argument is the hook's ElementCache,
 *       populated once on graph change. Hot path: called once per
 *       RAF tick alongside projectStars. Edge count dominates star
 *       count once a corpus has crossed ~10 facet-sharing works,
 *       so this is the per-frame cost that grows fastest.
 *       Space: O(1) per call.
 */
export function projectThreads(
  cameraGroup: SVGGElement,
  edges: readonly NavigableEdge[],
  cache: ElementCache,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  for (const edge of edges) {
    const el = cache.get(edge.id) ?? cameraGroup.querySelector(`[data-thread-id="${edge.id}"]`);
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
