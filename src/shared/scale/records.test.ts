import { describe, expect, test } from 'vitest';
import { LADDER_LENGTH, RATE_CEILING, RECORDS, bpmOf, rateOf, recordById } from './records';
import { SAMPLES } from './tubes';
import { characterOf, frameOf, mixHex, ribbonOf } from './frame';
import {
  FOLD_MS,
  RIBBONS_MS,
  arrive,
  countOf,
  elapsedOf,
  pause,
  phaseOf,
  resume,
} from './director';

// INV-SCL-001 — the line is true. The number the sentence claims is
// the computed rate to the nearest half unit; the joke only works if
// the math does.
describe('INV-SCL-001 · the line is true', () => {
  test.each(RECORDS.map((r) => [r.id, r] as const))('%s', (_, record) => {
    const rate = rateOf(record);
    expect(Math.round(rate * 2) / 2).toBe(record.claim);
    expect(record.line.toLowerCase()).toContain(record.unit.name.toLowerCase());
  });
});

// INV-SCL-002 — the same seven straws play every role.
describe('INV-SCL-002 · seven tubes, drawn head to tail', () => {
  test.each(RECORDS.map((r) => [r.id, r] as const))('%s', (_, record) => {
    expect(record.tubes).toHaveLength(7);
    record.tubes.forEach((tube) => expect(tube.points.length).toBeGreaterThanOrEqual(2));
    characterOf(record).forEach((strand) => expect(strand).toHaveLength(SAMPLES));
  });
});

// INV-SCL-003 — no page above eight units per second, so a tiled unit
// never strobes on a 60 Hz screen.
describe('INV-SCL-003 · the rate ceiling', () => {
  test.each(RECORDS.map((r) => [r.id, r] as const))('%s', (_, record) => {
    expect(rateOf(record)).toBeLessThan(RATE_CEILING);
    expect(record.rung).toBeLessThan(LADDER_LENGTH);
  });
});

describe('the tempo is derived from the facts', () => {
  test('the falcon passes a field at about fifty-nine beats a minute', () => {
    const falcon = recordById('falcon');
    expect(falcon).not.toBeNull();
    expect(Math.round(bpmOf(falcon!))).toBe(59);
  });
  test('Bertie plods at about eighty-eight', () => {
    expect(Math.round(bpmOf(recordById('bertie')!))).toBe(88);
  });
});

// INV-SCL-004 — the clock is a difference of timestamps, never a sum
// of frame deltas, and pausing holds it.
describe('INV-SCL-004 · the director’s clock', () => {
  test('elapsed is read from timestamps and excludes time paused', () => {
    const d0 = arrive(0, 1000);
    expect(elapsedOf(d0, 1500)).toBe(500);
    const held = pause(d0, 1500);
    expect(elapsedOf(held, 9000)).toBe(500);
    const going = resume(held, 3000);
    expect(elapsedOf(going, 3400)).toBe(900);
    expect(pause(held, 2000)).toBe(held);
    expect(resume(going, 2000)).toBe(going);
  });

  test('the phases follow the clock, and the scroll takes precedence', () => {
    expect(phaseOf(0, { index: 0, fraction: 0 })).toBe('ribbons');
    expect(phaseOf(RIBBONS_MS, { index: 0, fraction: 0 })).toBe('folding');
    expect(phaseOf(RIBBONS_MS + FOLD_MS, { index: 0, fraction: 0 })).toBe('character');
    expect(phaseOf(5000, { index: 0, fraction: 0.2 })).toBe('unfolding');
  });

  test('the counter counts whole units passed on the record’s clock', () => {
    const bertie = recordById('bertie')!;
    expect(countOf(bertie, 0)).toBe(0);
    expect(countOf(bertie, 10_000)).toBe(Math.floor(rateOf(bertie) * 10));
  });
});

describe('the frame', () => {
  const [bertie, falcon] = RECORDS;

  test('at rest the character holds and the treadmill stands between units', () => {
    const frame = frameOf(falcon!, null, 4000, { index: 1, fraction: 0 });
    expect(frame.phase).toBe('character');
    expect(frame.strands).toHaveLength(7);
    expect(frame.treadmill).toBeGreaterThanOrEqual(0);
    expect(frame.treadmill).toBeLessThan(1);
    expect(frame.strands[0]?.points).toEqual(characterOf(falcon!)[0]);
  });

  test('the ribbons begin off the stage and arrive as the clock runs', () => {
    const far = ribbonOf(falcon!, 3, 1500);
    const home = ribbonOf(falcon!, 3, 0);
    expect(far[0]!.x).toBeLessThan(home[0]!.x);
    const early = frameOf(falcon!, null, 0, { index: 1, fraction: 0 });
    expect(early.phase).toBe('ribbons');
  });

  test('leaving shifts the color toward the next record through the middle of the scroll', () => {
    const start = frameOf(bertie!, falcon!, 5000, { index: 0, fraction: 0.1 });
    const mid = frameOf(bertie!, falcon!, 5000, { index: 0, fraction: 0.5 });
    const end = frameOf(bertie!, falcon!, 5000, { index: 0, fraction: 0.9 });
    expect(start.strands[0]?.color).toBe(bertie!.color);
    expect(mid.strands[0]?.color).toBe(mixHex(bertie!.color, falcon!.color, 0.5));
    expect(end.strands[0]?.color).toBe(falcon!.color);
    expect(end.phase).toBe('unfolding');
  });
});
