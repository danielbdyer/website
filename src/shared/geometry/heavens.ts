// The heavens' slow turn — one revolution every ten minutes, the
// slowest motion on the site, an order of magnitude beyond the Foyer's
// geometric figure. So slow the visitor only notices if they sit.
//
// The phase is a pure function of the wall clock, not of the visit:
// the sky is wherever the hour has carried it, whether or not anyone
// was watching, and a visitor who returns finds it moved on. This is
// the "stable phase tied to time, not to visit" that CONSTELLATION_
// DESIGN.md §"Living-Document Behavior" asks of the world's heartbeat.
//
// The turn is carried as a camera roll (see camera.ts), so the
// structural stars, their labels' anchors, the companion glyph, the
// pointer ray-cast, the keyboard frame, and the atmosphere's view rays
// all read one sky. Labels stay upright because only positions turn.

export const HEAVENS_PERIOD_MS = 600_000;

/** The heavens' rotation phase in radians ∈ [0, 2π) at a wall-clock
 *  instant (milliseconds since the epoch). */
export function heavensPhase(epochMs: number): number {
  const wrapped = ((epochMs % HEAVENS_PERIOD_MS) + HEAVENS_PERIOD_MS) % HEAVENS_PERIOD_MS;
  return (wrapped / HEAVENS_PERIOD_MS) * Math.PI * 2;
}
