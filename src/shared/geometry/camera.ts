// Pinhole camera math for the constellation's 3D scene.
//
// The latent topology is a unit sphere (sphere.ts). The renderer
// flattens that sphere to the viewbox by projecting each
// `unitPosition` through a camera. Phase B holds the camera fixed:
// positioned below the sphere, looking up at the upper hemisphere,
// FOV chosen so the equator-rim sits just inside the frame. Phase C
// gives the camera state and lets the navigation hook drive it.
//
// The math: a standard right-handed look-at frame followed by a
// perspective divide. World point P → camera-space (x, y, z) where
// +z is "in front of camera" → screen (x/z, y/z) scaled by focal
// length 1/tan(fovY/2) and horizontal aspect. All pure functions.
// Smart constructors aren't needed here — Camera is a record of
// independently-meaningful values, validated only when the
// orientation degenerates (look-at == position), in which case the
// basis collapses to a stable default rather than producing NaN.

import type { UnitVector3 } from './sphere';

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Camera {
  readonly position: Vec3;
  readonly target: Vec3;
  readonly up: UnitVector3;
  /** Vertical field of view in radians. */
  readonly fovY: number;
  readonly near: number;
  readonly far: number;
}

export interface CameraBasis {
  /** From position toward target, unit length. */
  readonly forward: UnitVector3;
  /** Camera-right, unit length. */
  readonly right: UnitVector3;
  /** Re-orthogonalized camera-up, unit length. */
  readonly up: UnitVector3;
}

export interface ProjectedPoint {
  /** Normalized horizontal coord ∈ [-1, 1] (±1 = frustum edge). */
  readonly screenX: number;
  /** Normalized vertical coord ∈ [-1, 1]; +1 = up in image. */
  readonly screenY: number;
  /** Normalized depth ∈ [0, 1]; 0 = near plane, 1 = far plane. */
  readonly depth: number;
  /** False when the point is behind the camera (z ≤ 0 in camera space). */
  readonly inFront: boolean;
}

const DEFAULT_FORWARD: UnitVector3 = { x: 0, y: 0, z: 1 };
const DEFAULT_RIGHT: UnitVector3 = { x: 1, y: 0, z: 0 };
const DEFAULT_UP: UnitVector3 = { x: 0, y: 1, z: 0 };

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function normalize(v: Vec3, fallback: UnitVector3): UnitVector3 {
  const m = Math.hypot(v.x, v.y, v.z);
  if (m === 0) return fallback;
  return { x: v.x / m, y: v.y / m, z: v.z / m };
}

/** Build the camera's right-handed basis from its position, target,
 *  and up vector. Cross-product order follows the OpenGL look-at
 *  convention: right = up × forward, then up = forward × right. This
 *  makes +x in the camera's right-direction for a forward-facing
 *  scene. Degenerate inputs (target == position, or up parallel to
 *  forward) collapse to a stable default rather than producing NaN. */
export function cameraBasis(camera: Camera): CameraBasis {
  const forward = normalize(sub(camera.target, camera.position), DEFAULT_FORWARD);
  const right = normalize(cross(camera.up, forward), DEFAULT_RIGHT);
  const up = normalize(cross(forward, right), DEFAULT_UP);
  return { forward, right, up };
}

/** Project a world-space point through the camera. Behind-camera
 *  points return `inFront: false` with the screen coords pinned at
 *  the image center — the consumer decides whether to render them. */
export function project(
  point: Vec3,
  camera: Camera,
  basis: CameraBasis,
  aspect: number,
): ProjectedPoint {
  const offset = sub(point, camera.position);
  const xCam = dot(offset, basis.right);
  const yCam = dot(offset, basis.up);
  const zCam = dot(offset, basis.forward);
  if (zCam <= 0) return { screenX: 0, screenY: 0, depth: 1, inFront: false };
  const f = 1 / Math.tan(camera.fovY / 2);
  const screenX = ((f / aspect) * xCam) / zCam;
  const screenY = (f * yCam) / zCam;
  const depth = clamp01((zCam - camera.near) / (camera.far - camera.near));
  return { screenX, screenY, depth, inFront: true };
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/** Inverse of `project`: given normalized screen coords (x, y in
 *  [-1, 1]) return the world-space ray cast through that screen
 *  point. The ray's origin is the camera position; its direction
 *  is a unit vector. Composes with raySphereIntersect to lift 2D
 *  pointer events onto the latent sphere. */
export function unproject(
  screenX: number,
  screenY: number,
  camera: Camera,
  basis: CameraBasis,
  aspect: number,
): { origin: Vec3; direction: UnitVector3 } {
  const f = 1 / Math.tan(camera.fovY / 2);
  // World-space ray direction in camera basis: (xCam, yCam, 1) where
  // xCam and yCam are the inverse of the perspective divide. zCam = 1
  // since we're going forward by one focal length.
  const xCam = (screenX * aspect) / f;
  const yCam = screenY / f;
  // Compose into world space: dir = right * xCam + up * yCam + forward.
  const dx = basis.right.x * xCam + basis.up.x * yCam + basis.forward.x;
  const dy = basis.right.y * xCam + basis.up.y * yCam + basis.forward.y;
  const dz = basis.right.z * xCam + basis.up.z * yCam + basis.forward.z;
  const m = Math.hypot(dx, dy, dz);
  return {
    origin: camera.position,
    direction: { x: dx / m, y: dy / m, z: dz / m },
  };
}
