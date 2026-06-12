// Pure 2D-composition math for the atmosphere's per-frame uploads.
//
// The structural SVG positions stars by projecting unit-sphere
// points through the navigation camera, then letting CSS compose
// three transforms on top: the cursor parallax translate, the
// camera yaw, and the 600s heavens rotation. For the WebGL halos to
// sit exactly beneath the SVG stars, the atmosphere replays the
// same chain: project through the same camera, apply the same
// affine stack (read from computed style each frame), then map
// viewbox coords to canvas pixels through the same
// preserveAspectRatio fit the SVG uses.
//
// Everything here is pure — DOM reads stay in the hook; this module
// only composes numbers. The `out` Float32Arrays are caller-owned,
// pre-allocated buffers mutated in place (hot path, once per frame).

import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import type { Vec3 } from '@/shared/geometry/sphere';
import { project } from '@/shared/geometry/camera';

/** Row-major 2D affine: x' = a·x + c·y + e; y' = b·x + d·y + f.
 *  Matches the CSS `matrix(a, b, c, d, e, f)` serialization. */
export interface Affine2D {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

export const IDENTITY_AFFINE: Affine2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/** Parse a computed `transform` value. `none` (and anything
 *  unparseable, e.g. a matrix3d from a future style change) maps to
 *  identity — the safe reading for "no 2D offset to replay." */
export function parseCssMatrix(transform: string): Affine2D {
  const match = /^matrix\(([^)]+)\)$/.exec(transform.trim());
  if (match?.[1] === undefined) return IDENTITY_AFFINE;
  const parts = match[1].split(',').map((v) => Number.parseFloat(v));
  if (parts.length !== 6 || parts.some((v) => Number.isNaN(v))) return IDENTITY_AFFINE;
  const [a, b, c, d, e, f] = parts as [number, number, number, number, number, number];
  return { a, b, c, d, e, f };
}

/** Compose two affines: returns m1 ∘ m2 (apply m2 first, then m1). */
export function composeAffine(m1: Affine2D, m2: Affine2D): Affine2D {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

/** Re-anchor a transform at an origin: T(origin) ∘ m ∘ T(-origin).
 *  CSS serializes `transform` without `transform-origin` baked in;
 *  the SVG groups pin their origin at the viewbox center, so the
 *  replay has to wrap the matrix the same way. */
export function withOrigin(m: Affine2D, originX: number, originY: number): Affine2D {
  return {
    a: m.a,
    b: m.b,
    c: m.c,
    d: m.d,
    e: m.e + originX - (m.a * originX + m.c * originY),
    f: m.f + originY - (m.b * originX + m.d * originY),
  };
}

export function applyAffine(m: Affine2D, x: number, y: number): { x: number; y: number } {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}

/** The viewbox→canvas mapping for a square viewBox under
 *  `xMidYMid slice` (cover) or `xMidYMid meet` (contain). */
export interface FitTransform {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export function fitViewboxToCanvas(
  widthPx: number,
  heightPx: number,
  viewboxSize: number,
  mode: 'cover' | 'contain',
): FitTransform {
  const sx = widthPx / viewboxSize;
  const sy = heightPx / viewboxSize;
  const scale = mode === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
  return {
    scale,
    offsetX: (widthPx - viewboxSize * scale) / 2,
    offsetY: (heightPx - viewboxSize * scale) / 2,
  };
}

// Mirrors skyProjector.projectToViewbox: screen +Y up flips to
// viewbox +Y down, and the image radius is 44% of the viewbox.
const VIEWBOX_RADIUS_RATIO = 0.44;

/**
 * Project unit-sphere positions into canvas pixels through the
 * camera, the SVG's CSS transform stack, and the viewbox fit.
 * Behind-camera points park far offscreen (the same trick the DOM
 * projector uses) so their sprites never paint.
 *
 * @bigO Time: O(N) per call, allocation-free. Hot path: once per
 *       atmosphere frame. Space: O(1) beyond the caller's buffer.
 */
export function projectPointsToCanvas(
  points: readonly Vec3[],
  camera: Camera,
  basis: CameraBasis,
  world: Affine2D,
  fit: FitTransform,
  viewboxSize: number,
  out: Float32Array,
): void {
  const center = viewboxSize / 2;
  const radius = viewboxSize * VIEWBOX_RADIUS_RATIO;
  for (const [i, point] of points.entries()) {
    const proj = project(point, camera, basis, 1);
    if (!proj.inFront) {
      out[i * 2] = -1e5;
      out[i * 2 + 1] = -1e5;
      continue;
    }
    const vx = center + proj.screenX * radius;
    const vy = center - proj.screenY * radius;
    const wx = world.a * vx + world.c * vy + world.e;
    const wy = world.b * vx + world.d * vy + world.f;
    out[i * 2] = fit.offsetX + wx * fit.scale;
    out[i * 2 + 1] = fit.offsetY + wy * fit.scale;
  }
}

/** Extract the rotation angle (radians) from an affine — the 600s
 *  heavens rotation read back from computed style, handed to the
 *  dome shader so the deep starfield turns with the sky. */
export function affineRotation(m: Affine2D): number {
  return Math.atan2(m.b, m.a);
}

// Re-export so the hook's per-frame path can type its buffers
// without importing the geometry module directly.
export { type UnitVector3 } from '@/shared/geometry/sphere';
