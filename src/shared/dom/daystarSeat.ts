// The daystar's seat: where the nav's glyph rests, and the fixed
// element that takes its place while the eye moves (the ninth pass,
// with Danny: *the moon character to moon glyph transition jumps
// around a bit; it doesn't feel contiguous in its animation frames*).
// The glyph lives inside the nav, and the nav falls away with the
// page — so the transition used to fly the moon from below the frame
// on the ascent, and on the descent to wherever the room stood at its
// first paint: places the visitor never saw it. Now the glyph is
// lifted out of the page the moment the eye begins to move. The seat,
// fixed and outside the stage, shows the same icon at the icon's own
// rest — the glyph hidden beneath it, so the falling page leaves the
// moon where it is — rises and grows through the lift to exactly
// where the sky will seat its daystar, and carries the transition's
// name there: the transition has nothing to fly and only turns the
// moon in place. On the way down the seat begins where the daystar
// stood, the turn plays, and once the room has settled the seat comes
// down to the corner and gives the glyph its place back.

import { SIGNATURE_EASE, tween } from './lookUp';

export interface SeatRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** The daystar's box on /sky for a viewport, in page pixels — the
 *  plate's corner emblem, seated by the sky's projector
 *  (dom/skyProjector.ts `projectDaystar` over content/skyWalk.ts
 *  `daystarViewboxPoint`) and sized by tokens.css `--daystar-size`,
 *  clamp(96px, 12vmin, 150px). With the frame covering the viewport
 *  the emblem's center is 0.115 of the longer side in from the right
 *  and 0.1 of it down from the top. Mirrored here in three lines so
 *  the Foyer's eager path carries none of the sky's modules; the test
 *  holds the mirror to the originals. */
export function daystarRect(width: number, height: number): SeatRect {
  const longer = Math.max(width, height);
  const size = Math.min(Math.max(96, 0.12 * Math.min(width, height)), 150);
  return { x: width - 0.115 * longer - size / 2, y: 0.1 * longer - size / 2, w: size, h: size };
}

/** How much of the daystar's box the icon fills when they meet: the
 *  moon's crescent spans three quarters of its icon and the face's
 *  disc half of the daystar's box; the sun's rays reach nearly the
 *  edge of both. */
const SHARE = { moon: 0.67, sun: 0.95 };

/** The pull lifts the glyph a little of the way toward the sky before
 *  the commit carries it the rest. */
export const PULL_SHARE = 0.12;

/** On the way down: the earliest the seat may come down — after the
 *  transition's turn has played (its delay and its duration,
 *  tokens.css) — the longest it waits past that for the transition to
 *  finish, and how long the coming down takes. */
export const DESCENT_TURN_MS = 1050;
const TRANSITION_GRACE_MS = 1500;
export const LAND_MS = 600;

const SEATED = 'daystar-seated';

interface SeatState {
  rest: SeatRect | null;
  at: number;
  cancel: (() => void) | null;
}

const state: SeatState = { rest: null, at: 0, cancel: null };

function seatElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.daystar-seat');
}

function skyRect(): SeatRect {
  const box = daystarRect(globalThis.innerWidth || 1, globalThis.innerHeight || 1);
  const share = document.documentElement.classList.contains('dk') ? SHARE.moon : SHARE.sun;
  const size = box.w * share;
  return { x: box.x + (box.w - size) / 2, y: box.y + (box.h - size) / 2, w: size, h: size };
}

function write(seat: HTMLElement, rect: SeatRect): void {
  const style = seat.style;
  style.setProperty('left', `${rect.x.toFixed(2)}px`);
  style.setProperty('top', `${rect.y.toFixed(2)}px`);
  style.setProperty('width', `${rect.w.toFixed(2)}px`);
  style.setProperty('height', `${rect.h.toFixed(2)}px`);
}

/** Take the glyph's place: the seat shows where the icon rests and
 *  the glyph hides beneath it. Measured live, so only true while the
 *  room stands at rest — which every caller knows. */
export function takeSeat(): boolean {
  const seat = seatElement();
  const icon = document.querySelector<SVGElement>('.theme-toggle__glyph svg');
  if (!seat || !icon) return false;
  const r = icon.getBoundingClientRect();
  state.rest = { x: r.left, y: r.top, w: r.width, h: r.height };
  state.at = 0;
  write(seat, state.rest);
  document.documentElement.classList.add(SEATED);
  return true;
}

/** Place the seat a fraction of the way from the glyph's rest (0) to
 *  the daystar's place in the sky (1). */
export function seatAt(t: number): void {
  const seat = seatElement();
  const rest = state.rest;
  if (!seat || !rest) return;
  state.at = t;
  const sky = skyRect();
  write(seat, {
    x: rest.x + (sky.x - rest.x) * t,
    y: rest.y + (sky.y - rest.y) * t,
    w: rest.w + (sky.w - rest.w) * t,
    h: rest.h + (sky.h - rest.h) * t,
  });
}

/** Carry the seat the rest of the way to the sky, over the lift. */
export function riseSeat(ms: number): void {
  state.cancel?.();
  state.cancel = tween(state.at, 1, ms, SIGNATURE_EASE, seatAt, () => {
    state.cancel = null;
  });
}

/** Bring the seat down from the sky to the glyph's rest, then give
 *  the glyph its place back. */
export function landSeat(ms: number): void {
  state.cancel?.();
  state.cancel = tween(state.at, 0, ms, SIGNATURE_EASE, seatAt, () => {
    state.cancel = null;
    releaseSeat();
  });
}

/** Whether a view transition is still playing on the document. */
function transitionPlaying(): boolean {
  return document
    .getAnimations()
    .some((animation) =>
      (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith('::view-transition'),
    );
}

/** Bring the seat down once the transition's turn has played, and not
 *  a frame before it has finished: the seat is the transition's new
 *  image, and losing its name mid-turn would abort the turn. Returns
 *  the cancel. */
export function landSeatAfterTransition(): () => void {
  const started = performance.now();
  const land = () => landSeat(LAND_MS);
  const holdFor = { raf: 0 };
  const wait = () => {
    const waited = performance.now() - started;
    if (
      waited < DESCENT_TURN_MS ||
      (transitionPlaying() && waited < DESCENT_TURN_MS + TRANSITION_GRACE_MS)
    ) {
      holdFor.raf = requestAnimationFrame(wait);
      return;
    }
    land();
  };
  holdFor.raf = requestAnimationFrame(wait);
  return () => cancelAnimationFrame(holdFor.raf);
}

/** The glyph's place is its own again. */
export function releaseSeat(): void {
  state.cancel?.();
  state.cancel = null;
  state.at = 0;
  document.documentElement.classList.remove(SEATED);
}
