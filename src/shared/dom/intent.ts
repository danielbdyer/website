// Which star a held sky is aiming at.
//
// While a hand holds the sky, the center of view is a reticle — the
// visitor's own body, the companion glyph. Whichever star sits nearest
// it, within reach, is the likely intent: it claims (halo, name, glow)
// as the hand moves, and the sky settles onto it when the hand lets go.
// A star one step along the graph gets a small head start — the valley
// is still a valley — but any star in reach can be the one. Pure: the
// projector supplies screen positions; this decides.

export interface IntentCandidate {
  readonly key: string;
  /** Projected viewbox distance from the center of view. */
  readonly distance: number;
  /** One step from here along the graph (a neighbor or a bearing's end). */
  readonly step: boolean;
}

/** How far (viewbox units) from the center a star can be and still be
 *  the intent; how much nearer a step along the graph counts as. */
export const INTENT_RADIUS_VB = 90;
export const INTENT_STEP_BONUS_VB = 45;

export function chooseIntent(
  candidates: readonly IntentCandidate[],
  radius: number = INTENT_RADIUS_VB,
  stepBonus: number = INTENT_STEP_BONUS_VB,
): string | null {
  const best = candidates.reduce<{ key: string | null; score: number }>(
    (acc, c) => {
      const score = c.distance - (c.step ? stepBonus : 0);
      return score < acc.score ? { key: c.key, score } : acc;
    },
    { key: null, score: radius },
  );
  return best.key;
}
