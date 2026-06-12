import { describe, expect, test } from 'vitest';
import { cameraBasis } from '@/shared/geometry/camera';
import type { Camera } from '@/shared/geometry/camera';
import { unitVector } from '@/shared/geometry/sphere';
import { projectToViewbox } from '@/shared/dom/skyProjector';
import {
  IDENTITY_AFFINE,
  affineRotation,
  applyAffine,
  composeAffine,
  fitViewboxToCanvas,
  parseCssMatrix,
  projectPointsToCanvas,
  withOrigin,
} from './atmosphereProjection';

describe('parseCssMatrix', () => {
  test('parses a computed matrix()', () => {
    const m = parseCssMatrix('matrix(0.5, 0.1, -0.1, 0.5, 12, -7)');
    expect(m).toEqual({ a: 0.5, b: 0.1, c: -0.1, d: 0.5, e: 12, f: -7 });
  });

  test('maps none and junk to identity', () => {
    expect(parseCssMatrix('none')).toEqual(IDENTITY_AFFINE);
    expect(parseCssMatrix('matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)')).toEqual(IDENTITY_AFFINE);
  });
});

describe('affine composition', () => {
  test('composeAffine applies the second transform first', () => {
    const translate = { a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 };
    const scale = { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 };
    // scale then translate: (1, 1) → (2, 2) → (12, 22)
    const p = applyAffine(composeAffine(translate, scale), 1, 1);
    expect(p).toEqual({ x: 12, y: 22 });
  });

  test('withOrigin pivots a rotation about the given point', () => {
    const quarter = Math.PI / 2;
    const rotation = {
      a: Math.cos(quarter),
      b: Math.sin(quarter),
      c: -Math.sin(quarter),
      d: Math.cos(quarter),
      e: 0,
      f: 0,
    };
    const aboutCenter = withOrigin(rotation, 500, 500);
    const p = applyAffine(aboutCenter, 600, 500);
    expect(p.x).toBeCloseTo(500);
    expect(p.y).toBeCloseTo(600);
    // The origin itself is fixed.
    const o = applyAffine(aboutCenter, 500, 500);
    expect(o.x).toBeCloseTo(500);
    expect(o.y).toBeCloseTo(500);
  });

  test('affineRotation reads the rotation back out', () => {
    const angle = 0.37;
    const m = {
      a: Math.cos(angle),
      b: Math.sin(angle),
      c: -Math.sin(angle),
      d: Math.cos(angle),
      e: 3,
      f: 4,
    };
    expect(affineRotation(m)).toBeCloseTo(angle);
  });
});

describe('fitViewboxToCanvas', () => {
  test('cover scales to the larger ratio and centers the overflow', () => {
    const fit = fitViewboxToCanvas(2000, 1000, 1000, 'cover');
    expect(fit.scale).toBe(2);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBe(-500);
  });

  test('contain scales to the smaller ratio and letterboxes', () => {
    const fit = fitViewboxToCanvas(2000, 1000, 1000, 'contain');
    expect(fit.scale).toBe(1);
    expect(fit.offsetX).toBe(500);
    expect(fit.offsetY).toBe(0);
  });
});

describe('projectPointsToCanvas', () => {
  const camera: Camera = {
    position: { x: 0, y: 0, z: -2.5 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    fovY: Math.PI / 4,
    near: 0.1,
    far: 10,
  };
  const basis = cameraBasis(camera);

  test('agrees with the DOM projector — the registration guarantee', () => {
    // The WebGL halos must land exactly where skyProjector puts the
    // SVG stars. Same camera, identity CSS chain, square canvas at
    // 1:1 scale → the two pipelines must produce identical coords.
    const points = [unitVector(0.3, 0.2, 0.93), unitVector(-0.5, 0.1, 0.86)];
    const out = new Float32Array(points.length * 2);
    const fit = fitViewboxToCanvas(1000, 1000, 1000, 'cover');
    projectPointsToCanvas(points, camera, basis, IDENTITY_AFFINE, fit, 1000, out);
    for (const [i, point] of points.entries()) {
      const dom = projectToViewbox(point, camera, basis, 1000);
      expect(out[i * 2]).toBeCloseTo(dom.x, 3);
      expect(out[i * 2 + 1]).toBeCloseTo(dom.y, 3);
    }
  });

  test('applies the CSS chain and the fit', () => {
    const points = [unitVector(0, 0, 1)];
    const out = new Float32Array(2);
    // Pole projects to the viewbox center (500, 500). A +10/+20
    // translate then a 2× cover fit on a 2000×2000 canvas.
    const translate = { a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 };
    const fit = fitViewboxToCanvas(2000, 2000, 1000, 'cover');
    projectPointsToCanvas(points, camera, basis, translate, fit, 1000, out);
    expect(out[0]).toBeCloseTo(1020);
    expect(out[1]).toBeCloseTo(1040);
  });

  test('parks behind-camera points far offscreen', () => {
    const behind: Camera = { ...camera, position: { x: 0, y: 0, z: 2.5 } };
    // Looking from +z through the origin toward -z, the north pole
    // is behind once the camera passes it; project() reports
    // inFront=false for z ≤ 0 in camera space.
    const points = [unitVector(0, 0, 1)];
    const out = new Float32Array(2);
    const basisBehind = cameraBasis({ ...behind, target: { x: 0, y: 0, z: 5 } });
    projectPointsToCanvas(
      points,
      { ...behind, target: { x: 0, y: 0, z: 5 } },
      basisBehind,
      IDENTITY_AFFINE,
      fitViewboxToCanvas(1000, 1000, 1000, 'cover'),
      1000,
      out,
    );
    expect(out[0]).toBeLessThan(-1e4);
  });
});
