// The look-up's shared numbers, and its one moving part. The room's
// turn (tokens.css §"The look-up") and the heavens' turn (the
// backdrop's dome, webgl/readySky.ts) are one pitch of one eye, so
// what relates them lives here — eager and tiny — where the Foyer's
// route and the sky's lazy readiness can both reach it. The eighth
// pass, with Danny: *the 3D space continues to exist below; the
// homepage keeps the full width while it falls away, correctly.*

import { cubicBezierEase } from '@/shared/hooks/useThresholdReveal';

/** Degrees of pitch per unit of --reveal. Mirrors the 13deg in
 *  tokens.css §"The look-up" — change both together. */
export const PITCH_PER_REVEAL_DEG = 13;

/** Where the lift ends: at a 1200px focal length the page's top edge
 *  passes below a 900px frame at 41° of pitch; the lift goes to 48°,
 *  so the room is gone with a margin before the sky route arrives,
 *  and the heavens stand at the sky's own rest. */
export const LIFT = 3.7;
export const LIFT_MS = 900;
export const SETTLE_MS = 900;

/** The site's signature curve, as a function. */
export const SIGNATURE_EASE = cubicBezierEase(0.23, 1, 0.32, 1);

/** The heavens' pitch for a reveal, in radians, up positive. The sky
 *  the Foyer's backdrop shows at rest is the sky's rest view turned
 *  down by the whole lift, so the eye turning up through the lift
 *  arrives at the sky's rest view exactly — one world, one camera,
 *  the room and the heavens turning together. */
export function skyPitchFor(reveal: number): number {
  return ((reveal - LIFT) * PITCH_PER_REVEAL_DEG * Math.PI) / 180;
}

/** The room's current reveal, as written on the root; 0 at rest. */
export function readReveal(): number {
  const raw = Number.parseFloat(document.documentElement.style.getPropertyValue('--reveal'));
  return Number.isNaN(raw) ? 0 : raw;
}

type Pitcher = (reveal: number) => void;

let pitcher: Pitcher | null = null;

/** The readied sky registers how to turn its backdrop; the Foyer
 *  turns it with each reveal. Returns the unregister. One at a time:
 *  the latest readiness is the backdrop. */
export function registerBackdropPitcher(next: Pitcher): () => void {
  pitcher = next;
  return () => {
    if (pitcher === next) pitcher = null;
  };
}

export function pitchBackdrop(reveal: number): void {
  pitcher?.(reveal);
}

/** Carry a value from one place to another over a duration on an
 *  easing, once per animation frame; the last frame lands exactly on
 *  the destination. Returns the cancel. */
export function tween(
  from: number,
  to: number,
  ms: number,
  ease: (x: number) => number,
  onFrame: (value: number) => void,
  onDone?: () => void,
): () => void {
  const start = performance.now();
  let raf = 0;
  const step = (now: number): void => {
    const t = Math.min((now - start) / ms, 1);
    onFrame(from + (to - from) * ease(t));
    if (t < 1) {
      raf = requestAnimationFrame(step);
      return;
    }
    onDone?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
