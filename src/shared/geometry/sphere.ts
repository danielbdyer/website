// Spherical and Cartesian geometry on the unit sphere.
//
// The site's latent topology is a unit sphere in 3D. Each work has
// a position on that sphere. Today's 2D constellation is the
// azimuthal-equidistant projection of the upper hemisphere onto a
// disk: the disk's center is the north pole (the polestar), the
// rim is the equator. As more works land, the populated subregion
// (the cairn) grows toward — but never reaches — the full sphere.
//
// This module is generic spherical geometry. Domain knowledge —
// where the rooms sit, what the pole means — lives in
// constellation.ts. Here we only commit to the math.
//
// Conventions: colatitude θ ∈ [0, π] (0 = north pole, π = south
// pole); longitude φ ∈ [0, 2π) measured counterclockwise from
// the +x axis. The Cartesian basis is right-handed: y is the
// "vertical" axis when projecting to a 2D viewer, +z is "up
// toward the north pole."
//
// All functions are pure and total. Smart constructors normalize
// out-of-domain inputs (clamp θ, wrap φ, normalize Cartesian
// vectors) so callers never have to validate themselves.

const TWO_PI = 2 * Math.PI;
const HALF_PI = Math.PI / 2;

/** Position in spherical coordinates on the unit sphere.
 *  Construct via `spherical(theta, phi)` to normalize bounds. */
export interface Spherical {
  readonly theta: number;
  readonly phi: number;
}

/** A unit vector in 3D — the invariant `x² + y² + z² ≈ 1` holds.
 *  Construct via `unitVector(x, y, z)` to normalize, or via
 *  `sphericalToUnit(s)` which is unit by construction. */
export interface UnitVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Smart constructor: clamps θ to [0, π], wraps φ to [0, 2π). */
export function spherical(theta: number, phi: number): Spherical {
  const t = clamp(theta, 0, Math.PI);
  const p = ((phi % TWO_PI) + TWO_PI) % TWO_PI;
  return { theta: t, phi: p };
}

/** Smart constructor: normalizes the input vector to unit length.
 *  The zero vector has no defined direction; we return north-pole
 *  as a total fallback rather than throw, matching the rest of
 *  this module's totality. Callers in hot paths should pre-check. */
export function unitVector(x: number, y: number, z: number): UnitVector3 {
  const m = Math.hypot(x, y, z);
  if (m === 0) return NORTH_POLE;
  return { x: x / m, y: y / m, z: z / m };
}

/** The north pole: θ = 0, equivalently (0, 0, 1). The polestar
 *  sits here in the constellation's projection. */
export const NORTH_POLE: UnitVector3 = { x: 0, y: 0, z: 1 };

/** The south pole: θ = π, equivalently (0, 0, -1). */
export const SOUTH_POLE: UnitVector3 = { x: 0, y: 0, z: -1 };

/** Convert spherical to Cartesian. Unit by construction; no
 *  re-normalization needed. */
export function sphericalToUnit({ theta, phi }: Spherical): UnitVector3 {
  const sinT = Math.sin(theta);
  return {
    x: sinT * Math.cos(phi),
    y: sinT * Math.sin(phi),
    z: Math.cos(theta),
  };
}

/** Convert a unit Cartesian vector back to spherical coordinates.
 *  At the poles φ is undefined; we return φ = 0 as the canonical
 *  representative so the conversion is total. */
export function unitToSpherical(v: UnitVector3): Spherical {
  const theta = Math.acos(clamp(v.z, -1, 1));
  // At the poles sin(θ) → 0 and atan2 is unstable; return φ = 0.
  if (theta < 1e-9 || theta > Math.PI - 1e-9) return spherical(theta, 0);
  const phi = Math.atan2(v.y, v.x);
  return spherical(theta, phi);
}

/** Great-circle (geodesic) distance between two points on the
 *  unit sphere, in radians ∈ [0, π]. The natural metric for "how
 *  far across the cairn is it from here to there." Implemented via
 *  the chord/Haversine relation rather than `acos(dot)` because the
 *  latter is numerically unstable near 0 — tiny floating-point
 *  noise in unit-norm vectors becomes a non-trivial error after
 *  acos. The chord form gives exactly 0 for identical points and
 *  exactly π for antipodes. */
export function geodesicDistance(a: UnitVector3, b: UnitVector3): number {
  const chord = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  return 2 * Math.asin(clamp(chord / 2, 0, 1));
}

