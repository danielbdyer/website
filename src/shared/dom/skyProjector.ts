// The DOM-mutation layer for the constellation surface.
//
// The navigation hook owns physics + state; this module owns the
// per-frame writes to the SVG: positioning stars, threads, and
// scaling each star by its depth so the back hemisphere falls
// away from the visitor as the camera rotates around the globe.
// Each function is small, has a narrow data dependency, and never
// reaches into navigation state.
//
// CONSTELLATION_HORIZON.md §"Layer 3: Structural" names the
// commitment: every star is a real DOM `<a>` with focus, aria,
// keyboard tab order. This module keeps that contract honest by
// only ever mutating projected coordinates — never the elements'
// identity, role, or addressability.

import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { project } from '@/shared/geometry/camera';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { setAtmosphericStarPosition } from '@/shared/state/atmosphericScene';
import type { NavigableNode } from '@/shared/geometry/wellPhysics';

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
 *  screen +Y grows up — the negation handles the convention shift.
 *
 *  The radius factor (0.36) leaves margin around the sphere's
 *  silhouette so the visitor can read the backing shape — the
 *  globe sits inside the frame rather than cropping at the
 *  edges. Pair with the sphere-boundary ring in Stage which
 *  marks the silhouette at the same projected radius. */
const SPHERE_PROJECTION_RADIUS_FACTOR = 0.36;

export function projectToViewbox(
  point: UnitVector3,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): ScreenProj {
  const proj = project(point, camera, basis, 1);
  const center = viewboxSize / 2;
  const radius = viewboxSize * SPHERE_PROJECTION_RADIUS_FACTOR;
  return {
    x: center + proj.screenX * radius,
    y: center - proj.screenY * radius,
    inFront: proj.inFront,
  };
}

/** The sphere's projected silhouette radius in viewbox units. The
 *  Stage paints a faint ring at this radius so the visitor reads
 *  the backing globe — without it, the rotating stars look like
 *  scattered points without context. */
export const SPHERE_VIEWBOX_RADIUS_FACTOR = SPHERE_PROJECTION_RADIUS_FACTOR;

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
  selectorAttr: 'data-node-key' | 'data-thread-id' | 'data-bg-id',
  keys: readonly string[],
): ElementCache {
  const cache = new Map<string, Element>();
  for (const key of keys) {
    const el = cameraGroup.querySelector(`[${selectorAttr}="${key}"]`);
    if (el) cache.set(key, el);
  }
  return cache;
}

/** Depth-driven scale + opacity for the trackball's 3D-globe feel.
 *  A star on the near hemisphere (dot ≈ 1) renders at full scale and
 *  opacity; a star on the far hemisphere (dot ≈ -1) shrinks toward
 *  ~0.5× and fades toward ~0.15. Computed on the CPU once per star
 *  per frame and written as a CSS variable on the wrapper group so
 *  CSS handles the visual cascade — atom CSS combines depth with
 *  active/hover/preview state without the projector knowing about
 *  any of them. */
const NEAR_SCALE = 1;
const FAR_SCALE = 0.45;
const NEAR_OPACITY = 1;
const FAR_OPACITY = 0.18;

interface DepthVisuals {
  readonly scale: number;
  readonly opacity: number;
}

function depthVisuals(starPos: UnitVector3, cameraDirection: UnitVector3): DepthVisuals {
  // Front-facing factor = dot product of star position with the
  // camera-look-at direction. +1 = directly in front (closest); -1 =
  // directly behind (farthest, on the back hemisphere from the visitor).
  const dot =
    starPos.x * cameraDirection.x + starPos.y * cameraDirection.y + starPos.z * cameraDirection.z;
  const t = (dot + 1) / 2;
  return {
    scale: FAR_SCALE + (NEAR_SCALE - FAR_SCALE) * t,
    opacity: FAR_OPACITY + (NEAR_OPACITY - FAR_OPACITY) * t,
  };
}

/**
 * Position every star's wrapper group via the data-node-key
 * selector, scaled and faded by its depth on the latent sphere
 * (the dot product of the star's unit position with the camera's
 * look-at direction). Behind-camera points (theoretically possible
 * if a node sits on the far side of the sphere from the current
 * camera target) are hidden by a translate-far-offscreen trick
 * rather than added complexity in the DOM.
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
 *       two setAttribute + one setProperty + one buffer write per
 *       node, plus one sin/cos at the head of the call). The cache
 *       argument is the hook's ElementCache, populated once on graph
 *       change; falling back to querySelector on cache miss keeps
 *       the path correct across the single transient frame between a
 *       graph edit and the cache rebuild. Hot path: called once per
 *       RAF tick.
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
  // Camera-look-at direction = -forward (forward points from camera
  // toward target; the visitor's gaze direction is the opposite).
  // The depth dot product uses this so that a star at the look-at
  // surface point reads as fully foreground.
  const camDir: UnitVector3 = {
    x: -basis.forward.x,
    y: -basis.forward.y,
    z: -basis.forward.z,
  };
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
    const visuals = depthVisuals(node.unitPos, camDir);
    // Per-star magnitude (default 1) composes with the depth scale.
    // Magnitude is a stable hash-derived value carried in the
    // navigable node — bright "named" stars at ~1.4×, most quieter
    // — so the field has visual hierarchy without coordination.
    const magnitude = node.magnitude ?? 1;
    const finalScale = visuals.scale * magnitude;
    el.setAttribute(
      'transform',
      proj.inFront
        ? `translate(${proj.x.toFixed(2)} ${proj.y.toFixed(2)}) scale(${finalScale.toFixed(3)})`
        : 'translate(-9999 -9999)',
    );
    // Opacity flows through a CSS variable so atom CSS can combine
    // depth with state (active brighten, preview dim, etc.) without
    // this layer knowing about any of them.
    (el as SVGGElement).style.setProperty('--star-depth-opacity', visuals.opacity.toFixed(3));
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

/** A background-star position the projector iterates over. The id
 *  matches the BackgroundStarfield atom's data-bg-id; unitPos lives
 *  on the unit sphere (Fibonacci spiral distribution). */
export interface NavigableBackgroundStar {
  readonly id: string;
  readonly unitPos: UnitVector3;
}

/**
 * Position every background star's wrapper group. Simpler than
 * projectStars: no depth-opacity (background dots don't need
 * cascading state), no scale (small dots stay small), no broadcast
 * to the WebGL scene buffer (background stars don't drive shader
 * halos). Just translate to the projected position, or off-screen
 * if behind the camera.
 *
 * @bigO Time: O(B) per call (one cache.get + one matrix-multiply +
 *       one setAttribute per star). Hot path: called once per RAF
 *       tick. Background star count is fixed at module load (120
 *       in the current set), so this is bounded constant.
 *       Space: O(1).
 */
export function projectBackgroundStars(
  cameraGroup: SVGGElement,
  stars: readonly NavigableBackgroundStar[],
  cache: ElementCache,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): void {
  for (const star of stars) {
    const el = cache.get(star.id) ?? cameraGroup.querySelector(`[data-bg-id="${star.id}"]`);
    if (!el) continue;
    const proj = projectToViewbox(star.unitPos, camera, basis, viewboxSize);
    el.setAttribute(
      'transform',
      proj.inFront
        ? `translate(${proj.x.toFixed(2)} ${proj.y.toFixed(2)})`
        : 'translate(-9999 -9999)',
    );
  }
}
