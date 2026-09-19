// The director: the page's clock, and what the page is doing on it.
//
// One record is on stage at a time. Its clock starts at zero when the
// visitor arrives, pauses when asked (or when the tab is hidden), and
// is read as a difference of timestamps — never a sum of frame deltas,
// which drift and are throttled in a background tab. Everything that
// runs on the page's own clock (the ribbons entering, the fold, the
// treadmill, the counter) is a pure function of the elapsed time;
// only the unfolding is driven by the scroll instead. Pure: the shell
// (useBestiary) reads the clock and the scroll and hands them here.
// OBJECTS_OF_SCALE.md §"Two kinds of time".

import { rateOf, type SpeedRecord } from './records';

/** How the page's cycle goes: ribbons (the page arrives, clock at
 *  zero) → folding (the elbows set, head to tail) → character (looping
 *  at the true rate for as long as you stay) → unfolding (the scroll
 *  takes it apart; released early, it refolds). */
export type Phase = 'ribbons' | 'folding' | 'character' | 'unfolding';

/** The ribbons enter and lay the scene down, then fold, in this time. */
export const RIBBONS_MS = 900;
export const FOLD_MS = 550;

export interface Director {
  /** Which record is on stage, by its place in the drawn ladder. */
  readonly on: number;
  readonly arrivedAt: number;
  readonly pausedAt: number | null;
  /** Time spent paused before the current pause, in ms. */
  readonly pausedFor: number;
}

export interface Scroll {
  /** The whole page index the scroll is past. */
  readonly index: number;
  /** How far toward the next page, 0 at rest on a page. */
  readonly fraction: number;
}

/** Arrive at a record: the clock resets to zero. Arrival is reserved
 *  for coming from a different page; a scroll that snaps back to the
 *  same page resumes instead. */
export function arrive(on: number, at: number): Director {
  return { on, arrivedAt: at, pausedAt: null, pausedFor: 0 };
}

export function pause(director: Director, at: number): Director {
  return director.pausedAt === null ? { ...director, pausedAt: at } : director;
}

export function resume(director: Director, at: number): Director {
  if (director.pausedAt === null) return director;
  return {
    ...director,
    pausedAt: null,
    pausedFor: director.pausedFor + (at - director.pausedAt),
  };
}

export const isPaused = (director: Director): boolean => director.pausedAt !== null;

/** Milliseconds the page has run, excluding time paused. */
export function elapsedOf(director: Director, at: number): number {
  const until = director.pausedAt ?? at;
  return Math.max(0, until - director.arrivedAt - director.pausedFor);
}

/** What the page is doing: the scroll takes precedence (a page being
 *  scrolled away from is unfolding), then the clock. */
export function phaseOf(elapsedMs: number, scroll: Scroll): Phase {
  if (scroll.fraction > 0) return 'unfolding';
  if (elapsedMs < RIBBONS_MS) return 'ribbons';
  if (elapsedMs < RIBBONS_MS + FOLD_MS) return 'folding';
  return 'character';
}

/** Units passed since arrival, on the record's own clock. A whole
 *  number is a beat; the fraction is where the treadmill stands
 *  between two units. */
export function unitsPassed(record: SpeedRecord, elapsedMs: number): number {
  return rateOf(record) * (elapsedMs / 1000) * record.clock.factor;
}

export const countOf = (record: SpeedRecord, elapsedMs: number): number =>
  Math.floor(unitsPassed(record, elapsedMs));
