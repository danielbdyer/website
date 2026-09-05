import { describe, expect, test } from 'vitest';
import { figure, sky, star } from '@/test/sky-graph';
import { concordantFrom, presentFrom, relevanceFrom } from './presence';
import { POLE_KEY } from './skyWalk';

// A ring of eight stars plus a chain of craft strokes; small weather
// stands alone at the pole's side with words in concordance with the
// far salon star.
const NODES = [
  star('studio/a', ['craft'], 0, 0.5),
  star('studio/b', ['craft'], 20, 0.5),
  star('studio/c', ['craft'], 40, 0.5),
  star('garden/d', ['beauty'], 90, 0.5),
  star('garden/e', ['beauty'], 110, 0.5),
  star('study/f', ['consciousness'], 180, 0.5),
  star('study/g', ['consciousness'], 200, 0.5),
  star('salon/h', ['leadership'], 270, 0.5),
  star('garden/weather', ['relation'], 315, 0.2),
];
const GRAPH = sky(
  NODES,
  [
    figure('studio/a', 'studio/b', 'craft'),
    figure('studio/b', 'studio/c', 'craft'),
    figure('garden/d', 'garden/e', 'beauty'),
    figure('study/f', 'study/g', 'consciousness'),
  ],
  {
    concordance: {
      'garden/weather': [{ key: 'salon/h', weight: 0.4 }],
      'salon/h': [{ key: 'garden/weather', weight: 0.4 }],
    },
  },
);

describe('relevanceFrom', () => {
  test('here is 1; a neighbor outranks a star two strokes away, which outranks a stranger', () => {
    const r = relevanceFrom(GRAPH, 'studio/a');
    expect(r.get('studio/a')).toBe(1);
    expect(r.get('studio/b')!).toBeGreaterThan(r.get('studio/c')!);
    expect(r.get('studio/c')!).toBeGreaterThan(r.get('study/g')!);
  });

  test('words in concordance raise a star no figure reaches', () => {
    const r = relevanceFrom(GRAPH, 'garden/weather');
    expect(r.get('salon/h')!).toBeGreaterThan(r.get('study/f')!);
  });
});

describe('presentFrom', () => {
  test('at the pole everything is present', () => {
    expect(presentFrom(GRAPH, POLE_KEY, 4).size).toBe(NODES.length);
  });

  test('a small sky is wholly present', () => {
    expect(presentFrom(GRAPH, 'studio/a').size).toBe(NODES.length);
  });

  test('under a cap, here, its neighbors, and its bearings’ ends are always present', () => {
    const present = presentFrom(GRAPH, 'studio/b', 4, 1);
    expect(present.has('studio/b')).toBe(true);
    expect(present.has('studio/a')).toBe(true);
    expect(present.has('studio/c')).toBe(true);
    expect(present.size).toBe(4);
  });

  test('keeps a stranger from the far end of relevance, the same one each time', () => {
    const a = presentFrom(GRAPH, 'studio/a', 5, 1);
    const b = presentFrom(GRAPH, 'studio/a', 5, 1);
    expect([...a]).toEqual([...b]);
    expect(a.size).toBe(5);
    // The stranger is not among the top-ranked remainder.
    const relevance = relevanceFrom(GRAPH, 'studio/a');
    const remainder = [...a].filter((k) => !['studio/a', 'studio/b', 'studio/c'].includes(k));
    const weakest = remainder.toSorted((x, y) => relevance.get(x)! - relevance.get(y)!)[0]!;
    const allOthers = NODES.map((n) => n.key).filter(
      (k) => !['studio/a', 'studio/b', 'studio/c'].includes(k),
    );
    const strongest = allOthers.toSorted((x, y) => relevance.get(y)! - relevance.get(x)!)[0]!;
    expect(weakest).not.toBe(strongest);
  });
});

describe('concordantFrom', () => {
  test('names the node whose words echo yours when no thread joins them', () => {
    expect(concordantFrom(GRAPH, 'garden/weather')).toEqual({ key: 'salon/h', weight: 0.4 });
  });

  test('is silent at the pole and below the minimum', () => {
    expect(concordantFrom(GRAPH, POLE_KEY)).toBeNull();
    expect(concordantFrom(GRAPH, 'garden/weather', 0.5)).toBeNull();
  });
});
