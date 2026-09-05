import { useEffect, type RefObject } from 'react';

// The crown of rays turns once every two minutes and twenty on a CSS
// animation (tokens.css: daystar-crown). Left to itself the animation
// would start from zero whenever the daystar mounted, so every
// look-up would find the crown back at its first bearing. The crown
// takes its phase from the wall clock on mount instead, and so keeps
// turning as if it had never left. Written after hydration, on the
// crown's element, so the server's markup and the client's agree
// until then.

export const CROWN_TURN_SECONDS = 140;

/** The animation delay that puts a crown at the wall clock's phase. */
export function crownPhaseDelay(nowMs: number): string {
  const phase = (nowMs / 1000) % CROWN_TURN_SECONDS;
  return `-${phase.toFixed(3)}s`;
}

/** Set every crown under the root to the wall clock's phase. The atom
 *  that draws the crown is stateless; the molecule that mounts it
 *  calls this on its root. */
export function useCrownPhase(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const delay = crownPhaseDelay(Date.now());
    ref.current
      ?.querySelectorAll<SVGGElement>('.daystar__rays')
      .forEach((crown) => crown.style.setProperty('animation-delay', delay));
  }, [ref]);
}
