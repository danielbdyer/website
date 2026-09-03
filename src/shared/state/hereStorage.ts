// Where the visitor stands in the sky, remembered for the session.
//
// The walk's memory is the session's (CONSTELLATION_WALK.md §"The
// Walk's Memory"): *here* survives a refresh or a round trip into a
// work and back, and dissolves between visits, so a new visit begins
// at the pole. Best-effort I/O — sessionStorage may be unavailable
// (private mode quotas, SSR) and persistence is never a precondition
// for the sky working.

export const HERE_STORAGE_KEY = 'sky:here';

export function persistHere(place: string): void {
  try {
    globalThis.sessionStorage?.setItem(HERE_STORAGE_KEY, place);
  } catch {
    // ignored — see module note on best-effort
  }
}

/** The remembered place, or null when none is stored. The caller
 *  decides whether the place still exists in the graph. */
export function readPersistedHere(): string | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(HERE_STORAGE_KEY);
    return raw && raw.length > 0 && raw.length < 200 ? raw : null;
  } catch {
    return null;
  }
}
