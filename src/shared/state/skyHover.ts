// Shared signal for the star under the pointer (or keyboard focus).
// The interaction rim writes it when the hover changes; the WebGL
// atmosphere reads it each render frame to claim that star's halo. It
// lives outside React on purpose: a hover is a change of attention, not
// a change of the sky, and re-rendering hundreds of stars and a
// thousand threads to light one of them was the sky's whole frame
// budget at a vault's density (CONSTELLATION_ARCHITECTURE.md §"The
// shell"). Module-level state for the same reason constellationCursor
// is: one sky, one pointer, both sides on the main thread.
//
// The index is the atmosphere's star index (atmosphereScene
// .activeStarIndex); -1 when nothing is hovered.

let hoverIndex = -1;

export function setSkyHoverIndex(index: number): void {
  hoverIndex = index;
}

export function getSkyHoverIndex(): number {
  return hoverIndex;
}

/** Test-only helper — clear the signal between tests. */
export function resetSkyHover(): void {
  hoverIndex = -1;
}
