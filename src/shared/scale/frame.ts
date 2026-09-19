// The frame: what the seven straws are doing at one moment.
//
// A pure function from the record on stage, the page's clock, and the
// scroll to the pose of every tube and the offset of the treadmill —
// the whole picture as data, for the painter to draw. Poses are
// computed once per record and cached; the morph between two poses is
// computed per frame in bends, so a straw keeps its length as it
// bends (tubes.ts). OBJECTS_OF_SCALE.md §"The morph".

import { FOLD_MS, RIBBONS_MS, type Phase, type Scroll, phaseOf, unitsPassed } from './director';
import { STAGE, type SpeedRecord } from './records';
import {
  SAMPLES,
  add,
  bend,
  lerp,
  polar,
  pose,
  scale,
  smoothstep,
  type Tube,
  type Vec2,
} from './tubes';

export interface Strand {
  readonly points: readonly Vec2[];
  readonly radius: number;
  readonly z: number;
  readonly color: string;
}

export interface Frame {
  readonly phase: Phase;
  readonly strands: readonly Strand[];
  /** Where the treadmill stands between two units, in [0, 1). */
  readonly treadmill: number;
  /** How far the stage has been scrolled away from, in [0, 1]. */
  readonly leaving: number;
}

/** The ribbons begin this far up their own axis, off the stage. */
const RIBBON_RUN = 1500;
const RIBBON_LENGTH = 1200;
const CENTER: Vec2 = { x: STAGE.width / 2, y: STAGE.height / 2 - 40 };

// ─── Poses ─────────────────────────────────────────────────────────

/** Tube `k`'s ribbon: a line through the stage on the record's entry
 *  angle, spaced from its neighbors, with a lazy wave along it, and
 *  shifted `run` units back up the axis. Head first: the head is the
 *  end farthest along the direction of travel. */
export function ribbonOf(record: SpeedRecord, k: number, run: number): Vec2[] {
  const { angle, spread, wave } = record.ribbon;
  const along = polar(angle, 1);
  const across = polar(angle + Math.PI / 2, 1);
  const lane = (k - 3) * spread;
  return Array.from({ length: SAMPLES }, (_, i) => {
    const s = RIBBON_LENGTH / 2 - (RIBBON_LENGTH * i) / (SAMPLES - 1) - run;
    const ripple = wave * Math.sin(s / 120 + k * 0.9);
    return add(CENTER, add(scale(along, s), scale(across, lane + ripple)));
  });
}

const characterPoses = new Map<string, readonly (readonly Vec2[])[]>();

/** The record's character, each tube smoothed and resampled, cached
 *  by id. */
export function characterOf(record: SpeedRecord): readonly (readonly Vec2[])[] {
  const cached = characterPoses.get(record.id);
  if (cached) return cached;
  const poses = record.tubes.map((tube: Tube) => pose(tube.points));
  characterPoses.set(record.id, poses);
  return poses;
}

// ─── The picture at one moment ─────────────────────────────────────

const easeOut = (t: number): number => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3;

/** Where tube `k` is on the page's own clock: streaming in as a
 *  ribbon, folding head to tail, or holding as the character. */
function strandOnClock(record: SpeedRecord, k: number, elapsedMs: number): readonly Vec2[] {
  const character = characterOf(record)[k] ?? [];
  if (elapsedMs < RIBBONS_MS) {
    return ribbonOf(record, k, RIBBON_RUN * (1 - easeOut(elapsedMs / RIBBONS_MS)));
  }
  const t = (elapsedMs - RIBBONS_MS) / FOLD_MS;
  return t >= 1 ? character : bend(ribbonOf(record, k, 0), character, t, 'head');
}

/** Where tube `k` is as the visitor scrolls away: unknotting tail
 *  first into this record's ribbons over the first half of the
 *  leaving, then carried on to the next record's ribbons, up their own
 *  axis, over the second — so the same straws arrive as the next
 *  page's entrance. */
function strandLeaving(
  record: SpeedRecord,
  next: SpeedRecord | null,
  k: number,
  leaving: number,
): readonly Vec2[] {
  const character = characterOf(record)[k] ?? [];
  const ribbon = ribbonOf(record, k, 0);
  if (leaving < 0.5) return bend(character, ribbon, smoothstep(leaving / 0.5), 'tail');
  if (!next) return ribbon;
  const t = smoothstep((leaving - 0.5) / 0.5);
  return bend(ribbon, ribbonOf(next, k, RIBBON_RUN), t, 'head', 0.2);
}

/** The strands' color shifts toward the next record's through the
 *  middle of the leaving. */
function colorLeaving(record: SpeedRecord, next: SpeedRecord | null, leaving: number): string {
  if (!next || leaving <= 0.3) return record.color;
  if (leaving >= 0.7) return next.color;
  return mixHex(record.color, next.color, (leaving - 0.3) / 0.4);
}

/** Mix two `#rrggbb` colors in sRGB. */
export function mixHex(a: string, b: string, t: number): string {
  const channel = (i: number): string => {
    const from = Number.parseInt(a.slice(1 + i * 2, 3 + i * 2), 16);
    const to = Number.parseInt(b.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(lerp(from, to, t))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function frameOf(
  record: SpeedRecord,
  next: SpeedRecord | null,
  elapsedMs: number,
  scroll: Scroll,
): Frame {
  const phase = phaseOf(elapsedMs, scroll);
  const leaving = phase === 'unfolding' ? scroll.fraction : 0;
  const color = colorLeaving(record, next, leaving);
  const strands = record.tubes.map((tube, k) => ({
    points:
      phase === 'unfolding'
        ? strandLeaving(record, next, k, leaving)
        : strandOnClock(record, k, elapsedMs),
    radius: tube.radius,
    z: tube.z,
    color,
  }));
  return { phase, strands, treadmill: unitsPassed(record, elapsedMs) % 1, leaving };
}
