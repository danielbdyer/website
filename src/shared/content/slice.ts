import { parseSlice, type Axis, type Slice, type SliceEdge, type SliceNode } from '@dby/slice';
import type { Work } from './schema';
import { isPublished } from './schema';
import { COMPASS, FACET_AZIMUTH_DEG, FACET_HUE } from './constellation';

// ─── The works adapter ─────────────────────────────────────────────
//
// The house's graph as a slice: published works as nodes, the eight
// facets as the compass, and the wikilinks between works as declared
// `references`. This is the first adapter of the `GraphSource` port
// named in CATHEDRALS.md §"Dependency injection, without a container";
// the engine's vault adapter is the second. Pure: time is an argument.
//
// What it does not carry is as deliberate as what it does. No body —
// the body stays at home (INV: the slice never carries what a body
// does not). No figures — the spanning trees are the sky's to derive
// from axes and placement (INV-SLC-005). No pending — the site has no
// proposals until the engine enters (INV-SLC-004).

/** The site is one space: the author's canonical graph. */
export const SITE_SPACE = 'site';

/** The eight facets as the compass, in bearing order, with the sky's
 *  azimuths and hues. */
export function facetAxes(): readonly Axis[] {
  return COMPASS.map((facet) => ({
    id: facet,
    name: facet,
    azimuthDeg: FACET_AZIMUTH_DEG[facet],
    hue: FACET_HUE[facet],
  }));
}

const nodeId = (room: string, slug: string): string => `${room}/${slug}`;

const byText = (a: string, b: string): number => a.localeCompare(b);

const nodeFrom = (work: Work): SliceNode => ({
  id: nodeId(work.room, work.slug),
  title: work.title,
  kind: work.type ?? 'work',
  axes: [...work.facets],
  ...(work.summary === undefined ? {} : { summary: work.summary }),
  createdAt: work.date.toISOString(),
  href: `/${work.room}/${work.slug}`,
  group: work.room,
});

/** The declared edges into a work: each published work whose body
 *  links to it, as `references`. A link from a work outside the slice
 *  (a draft, a future date) is dropped so every edge stays grounded. */
const edgesInto = (work: Work, known: ReadonlySet<string>): readonly SliceEdge[] =>
  work.backlinks.flatMap((from) => {
    const subject = nodeId(from.room, from.slug);
    return known.has(subject)
      ? [
          {
            subject,
            predicate: 'references' as const,
            object: nodeId(work.room, work.slug),
            origin: 'declared' as const,
          },
        ]
      : [];
  });

const edgeKey = (edge: SliceEdge): string => `${edge.subject} ${edge.predicate} ${edge.object}`;

/** Cut the site's slice from its works as of `now`. Deterministic:
 *  nodes and edges are sorted by key, and the result is parsed through
 *  the schema of record, so the adapter cannot emit an ungrounded slice. */
export function sliceFromWorks(works: readonly Work[], now: Date = new Date()): Slice {
  const published = works
    .filter((work) => isPublished(work, now))
    .toSorted((a, b) => byText(nodeId(a.room, a.slug), nodeId(b.room, b.slug)));
  const known = new Set(published.map((work) => nodeId(work.room, work.slug)));
  const edges = [
    ...new Map(
      published.flatMap((work) => edgesInto(work, known)).map((edge) => [edgeKey(edge), edge]),
    ).values(),
  ].toSorted((a, b) => byText(edgeKey(a), edgeKey(b)));
  return parseSlice({
    space: SITE_SPACE,
    asOf: now.toISOString(),
    axes: facetAxes(),
    nodes: published.map(nodeFrom),
    edges,
    pending: { unresolved: 0, ghosts: [] },
  });
}
