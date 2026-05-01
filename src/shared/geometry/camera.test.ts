import { describe, expect, test } from 'vitest';
import { type Camera, cameraBasis, project } from './camera';

const LOOKING_UP: Camera = {
  position: { x: 0, y: 0, z: -2 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fovY: Math.PI / 4,
  near: 0.5,
  far: 4,
};

describe('cameraBasis', () => {
  test('forward points from position toward target', () => {
    const { forward } = cameraBasis(LOOKING_UP);
    expect(forward).toEqual({ x: 0, y: 0, z: 1 });
  });

  test('right is perpendicular to forward and to up', () => {
    const { right, forward, up } = cameraBasis(LOOKING_UP);
    expect(right.x * forward.x + right.y * forward.y + right.z * forward.z).toBeCloseTo(0, 9);
    expect(right.x * up.x + right.y * up.y + right.z * up.z).toBeCloseTo(0, 9);
  });

  test('basis vectors are unit length', () => {
    const { forward, right, up } = cameraBasis(LOOKING_UP);
    expect(Math.hypot(forward.x, forward.y, forward.z)).toBeCloseTo(1, 9);
    expect(Math.hypot(right.x, right.y, right.z)).toBeCloseTo(1, 9);
    expect(Math.hypot(up.x, up.y, up.z)).toBeCloseTo(1, 9);
  });

  test('degenerate input (target = position) collapses to a stable default', () => {
    const degenerate: Camera = { ...LOOKING_UP, target: LOOKING_UP.position };
    const basis = cameraBasis(degenerate);
    // Should not produce NaN.
    expect(Number.isFinite(basis.forward.x)).toBe(true);
    expect(Number.isFinite(basis.forward.y)).toBe(true);
    expect(Number.isFinite(basis.forward.z)).toBe(true);
  });
});

describe('project', () => {
  const basis = cameraBasis(LOOKING_UP);

  test('the look-at point projects to image center', () => {
    const p = project(LOOKING_UP.target, LOOKING_UP, basis, 1);
    expect(p.screenX).toBeCloseTo(0, 9);
    expect(p.screenY).toBeCloseTo(0, 9);
    expect(p.inFront).toBe(true);
  });

  test('a point behind the camera reports inFront = false', () => {
    // Camera at (0, 0, -2) looking +z; (0, 0, -3) is behind.
    const p = project({ x: 0, y: 0, z: -3 }, LOOKING_UP, basis, 1);
    expect(p.inFront).toBe(false);
  });

  test('a point above the look-at line projects with positive screenY', () => {
    const p = project({ x: 0, y: 0.5, z: 0 }, LOOKING_UP, basis, 1);
    expect(p.screenY).toBeGreaterThan(0);
    expect(p.screenX).toBeCloseTo(0, 9);
  });

  test('a point right of the look-at line projects with positive screenX', () => {
    const p = project({ x: 0.5, y: 0, z: 0 }, LOOKING_UP, basis, 1);
    expect(p.screenX).toBeGreaterThan(0);
    expect(p.screenY).toBeCloseTo(0, 9);
  });

  test('aspect compresses x: a non-1 aspect changes screenX, not screenY', () => {
    const wide = project({ x: 0.3, y: 0.3, z: 0 }, LOOKING_UP, basis, 2);
    const square = project({ x: 0.3, y: 0.3, z: 0 }, LOOKING_UP, basis, 1);
    // Wide aspect halves screenX (x/aspect), leaves screenY alone.
    expect(wide.screenX).toBeCloseTo(square.screenX / 2, 9);
    expect(wide.screenY).toBeCloseTo(square.screenY, 9);
  });

  test('depth grows with distance from the camera', () => {
    const near = project({ x: 0, y: 0, z: 0 }, LOOKING_UP, basis, 1);
    const far = project({ x: 0, y: 0, z: 1 }, LOOKING_UP, basis, 1);
    expect(far.depth).toBeGreaterThan(near.depth);
    expect(near.depth).toBeGreaterThanOrEqual(0);
    expect(far.depth).toBeLessThanOrEqual(1);
  });

  test('depth clamps to [0, 1] across very near and very far points', () => {
    const veryNear = project({ x: 0, y: 0, z: -1.9 }, LOOKING_UP, basis, 1);
    const veryFar = project({ x: 0, y: 0, z: 100 }, LOOKING_UP, basis, 1);
    expect(veryNear.depth).toBeGreaterThanOrEqual(0);
    expect(veryNear.depth).toBeLessThanOrEqual(1);
    expect(veryFar.depth).toBe(1);
  });

  test('symmetric: a point and its reflection across the look-at line project to mirrored screen coords', () => {
    const left = project({ x: -0.4, y: 0.2, z: 0 }, LOOKING_UP, basis, 1);
    const right = project({ x: 0.4, y: 0.2, z: 0 }, LOOKING_UP, basis, 1);
    expect(left.screenX).toBeCloseTo(-right.screenX, 9);
    expect(left.screenY).toBeCloseTo(right.screenY, 9);
  });
});
