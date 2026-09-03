import { describe, expect, test } from 'vitest';
import { NORTH_POLE, expMap, geodesicDistance, logMap, unitVector } from './sphere';

describe('expMap and logMap', () => {
  test('a zero tangent maps to the anchor itself', () => {
    expect(expMap(NORTH_POLE, { x: 0, y: 0, z: 0 })).toEqual(NORTH_POLE);
    expect(logMap(NORTH_POLE, NORTH_POLE)).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('walking a tangent of length θ arrives θ radians away, along it', () => {
    const p = expMap(NORTH_POLE, { x: 0.5, y: 0, z: 0 });
    expect(geodesicDistance(NORTH_POLE, p)).toBeCloseTo(0.5, 9);
    expect(p.x).toBeGreaterThan(0);
    expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 9);
  });

  test('log is the inverse of exp', () => {
    const anchor = unitVector(0.3, -0.2, 0.9);
    const u = { x: 0.2, y: 0.35, z: -(0.3 * 0.2 + -0.2 * 0.35) / 0.9 };
    const back = logMap(anchor, expMap(anchor, u));
    expect(back.x).toBeCloseTo(u.x, 6);
    expect(back.y).toBeCloseTo(u.y, 6);
    expect(back.z).toBeCloseTo(u.z, 6);
  });

  test('log lies in the tangent plane at the anchor', () => {
    const anchor = unitVector(0.1, 0.7, 0.7);
    const u = logMap(anchor, unitVector(-0.4, 0.5, 0.6));
    expect(u.x * anchor.x + u.y * anchor.y + u.z * anchor.z).toBeCloseTo(0, 9);
  });
});
