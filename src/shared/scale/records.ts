// The records: one speed record and one object of scale each, as data.
//
// A record is a fact (a subject and its speed, with its source and its
// date), a unit (the object of scale it is measured in), the sentence
// the page says, and a character: seven tubes, drawn head to tail in
// stage units. The rate on the stage — units per second — is derived
// from the facts and never typed by hand; the test in records.test.ts
// walks every record and checks that the sentence still holds. If a
// record falls, one edit to `speedMs` moves the motion, the counter,
// and the tempo, and the test says whether the line is still true.
// OBJECTS_OF_SCALE.md §"A page is data".

import type { Tube, Vec2 } from './tubes';

/** The ladder's tiers, slow end first. */
export type Tier = 'slow' | 'bodies' | 'machines' | 'offplanet' | 'finale';

/** The flat black silhouette that tiles the ground. */
export type Silhouette = 'field' | 'banana';

export interface Subject {
  readonly name: string;
  readonly speedMs: number;
  readonly holder: string;
  readonly source: string;
  readonly asOf: string;
}

export interface Unit {
  readonly name: string;
  readonly plural: string;
  readonly lengthM: number;
  readonly silhouette: Silhouette;
  /** How much of the stage's width one unit spans on screen. */
  readonly screenWidth: number;
}

export interface Clock {
  readonly mode: 'real' | 'lapse' | 'slowmo';
  readonly factor: number;
}

/** The entry pose: the angle the ribbons stream in on (radians, screen
 *  coordinates), their spacing, and the wave along them. */
export interface Ribbon {
  readonly angle: number;
  readonly spread: number;
  readonly wave: number;
}

/** Exactly seven: the same seven straws play every role. */
export type Seven<T> = readonly [T, T, T, T, T, T, T];

export interface SpeedRecord {
  readonly id: string;
  /** The record's place on the ladder of twenty-four, zero-based. */
  readonly rung: number;
  readonly tier: Tier;
  readonly line: string;
  /** The count the line claims, so the test can hold the sentence to
   *  the math: "One football field" is 1, "a banana and a half" 1.5. */
  readonly claim: number;
  readonly subject: Subject;
  readonly unit: Unit;
  readonly clock: Clock;
  readonly color: string;
  readonly ribbon: Ribbon;
  readonly tubes: Seven<Tube>;
}

/** The stage the characters are authored on: a box in stage units,
 *  the ground line near its foot. The painter fits it to the screen. */
export const STAGE = { width: 1000, height: 600, ground: 520 } as const;

/** The ladder has twenty-four rungs; two are drawn. */
export const LADDER_LENGTH = 24;

// ─── Derived, never stored ─────────────────────────────────────────

/** Units per second on the stage. */
export const rateOf = (record: SpeedRecord): number => record.subject.speedMs / record.unit.lengthM;

/** One beat per unit passed: the page's tempo. */
export const bpmOf = (record: SpeedRecord): number => rateOf(record) * 60;

/** Above this the tiled units strobe on a 60 Hz screen. */
export const RATE_CEILING = 8;

// ─── Authoring helpers ─────────────────────────────────────────────

/** A local frame for drawing a character: `a` runs along the body's
 *  heading (forward positive), `b` across it (below positive). */
const facing =
  (center: Vec2, headingDeg: number) =>
  (a: number, b: number): Vec2 => {
    const h = (headingDeg * Math.PI) / 180;
    return {
      x: center.x + a * Math.cos(h) - b * Math.sin(h),
      y: center.y + a * Math.sin(h) + b * Math.cos(h),
    };
  };

const tube = (radius: number, z: number, points: readonly Vec2[]): Tube => ({
  points,
  radius,
  z,
});

// ─── 10 · The peregrine falcon, diving ─────────────────────────────

const falcon = facing({ x: 500, y: 236 }, 24);

