import { describe, expect, test } from 'vitest';
import {
  basinFieldForce,
  flickVelocity,
  holdDirection,
  nearestNode,
  neighborInDirection,
  type NavigableNode,
} from './useConstellationNavigation';

const NODE_A: NavigableNode = { key: 'a', pos: { x: 100, y: 500 } };
const NODE_B: NavigableNode = { key: 'b', pos: { x: 900, y: 500 } };
const NODE_C: NavigableNode = { key: 'c', pos: { x: 500, y: 100 } };
const NODE_D: NavigableNode = { key: 'd', pos: { x: 500, y: 900 } };
const NODES = [NODE_A, NODE_B, NODE_C, NODE_D];

describe('nearestNode', () => {
  test('returns the closest node within range', () => {
    expect(nearestNode({ x: 110, y: 505 }, NODES)).toEqual({
      key: 'a',
      distance: expect.closeTo(Math.hypot(10, 5), 5),
    });
  });

  test('returns null when no node is within maxDistance', () => {
    expect(nearestNode({ x: 500, y: 500 }, NODES, 50)).toBeNull();
  });

  test('returns null on an empty graph', () => {
    expect(nearestNode({ x: 0, y: 0 }, [])).toBeNull();
  });
});

describe('basinFieldForce', () => {
  test('returns zero force when no node is within influence', () => {
    expect(basinFieldForce({ x: 500, y: 500 }, NODES, 50)).toEqual({ x: 0, y: 0 });
  });

  test('points toward a single nearby node', () => {
    const force = basinFieldForce({ x: 200, y: 500 }, [NODE_A], 200, 30);
    expect(force.x).toBeLessThan(0);
    expect(Math.abs(force.y)).toBeLessThan(0.001);
  });

  test('cancels along the saddle between two equidistant nodes', () => {
    const force = basinFieldForce({ x: 500, y: 500 }, [NODE_A, NODE_B], 800, 30);
    expect(force.x).toBeCloseTo(0, 5);
    expect(force.y).toBeCloseTo(0, 5);
  });

  test('is zero at the node center so the cursor can settle', () => {
    const force = basinFieldForce(NODE_A.pos, [NODE_A], 300, 30);
    expect(force.x).toBeCloseTo(0, 5);
    expect(force.y).toBeCloseTo(0, 5);
  });

  test('vanishes at the influence boundary', () => {
    // At d = R the shape factor is zero by construction.
    const force = basinFieldForce({ x: 100 + 300, y: 500 }, [NODE_A], 300, 30);
    expect(force.x).toBeCloseTo(0, 5);
    expect(force.y).toBeCloseTo(0, 5);
  });
});

describe('holdDirection', () => {
  test('a single arrow yields a unit vector', () => {
    expect(holdDirection(new Set(['ArrowRight']))).toEqual({ x: 1, y: 0 });
    expect(holdDirection(new Set(['ArrowUp']))).toEqual({ x: 0, y: -1 });
  });

  test('diagonal holds normalize to unit length', () => {
    const v = holdDirection(new Set(['ArrowRight', 'ArrowDown']));
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 5);
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 5);
  });

  test('opposing holds cancel to zero', () => {
    expect(holdDirection(new Set(['ArrowLeft', 'ArrowRight']))).toEqual({ x: 0, y: 0 });
  });

  test('an empty set is the zero vector', () => {
    expect(holdDirection(new Set())).toEqual({ x: 0, y: 0 });
  });
});

describe('flickVelocity', () => {
  test('returns zero with fewer than two samples', () => {
    expect(flickVelocity([])).toEqual({ x: 0, y: 0 });
    expect(flickVelocity([{ time: 0, pos: { x: 0, y: 0 } }])).toEqual({ x: 0, y: 0 });
  });

  test('infers velocity from the start-to-end position change over the window', () => {
    const samples = [
      { time: 1000, pos: { x: 100, y: 100 } },
      { time: 1050, pos: { x: 150, y: 100 } },
      { time: 1100, pos: { x: 200, y: 100 } },
    ];
    const v = flickVelocity(samples, 200);
    expect(v.x).toBeCloseTo(1000, 5);
    expect(v.y).toBeCloseTo(0, 5);
  });

  test('a stationary release yields zero velocity', () => {
    const samples = [
      { time: 0, pos: { x: 50, y: 50 } },
      { time: 60, pos: { x: 50, y: 50 } },
      { time: 120, pos: { x: 50, y: 50 } },
    ];
    expect(flickVelocity(samples)).toEqual({ x: 0, y: 0 });
  });
});

describe('neighborInDirection', () => {
  test('right of A picks the node to the right', () => {
    expect(neighborInDirection('a', NODES, 'ArrowRight')?.key).toBe('b');
  });

  test('up from D picks the central upper node', () => {
    expect(neighborInDirection('d', NODES, 'ArrowUp')?.key).toBe('c');
  });

  test('returns null when no candidate lies in the requested direction', () => {
    expect(neighborInDirection('b', [NODE_A, NODE_B], 'ArrowRight')).toBeNull();
  });
});
