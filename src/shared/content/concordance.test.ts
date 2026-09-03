import { describe, expect, test } from 'vitest';
import { buildConcordance, concordanceBetween, stem, tokenize } from './concordance';

const DOCS = [
  {
    key: 'garden/cello',
    text: 'My parents practiced the cello every morning. The cello was the sound of the house.',
  },
  {
    key: 'salon/part',
    text: 'Arvo Pärt writes for cello and piano; the silence between notes is the music of the room.',
  },
  {
    key: 'studio/platform',
    text: 'A platform team builds containers for other teams; the architecture gives work a place to land.',
  },
  {
    key: 'study/enough',
    text: 'Enough is a decision the body makes before the mind. Practice without a visible floor.',
  },
];

describe('tokenize and stem', () => {
  test('drops markdown, links, stop words, and short words; stems lightly', () => {
    const tokens = tokenize('## The **containers** were waiting, see https://x.y/z — and then?');
    expect(tokens).toEqual(['container', 'wait', 'see']);
  });

  test('stems plurals and participles but leaves short words alone', () => {
    expect(stem('cellos')).toBe('cello');
    expect(stem('waiting')).toBe('wait');
    expect(stem('less')).toBe('less');
    expect(stem('sky')).toBe('sky');
  });
});

describe('buildConcordance', () => {
  test('the two cello texts are each other’s strongest concordance', () => {
    const c = buildConcordance(DOCS);
    expect(c['garden/cello']?.[0]?.key).toBe('salon/part');
    expect(c['salon/part']?.[0]?.key).toBe('garden/cello');
  });

  test('is symmetric in weight and never lists a work against itself', () => {
    const c = buildConcordance(DOCS);
    const ab = concordanceBetween(c, 'garden/cello', 'salon/part');
    const ba = concordanceBetween(c, 'salon/part', 'garden/cello');
    expect(ab).toBeGreaterThan(0);
    expect(ab).toBeCloseTo(ba, 6);
    for (const [key, list] of Object.entries(c)) {
      expect(list.map((x) => x.key)).not.toContain(key);
    }
  });

  test('unrelated texts weigh nothing, and the list is capped', () => {
    const c = buildConcordance(DOCS, 1);
    expect(concordanceBetween(c, 'studio/platform', 'garden/cello')).toBe(0);
    for (const list of Object.values(c)) expect(list.length).toBeLessThanOrEqual(1);
  });

  test('is deterministic', () => {
    expect(buildConcordance(DOCS)).toEqual(buildConcordance(DOCS));
  });
});
