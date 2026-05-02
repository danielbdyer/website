import { describe, expect, test } from 'vitest';
import { type CameraBasis } from '@/shared/geometry/camera';
import { NORTH_POLE, sphericalToUnit, unitVector } from '@/shared/geometry/sphere';
import {
  flickAngularVelocity,
  geodesicNearestNode,
  geodesicNeighborInDirection,
  sphericalBasinForce,
  tangentHoldDirection,
  type NavigableNode,
} from './useConstellationNavigation';

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

describe('sphericalBasinForce', () => {
  test('zero force when no node is within influence', () => {
    const force = sphericalBasinForce(NORTH_POLE, [NODE_EAST], 0.5);
    expect(force.x).toBeCloseTo(0, 9);
    expect(force.y).toBeCloseTo(0, 9);
    expect(force.z).toBeCloseTo(0, 9);
  });

  test('points along the great circle toward a single nearby node', () => {
    // Cursor between pole and east, slightly toward east.
    const cursor = sphericalToUnit({ theta: 0.3, phi: 0 });
    const force = sphericalBasinForce(cursor, [NODE_EAST], Math.PI, 1);
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
    const force = sphericalBasinForce(NORTH_POLE, [NODE_EAST, NODE_WEST], Math.PI, 1);
    // Pulls along ±x cancel. Tangent at the pole has no z component
    // anyway, so y is also cancelled (no y in either node).
    expect(force.x).toBeCloseTo(0, 9);
    expect(force.y).toBeCloseTo(0, 9);
    expect(force.z).toBeCloseTo(0, 9);
  });

  test('is zero exactly at the node center (cursor settles)', () => {
    const force = sphericalBasinForce(NODE_EAST.unitPos, [NODE_EAST], 0.5, 5);
    expect(force.x).toBeCloseTo(0, 9);
    expect(force.y).toBeCloseTo(0, 9);
    expect(force.z).toBeCloseTo(0, 9);
  });

  test('vanishes at the influence radius (shape = 0)', () => {
    // Cursor at theta = 0.5 from pole, with influence exactly 0.5.
    const cursor = sphericalToUnit({ theta: 0.5, phi: 0 });
    const force = sphericalBasinForce(cursor, [NODE_POLE], 0.5, 5);
    expect(Math.hypot(force.x, force.y, force.z)).toBeLessThan(1e-6);
  });

  test('always returns a tangent force (perpendicular to position)', () => {
    const cursor = sphericalToUnit({ theta: 0.4, phi: 1.2 });
    const force = sphericalBasinForce(cursor, NODES);
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

  test('opposing arrows cancel to zero', () => {
    const v = tangentHoldDirection(new Set(['ArrowLeft', 'ArrowRight']), STAGE_BASIS, NORTH_POLE);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.y).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });

  test('an empty set is zero', () => {
    expect(tangentHoldDirection(new Set(), STAGE_BASIS, NORTH_POLE)).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('result is always perpendicular to the cursor position', () => {
    const cursor = sphericalToUnit({ theta: 0.7, phi: 1.3 });
    const v = tangentHoldDirection(new Set(['ArrowUp', 'ArrowRight']), STAGE_BASIS, cursor);
    const dot = v.x * cursor.x + v.y * cursor.y + v.z * cursor.z;
    expect(Math.abs(dot)).toBeLessThan(1e-9);
  });

  test('a diagonal hold normalizes to unit length', () => {
    const v = tangentHoldDirection(new Set(['ArrowUp', 'ArrowRight']), STAGE_BASIS, NORTH_POLE);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 9);
  });
});

describe('flickAngularVelocity', () => {
  test('returns zero with fewer than two samples', () => {
    expect(flickAngularVelocity([])).toEqual({ x: 0, y: 0, z: 0 });
    expect(flickAngularVelocity([{ time: 0, pos: NORTH_POLE }])).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('infers tangent velocity from the position change over the window', () => {
    const start = NORTH_POLE;
    const end = sphericalToUnit({ theta: 0.1, phi: 0 });
    const samples = [
      { time: 0, pos: start },
      { time: 100, pos: end },
    ];
    const v = flickAngularVelocity(samples, 200);
    // Tangent velocity at `end` perpendicular to `end`.
    const dot = v.x * end.x + v.y * end.y + v.z * end.z;
    expect(Math.abs(dot)).toBeLessThan(1e-9);
    // Direction roughly +x (we moved east from the pole).
    expect(v.x).toBeGreaterThan(0);
  });

  test('a stationary release yields zero velocity', () => {
    const samples = [
      { time: 0, pos: NORTH_POLE },
      { time: 60, pos: NORTH_POLE },
      { time: 120, pos: NORTH_POLE },
    ];
    expect(flickAngularVelocity(samples)).toEqual({ x: 0, y: 0, z: 0 });
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
