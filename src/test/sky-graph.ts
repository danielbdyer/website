// Builders for constellation graphs in tests: stars by key and axes,
// figure strokes and relations, and a sky over the site's eight facets.
// One place to hold the graph's shape so the tests describe behavior,
// not fixtures. CATHEDRALS.md §"The Contract" — the sky reads a slice,
// so a test's graph is whatever axes and keys it names.

import type { Origin } from '@dbd/slice';
import {
  axesOf,
  type Axis,
  type ConstellationEdge,
  type ConstellationGraph,
  type ConstellationHue,
  type ConstellationNode,
} from '@/shared/content/constellation';
import { facetAxes } from '@/shared/content/facet-compass';
import { diskToHemisphere } from '@/shared/geometry/sphere';

/** The eight facets as the compass, as the works adapter hands them
 *  to the sky. */
export const FACET_AXES: readonly Axis[] = axesOf(facetAxes());

export const hueOf = (axis: string | undefined): ConstellationHue =>
  FACET_AXES.find((a) => a.id === axis)?.hue ?? 'gold';

/** A star at `key` (a work's `room/slug`, or any id), carrying `axes`,
 *  placed at the given polar coordinates on the disk. A slashed key
 *  reads as `group/slug` and opens in the sky; a bare key has no page. */
export function star(
  key: string,
  axes: readonly string[],
  angleDeg: number,
  radius: number,
  extras: Partial<ConstellationNode> = {},
): ConstellationNode {
  const slash = key.indexOf('/');
  const group = slash === -1 ? null : key.slice(0, slash);
  const slug = slash === -1 ? key : key.slice(slash + 1);
  return {
    key,
    title: slug,
    kind: 'work',
    group,
    href: group ? `/sky/${key}` : null,
    summary: null,
    date: new Date('2026-01-01'),
    axes,
    status: null,
    isPreview: false,
    angleDeg,
    radius,
    unitPosition: diskToHemisphere(radius, (angleDeg * Math.PI) / 180),
    hue: hueOf(axes[0]),
    twinklePhase: 0,
    ...extras,
  };
}

/** A stroke of an axis's figure between two stars — emergent. */
export function figure(source: string, target: string, axis: string): ConstellationEdge {
  return { source, target, axis, hue: hueOf(axis), origin: 'emergent', predicate: null };
}

/** A relation the slice carried — declared unless said otherwise. */
export function relation(
  source: string,
  target: string,
  predicate = 'references',
  origin: Origin = 'declared',
): ConstellationEdge {
  return { source, target, axis: null, hue: null, origin, predicate };
}

/** A sky over the eight facets. */
export function sky(
  nodes: readonly ConstellationNode[],
  edges: readonly ConstellationEdge[],
  extras: Partial<ConstellationGraph> = {},
): ConstellationGraph {
  return { axes: FACET_AXES, nodes, edges, ...extras };
}
