// ─── A line diff ──────────────────────────────────────────────────
//
// The operator reads a patch before blessing it, so the fabric shows
// what would change, line by line. The longest common subsequence is
// found by the textbook dynamic program over the two line arrays; the
// walk back turns the table into a script of keep, add, and drop. Pure,
// and small enough to read in one sitting.

export interface Hunk {
  readonly kind: 'same' | 'added' | 'removed';
  readonly text: string;
}

const table = (a: readonly string[], b: readonly string[]): readonly (readonly number[])[] =>
  a.reduceRight<readonly (readonly number[])[]>(
    (below, lineA) => {
      const rowBelow = below[0] ?? [];
      const row = b.reduceRight<readonly number[]>(
        (right, lineB, j) => [
          lineA === lineB ? (rowBelow[j + 1] ?? 0) + 1 : Math.max(rowBelow[j] ?? 0, right[0] ?? 0),
          ...right,
        ],
        [0],
      );
      return [row, ...below];
    },
    [Array.from({ length: b.length + 1 }, () => 0)],
  );

const walk = (
  a: readonly string[],
  b: readonly string[],
  lengths: readonly (readonly number[])[],
  i: number,
  j: number,
): readonly Hunk[] => {
  const lineA = a[i];
  const lineB = b[j];
  if (lineA === undefined && lineB === undefined) return [];
  if (lineA !== undefined && lineB !== undefined && lineA === lineB) {
    return [{ kind: 'same', text: lineA }, ...walk(a, b, lengths, i + 1, j + 1)];
  }
  const down = lengths[i + 1]?.[j] ?? 0;
  const right = lengths[i]?.[j + 1] ?? 0;
  // A removal before an addition, as a reader expects a diff to read.
  return lineA !== undefined && (lineB === undefined || down >= right)
    ? [{ kind: 'removed', text: lineA }, ...walk(a, b, lengths, i + 1, j)]
    : [{ kind: 'added', text: lineB ?? '' }, ...walk(a, b, lengths, i, j + 1)];
};

const lines = (text: string): readonly string[] => (text === '' ? [] : text.split('\n'));

/** The hunks that turn `before` into `after`. */
export function diffLines(before: string, after: string): readonly Hunk[] {
  const a = lines(before);
  const b = lines(after);
  return walk(a, b, table(a, b), 0, 0);
}

const mark = { same: ' ', added: '+', removed: '-' } as const;

/** The diff as the operator reads it: changed lines with a little
 *  context, unchanged stretches folded to one line saying how many. */
export function unified(before: string, after: string, context = 2): string {
  const hunks = diffLines(before, after);
  const near = hunks.map((_, index) =>
    hunks
      .slice(Math.max(0, index - context), index + context + 1)
      .some((hunk) => hunk.kind !== 'same'),
  );
  const shown = hunks.flatMap((hunk, index) => {
    if (near[index]) return [`${mark[hunk.kind]} ${hunk.text}`];
    const previousShown = index === 0 || near[index - 1];
    return previousShown ? ['  …'] : [];
  });
  return shown.join('\n');
}

/** How much a diff changes: added and removed lines, for the summary. */
export const changed = (
  hunks: readonly Hunk[],
): { readonly added: number; readonly removed: number } => ({
  added: hunks.filter((hunk) => hunk.kind === 'added').length,
  removed: hunks.filter((hunk) => hunk.kind === 'removed').length,
});
