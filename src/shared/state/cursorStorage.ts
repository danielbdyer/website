// The constellation cursor's session memory. Two narrow concerns
// share this module because they share the same lifetime grain
// (per-tab session for the cursor, per-device for the visit
// manifest) and the same disciplined I/O posture (best-effort,
// JSON-validated, never throws into the navigation hook).
//
// CONSTELLATION_DESIGN.md §"Living-Document Behavior" names the
// commitment: pinned places persist within a session and dissolve
// between sessions; the cursor's last position survives within a
// session and returns to polestar between sessions; cross-session
// continuity is the world's heartbeat (the slow rotation), not the
// visitor's history.
//
// The visit manifest is a single boolean — `true` once the visitor
// has interacted with /sky once. P11 (NewStarBloom) will extend
// this manifest with a `perceivedMtime` field so returning visitors
// see new stars bloom; the storage key stays the same so the
// schema evolves additively.

import type { UnitVector3 } from '@/shared/geometry/sphere';
import { unitVector } from '@/shared/geometry/sphere';

/** sessionStorage key for the cursor's last sphere position.
 *  Schema: `{x, y, z}` JSON. Position alone is enough to re-mount
 *  the cursor where the visitor left it; P11 may extend. */
export const CURSOR_STORAGE_KEY = 'sky:cursor:pos';

/** localStorage key for the first-visit manifest. Schema: the
 *  literal string `'true'`. Any other value reads as not-visited
 *  so the visitor sees the full demonstration on next arrival. */
export const VISIT_MANIFEST_KEY = 'sky:visited';

/** Persist the cursor's current sphere position to sessionStorage.
 *  Best-effort — sessionStorage may be unavailable (private mode
 *  quotas, SSR), and persistence is never a precondition for the
 *  rest of the navigation working. */
export function persistCursorPos(pos: { x: number; y: number; z: number }): void {
  try {
    globalThis.sessionStorage?.setItem(
      CURSOR_STORAGE_KEY,
      JSON.stringify({ x: pos.x, y: pos.y, z: pos.z }),
    );
  } catch {
    // ignored — see module note on best-effort
  }
}

/** Read the cursor's last persisted position. Returns null when no
 *  value is stored, when JSON is malformed, when the schema is
 *  missing a coordinate, or when the value's magnitude doesn't
 *  read as a unit vector (corrupt or schema-drifted storage). */
export function readPersistedCursorPos(): UnitVector3 | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(CURSOR_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as { x?: unknown }).x === 'number' &&
      typeof (parsed as { y?: unknown }).y === 'number' &&
      typeof (parsed as { z?: unknown }).z === 'number'
    ) {
      const candidate = parsed as { x: number; y: number; z: number };
      const m = Math.hypot(candidate.x, candidate.y, candidate.z);
      if (m < 0.5 || m > 1.5) return null; // not a unit vector — discard
      return unitVector(candidate.x, candidate.y, candidate.z);
    }
    return null;
  } catch {
    return null;
  }
}

/** Has the visitor interacted with /sky on this device before?
 *  Returns true only when the manifest holds the literal `'true'`;
 *  any other state (missing, corrupt, throws on access) reads as
 *  not-visited so the next session shows the full demonstration. */
export function hasVisitedBefore(): boolean {
  try {
    return globalThis.localStorage?.getItem(VISIT_MANIFEST_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Record that the visitor has interacted with /sky. Called from
 *  the first real input (pointerdown / keydown), never from the
 *  demo's auto-completion — so a refresh during the demo doesn't
 *  short-circuit the next visit. */
export function markVisited(): void {
  try {
    globalThis.localStorage?.setItem(VISIT_MANIFEST_KEY, 'true');
  } catch {
    // ignored — see module note on best-effort. The visitor sees
    // a demo on next visit, which is honest.
  }
}
