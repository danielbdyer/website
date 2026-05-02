import { describe, expect, test } from 'vitest';
import {
  NORTH_POLE,
  SOUTH_POLE,
  diskToHemisphere,
  geodesicDistance,
  projectOntoTangentPlane,
  raySphereIntersect,
  slerp,
  spherical,
  sphericalToUnit,
  stepOnSphere,
  tangentTowards,
  unitToSpherical,
  unitVector,
} from './sphere';

// Sample points covering the interior, the equator, and near
// (but not at) the poles. The pole boundaries are tested separately
// because φ is undefined there and we collapse it to 0.
const INTERIOR_SAMPLES = [
  spherical(0.1, 0),
  spherical(0.5, 1),
  spherical(1, 2),
  spherical(Math.PI / 4, Math.PI / 3),
  spherical(Math.PI / 3, Math.PI),
  spherical(Math.PI / 2, 0), // equator at φ = 0
  spherical(Math.PI / 2, Math.PI), // equator antipode
  spherical((2 * Math.PI) / 3, 4),
  spherical(Math.PI - 0.1, 5),
];

const APPROX = 1e-9;

function approxEqualVec(a: { x: number; y: number; z: number }, b: typeof a): void {
  expect(a.x).toBeCloseTo(b.x, 9);
  expect(a.y).toBeCloseTo(b.y, 9);
  expect(a.z).toBeCloseTo(b.z, 9);
}

function isUnitNorm(v: { x: number; y: number; z: number }): boolean {
  return Math.abs(Math.hypot(v.x, v.y, v.z) - 1) < 1e-9;
}

describe('spherical smart constructor', () => {
  test('clamps theta to [0, π]', () => {
    expect(spherical(-1, 0).theta).toBe(0);
    expect(spherical(Math.PI + 1, 0).theta).toBe(Math.PI);
  });

  test('wraps phi to [0, 2π)', () => {
    expect(spherical(1, -Math.PI).phi).toBeCloseTo(Math.PI, APPROX);
    expect(spherical(1, 3 * Math.PI).phi).toBeCloseTo(Math.PI, APPROX);
    expect(spherical(1, 2 * Math.PI).phi).toBeCloseTo(0, APPROX);
  });
});

describe('unitVector smart constructor', () => {
  test('normalizes any nonzero vector to unit length', () => {
    expect(isUnitNorm(unitVector(3, 4, 0))).toBe(true);
    expect(isUnitNorm(unitVector(-7, 2, 5))).toBe(true);
    expect(isUnitNorm(unitVector(0.001, 0, 0))).toBe(true);
  });

  test('returns the north pole for the zero vector (totality)', () => {
    expect(unitVector(0, 0, 0)).toEqual(NORTH_POLE);
  });
});

describe('sphericalToUnit', () => {
  test('produces unit vectors for every input', () => {
    for (const s of INTERIOR_SAMPLES) {
      expect(isUnitNorm(sphericalToUnit(s))).toBe(true);
    }
    expect(isUnitNorm(sphericalToUnit(spherical(0, 0)))).toBe(true);
    expect(isUnitNorm(sphericalToUnit(spherical(Math.PI, 0)))).toBe(true);
  });

  test('north pole maps to (0, 0, 1)', () => {
    approxEqualVec(sphericalToUnit(spherical(0, 0)), NORTH_POLE);
  });

  test('south pole maps to (0, 0, -1)', () => {
    approxEqualVec(sphericalToUnit(spherical(Math.PI, 0)), SOUTH_POLE);
  });

  test('equator at φ = 0 maps to (1, 0, 0)', () => {
    approxEqualVec(sphericalToUnit(spherical(Math.PI / 2, 0)), { x: 1, y: 0, z: 0 });
  });
});

describe('round-trip laws', () => {
  // unitToSpherical ∘ sphericalToUnit = id on interior points
  test('spherical → unit → spherical preserves interior points', () => {
    for (const s of INTERIOR_SAMPLES) {
      const back = unitToSpherical(sphericalToUnit(s));
      expect(back.theta).toBeCloseTo(s.theta, 9);
      expect(back.phi).toBeCloseTo(s.phi, 9);
    }
  });

  // sphericalToUnit ∘ unitToSpherical = id on the sphere
  test('unit → spherical → unit preserves Cartesian unit vectors', () => {
    const samples = INTERIOR_SAMPLES.map(sphericalToUnit);
    for (const v of samples) {
      approxEqualVec(sphericalToUnit(unitToSpherical(v)), v);
    }
  });

  test('poles round-trip with φ collapsed to 0 (canonical)', () => {
    expect(unitToSpherical(NORTH_POLE)).toEqual({ theta: 0, phi: 0 });
    expect(unitToSpherical(SOUTH_POLE)).toEqual({ theta: Math.PI, phi: 0 });
  });
});