/** Inverse azimuthal-equidistant projection: given a point on the
 *  2D unit disk (radius ∈ [0, 1] from the disk's center, an angle
 *  in radians around the disk), return its position on the upper
 *  hemisphere. Center → north pole. Rim → equator. The standard
 *  map projection used to flatten a hemisphere onto a circle while
 *  preserving angles measured from the center. The site's 2D
 *  layout is exactly this projection, so adding `unitPosition` is
 *  un-projecting — putting back the z component the disk dropped. */
export function diskToHemisphere(unitRadius: number, angleRadians: number): UnitVector3 {
  const r = clamp(unitRadius, 0, 1);
  return sphericalToUnit(spherical(r * HALF_PI, angleRadians));
}

/** A 3D vector that may not be unit-length. Used for tangent
 *  vectors (perpendicular to a sphere position) and forces. */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Unit tangent vector at `from` pointing along the great circle
 *  toward `to`. The result lies in the tangent plane at `from`
 *  (perpendicular to `from`) and has unit length. When `from` and
 *  `to` are the same point or antipodal, returns the zero vector
 *  (no defined direction); callers should treat that case as "no
 *  pull." */
export function tangentTowards(from: UnitVector3, to: UnitVector3): Vec3 {
  const dot = from.x * to.x + from.y * to.y + from.z * to.z;
  // Project `to` onto the tangent plane at `from`: `to - dot * from`.
  const tx = to.x - dot * from.x;
  const ty = to.y - dot * from.y;
  const tz = to.z - dot * from.z;
  const m = Math.hypot(tx, ty, tz);
  if (m < 1e-12) return { x: 0, y: 0, z: 0 };
  return { x: tx / m, y: ty / m, z: tz / m };
}

/** Re-project `v` onto the tangent plane at `p` by removing the
 *  component along `p`. The result is perpendicular to `p`. Used
 *  to keep velocity tangent after numerical drift. */
export function projectOntoTangentPlane(v: Vec3, p: UnitVector3): Vec3 {
  const dot = v.x * p.x + v.y * p.y + v.z * p.z;
  return { x: v.x - dot * p.x, y: v.y - dot * p.y, z: v.z - dot * p.z };
}

/** Step a unit-sphere position forward by a tangent vector. Adds
 *  `tangent * dt` to the position (a small straight-line step in
 *  the tangent plane), then re-normalizes onto the sphere. Stable
 *  for small dt; accumulates angular error for large dt that
 *  callers should mitigate by clamping dt. */
export function stepOnSphere(p: UnitVector3, tangent: Vec3, dt: number): UnitVector3 {
  return unitVector(p.x + tangent.x * dt, p.y + tangent.y * dt, p.z + tangent.z * dt);
}

/** Spherical linear interpolation between two unit vectors. t ∈
 *  [0, 1]; t=0 returns `from`, t=1 returns `to`. The path is the
 *  great circle from `from` to `to`. Falls back to linear-then-
 *  normalize at near-identity (where slerp is numerically unstable
 *  and the result equals lerp anyway). */
export function slerp(from: UnitVector3, to: UnitVector3, t: number): UnitVector3 {
  const dot = clamp(from.x * to.x + from.y * to.y + from.z * to.z, -1, 1);
  const omega = Math.acos(dot);
  if (omega < 1e-6) {
    return unitVector(
      from.x + (to.x - from.x) * t,
      from.y + (to.y - from.y) * t,
      from.z + (to.z - from.z) * t,
    );
  }
  const sinO = Math.sin(omega);
  const a = Math.sin((1 - t) * omega) / sinO;
  const b = Math.sin(t * omega) / sinO;
  return unitVector(a * from.x + b * to.x, a * from.y + b * to.y, a * from.z + b * to.z);
}

/** Ray-sphere intersection with the unit sphere centered at the
 *  origin. Returns the nearer-to-origin-of-ray intersection point
 *  on the sphere, or null if the ray misses. The ray is `origin +
 *  t * direction` for t ≥ 0; direction must be a unit vector. */
export function raySphereIntersect(origin: Vec3, direction: Vec3): UnitVector3 | null {
  // Quadratic: ||origin + t*dir||^2 = 1
  // → t^2 + 2 (origin·dir) t + (||origin||^2 - 1) = 0
  const b = origin.x * direction.x + origin.y * direction.y + origin.z * direction.z;
  const c = origin.x * origin.x + origin.y * origin.y + origin.z * origin.z - 1;
  const disc = b * b - c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const tNear = -b - sq;
  const t = tNear >= 0 ? tNear : -b + sq;
  if (t < 0) return null;
  return unitVector(
    origin.x + t * direction.x,
    origin.y + t * direction.y,
    origin.z + t * direction.z,
  );
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
