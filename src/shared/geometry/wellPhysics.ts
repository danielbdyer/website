// Pure helpers for the constellation's well-field navigation.
//
// Each star is a gravity well — a tangent attractor force that
// falls off with geodesic distance. This module holds the math:
// the well-force summation, the nearest-node search, the keyboard
// neighbor lookup, the tangent-direction synthesis, and the flick
// velocity from a recent sample window. Plus the easing curve the
// demonstration drift slerps along.
//
// Naming note: in the design lexicon "basin" is the editorial
// cluster — a named gathering of stars. The per-star physics here
// is the *well* each star carries; the cluster meaning lives at
// the chrome layer. CONSTELLATION_DESIGN.md §"Constellation
// Lexicon" flagged the collision; this module owns the *well* side
// of the rename. CONSTELLATION_IMPLEMENTATION_AUDIT.md §"Code-design
// vocabulary drift" closes the gap.

import type { CameraBasis } from '@/shared/geometry/camera';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import {
  NORTH_POLE,
  geodesicDistance,
  projectOntoTangentPlane,
  tangentTowards,
} from '@/shared/geometry/sphere';

/** A node the cursor can settle into. The hook holds a list of
 *  these and re-projects each per frame; the well-field summation
 *  reads this shape. */
export interface NavigableNode {
  readonly key: string;
  readonly unitPos: UnitVector3;
  /** Per-star scale magnitude. The projector composes this with the
   *  depth-driven scale factor so stars carry visual hierarchy: some
   *  bright "named" stars at ~1.4×, most quieter at ~0.8-1.0×.
   *  Defaults to 1 if absent. Stable per slug — derived from the
   *  same hash that drives the twinkle phase. */
  readonly magnitude?: number;
}

/** Force-field constants in spherical units. Position is a unit
 *  vector on the sphere; "distance" is geodesic (radians along
 *  great circle). Velocity is angular (rad/s). */
export const INFLUENCE_RADIUS_RAD = 0.7;
export const WELL_RADIUS_RAD = 0.3;
export const WELL_STIFFNESS = 9;
export const MAX_ANGULAR_VELOCITY = 8;
export const VELOCITY_SAMPLE_WINDOW_MS = 120;

/** A single pointer sample taken during a drag. The flick velocity
 *  is computed over a recent window of these on pointer release. */
