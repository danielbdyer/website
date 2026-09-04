import { describe, expect, test } from 'vitest';
import { canonicalSkyGraph } from '@/test/sky-fixtures';
import { POLE_KEY, namedRanks } from '@/shared/content/skyWalk';
import { presentFrom } from '@/shared/content/presence';
import { buildPositionedMap, resolveEdges, threadPresent } from './layout';
import { presentEdgeIds } from './walk';

describe('presentEdgeIds', () => {
  const edges = resolveEdges(canonicalSkyGraph, buildPositionedMap(canonicalSkyGraph));

  test('names exactly the threads present from a place, by id', () => {
    const here = canonicalSkyGraph.nodes[0]!.key;
    const present = presentFrom(canonicalSkyGraph, here);
    const named = namedRanks(canonicalSkyGraph, here);
    const ids = presentEdgeIds(edges, present, named);
    for (const edge of edges) {
      expect(ids.has(edge.id)).toBe(threadPresent(present, named, edge));
    }
  });

  test("a small sky's figures are all present from the pole", () => {
    const ids = presentEdgeIds(
      edges,
      presentFrom(canonicalSkyGraph, POLE_KEY),
      namedRanks(canonicalSkyGraph, POLE_KEY),
    );
    const figures = edges.filter((edge) => edge.origin === 'emergent');
    expect(figures.length).toBeGreaterThan(0);
    expect(figures.every((edge) => ids.has(edge.id))).toBe(true);
  });
});
