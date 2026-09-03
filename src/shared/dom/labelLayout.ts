// Where a star's name sits so it does not sit on another's.
//
// Pure: given projected star positions and label lengths, choose one
// of four sides around each star (below, above, right, left) so the
// named labels — the ones visible at rest — never overlap each other
// or cover a star. Every label stays center-anchored and is moved by a
// translate, so a change of side glides rather than jumps. The
// projector applies the offsets to the DOM (skyProjector.placeLabels)
// on arrival and at the idle cadence.

export interface LabelItem {
  readonly key: string;
  /** Projected viewbox position of the star. */
  readonly x: number;
  readonly y: number;
  /** Characters in the label — width is estimated from it. */
  readonly chars: number;
}

export type LabelSide = 'below' | 'above' | 'right' | 'left';

interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

// 11px italic serif in a 1000-unit viewbox: roughly 5.7 units per
// character and 12 tall. A star's body and halo want 9 units clear;
// a side label stands 12 units off the star.
export const LABEL_CHAR_WIDTH = 5.7;
export const LABEL_HEIGHT = 12;
export const STAR_CLEARANCE = 9;
const SIDE_GAP = 12;

/** Below first — the whisper's habit — then above, then to either side. */
export const LABEL_SIDES: readonly LabelSide[] = ['below', 'above', 'right', 'left'];

export function labelWidth(item: LabelItem): number {
  return item.chars * LABEL_CHAR_WIDTH;
}

/** The translate that puts a center-anchored label on the given side
 *  of its star (dy is the baseline's offset from the star's center). */
export function slotOffset(item: LabelItem, side: LabelSide): { dx: number; dy: number } {
  const half = labelWidth(item) / 2;
  if (side === 'below') return { dx: 0, dy: 16 };
  if (side === 'above') return { dx: 0, dy: -10 };
  if (side === 'right') return { dx: SIDE_GAP + half, dy: 4 };
  return { dx: -SIDE_GAP - half, dy: 4 };
}

export function labelBox(item: LabelItem, side: LabelSide): Box {
  const width = labelWidth(item);
  const { dx, dy } = slotOffset(item, side);
  const baseline = item.y + dy;
  const left = item.x + dx - width / 2;
  return {
    left,
    right: left + width,
    top: baseline - LABEL_HEIGHT * 0.8,
    bottom: baseline + LABEL_HEIGHT * 0.25,
  };
}

function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

function coversStar(box: Box, star: { x: number; y: number }): boolean {
  return (
    star.x > box.left - STAR_CLEARANCE &&
    star.x < box.right + STAR_CLEARANCE &&
    star.y > box.top - STAR_CLEARANCE &&
    star.y < box.bottom + STAR_CLEARANCE
  );
}

const STAR_PENALTY = 400;

function cost(box: Box, placed: readonly Box[], stars: readonly LabelItem[], self: string): number {
  const overlap = placed.reduce((sum, other) => sum + overlapArea(box, other), 0);
  const covered = stars.filter((s) => s.key !== self && coversStar(box, s)).length;
  return overlap + covered * STAR_PENALTY;
}

function bestSide(item: LabelItem, placed: readonly Box[], stars: readonly LabelItem[]): LabelSide {
  return LABEL_SIDES.reduce<{ side: LabelSide; cost: number }>(
    (best, side) => {
      const c = cost(labelBox(item, side), placed, stars, item.key);
      return c < best.cost ? { side, cost: c } : best;
    },
    { side: 'below', cost: Number.POSITIVE_INFINITY },
  ).side;
}

/**
 * Choose a side for every item. The first `namedCount` items are the
 * labels visible at rest, in priority order (here first): each avoids
 * the boxes already placed before it and every star. The rest — labels
 * that show only on hover — avoid the named boxes and the stars but
 * not each other.
 *
 * @bigO Time: O(N · S · (K + N)) for N items, S sides, K named —
 *       ~16·4·30 at production density. Not a per-frame path.
 */
export function chooseLabelSlots(
  items: readonly LabelItem[],
  namedCount: number,
): ReadonlyMap<string, LabelSide> {
  const named = items.slice(0, Math.max(namedCount, 0));
  const placedNamed = named.reduce<{
    boxes: readonly Box[];
    sides: readonly [string, LabelSide][];
  }>(
    (acc, item) => {
      const side = bestSide(item, acc.boxes, items);
      return {
        boxes: [...acc.boxes, labelBox(item, side)],
        sides: [...acc.sides, [item.key, side]],
      };
    },
    { boxes: [], sides: [] },
  );
  const rest = items
    .slice(named.length)
    .map((item): [string, LabelSide] => [item.key, bestSide(item, placedNamed.boxes, items)]);
  return new Map([...placedNamed.sides, ...rest]);
}
