import { describe, expect, test } from 'vitest';
import { LABEL_SLOTS, chooseLabelSlots, labelBox, type LabelItem } from './labelLayout';

const item = (key: string, x: number, y: number, chars = 12): LabelItem => ({ key, x, y, chars });

function overlaps(a: ReturnType<typeof labelBox>, b: ReturnType<typeof labelBox>): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

describe('chooseLabelSlots', () => {
  test('a lone label sits below its star', () => {
    const slots = chooseLabelSlots([item('a', 500, 500)], 1);
    expect(slots.get('a')).toEqual(LABEL_SLOTS[0]);
  });

  test('two named stars stacked closely do not overlap their labels', () => {
    const items = [item('here', 500, 500), item('near', 500, 518)];
    const slots = chooseLabelSlots(items, 2);
    const a = labelBox(items[0]!, slots.get('here')!);
    const b = labelBox(items[1]!, slots.get('near')!);
    expect(overlaps(a, b)).toBe(false);
  });

  test('a label will not cover a neighboring star', () => {
    // A star directly below would be covered by the default slot.
    const items = [item('a', 500, 500, 20), item('b', 500, 516)];
    const slots = chooseLabelSlots(items, 1);
    expect(slots.get('a')).not.toEqual(LABEL_SLOTS[0]);
  });

  test('the first item takes priority: it keeps its slot and later ones move', () => {
    const items = [item('first', 500, 500), item('second', 560, 500)];
    const slots = chooseLabelSlots(items, 2);
    expect(slots.get('first')).toEqual(LABEL_SLOTS[0]);
    expect(slots.get('second')).not.toEqual(LABEL_SLOTS[0]);
  });

  test('every item receives a slot, including unnamed ones', () => {
    const items = [item('a', 100, 100), item('b', 300, 300), item('c', 600, 600)];
    const slots = chooseLabelSlots(items, 1);
    expect([...slots.keys()].toSorted()).toEqual(['a', 'b', 'c']);
  });
});
