// Whether the daystar's magic — the scarf and its animation library —
// should be fetched and mounted at all. Pure: the hook reads the
// visitor's preferences and hands them here.
//
// The magic is a lazy layer (PERFORMANCE_BUDGET.md §"The sky's lazy
// layers"): it never blocks first paint, never loads under reduced
// motion or Save-Data, and can be switched off with `?magic=off` so a
// perf probe can measure the sky without it.

export interface MagicConditions {
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
  /** The page's query string, as `location.search`. */
  readonly search: string;
}

export function magicWanted(conditions: MagicConditions): boolean {
  if (conditions.reducedMotion || conditions.saveData) return false;
  return new URLSearchParams(conditions.search).get('magic') !== 'off';
}
