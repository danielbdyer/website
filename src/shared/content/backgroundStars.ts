// Background starfield — decorative pinpricks of light filling the
// celestial sphere beyond the named works. Each is a deterministic
// position on the unit sphere (Fibonacci-spiral distribution) plus a
// small per-star magnitude that scales radius and opacity. The
// constellation reads as dense (the reference's "library of stars"
// register) without making every dot a hypertext anchor — these are
// purely the atmosphere of stars between the named ones.
//
// Why Fibonacci spiral: the canonical "evenly distributed across a
// sphere without grid artifacts" pattern. 120 points distributed
// this way leave no obvious gap or band in the sky; rotating the
// camera around the globe always reveals roughly the same density.
//
// The set is computed once at module load and never mutates. No
// network, no I/O — pure math.

import type { UnitVector3 } from '@/shared/geometry/sphere';

export interface BackgroundStar {
  readonly id: string;
  readonly unitPos: UnitVector3;
  /** Per-star magnitude in [0.4, 0.8] — drives the star's rendered
   *  radius and opacity so the field has visual hierarchy without
   *  any dot competing with the named (linked) stars. */
  readonly magnitude: number;
}

/** Number of background stars rendered across the sphere. 120 gives
 *  ~60 visible on the front hemisphere at any time, which combined
 *  with the named works' ~10-15 visible reads as the dense
 *  Hevelius-register sky without taxing the projector beyond what
 *  the heavy fixture already costs. */
const BACKGROUND_STAR_COUNT = 120;

const GOLDEN_ANGLE = Math.PI * (1 + Math.sqrt(5));

function fibonacciSpherePoint(i: number, total: number): UnitVector3 {
  const y = 1 - ((i + 0.5) * 2) / total;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * GOLDEN_ANGLE;
  return {
    x: Math.cos(theta) * radius,
    y,
    z: Math.sin(theta) * radius,
  };
}

/** FNV-1a 32-bit hash. Same primitive used elsewhere in the content
 *  layer; copied here rather than imported so the background-stars
 *  module stays self-contained and side-effect-free. */
function hash(input: string): number {
  return (
    [...input].reduce(
      (h, ch) => Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16_777_619),
      2_166_136_261,
    ) >>> 0
  );
}

const UINT32_MAX = 2 ** 32 - 1;

export const BACKGROUND_STARS: readonly BackgroundStar[] = Array.from(
  { length: BACKGROUND_STAR_COUNT },
  (_, i) => {
    const id = `bg-${String(i)}`;
    const m = hash(id) / UINT32_MAX;
    return {
      id,
      unitPos: fibonacciSpherePoint(i, BACKGROUND_STAR_COUNT),
      magnitude: 0.4 + m * 0.4,
    };
  },
);
