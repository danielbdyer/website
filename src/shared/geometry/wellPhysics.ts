// Pure helpers for keyboard travel across the constellation's sphere.
//
// What remains of the well-field physics after the walk replaced it
// (CONSTELLATION_WALK.md §"What This Supersedes"): the navigable-node
// shape the DOM projector reads, and the tangent-direction synthesis
// that turns an arrow key into a direction on the sphere so
// `neighborToward` (skyWalk.ts) can pick the star it points at.

import type { CameraBasis } from '@/shared/geometry/camera';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import { projectOntoTangentPlane } from '@/shared/geometry/sphere';

/** A star the projector places each frame. */
export interface NavigableNode {
  readonly key: string;
  readonly unitPos: UnitVector3;
}

const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

/** Tangent direction at `pos` synthesized from held arrow keys.
 *  Up/down map to ±camera-up projected onto the tangent plane;
 *  left/right map to ±camera-right. The result is normalized so
 *  pressing two keys diagonally produces unit-magnitude direction. */
export function tangentHoldDirection(
  heldKeys: ReadonlySet<string>,
  basis: CameraBasis,
  pos: UnitVector3,
): Vec3 {
  const upWeight = (heldKeys.has('ArrowUp') ? 1 : 0) - (heldKeys.has('ArrowDown') ? 1 : 0);
  const rightWeight = (heldKeys.has('ArrowRight') ? 1 : 0) - (heldKeys.has('ArrowLeft') ? 1 : 0);
  if (upWeight === 0 && rightWeight === 0) return ZERO;
  // Compose then re-tangent (project off the radial component) and
  // normalize so the magnitude is 1 regardless of how the basis
  // happens to align with the tangent plane.
  const tangent = projectOntoTangentPlane(
    {
      x: basis.up.x * upWeight + basis.right.x * rightWeight,
      y: basis.up.y * upWeight + basis.right.y * rightWeight,
      z: basis.up.z * upWeight + basis.right.z * rightWeight,
    },
    pos,
  );
  const m = Math.hypot(tangent.x, tangent.y, tangent.z);
  if (m < 1e-9) return ZERO;
  return { x: tangent.x / m, y: tangent.y / m, z: tangent.z / m };
}