export interface PointerSample {
  time: number;
  pos: UnitVector3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * The closest node by geodesic distance, or null when nothing is
 * within `maxRadians`. Filters by dot product (cheap) before
 * computing the geodesic (acos), since the two are monotonically
 * related on the unit sphere — so the expensive call only runs for
 * the eventual best match.
 *
 * @bigO Time: O(N) — single pass over the node list with one
 *       multiply-add and one compare per node, plus exactly one
 *       acos for the winner. Hot path: this runs once per RAF tick
 *       from useConstellationNavigation.tick. Don't add a sort, a
 *       second pass, or a per-node trig call.
 *       Space: O(1).
 */
export function geodesicNearestNode(
  cursor: UnitVector3,
  nodes: readonly NavigableNode[],
  maxRadians = Math.PI,
): { key: string; distance: number } | null {
  // d ≤ maxRadians ⇔ cos(d) ≥ cos(maxRadians) ⇔ dot ≥ minDot.
  const minDot = maxRadians >= Math.PI ? -1 : Math.cos(maxRadians);
  let bestKey: string | null = null;
  let bestDot = -2; // strictly below any real dot value
  for (const node of nodes) {
    const dot = cursor.x * node.unitPos.x + cursor.y * node.unitPos.y + cursor.z * node.unitPos.z;
    if (dot < minDot) continue;
    if (dot <= bestDot) continue;
    bestDot = dot;
    bestKey = node.key;
  }
  if (bestKey === null) return null;
  return { key: bestKey, distance: Math.acos(clamp(bestDot, -1, 1)) };
}

/**
 * Sum of tangent attractor forces at `pos` from every node within
 * `influenceRadius` (radians). Each contribution is a unit tangent
 * pointing toward the node, scaled by stiffness * shape(d) where
 * shape is linear in geodesic distance and zero at the influence
 * rim. The result is a tangent vector at `pos` — perpendicular to
 * it by construction.
 *
 * @bigO Time: O(N) — single pass, with the dot-product filter
 *       (one multiply-add) gating the expensive acos / tangent
 *       work. Hot path: runs once per RAF tick. Don't add a
 *       distance-matrix precompute (the per-tick cursor moves;
 *       the matrix would have to rebuild) or a per-node memoized
 *       acos (already gated by the dot test).
 *       Space: O(1) — fx/fy/fz accumulators only.
 */
export function sphericalWellForce(
  pos: UnitVector3,
  nodes: readonly NavigableNode[],
  influenceRadius = INFLUENCE_RADIUS_RAD,
  stiffness = WELL_STIFFNESS,
): Vec3 {
  // dot ≥ minDot ⇔ geodesic ≤ influenceRadius. The dot test is a
  // single multiply-add per node; full geodesicDistance only fires
  // for nodes inside the well's reach.
  const minDot = influenceRadius >= Math.PI ? -1 : Math.cos(influenceRadius);
  let fx = 0;
  let fy = 0;
  let fz = 0;
  for (const node of nodes) {
    const dot = pos.x * node.unitPos.x + pos.y * node.unitPos.y + pos.z * node.unitPos.z;
    if (dot < minDot) continue;
    const d = geodesicDistance(pos, node.unitPos);
    if (d <= 1e-12) continue;
    const tangent = tangentTowards(pos, node.unitPos);
    const shape = 1 - d / influenceRadius;
    const magnitude = stiffness * d * shape;
    fx += tangent.x * magnitude;
    fy += tangent.y * magnitude;
    fz += tangent.z * magnitude;
  }
  return { x: fx, y: fy, z: fz };
}

/** Tangent direction at `pos` synthesized from held arrow keys.
 *  Up/down map to ±camera-up projected onto the tangent plane;
 *  left/right map to ±camera-right. The result is normalized so
 *  pressing two keys diagonally produces unit-magnitude direction. */
export function tangentHoldDirection(
  heldKeys: ReadonlySet<string>,
  basis: CameraBasis,
  pos: UnitVector3,
): Vec3 {
  let upWeight = 0;
  let rightWeight = 0;
  if (heldKeys.has('ArrowUp')) upWeight += 1;
  if (heldKeys.has('ArrowDown')) upWeight -= 1;
  if (heldKeys.has('ArrowRight')) rightWeight += 1;
  if (heldKeys.has('ArrowLeft')) rightWeight -= 1;
  if (upWeight === 0 && rightWeight === 0) return { x: 0, y: 0, z: 0 };
  // Compose then re-tangent (project off the radial component) and
  // normalize so the magnitude is 1 regardless of how the basis
  // happens to align with the tangent plane.
  const wx = basis.up.x * upWeight + basis.right.x * rightWeight;
  const wy = basis.up.y * upWeight + basis.right.y * rightWeight;
  const wz = basis.up.z * upWeight + basis.right.z * rightWeight;
  const tangent = projectOntoTangentPlane({ x: wx, y: wy, z: wz }, pos);
  const m = Math.hypot(tangent.x, tangent.y, tangent.z);
  if (m < 1e-9) return { x: 0, y: 0, z: 0 };
  return { x: tangent.x / m, y: tangent.y / m, z: tangent.z / m };
}

/** The gesture's release angular velocity, computed from pointer
 *  samples within the last `windowMs`. The result is a tangent
 *  vector at the most-recent sample's position. */
export function flickAngularVelocity(
  samples: readonly PointerSample[],
  windowMs = VELOCITY_SAMPLE_WINDOW_MS,
): Vec3 {
  if (samples.length < 2) return { x: 0, y: 0, z: 0 };
  const newest = samples.at(-1)!;
  const cutoff = newest.time - windowMs;
  const oldest = samples.find((s) => s.time >= cutoff) ?? samples[0]!;
  const dt = (newest.time - oldest.time) / 1000;
  if (dt <= 0) return { x: 0, y: 0, z: 0 };
  const v3 = {
    x: (newest.pos.x - oldest.pos.x) / dt,
    y: (newest.pos.y - oldest.pos.y) / dt,
    z: (newest.pos.z - oldest.pos.z) / dt,
  };
  return projectOntoTangentPlane(v3, newest.pos);
}

/** Reduced-motion fallback: a tap → jump to the nearest neighbor in
 *  the requested direction. Direction is decomposed against the
 *  camera basis at the active node's position so "right" feels
 *  like "right on the visitor's screen." */
export function geodesicNeighborInDirection(
  activeKey: string | null,
  nodes: readonly NavigableNode[],
  arrowKey: string,
  basis: CameraBasis,
): NavigableNode | null {
  const direction = tangentHoldDirection(new Set([arrowKey]), basis, NORTH_POLE);
  if (direction.x === 0 && direction.y === 0 && direction.z === 0) return null;
  const active = nodes.find((n) => n.key === activeKey);
  const origin = active?.unitPos ?? NORTH_POLE;
  let best: { node: NavigableNode; cost: number } | null = null;
  for (const candidate of nodes) {
    if (candidate.key === active?.key) continue;
    const tangent = tangentTowards(origin, candidate.unitPos);
    const along = tangent.x * direction.x + tangent.y * direction.y + tangent.z * direction.z;
    if (along <= 0) continue;
    const distance = geodesicDistance(origin, candidate.unitPos);
    const cost = distance / Math.max(along, 0.05);
    if (!best || cost < best.cost) best = { node: candidate, cost };
  }
  if (best) return best.node;
  return active ? null : (nodes[0] ?? null);
}

/** Cubic ease-out approximating the design's signature easing
 *  (cubic-bezier(0.23, 1, 0.32, 1)). Used by the demonstration
 *  drift's slerp parameter so the cursor arrives gently rather than
 *  decelerating linearly. */
export function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}
