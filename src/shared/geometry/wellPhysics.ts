// Pure helpers for keyboard travel across the constellation's sphere.
//
// What remains of the well-field physics after the walk replaced it
// (CONSTELLATION_WALK.md §"What This Supersedes"): the navigable-node
// shape the DOM projector reads, and the tangent-direction synthesis
// that turns an arrow key into a direction on the sphere so
// `neighborToward` (skyWalk.ts) can pick the star it points at. The
// attractor forces, the flick velocity, and the nearest-well search
// are gone with the drag.

import type { CameraBasis } from '@/shared/geometry/camera';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import { projectOntoTangentPlane } from '@/shared/geometry/sphere';

/** A star the projector places each frame. */
export interface NavigableNode {
  readonly key: string;
  readonly unitPos: UnitVector3;
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
