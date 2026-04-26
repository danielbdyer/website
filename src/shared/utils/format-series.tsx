import { Fragment, type ReactNode } from 'react';

// `Intl.ListFormat` is the ECMA-402 standard for formatting series in a
// locale-aware way. The English conjunction style produces:
//
//   1 item   -> "a"
//   2 items  -> "a and b"
//   3 items  -> "a, b, and c"          (Oxford comma — VOICE_AND_COPY.md)
//   4+ items -> "a, b, c, and d"
//
// Available natively in Node 22+ and every evergreen browser; no
// polyfill, no SSG concern. Today the locale is hardcoded to English;
// a future i18n pass swaps the constructor argument.
const conjunctionFormatter = new Intl.ListFormat('en', {
  style: 'long',
  type: 'conjunction',
});

// Placeholder shape — items get encoded as `[[SLOT-N]]` so the
// formatter operates on opaque strings, then we map each slot back
// to its rendered React node by index.
const SLOT_PATTERN = /^\[\[SLOT-(\d+)\]\]$/;
const slotKey = (index: number): string => `[[SLOT-${index}]]`;

// Formats a series of React nodes (e.g., `<Link>` elements) using
// `Intl.ListFormat`. Built on `formatToParts`: items become opaque
// `[[SLOT-N]]` placeholders, the formatter interleaves them with the
// right separator literals, and each placeholder maps back to its
// rendered React node by index. Pure, dependency-free.
//
// Used by every "list of works" or "list of facets" the site renders
// in prose — backlinks, facet threads, the room-page threads line.
// Replaces the earlier hand-rolled separator helper which dropped the
// Oxford comma in 3+ item series; the formatter handles all cases.
export function formatSeries<T>(
  items: readonly T[],
  render: (item: T, index: number) => ReactNode,
): ReactNode {
  if (items.length === 0) return null;
  const placeholders = items.map((_, i) => slotKey(i));
  const parts = conjunctionFormatter.formatToParts(placeholders);
  return parts.map((part, partIndex) => {
    if (part.type === 'literal') {
      return <Fragment key={`lit-${partIndex}`}>{part.value}</Fragment>;
    }
    const match = SLOT_PATTERN.exec(part.value);
    if (!match) return null;
    const itemIndex = Number(match[1]);
    return <Fragment key={`el-${itemIndex}`}>{render(items[itemIndex]!, itemIndex)}</Fragment>;
  });
}
