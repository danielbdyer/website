import { describe, expect, test } from 'vitest';
import {
  applyBasinPull,
  directionalNeighbor,
  nearestNode,
  springStep,
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

describe('applyBasinPull', () => {
  test('leaves the target untouched when no node is in range', () => {
    expect(applyBasinPull({ x: 500, y: 500 }, NODES, 50)).toEqual({ x: 500, y: 500 });
  });

  test('bends the target toward a single nearby node', () => {
    const pulled = applyBasinPull({ x: 150, y: 500 }, [NODE_A], 200, 0.6);
    expect(pulled.x).toBeLessThan(150);
    expect(pulled.x).toBeGreaterThan(NODE_A.pos.x);
    expect(pulled.y).toBeCloseTo(500, 5);
  });

  test('competing pulls between equidistant nodes settle near the saddle', () => {
    // Pulls compose sequentially — each updates the position before the
    // next computes — so the result is near, not exactly on, the saddle.
    // Within 1% of viewbox is the intended "between two basins" feel.
    const pulled = applyBasinPull({ x: 500, y: 500 }, [NODE_A, NODE_B], 800, 0.4);
    expect(pulled.y).toBeCloseTo(500, 5);
    expect(Math.abs(pulled.x - 500)).toBeLessThan(10);
  });
});

describe('springStep', () => {
  test('a settled spring at its target stays put', () => {
    const result = springStep({ x: 500, y: 500 }, { x: 0, y: 0 }, { x: 500, y: 500 }, 0.016);
    expect(result.pos.x).toBeCloseTo(500, 5);
    expect(result.pos.y).toBeCloseTo(500, 5);
    expect(result.vel.x).toBeCloseTo(0, 5);
    expect(result.vel.y).toBeCloseTo(0, 5);
  });

  test('integrating many steps converges toward the target', () => {
    let pos = { x: 0, y: 0 };
    let vel = { x: 0, y: 0 };
    for (let i = 0; i < 600; i++) {
      const next = springStep(pos, vel, { x: 100, y: 100 }, 1 / 60);
      pos = next.pos;
      vel = next.vel;
    }
    expect(pos.x).toBeCloseTo(100, 1);
    expect(pos.y).toBeCloseTo(100, 1);
  });
});

describe('directionalNeighbor', () => {
  test('right of A picks the node to the right', () => {
    expect(directionalNeighbor('a', NODES, 'right')?.key).toBe('b');
  });

  test('up from D picks the central upper node', () => {
    expect(directionalNeighbor('d', NODES, 'up')?.key).toBe('c');
  });

  test('returns null when no candidate lies in the requested direction', () => {
    expect(directionalNeighbor('b', [NODE_A, NODE_B], 'right')).toBeNull();
  });

  test('falls back to the first node when the active key is unknown', () => {
    expect(directionalNeighbor('missing', NODES, 'left')?.key).toBe('a');
  });
});
