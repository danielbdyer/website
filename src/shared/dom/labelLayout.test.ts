import { describe, expect, test } from 'vitest';
import { chooseLabelSlots, labelBox, slotOffset, type LabelItem } from './labelLayout';

const item = (key: string, x: number, y: number, chars = 12): LabelItem => ({ key, x, y, chars });

function overlaps(a: ReturnType<typeof labelBox>, b: ReturnType<typeof labelBox>): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

describe('slotOffset', () => {
  test('side labels stand off the star by half their width plus a gap, so the text stays centered', () => {
    const a = item('a', 0, 0, 10);
    expect(slotOffset(a, 'below')).toEqual({ dx: 0, dy: 16 });
    expect(slotOffset(a, 'right').dx).toBeCloseTo(12 + (10 * 5.7) / 2, 6);
    expect(slotOffset(a, 'left').dx).toBeCloseTo(-(12 + (10 * 5.7) / 2), 6);
  });
});

describe('chooseLabelSlots', () => {
  test('a lone label sits below its star', () => {
    const slots = chooseLabelSlots([item('a', 500, 500)], 1);
    expect(slots.get('a')).toBe('below');
  });

  test('two named stars stacked closely do not overlap their labels', () => {
    const items = [item('here', 500, 500), item('near', 500, 518)];
    const slots = chooseLabelSlots(items, 2);
    const a = labelBox(items[0]!, slots.get('here')!);
    const b = labelBox(items[1]!, slots.get('near')!);
    expect(overlaps(a, b)).toBe(false);
  });

  test('a label will not cover a neighboring star', () => {
    // A star directly below would be covered by the default side.
    const items = [item('a', 500, 500, 20), item('b', 500, 516)];
    const slots = chooseLabelSlots(items, 1);
    expect(slots.get('a')).not.toBe('below');
  });

  test('the first item takes priority: it keeps its side and later ones move', () => {
    const items = [item('first', 500, 500), item('second', 560, 500)];
    const slots = chooseLabelSlots(items, 2);
    expect(slots.get('first')).toBe('below');
    expect(slots.get('second')).not.toBe('below');
  });

  test('every item receives a side, including unnamed ones', () => {
    const items = [item('a', 100, 100), item('b', 300, 300), item('c', 600, 600)];
    const slots = chooseLabelSlots(items, 1);
    expect([...slots.keys()].toSorted()).toEqual(['a', 'b', 'c']);
  });
});
