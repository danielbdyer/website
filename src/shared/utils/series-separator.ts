/**
 * Returns the right separator string before the i-th item in a series
 * — handles the Oxford-comma rule per VOICE_AND_COPY.md §"Punctuation"
 * (*"Commas do the usual work. Oxford comma on."*).
 *
 *   1 item   → ""                                  ("apple")
 *   2 items  → "" / " and "                        ("apple and pear")
 *   3+ items → "" / ", " / ", " / ", and "         ("apple, pear, and quince")
 *
 * The function is pure and dependency-free; designed to be called
 * inside a `.map((item, i) => ...)` over a series.
 */
export function seriesSeparator(index: number, total: number): string {
  if (index === 0) return '';
  if (index === total - 1) return total > 2 ? ', and ' : ' and ';
  return ', ';
}
