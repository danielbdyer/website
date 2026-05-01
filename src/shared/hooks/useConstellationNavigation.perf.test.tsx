import { describe, expect, test } from 'vitest';
import {
  basinFieldForce,
  flickVelocity,
  holdDirection,
  nearestNode,
  type NavigableNode,
} from './useConstellationNavigation';

// Performance regression guards for the navigation hot path. The
// constellation's RAF loop runs basinFieldForce + nearestNode once
// per frame; the budgets below are generous enough to be CI-stable
// while still catching algorithmic regressions (an order-of-
// magnitude slowdown will trip them). The cursor's force-field
// integration must stay well inside a single RAF frame even at
// node counts an order beyond what the site is likely to ship.

function generateNodes(n: number): readonly NavigableNode[] {
  // Deterministic, reasonably-spread placements. Avoids hash-driven
  // randomness so the benchmark is stable across runs.
  return Array.from({ length: n }, (_, i) => ({
    key: `node-${i}`,
    pos: { x: (i * 73) % 1000, y: (i * 137) % 1000 },
  }));
}

function timed(fn: () => void): number {
  const start = globalThis.performance.now();
  fn();
  return globalThis.performance.now() - start;
}

// Budgets are generous enough to be CI-stable but tight enough to
// trip on an order-of-magnitude regression. Local measurement on a
// development machine sits well below each threshold; a real-world
// regression (e.g. accidentally re-enabling the sqrt path before
// the bounding-box reject) would cross them.
describe('navigation hot path performance', () => {
  test('basinFieldForce — 30 nodes × 60_000 iterations stays under 600ms', () => {
    const nodes = generateNodes(30);
    const elapsed = timed(() => {
      for (let i = 0; i < 60_000; i++) {
        basinFieldForce({ x: i % 1000, y: (i * 3) % 1000 }, nodes);
      }
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('basinFieldForce — 200 nodes × 10_000 iterations stays under 600ms', () => {
    const nodes = generateNodes(200);
    const elapsed = timed(() => {
      for (let i = 0; i < 10_000; i++) {
        basinFieldForce({ x: i % 1000, y: (i * 3) % 1000 }, nodes);
      }
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('nearestNode — 200 nodes × 60_000 iterations stays under 600ms', () => {
    const nodes = generateNodes(200);
    const elapsed = timed(() => {
      for (let i = 0; i < 60_000; i++) {
        nearestNode({ x: i % 1000, y: (i * 3) % 1000 }, nodes, 95);
      }
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('flickVelocity — 30 samples × 200_000 iterations stays under 600ms', () => {
    const samples = Array.from({ length: 30 }, (_, i) => ({
      time: i * 4,
      pos: { x: i * 5, y: i * 7 },
    }));
    const elapsed = timed(() => {
      for (let i = 0; i < 200_000; i++) flickVelocity(samples);
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('holdDirection — 4 keys × 1_000_000 iterations stays under 600ms', () => {
    const held = new Set(['ArrowUp', 'ArrowRight']);
    const elapsed = timed(() => {
      for (let i = 0; i < 1_000_000; i++) holdDirection(held);
    });
    expect(elapsed).toBeLessThan(600);
  });
});
