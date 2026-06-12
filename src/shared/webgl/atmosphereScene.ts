// The atmospheric layer's data contract — CONSTELLATION_HORIZON.md
// §"Data Contracts" names buildAtmosphericScene(graph). The horizon
// drafted it in normalized 2D before the latent sphere shipped; the
// lived form carries 3D unit positions so the atmosphere projects
// through the same camera the structural layer does.
//
// Pure derivation, computed once per graph (module load / fixture
// swap), never per frame. Deterministic: the same graph yields the
// same scene, and the motes' drift parameters hash from stable seeds
// so the dust returns to the same sky on every visit.

import type { ConstellationGraph } from '@/shared/content/constellation';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import { sphericalToUnit, spherical } from '@/shared/geometry/sphere';

const HUE_INDEX = { warm: 0, rose: 1, violet: 2, gold: 3 } as const;

export interface AtmosphericStar {
  /** `room/slug` — pairs the sprite with its structural anchor. */
  readonly key: string;
  readonly unitPosition: UnitVector3;
  /** Index into the accent palette: 0 warm · 1 rose · 2 violet · 3 gold. */
  readonly hueIndex: number;
  /** Twinkle phase in seconds, deterministic per slug (shared with
   *  the structural layer's data so both breathe on the same beat). */
  readonly twinklePhase: number;
  /** Size variance ∈ [0.75, 1.25] — each star's halo tuned to a
   *  slightly different luminance, per CONSTELLATION.md §"Night". */
  readonly sizeVariance: number;
}

export interface AtmosphericMote {
  /** Rest position — a point on a shell just above the sphere, so
   *  motes parallax more than stars when the camera orbits. */
  readonly basePosition: Vec3;
  /** Two tangent drift directions; the mote bobs along both. */
  readonly driftA: Vec3;
  readonly driftB: Vec3;
  /** Angular drift amplitude (radians) and frequencies (rad/s). */
  readonly amplitude: number;
  readonly frequencyA: number;
  readonly frequencyB: number;
  readonly phase: number;
  readonly sizeVariance: number;
}

export interface AtmosphericScene {
  readonly stars: readonly AtmosphericStar[];
  readonly motes: readonly AtmosphericMote[];
}

// FNV-1a, the same deterministic hash the graph layout uses —
// re-derived locally so this module doesn't reach into
// constellation.ts internals.
function hash(input: string): number {
  return (
    [...input].reduce(
      (h, ch) => Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16_777_619),
      2_166_136_261,
    ) >>> 0
  );
}

function unitOf(seed: string): number {
  return hash(seed) / (2 ** 32 - 1);
}

const MOTE_COUNT = 56;
// Shell radii just above the unit sphere — close enough to read as
// the sky's own air, far enough that the camera's orbit moves them
// visibly more than the stars beneath (nearer layers move more —
// the horizon doc's depth commitment).
const MOTE_SHELL_MIN = 1.04;
const MOTE_SHELL_MAX = 1.3;

function tangentPair(p: UnitVector3): { a: Vec3; b: Vec3 } {
  // Any vector not parallel to p seeds the frame; the pole's own
  // axis degenerates only at the pole itself, where the fallback
  // x-axis takes over.
  const ref: Vec3 = Math.abs(p.z) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 };
  const ax = p.y * ref.z - p.z * ref.y;
  const ay = p.z * ref.x - p.x * ref.z;
  const az = p.x * ref.y - p.y * ref.x;
  const am = Math.hypot(ax, ay, az) || 1;
  const a = { x: ax / am, y: ay / am, z: az / am };
  return {
    a,
    b: {
      x: p.y * a.z - p.z * a.y,
      y: p.z * a.x - p.x * a.z,
      z: p.x * a.y - p.y * a.x,
    },
  };
}

function buildMote(index: number): AtmosphericMote {
  const seed = `mote/${index}`;
  // Bias toward the upper hemisphere (the visible vault): colatitude
  // up to ~105° so a few motes drift near the horizon line.
  const theta = unitOf(`${seed}/theta`) * Math.PI * 0.58;
  const phi = unitOf(`${seed}/phi`) * Math.PI * 2;
  const onSphere = sphericalToUnit(spherical(theta, phi));
  const shell = MOTE_SHELL_MIN + unitOf(`${seed}/shell`) * (MOTE_SHELL_MAX - MOTE_SHELL_MIN);
  const { a, b } = tangentPair(onSphere);
  return {
    basePosition: { x: onSphere.x * shell, y: onSphere.y * shell, z: onSphere.z * shell },
    driftA: a,
    driftB: b,
    amplitude: 0.015 + unitOf(`${seed}/amp`) * 0.035,
    frequencyA: (Math.PI * 2) / (28 + unitOf(`${seed}/fa`) * 34),
    frequencyB: (Math.PI * 2) / (40 + unitOf(`${seed}/fb`) * 48),
    phase: unitOf(`${seed}/phase`) * Math.PI * 2,
    sizeVariance: 0.5 + unitOf(`${seed}/size`) * 0.9,
  };
}

const MOTES: readonly AtmosphericMote[] = Array.from({ length: MOTE_COUNT }, (_, i) =>
  buildMote(i),
);

export function buildAtmosphericScene(graph: ConstellationGraph): AtmosphericScene {
  const stars = graph.nodes.map((node) => ({
    key: `${node.room}/${node.slug}`,
    unitPosition: node.unitPosition,
    hueIndex: HUE_INDEX[node.hue],
    twinklePhase: node.twinklePhase,
    sizeVariance: 0.75 + unitOf(`${node.room}/${node.slug}/halo`) * 0.5,
  }));
  return { stars, motes: MOTES };
}

/** Resolve the active star's scene index from the structural
 *  layer's active key. -1 when nothing is claimed. */
export function activeStarIndex(scene: AtmosphericScene, activeKey: string | null): number {
  if (activeKey === null) return -1;
  return scene.stars.findIndex((star) => star.key === activeKey);
}
