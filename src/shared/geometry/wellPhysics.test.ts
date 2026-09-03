import { describe, expect, test } from 'vitest';
import { type CameraBasis } from '@/shared/geometry/camera';
import { NORTH_POLE } from '@/shared/geometry/sphere';
import { tangentHoldDirection } from './wellPhysics';

// A camera looking down at the sphere from +z, with world up as +y.
// At the polestar the tangent plane is the xy plane, so right→+x,
// up→+y.
const STAGE_BASIS: CameraBasis = {
  forward: { x: 0, y: 0, z: -1 },
  right: { x: 1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
};

describe('tangentHoldDirection', () => {
  test('a single arrow yields a unit-length tangent at the polestar', () => {
    const right = tangentHoldDirection(new Set(['ArrowRight']), STAGE_BASIS, NORTH_POLE);
    expect(Math.hypot(right.x, right.y, right.z)).toBeCloseTo(1, 9);
    expect(right.x).toBeCloseTo(1, 9);

    const up = tangentHoldDirection(new Set(['ArrowUp']), STAGE_BASIS, NORTH_POLE);
    expect(Math.hypot(up.x, up.y, up.z)).toBeCloseTo(1, 9);
    expect(up.y).toBeCloseTo(1, 9);
  });

  test('two diagonal arrows compose to one unit-length tangent', () => {
    const upRight = tangentHoldDirection(
      new Set(['ArrowUp', 'ArrowRight']),
      STAGE_BASIS,
      NORTH_POLE,
    );
    expect(Math.hypot(upRight.x, upRight.y, upRight.z)).toBeCloseTo(1, 9);
  });

  test('opposite arrows cancel', () => {
    const cancel = tangentHoldDirection(new Set(['ArrowUp', 'ArrowDown']), STAGE_BASIS, NORTH_POLE);
    expect(Math.hypot(cancel.x, cancel.y, cancel.z)).toBeCloseTo(0, 9);
  });

  test('no arrows yields zero', () => {
    const zero = tangentHoldDirection(new Set(), STAGE_BASIS, NORTH_POLE);
    expect(Math.hypot(zero.x, zero.y, zero.z)).toBeCloseTo(0, 9);
  });

  test('the direction is tangent to the sphere at a non-polar position', () => {
    const pos = { x: 0.6, y: 0, z: 0.8 };
    const dir = tangentHoldDirection(new Set(['ArrowRight']), STAGE_BASIS, pos);
    const radial = dir.x * pos.x + dir.y * pos.y + dir.z * pos.z;
    expect(Math.abs(radial)).toBeLessThan(1e-9);
    expect(Math.hypot(dir.x, dir.y, dir.z)).toBeCloseTo(1, 9);
  });
});
