import { describe, expect, test } from 'vitest';
import { type CameraBasis } from '@/shared/geometry/camera';
import { NORTH_POLE, sphericalToUnit } from '@/shared/geometry/sphere';
import {
  flickAngularVelocity,
  geodesicNearestNode,
  sphericalWellForce,
  tangentHoldDirection,
  type NavigableNode,
} from './useConstellationNavigation';

// Performance regression guards for the navigation hot path. The
// constellation's RAF loop runs sphericalWellForce + geodesicNearestNode
// once per frame; the budgets below are generous enough to be CI-
// stable while still catching algorithmic regressions (an order-of-
// magnitude slowdown will trip them).

function generateNodes(n: number): readonly NavigableNode[] {
  // Deterministic, reasonably-spread placements over the upper
  // hemisphere. Avoids hash-driven randomness so the benchmark is
  // stable across runs.
  return Array.from({ length: n }, (_, i) => ({
    key: `node-${i}`,
    unitPos: sphericalToUnit({
      theta: ((i * 13) % 90) * (Math.PI / 180),
      phi: ((i * 37) % 360) * (Math.PI / 180),
    }),
  }));
}

const STAGE_BASIS: CameraBasis = {
  forward: { x: 0, y: 0, z: -1 },
  right: { x: 1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
};

function cursorAt(i: number) {
  return sphericalToUnit({
    theta: ((i * 7) % 90) * (Math.PI / 180),
    phi: ((i * 23) % 360) * (Math.PI / 180),
  });
}

function timed(fn: () => void): number {
  const start = globalThis.performance.now();
  fn();
  return globalThis.performance.now() - start;
}

describe('navigation hot path performance', () => {
  test('sphericalWellForce — 30 nodes × 60_000 iterations stays under 600ms', () => {
    const nodes = generateNodes(30);
    const elapsed = timed(() => {
      for (let i = 0; i < 60_000; i++) sphericalWellForce(cursorAt(i), nodes);
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('sphericalWellForce — 200 nodes × 10_000 iterations stays under 600ms', () => {
    const nodes = generateNodes(200);
    const elapsed = timed(() => {
      for (let i = 0; i < 10_000; i++) sphericalWellForce(cursorAt(i), nodes);
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('geodesicNearestNode — 200 nodes × 60_000 iterations stays under 600ms', () => {
    const nodes = generateNodes(200);
    const elapsed = timed(() => {
      for (let i = 0; i < 60_000; i++) geodesicNearestNode(cursorAt(i), nodes, 0.3);
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('flickAngularVelocity — 30 samples × 200_000 iterations stays under 600ms', () => {
    const samples = Array.from({ length: 30 }, (_, i) => ({
      time: i * 4,
      pos: cursorAt(i),
    }));
    const elapsed = timed(() => {
      for (let i = 0; i < 200_000; i++) flickAngularVelocity(samples);
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('tangentHoldDirection — 1_000_000 iterations stays under 600ms', () => {
    const held = new Set(['ArrowUp', 'ArrowRight']);
    const elapsed = timed(() => {
      for (let i = 0; i < 1_000_000; i++) tangentHoldDirection(held, STAGE_BASIS, NORTH_POLE);
    });
    expect(elapsed).toBeLessThan(600);
  });
});
