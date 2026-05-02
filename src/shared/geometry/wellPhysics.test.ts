import { describe, expect, test } from 'vitest';
import { type CameraBasis } from '@/shared/geometry/camera';
import { NORTH_POLE, sphericalToUnit, unitVector } from '@/shared/geometry/sphere';
import {
  easeOutCubic,
  flickAngularVelocity,
  geodesicNearestNode,
  geodesicNeighborInDirection,
  sphericalWellForce,
  tangentHoldDirection,
  type NavigableNode,
} from './wellPhysics';

// Four cardinal nodes covering the upper hemisphere: pole at the
// top, three equator points at φ = 0, π/2, π. Tests rely on these
// being well-separated by geodesic distance.
const NODE_POLE: NavigableNode = { key: 'pole', unitPos: NORTH_POLE };
const NODE_EAST: NavigableNode = { key: 'east', unitPos: unitVector(1, 0, 0) };
const NODE_NORTH: NavigableNode = { key: 'north', unitPos: unitVector(0, 1, 0) };
const NODE_WEST: NavigableNode = { key: 'west', unitPos: unitVector(-1, 0, 0) };
const NODES = [NODE_POLE, NODE_EAST, NODE_NORTH, NODE_WEST];

// A camera looking down at the sphere from +z, with world up as +y.
// Convenient for tests because at the polestar the tangent plane is
// the xy plane, so right→+x, up→+y. The sphere physics doesn't need
// to know about projection here; we only use the basis for the
// hold-direction and neighbor-direction tests.
const STAGE_BASIS: CameraBasis = {
  forward: { x: 0, y: 0, z: -1 },
  right: { x: 1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
};

describe('geodesicNearestNode', () => {
  test('returns the closest node by geodesic distance', () => {
    // A point near the pole (small θ) — pole should win.
    const cursor = sphericalToUnit({ theta: 0.05, phi: 0 });
    const result = geodesicNearestNode(cursor, NODES);
    expect(result?.key).toBe('pole');
    expect(result?.distance).toBeCloseTo(0.05, 9);
  });

  test('returns null when no node is within maxRadians', () => {
    expect(geodesicNearestNode(NORTH_POLE, [NODE_EAST], 0.1)).toBeNull();
  });

  test('returns null on an empty graph', () => {
    expect(geodesicNearestNode(NORTH_POLE, [])).toBeNull();
  });

  test('the pole and the east equator are π/2 apart', () => {
    const result = geodesicNearestNode(NODE_POLE.unitPos, [NODE_EAST]);
    expect(result?.distance).toBeCloseTo(Math.PI / 2, 9);
  });
});

describe('sphericalWellForce', () => {
  test('zero force when no node is within influence', () => {
    const force = sphericalWellForce(NORTH_POLE, [NODE_EAST], 0.5);
    expect(force.x).toBeCloseTo(0, 9);
    expect(force.y).toBeCloseTo(0, 9);
    expect(force.z).toBeCloseTo(0, 9);
  });

  test('points along the great circle toward a single nearby node', () => {
    // Cursor between pole and east, slightly toward east.
    const cursor = sphericalToUnit({ theta: 0.3, phi: 0 });
    const force = sphericalWellForce(cursor, [NODE_EAST], Math.PI, 1);
    // Tangent toward east at this position: the x component of the
    // tangent should be positive (we're east of the pole, tangent
    // points further east — also +x in this configuration).
    expect(force.x).toBeGreaterThan(0);
    // Tangent is perpendicular to position.
    const dotPos = force.x * cursor.x + force.y * cursor.y + force.z * cursor.z;
    expect(dotPos).toBeCloseTo(0, 9);
  });

  test('cancels at the saddle between two equidistant nodes', () => {
    // The pole is equidistant from east and west (both at π/2).
    const force = sphericalWellForce(NORTH_POLE, [NODE_EAST, NODE_WEST], Math.PI, 1);
    // Pulls along ±x cancel. Tangent at the pole has no z component
    // anyway, so y is also cancelled (no y in either node).
    expect(force.x).toBeCloseTo(0, 9);
    expect(force.y).toBeCloseTo(0, 9);
    expect(force.z).toBeCloseTo(0, 9);
  });

  test('is zero exactly at the node center (cursor settles)', () => {
    const force = sphericalWellForce(NODE_EAST.unitPos, [NODE_EAST], 0.5, 5);
    expect(force.x).toBeCloseTo(0, 9);
    expect(force.y).toBeCloseTo(0, 9);
    expect(force.z).toBeCloseTo(0, 9);
  });

  test('vanishes at the influence radius (shape = 0)', () => {
    // Cursor at theta = 0.5 from pole, with influence exactly 0.5.
    const cursor = sphericalToUnit({ theta: 0.5, phi: 0 });
    const force = sphericalWellForce(cursor, [NODE_POLE], 0.5, 5);
    expect(Math.hypot(force.x, force.y, force.z)).toBeLessThan(1e-6);
  });

  test('always returns a tangent force (perpendicular to position)', () => {
    const cursor = sphericalToUnit({ theta: 0.4, phi: 1.2 });
    const force = sphericalWellForce(cursor, NODES);
    const dot = force.x * cursor.x + force.y * cursor.y + force.z * cursor.z;
    expect(Math.abs(dot)).toBeLessThan(1e-9);
  });
});

describe('tangentHoldDirection', () => {
  test('a single arrow yields a unit-length tangent at the polestar', () => {
    const right = tangentHoldDirection(new Set(['ArrowRight']), STAGE_BASIS, NORTH_POLE);
    expect(Math.hypot(right.x, right.y, right.z)).toBeCloseTo(1, 9);
    // At the pole, +right = +x.
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
});

describe('flickAngularVelocity', () => {
  test('two samples on the polestar tangent plane yield horizontal velocity', () => {
    const samples = [
      { time: 0, pos: NORTH_POLE },
      { time: 50, pos: sphericalToUnit({ theta: 0.05, phi: 0 }) },
    ];
    const v = flickAngularVelocity(samples);
    // The sample moved in the +x direction over 50ms; velocity is
    // tangent at the second sample's position. Magnitude should be
    // small but positive.
    expect(Math.hypot(v.x, v.y, v.z)).toBeGreaterThan(0);
  });

  test('a single sample yields zero (no time delta)', () => {
    const v = flickAngularVelocity([{ time: 0, pos: NORTH_POLE }]);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(0, 9);
  });

  test('respects the windowMs cutoff', () => {
    // Two samples 200ms apart with windowMs=100; only the newest
    // (in window) and the closest-in-window-or-earliest are used.
    // Same sample twice = zero velocity.
    const samples = [
      { time: 0, pos: NORTH_POLE },
      { time: 200, pos: NORTH_POLE },
    ];
    const v = flickAngularVelocity(samples, 100);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(0, 9);
  });
});

describe('geodesicNeighborInDirection', () => {
  test('right of pole picks the east node', () => {
    const result = geodesicNeighborInDirection('pole', NODES, 'ArrowRight', STAGE_BASIS);
    expect(result?.key).toBe('east');
  });

  test('up from pole picks the +y equator node', () => {
    const result = geodesicNeighborInDirection('pole', NODES, 'ArrowUp', STAGE_BASIS);
    expect(result?.key).toBe('north');
  });

  test('left of pole picks the west node', () => {
    const result = geodesicNeighborInDirection('pole', NODES, 'ArrowLeft', STAGE_BASIS);
    expect(result?.key).toBe('west');
  });

  test('returns null when no candidate lies in the requested direction', () => {
    // Only one neighbor, in the wrong direction.
    const result = geodesicNeighborInDirection(
      'east',
      [NODE_EAST, NODE_WEST],
      'ArrowRight',
      STAGE_BASIS,
    );
    expect(result).toBeNull();
  });
});

describe('easeOutCubic', () => {
  test('boundary values land exactly at 0 and 1', () => {
    expect(easeOutCubic(0)).toBeCloseTo(0, 9);
    expect(easeOutCubic(1)).toBeCloseTo(1, 9);
  });

  test('crosses 0.5 before t=0.5 (ease-out shape)', () => {
    // 1 - (1 - 0.4)^3 = 1 - 0.216 = 0.784 — comfortably past half.
    expect(easeOutCubic(0.4)).toBeGreaterThan(0.5);
  });

  test('monotonically non-decreasing', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 20; i++) {
      const v = easeOutCubic(i / 20);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
