// Where a star's name sits so it does not sit on another's.
//
// Pure: given projected star positions and label lengths, choose one
// of four slots around each star (below, above, right, left) so the
// named labels — the ones visible at rest — never overlap each other
// or cover a star. The projector applies the slots to the DOM
// (skyProjector.placeLabels) on arrival and at the idle cadence; the
// heavens turn too slowly for this to need every frame.

export interface LabelItem {
  readonly key: string;
  /** Projected viewbox position of the star. */
  readonly x: number;
  readonly y: number;
  /** Characters in the label — width is estimated from it. */
  readonly chars: number;
}

export interface LabelSlot {
  readonly dx: number;
  readonly dy: number;
  readonly anchor: 'middle' | 'start' | 'end';
}

interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

// 11px italic serif in a 1000-unit viewbox: roughly 5.7 units per
// character and 12 tall. A star's body and halo want 9 units clear.
export const LABEL_CHAR_WIDTH = 5.7;
export const LABEL_HEIGHT = 12;
export const STAR_CLEARANCE = 9;

/** Below first — the whisper's habit — then above, then to either side. */
export const LABEL_SLOTS: readonly LabelSlot[] = [
  { dx: 0, dy: 16, anchor: 'middle' },
  { dx: 0, dy: -10, anchor: 'middle' },
  { dx: 12, dy: 4, anchor: 'start' },
  { dx: -12, dy: 4, anchor: 'end' },
];

function leftEdge(item: LabelItem, slot: LabelSlot, width: number): number {
  if (slot.anchor === 'middle') return item.x + slot.dx - width / 2;
  if (slot.anchor === 'start') return item.x + slot.dx;
  return item.x + slot.dx - width;
}

export function labelBox(item: LabelItem, slot: LabelSlot): Box {
  const width = item.chars * LABEL_CHAR_WIDTH;
  const baseline = item.y + slot.dy;
  const left = leftEdge(item, slot, width);
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

function bestSlot(item: LabelItem, placed: readonly Box[], stars: readonly LabelItem[]): LabelSlot {
  return LABEL_SLOTS.reduce<{ slot: LabelSlot; cost: number }>(
    (best, slot) => {
      const c = cost(labelBox(item, slot), placed, stars, item.key);
      return c < best.cost ? { slot, cost: c } : best;
    },
    { slot: LABEL_SLOTS[0]!, cost: Number.POSITIVE_INFINITY },
  ).slot;
}

/**
 * Choose a slot for every item. The first `namedCount` items are the
 * labels visible at rest, in priority order (here first): each avoids
 * the boxes already placed before it and every star. The rest — labels
 * that show only on hover — avoid the named boxes and the stars but
 * not each other.
 *
 * @bigO Time: O(N · S · (K + N)) for N items, S slots, K named —
 *       ~16·4·30 at production density. Not a per-frame path.
 */
export function chooseLabelSlots(
  items: readonly LabelItem[],
  namedCount: number,
): ReadonlyMap<string, LabelSlot> {
  const named = items.slice(0, Math.max(namedCount, 0));
  const placedNamed = named.reduce<{
    boxes: readonly Box[];
    slots: readonly [string, LabelSlot][];
  }>(
    (acc, item) => {
      const slot = bestSlot(item, acc.boxes, items);
      return {
        boxes: [...acc.boxes, labelBox(item, slot)],
        slots: [...acc.slots, [item.key, slot]],
      };
    },
    { boxes: [], slots: [] },
  );
  const rest = items
    .slice(named.length)
    .map((item): [string, LabelSlot] => [item.key, bestSlot(item, placedNamed.boxes, items)]);
  return new Map([...placedNamed.slots, ...rest]);
}