describe('geodesicDistance', () => {
  test('zero between a point and itself', () => {
    for (const s of INTERIOR_SAMPLES) {
      const v = sphericalToUnit(s);
      expect(geodesicDistance(v, v)).toBeCloseTo(0, 9);
    }
  });

  test('π between antipodes', () => {
    expect(geodesicDistance(NORTH_POLE, SOUTH_POLE)).toBeCloseTo(Math.PI, 9);
  });

  test('symmetric: d(a, b) = d(b, a)', () => {
    const a = sphericalToUnit(spherical(0.7, 1.3));
    const b = sphericalToUnit(spherical(2.1, 4.5));
    expect(geodesicDistance(a, b)).toBeCloseTo(geodesicDistance(b, a), 9);
  });

  test('triangle inequality holds across sampled triples', () => {
    const points = INTERIOR_SAMPLES.map(sphericalToUnit);
    for (const a of points) {
      for (const b of points) {
        for (const c of points) {
          const direct = geodesicDistance(a, c);
          const via = geodesicDistance(a, b) + geodesicDistance(b, c);
          expect(direct).toBeLessThanOrEqual(via + 1e-9);
        }
      }
    }
  });

  test('returns a value in [0, π]', () => {
    const points = INTERIOR_SAMPLES.map(sphericalToUnit);
    for (const a of points) {
      for (const b of points) {
        const d = geodesicDistance(a, b);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });
});

describe('diskToHemisphere', () => {
  test('disk center maps to the north pole', () => {
    approxEqualVec(diskToHemisphere(0, 0), NORTH_POLE);
  });

  test('disk rim maps to the equator', () => {
    const rim = diskToHemisphere(1, 0);
    expect(rim.z).toBeCloseTo(0, 9);
    expect(Math.hypot(rim.x, rim.y)).toBeCloseTo(1, 9);
  });

  test('every disk point lands on the upper hemisphere (z ≥ 0)', () => {
    for (let r = 0; r <= 1; r += 0.1) {
      for (let phi = 0; phi < 2 * Math.PI; phi += 0.4) {
        const v = diskToHemisphere(r, phi);
        expect(v.z).toBeGreaterThanOrEqual(-1e-9);
        expect(isUnitNorm(v)).toBe(true);
      }
    }
  });

  test('preserves the disk angle as longitude on the sphere', () => {
    // Mid-radius point: the longitude should match the input angle.
    const v = diskToHemisphere(0.5, Math.PI / 3);
    const back = unitToSpherical(v);
    expect(back.phi).toBeCloseTo(Math.PI / 3, 9);
  });

  test('clamps an out-of-range radius to [0, 1]', () => {
    expect(diskToHemisphere(-0.5, 0)).toEqual(NORTH_POLE);
    const overRim = diskToHemisphere(2, 0);
    expect(overRim.z).toBeCloseTo(0, 9);
  });
});

describe('tangentTowards', () => {
  test('returns a unit vector for distinct non-antipodal points', () => {
    const t = tangentTowards(NORTH_POLE, sphericalToUnit(spherical(Math.PI / 2, 0)));
    expect(Math.hypot(t.x, t.y, t.z)).toBeCloseTo(1, 9);
  });

  test('is perpendicular to the source position (lies in tangent plane)', () => {
    const a = sphericalToUnit(spherical(0.7, 1.3));
    const b = sphericalToUnit(spherical(2.1, 4.5));
    const t = tangentTowards(a, b);
    expect(t.x * a.x + t.y * a.y + t.z * a.z).toBeCloseTo(0, 9);
  });

  test('returns the zero vector when source equals target', () => {
    const p = sphericalToUnit(spherical(0.5, 1));
    expect(tangentTowards(p, p)).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('returns the zero vector at antipodes (no defined direction)', () => {
    const t = tangentTowards(NORTH_POLE, SOUTH_POLE);
    expect(t).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('points consistently toward the target along the great circle', () => {
    // From the equator at φ=0 toward (cos π/3, sin π/3, 0): tangent
    // should have positive y component (rotating around the polar axis
    // counterclockwise from +x toward +y).
    const a = sphericalToUnit(spherical(Math.PI / 2, 0));
    const b = sphericalToUnit(spherical(Math.PI / 2, Math.PI / 3));
    const t = tangentTowards(a, b);
    expect(t.y).toBeGreaterThan(0);
  });
});

describe('projectOntoTangentPlane', () => {
  test('a vector parallel to p projects to zero', () => {
    const p = sphericalToUnit(spherical(0.7, 1.3));
    const v = { x: p.x * 3, y: p.y * 3, z: p.z * 3 };
    const projected = projectOntoTangentPlane(v, p);
    expect(projected.x).toBeCloseTo(0, 9);
    expect(projected.y).toBeCloseTo(0, 9);
    expect(projected.z).toBeCloseTo(0, 9);
  });

  test('result is perpendicular to p', () => {
    const p = sphericalToUnit(spherical(1, 2));
    const v = { x: 0.3, y: 0.7, z: -0.4 };
    const projected = projectOntoTangentPlane(v, p);
    expect(projected.x * p.x + projected.y * p.y + projected.z * p.z).toBeCloseTo(0, 9);
  });

  test('a tangent vector passes through unchanged', () => {
    const p = NORTH_POLE;
    const tangent = { x: 0.5, y: -0.3, z: 0 };
    const projected = projectOntoTangentPlane(tangent, p);
    expect(projected.x).toBeCloseTo(tangent.x, 9);
    expect(projected.y).toBeCloseTo(tangent.y, 9);
    expect(projected.z).toBeCloseTo(0, 9);
  });
});

describe('stepOnSphere', () => {
  test('zero tangent returns the original point', () => {
    const p = sphericalToUnit(spherical(0.7, 2));
    const result = stepOnSphere(p, { x: 0, y: 0, z: 0 }, 0.1);
    expect(result.x).toBeCloseTo(p.x, 9);
    expect(result.y).toBeCloseTo(p.y, 9);
    expect(result.z).toBeCloseTo(p.z, 9);
  });

  test('result stays on the unit sphere', () => {
    const p = NORTH_POLE;
    const tangent = { x: 0.5, y: 0, z: 0 };
    const result = stepOnSphere(p, tangent, 0.3);
    expect(Math.hypot(result.x, result.y, result.z)).toBeCloseTo(1, 9);
  });

  test('small steps approximate motion in the tangent direction', () => {
    const p = NORTH_POLE;
    const tangent = { x: 1, y: 0, z: 0 };
    // Small dt: position should shift mostly along +x.
    const result = stepOnSphere(p, tangent, 0.01);
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBeCloseTo(0, 9);
    // Z drops slightly (since we're moving along the sphere).
    expect(result.z).toBeLessThan(1);
  });
});

describe('slerp', () => {
  test('t=0 returns the start point', () => {
    const a = sphericalToUnit(spherical(0.5, 1));
    const b = sphericalToUnit(spherical(2, 3));
    const result = slerp(a, b, 0);
    expect(result.x).toBeCloseTo(a.x, 9);
    expect(result.y).toBeCloseTo(a.y, 9);
    expect(result.z).toBeCloseTo(a.z, 9);
  });

  test('t=1 returns the end point', () => {
    const a = sphericalToUnit(spherical(0.5, 1));
    const b = sphericalToUnit(spherical(2, 3));
    const result = slerp(a, b, 1);
    expect(result.x).toBeCloseTo(b.x, 9);
    expect(result.y).toBeCloseTo(b.y, 9);
    expect(result.z).toBeCloseTo(b.z, 9);
  });

  test('intermediate points stay on the unit sphere', () => {
    const a = NORTH_POLE;
    const b = sphericalToUnit(spherical(Math.PI / 2, Math.PI / 4));
    for (let t = 0; t <= 1; t += 0.1) {
      const p = slerp(a, b, t);
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 9);
    }
  });

  test('handles near-identical inputs without blowing up', () => {
    const a = NORTH_POLE;
    const b = unitVector(0, 1e-9, 1);
    const result = slerp(a, b, 0.5);
    expect(Number.isFinite(result.x)).toBe(true);
    expect(Number.isFinite(result.y)).toBe(true);
    expect(Number.isFinite(result.z)).toBe(true);
    expect(Math.hypot(result.x, result.y, result.z)).toBeCloseTo(1, 9);
  });
});

describe('raySphereIntersect', () => {
  test('returns null when the ray misses', () => {
    const origin = { x: 0, y: 5, z: -2 };
    const direction = { x: 0, y: 0, z: 1 };
    expect(raySphereIntersect(origin, direction)).toBeNull();
  });

  test('returns the near intersection for a ray pointing at the sphere', () => {
    const origin = { x: 0, y: 0, z: -2 };
    const direction = { x: 0, y: 0, z: 1 };
    const hit = raySphereIntersect(origin, direction);
    expect(hit).not.toBeNull();
    // Should be the near point: (0, 0, -1).
    expect(hit?.x).toBeCloseTo(0, 9);
    expect(hit?.y).toBeCloseTo(0, 9);
    expect(hit?.z).toBeCloseTo(-1, 9);
  });

  test('returns null when the ray points away from the sphere from outside', () => {
    const origin = { x: 0, y: 0, z: -2 };
    const direction = { x: 0, y: 0, z: -1 };
    expect(raySphereIntersect(origin, direction)).toBeNull();
  });

  test('the hit lies on the unit sphere', () => {
    const origin = { x: -1, y: 0, z: -2 };
    const direction = { x: 0.5, y: 0.1, z: 1 };
    const m = Math.hypot(direction.x, direction.y, direction.z);
    const dirUnit = { x: direction.x / m, y: direction.y / m, z: direction.z / m };
    const hit = raySphereIntersect(origin, dirUnit);
    expect(hit).not.toBeNull();
    expect(Math.hypot(hit!.x, hit!.y, hit!.z)).toBeCloseTo(1, 9);
  });
});
