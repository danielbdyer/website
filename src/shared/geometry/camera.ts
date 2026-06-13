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

/** Rotate a vector around a unit axis by `angle` radians (Rodrigues'
 *  rotation formula). Pure; the magnitude of `v` is preserved. */
function rotateAroundAxis(v: Vec3, axis: UnitVector3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dotKV = axis.x * v.x + axis.y * v.y + axis.z * v.z;
  const crossX = axis.y * v.z - axis.z * v.y;
  const crossY = axis.z * v.x - axis.x * v.z;
  const crossZ = axis.x * v.y - axis.y * v.x;
  const k = (1 - c) * dotKV;
  return {
    x: v.x * c + crossX * s + axis.x * k,
    y: v.y * c + crossY * s + axis.y * k,
    z: v.z * c + crossZ * s + axis.z * k,
  };
}

/** Orbit a camera around its look-at target by a small yaw (about the
 *  camera's up) and pitch (about camera-right), keeping the target, up,
 *  and lens unchanged. This is the passive mouse-look peer: the camera
 *  shifts a few degrees toward the cursor so the scene shows real
 *  perspective parallax — near stars move more than far — without the
 *  centerpoint committing anywhere (that commitment is the drag's job).
 *  The orbit distance is preserved, since both rotations preserve the
 *  position's magnitude about the target. A zero offset returns the
 *  camera untouched (the common at-rest case). */
export function applyCameraLook(camera: Camera, yaw: number, pitch: number): Camera {
  if (yaw === 0 && pitch === 0) return camera;
  const yawed = rotateAroundAxis(camera.position, camera.up, yaw);
  const forward = normalize(
    {
      x: camera.target.x - yawed.x,
      y: camera.target.y - yawed.y,
      z: camera.target.z - yawed.z,
    },
    DEFAULT_FORWARD,
  );
  const right = normalize(cross(camera.up, forward), DEFAULT_RIGHT);
  return { ...camera, position: rotateAroundAxis(yawed, right, pitch) };
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

/** Mutable projection target for `projectInto` — the hot paths
 *  (the DOM projector and the atmosphere, once per element per
 *  frame) reuse one scratch instead of allocating a result per
 *  call. Same fields and semantics as ProjectedPoint. */
export interface ProjectedPointMut {
  screenX: number;
  screenY: number;
  depth: number;
  inFront: boolean;
}

/** Allocation-free `project`. Writes into `out` and returns it.
 *  Behavior is identical to `project`; the pair stays in lockstep. */
export function projectInto(
  point: Vec3,
  camera: Camera,
  basis: CameraBasis,
  aspect: number,
  out: ProjectedPointMut,
): ProjectedPointMut {
  const ox = point.x - camera.position.x;
  const oy = point.y - camera.position.y;
  const oz = point.z - camera.position.z;
  const zCam = ox * basis.forward.x + oy * basis.forward.y + oz * basis.forward.z;
  if (zCam <= 0) {
    out.screenX = 0;
    out.screenY = 0;
    out.depth = 1;
    out.inFront = false;
    return out;
  }
  const xCam = ox * basis.right.x + oy * basis.right.y + oz * basis.right.z;
  const yCam = ox * basis.up.x + oy * basis.up.y + oz * basis.up.z;
  const f = 1 / Math.tan(camera.fovY / 2);
  out.screenX = ((f / aspect) * xCam) / zCam;
  out.screenY = (f * yCam) / zCam;
  out.depth = clamp01((zCam - camera.near) / (camera.far - camera.near));
  out.inFront = true;
  return out;
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
