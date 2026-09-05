import { useEffect, type RefObject } from 'react';

// The crown of rays turns once every two minutes and twenty on a CSS
// animation (tokens.css: daystar-crown). Two crowns — the nav's glyph
// and the sky's daystar — would start their turns whenever each
// mounted, and the look-up's morph would find their rays out of
// step. Both take the animation's phase from the wall clock on mount,
// so the rays keep their bearings from the corner into the sky: the
// same crown, in its place. Written after hydration, on the crown's
// element, so the server's markup and the client's agree until then.

export const CROWN_TURN_SECONDS = 140;

/** The animation delay that puts a crown at the wall clock's phase. */
export function crownPhaseDelay(nowMs: number): string {
  const phase = (nowMs / 1000) % CROWN_TURN_SECONDS;
  return `-${phase.toFixed(3)}s`;
}

/** Set every crown under the root to the wall clock's phase. The
 *  atoms that draw a crown are stateless; the molecule that mounts
 *  them, and the nav's toggle, call this on their own root. */
export function useCrownPhase(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const delay = crownPhaseDelay(Date.now());
    ref.current
      ?.querySelectorAll<SVGGElement>('.daystar__rays')
      .forEach((crown) => crown.style.setProperty('animation-delay', delay));
  }, [ref]);
}
