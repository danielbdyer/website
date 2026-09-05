// The daystar's seat: the fixed element that stands for the nav's
// glyph while the eye moves. The ninth pass lifted the glyph out of
// the corner the moment the eye moved and carried it up; the tenth,
// with Danny, undid that: *I liked that I didn't think about the
// glyphs as soon as the transition happened. It was nearly perfect as
// it was — it needed the resolution back into the homepage to be
// tighter, and the sun or moon already being there to represent the
// glyph a little earlier. The ends needed to change, not the body.*
// And the eleventh, after the tenth showed the icon grown large in the
// sky: *the transitions up to the sky are dissimilar in that by the
// time the sky starts to appear the normal-sized glyph should already
// be transitioning into the character, such that we never see the
// glyph itself grow larger at all. The character will need to begin to
// appear as soon as the room/sky threshold has been crossed.* So the
// glyph is left alone: it falls away with the page, fading at its own
// size, unnoticed. On the way up the seat holds the character itself —
// the daystar, face and painted body and all — at exactly the place
// and the size the sky will seat it, appearing as soon as the falling
// page has uncovered that place, whole early in the lift; the
// character carries the transition's name, so the route's transition
// finds the same face in the same place and crosses to it with nothing
// to fly or grow. On the way down the seat holds the icon at the
// glyph's own rest from the first paint, so the transition flies the
// face from the sky to exactly there and resolves into it; once the
// transition has finished the glyph has its place back, with no second
// step.

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

/** The character appears in the sky over this stretch of the reveal:
 *  from the moment the falling page has uncovered the daystar's place
 *  (its box is clear of the page's top edge from about 0.62) to early
 *  in the lift. */
const APPEARS_FROM = 0.65;
const APPEARS_BY = 1.3;

/** What the seat holds: nothing, the character in the sky, or the
 *  icon at the glyph's rest. The seat's component renders by it. */
export type SeatMode = 'none' | 'sky' | 'rest';

const held = { mode: 'none' as SeatMode };
const listeners = new Set<() => void>();

function setMode(mode: SeatMode): void {
  if (held.mode === mode) return;
  held.mode = mode;
  for (const listener of listeners) listener();
}

/** For useSyncExternalStore: what the seat holds now, and a way to
 *  hear it change. */
export function seatMode(): SeatMode {
  return held.mode;
}

export function subscribeSeat(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** On the way down: the earliest the seat may give the glyph its
 *  place back — after the transition's flight (its delay and its
 *  duration, tokens.css) — and the longest it waits past that for the
 *  transition to finish. */
export const DESCENT_ARRIVES_MS = 1150;
const TRANSITION_GRACE_MS = 1500;

const SEATED = 'daystar-seated';
const PRESENCE = '--seat-presence';

function seatElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.daystar-seat');
}

function skyRect(): SeatRect {
  return daystarRect(globalThis.innerWidth || 1, globalThis.innerHeight || 1);
}

function write(seat: HTMLElement, rect: SeatRect): void {
  const style = seat.style;
  style.setProperty('left', `${rect.x.toFixed(2)}px`);
  style.setProperty('top', `${rect.y.toFixed(2)}px`);
  style.setProperty('width', `${rect.w.toFixed(2)}px`);
  style.setProperty('height', `${rect.h.toFixed(2)}px`);
}

function seated(): boolean {
  return document.documentElement.classList.contains(SEATED);
}

function present(value: number): void {
  document.documentElement.style.setProperty(PRESENCE, value.toFixed(3));
}

/** The seat in the sky, holding the character where the daystar will
 *  be, at the given presence (0 → 1); the glyph fades in the falling
 *  page by the same measure. */
export function seatInSky(presence: number): boolean {
  const seat = seatElement();
  if (!seat) return false;
  write(seat, skyRect());
  present(presence);
  setMode('sky');
  document.documentElement.classList.add(SEATED);
  return true;
}

/** The seat at the glyph's own rest, holding the icon, whole, the
 *  glyph beneath it. Measured live, so only true while the room stands
 *  at rest — which the caller knows. */
export function seatAtRest(): boolean {
  const seat = seatElement();
  const icon = document.querySelector<SVGElement>('.theme-toggle__glyph svg');
  if (!seat || !icon) return false;
  const r = icon.getBoundingClientRect();
  write(seat, { x: r.left, y: r.top, w: r.width, h: r.height });
  present(1);
  setMode('rest');
  document.documentElement.classList.add(SEATED);
  return true;
}

/** The character's presence in the sky for a reveal: none until the
 *  page has uncovered its place, whole early in the lift, smooth
 *  between. */
export function presenceFor(reveal: number): number {
  const t = Math.min(Math.max((reveal - APPEARS_FROM) / (APPEARS_BY - APPEARS_FROM), 0), 1);
  return t * t * (3 - 2 * t);
}

/** The seat rides the reveal on the way up. It holds the character
 *  from the first breath of a pull — unseen, at no presence, so the
 *  character's paint and magic are already live before it is shown —
 *  lets it appear once the page has uncovered its place, and lets it
 *  go if the pull comes all the way back to rest. */
export function seatWithReveal(reveal: number): void {
  if (reveal <= 0.001) {
    if (seated()) releaseSeat();
    return;
  }
  seatInSky(presenceFor(reveal));
}

/** Whether a view transition is still playing on the document. */
function transitionPlaying(): boolean {
  return document
    .getAnimations()
    .some((animation) =>
      (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith('::view-transition'),
    );
}

/** On the way down, give the glyph its place back once the transition
 *  has flown the face to it — and not a frame before it has finished:
 *  the seat is the transition's new image, and losing its name
 *  mid-flight would abort the flight. Returns the cancel. */
export function releaseSeatAfterTransition(): () => void {
  const started = performance.now();
  const hold = { raf: 0 };
  const wait = () => {
    const waited = performance.now() - started;
    const stillFlying = transitionPlaying() && waited < DESCENT_ARRIVES_MS + TRANSITION_GRACE_MS;
    if (waited < DESCENT_ARRIVES_MS || stillFlying) {
      hold.raf = requestAnimationFrame(wait);
      return;
    }
    releaseSeat();
  };
  hold.raf = requestAnimationFrame(wait);
  return () => cancelAnimationFrame(hold.raf);
}

/** The glyph's place is its own again. */
export function releaseSeat(): void {
  setMode('none');
  document.documentElement.classList.remove(SEATED);
  document.documentElement.style.removeProperty(PRESENCE);
}
