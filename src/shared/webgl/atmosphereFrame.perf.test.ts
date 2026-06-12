import { describe, expect, test } from 'vitest';
import { cameraBasis } from '@/shared/geometry/camera';
import type { Camera } from '@/shared/geometry/camera';
import { sphericalToUnit } from '@/shared/geometry/sphere';
import type { Vec3 } from '@/shared/geometry/sphere';
import { blendSkyPalettes, buildSkyPalette } from './palette';
import { IDENTITY_AFFINE, fitViewboxToCanvas, projectPointsToCanvas } from './atmosphereProjection';

// Performance regression guards for the atmosphere's per-frame JS.
// The render loop's main-thread cost is dominated by
// projectPointsToCanvas (stars + motes, every frame); the palette
// blend runs only during the 500ms theme fade but sits on the same
// frame path. Budgets are generous enough to be CI-stable while
// catching an order-of-magnitude regression — the same posture as
// wellPhysics.perf.test. The deeper guarantees (no per-frame
// getComputedStyle, no per-frame allocation in the loop) are
// structural; these floors catch the algorithmic ones.

function generatePoints(n: number): readonly Vec3[] {
  return Array.from({ length: n }, (_, i) =>
    sphericalToUnit({
      theta: ((i * 13) % 90) * (Math.PI / 180),
      phi: ((i * 37) % 360) * (Math.PI / 180),
    }),
  );
}

const CAMERA: Camera = {
  position: { x: 0, y: 0, z: -2.5 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fovY: Math.PI / 4,
  near: 0.1,
  far: 10,
};
const BASIS = cameraBasis(CAMERA);

function timed(fn: () => void): number {
  const start = globalThis.performance.now();
  fn();
  return globalThis.performance.now() - start;
}

describe('atmosphere frame-path performance', () => {
  test('projectPointsToCanvas — 140 points × 60_000 frames stays under 600ms', () => {
    // 140 ≈ a dense future sky (80 stars + 56 motes). 60k frames is
    // ~16 minutes of continuous 60fps travel.
    const points = generatePoints(140);
    const out = new Float32Array(points.length * 2);
    const fit = fitViewboxToCanvas(2560, 1440, 1000, 'cover');
    const elapsed = timed(() => {
      for (let i = 0; i < 60_000; i++) {
        projectPointsToCanvas(points, CAMERA, BASIS, IDENTITY_AFFINE, fit, 1000, out);
      }
    });
    expect(elapsed).toBeLessThan(600);
  });

  test('blendSkyPalettes — 100_000 fade frames stays under 600ms', () => {
    const light = buildSkyPalette(() => '#a08664', false);
    const dark = buildSkyPalette(() => '#14110e', true);
    const elapsed = timed(() => {
      for (let i = 0; i < 100_000; i++) {
        blendSkyPalettes(light, dark, (i % 100) / 100);
      }
    });
    expect(elapsed).toBeLessThan(600);
  });
});
