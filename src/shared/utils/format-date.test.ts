import { describe, expect, test } from 'vitest';
import { formatWorkDate } from './format-date';

describe('formatWorkDate', () => {
  test('keeps the calendar day the frontmatter names, regardless of the local zone', () => {
    // YAML parses a bare date as midnight UTC. In any zone west of the
    // meridian a local-time format would read this as April 23.
    expect(formatWorkDate(new Date('2026-04-24'))).toBe('April 24, 2026');
  });

  test('a late-evening UTC instant does not roll into the next day', () => {
    expect(formatWorkDate(new Date('2026-12-31T23:30:00Z'))).toBe('December 31, 2026');
  });

  test('reads in the site register: full month, day, year', () => {
    expect(formatWorkDate(new Date('2025-08-27'))).toBe('August 27, 2025');
  });
});
