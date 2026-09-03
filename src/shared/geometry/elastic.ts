// The give of the sky under a hand that pulls where no thread leads.
//
// A rubber band, not a wall: small pulls move the sky almost
// one-to-one, larger pulls move it less and less, and no pull moves it
// past the limit. The same curve iOS uses for overscroll, chosen so the
// tension is felt from the first pixel and the sky never runs away.

/**
 * How far the sky gives (in the same units as `distance`) when the hand
 * has pulled `distance` where nothing leads. Monotonic, bounded by
 * `limit`, with slope `give` at the origin.
 */
export function rubberBand(distance: number, limit: number, give = 0.55): number {
  if (distance <= 0 || limit <= 0) return 0;
  return limit * (1 - 1 / (1 + (give * distance) / limit));
}
