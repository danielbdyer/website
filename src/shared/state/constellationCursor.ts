// Shared signal for the constellation's cursor position. The
// navigation hook writes to it each tick (when the cursor moves on
// the sphere); the WebGL firmament reads from it each render frame
// to position its luminous pool of attention. This is the seam
// where two RAF loops — one driving physics, one driving paint —
// communicate without coupling their lifetimes.
//
// Coords: normalized screen space, x ∈ [-1, 1] (left to right), y
// ∈ [-1, 1] (down to up; +y is "up" in the shader's space, the
// caller flips from SVG +y-down). `active` is true when the cursor
// is on the surface (always true while /sky is mounted under the
// current Pass 2 design); reserved for future "cursor leaves" or
// "screen unfocused" gating.
//
// Module-level mutable state is the right shape here: there is
// exactly one constellation cursor at a time, both readers run on
// the same main thread, and the consumer reads on every render
// (so a subscribe/notify pattern would just add overhead). The
// React Compiler doesn't peer into this seam, which is fine — the
// signal is intentionally outside React's view.

let cursorX = 0;
let cursorY = 0;
let cursorActive = false;

export interface ConstellationCursor {
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
}

export function setConstellationCursor(x: number, y: number, active: boolean): void {
  cursorX = x;
  cursorY = y;
  cursorActive = active;
}

export function getConstellationCursor(): ConstellationCursor {
  return { x: cursorX, y: cursorY, active: cursorActive };
}

/** Test-only helper. Reset the signal between unit tests so one
 *  test's cursor write doesn't leak into the next. */
export function resetConstellationCursor(): void {
  cursorX = 0;
  cursorY = 0;
  cursorActive = false;
}