const FALCON: SpeedRecord = {
  id: 'falcon',
  rung: 10,
  tier: 'bodies',
  line: 'One football field per second.',
  claim: 1,
  subject: {
    name: 'Peregrine falcon, diving',
    speedMs: 108.2,
    holder: '"Frightful", timed by Ken Franklin',
    source: 'Guinness World Records, fastest bird in a dive',
    asOf: '2005',
  },
  unit: {
    name: 'football field',
    plural: 'football fields',
    lengthM: 109.73,
    silhouette: 'field',
    screenWidth: 0.92,
  },
  clock: { mode: 'real', factor: 1 },
  color: '#f0644a',
  ribbon: { angle: (24 * Math.PI) / 180, spread: 26, wave: 10 },
  // Seen from below, on the diagonal of the stoop: a body, two sickle
  // wings swept back into a narrow chevron, a short fan of tail. The
  // beak is the spine's last bend, hooked down.
  tubes: [
    // t1 · the spine, beak to tail
    tube(17, 7, [
      falcon(214, 14),
      falcon(206, -2),
      falcon(160, -6),
      falcon(60, 0),
      falcon(-40, 4),
      falcon(-130, 2),
      falcon(-196, 0),
    ]),
    // t2 · the far wing's leading edge, shoulder to tip, bowed outward
    tube(9, 3, [falcon(84, -16), falcon(30, -62), falcon(-50, -104), falcon(-160, -128)]),
    // t3 · the near wing's leading edge
    tube(9, 5, [falcon(84, 16), falcon(30, 62), falcon(-50, 104), falcon(-160, 128)]),
    // t4 · the near wing's trailing edge, hip to tip, curved in
    tube(7, 4, [falcon(-70, 14), falcon(-96, 36), falcon(-128, 76), falcon(-160, 128)]),
    // t5 · the far wing's trailing edge
    tube(7, 2, [falcon(-70, -14), falcon(-96, -36), falcon(-128, -76), falcon(-160, -128)]),
    // t6 · the tail's far feathers
    tube(7, 1, [falcon(-176, -6), falcon(-226, -24), falcon(-258, -38)]),
    // t7 · the tail's near feathers
    tube(7, 6, [falcon(-176, 6), falcon(-226, 24), falcon(-258, 38)]),
  ],
};

// ─── 05 · Bertie, the fastest tortoise ─────────────────────────────

const BERTIE: SpeedRecord = {
  id: 'bertie',
  rung: 5,
  tier: 'slow',
  line: 'A banana and a half per second.',
  claim: 1.5,
  subject: {
    name: 'Bertie, the fastest tortoise',
    speedMs: 0.28,
    holder: 'Bertie, a leopard tortoise, at Adderley in County Durham',
    source: 'Guinness World Records, fastest tortoise',
    asOf: '2014',
  },
  unit: {
    name: 'banana',
    plural: 'bananas',
    lengthM: 0.19,
    silhouette: 'banana',
    screenWidth: 0.11,
  },
  clock: { mode: 'real', factor: 1 },
  color: '#6f9a45',
  ribbon: { angle: 0, spread: 34, wave: 22 },
  // Four straws coil into a squat dome of shell, rolling inward; the
  // neck reaches forward low to the ground; two stubs of leg.
  tubes: [
    // t1 · the neck and head, beak first
    tube(19, 6, [
      { x: 836, y: 466 },
      { x: 796, y: 450 },
      { x: 750, y: 448 },
      { x: 708, y: 460 },
      { x: 676, y: 480 },
    ]),
    // t2 · the shell's outer coil
    tube(18, 5, [
      { x: 690, y: 470 },
      { x: 660, y: 356 },
      { x: 536, y: 262 },
      { x: 390, y: 270 },
      { x: 300, y: 350 },
      { x: 296, y: 470 },
    ]),
    // t3 · the second coil
    tube(16, 4, [
      { x: 650, y: 456 },
      { x: 604, y: 372 },
      { x: 516, y: 328 },
      { x: 416, y: 340 },
      { x: 360, y: 410 },
      { x: 354, y: 456 },
    ]),
    // t4 · the third coil
    tube(14, 3, [
      { x: 610, y: 440 },
      { x: 572, y: 394 },
      { x: 510, y: 372 },
      { x: 442, y: 382 },
      { x: 406, y: 430 },
    ]),
    // t5 · the innermost coil
    tube(12, 2, [
      { x: 562, y: 422 },
      { x: 536, y: 402 },
      { x: 500, y: 398 },
      { x: 470, y: 414 },
    ]),
    // t6 · the front leg
    tube(22, 7, [
      { x: 638, y: 478 },
      { x: 648, y: 498 },
      { x: 654, y: 516 },
    ]),
    // t7 · the back leg
    tube(22, 1, [
      { x: 352, y: 478 },
      { x: 342, y: 498 },
      { x: 336, y: 516 },
    ]),
  ],
};

/** The ladder as drawn so far, in reading order: the slow end first. */
export const RECORDS: readonly SpeedRecord[] = [BERTIE, FALCON];

export const recordById = (id: string): SpeedRecord | null =>
  RECORDS.find((record) => record.id === id) ?? null;
