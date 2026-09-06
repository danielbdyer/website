import {
  parseSlice,
  type Axis,
  type Ghost,
  type Slice,
  type SliceEdge,
  type SliceNode,
} from '@dbd/slice';
import { homeOf, pendingIn, visibleReflections, type FabricState } from './log';
import type { Aperture } from './ports';
import type { Reflection } from './schema';

// ─── The fabric's own memory, as a slice ───────────────────────────
//
// The first GraphSource is the fold itself: what a tenant may see of
// the reflections, cut for one turn. A reflection is a node whose
// `group` is the space it lives in now — its own space until a bridge
// carries it across and the sovereign blesses it. Citations between
// two reflections both in the slice are declared `references`; a
// citation to anything else stays a weak reference and is not drawn.
// Proposals still waiting are ghosts. Pure: time is an argument.

const nodeFrom = (state: FabricState, reflection: Reflection): SliceNode => ({
  id: reflection.id,
  title: reflection.attempted,
  kind: 'reflection',
  axes: [],
  summary: reflection.observed.join(' · '),
  createdAt: reflection.at,
  status: reflection.status,
  group: homeOf(state, reflection),
});

const edgesFrom = (reflection: Reflection, known: ReadonlySet<string>): readonly SliceEdge[] =>
  reflection.cites.flatMap((citation) =>
    known.has(citation.node) && citation.node !== reflection.id
      ? [
          {
            subject: reflection.id,
            predicate: 'references' as const,
            object: citation.node,
            origin: 'declared' as const,
          },
        ]
      : [],
  );

const ghostFrom =
  (state: FabricState) =>
  (bridgeId: string): readonly Ghost[] => {
    const bridge = state.bridges.get(bridgeId);
    const reflection = bridge ? state.reflections.get(bridge.node) : undefined;
    return bridge && reflection
      ? [
          {
            id: bridge.id,
            operation: 'create_entity' as const,
            title: reflection.attempted,
            evidence: bridge.evidence,
            ...(bridge.confidence === undefined ? {} : { confidence: bridge.confidence }),
          },
        ]
      : [];
  };

const matches =
  (query: string | undefined) =>
  (reflection: Reflection): boolean =>
    query === undefined ||
    [reflection.attempted, ...reflection.observed, ...reflection.inferred].some((text) =>
      text.toLowerCase().includes(query.toLowerCase()),
    );

const newestFirst = (a: Reflection, b: Reflection): number => b.at.localeCompare(a.at);

/** The memory of `viewer`, cut for one turn: the reflections it may
 *  see (INV-FAB-006), filtered by the aperture's query and capped by
 *  its `topK`, with the proposals waiting in `viewer`'s space as
 *  ghosts. Grounded by construction; parsed so the invariants hold. */
export function sliceFromState(
  state: FabricState,
  viewer: string,
  asOf: string,
  aperture: Aperture = {},
): Slice {
  const seen = visibleReflections(state, viewer)
    .filter(matches(aperture.query))
    .toSorted(newestFirst)
    .slice(0, aperture.topK ?? Number.POSITIVE_INFINITY);
  const known = new Set(seen.map((reflection) => reflection.id));
  const waiting = pendingIn(state, viewer);
  return parseSlice({
    space: viewer,
    asOf,
    axes: [],
    nodes: seen.map((reflection) => nodeFrom(state, reflection)),
    edges: seen.flatMap((reflection) => edgesFrom(reflection, known)),
    pending: {
      unresolved: waiting.length,
      ghosts: waiting.flatMap((bridge) => ghostFrom(state)(bridge.id)),
    },
  });
}

// ─── Merging and cutting ──────────────────────────────────────────

export interface SliceParts {
  readonly axes: readonly Axis[];
  readonly nodes: readonly SliceNode[];
  readonly edges: readonly SliceEdge[];
}

/** The items with one per key, the first occurrence kept. A Map keeps
 *  the last, so the list is reversed on the way in and out. */
const uniqueBy = <T>(items: readonly T[], key: (item: T) => string): readonly T[] =>
  [...new Map(items.toReversed().map((item) => [key(item), item])).values()].toReversed();

const edgeKey = (edge: SliceEdge): string => `${edge.subject} ${edge.predicate} ${edge.object}`;

/** Several sources' parts as one slice for one space: nodes and axes
 *  by id, first wins; edges kept only when both ends survived, so the
 *  merge is grounded whatever the parts were. */
export function mergeParts(
  space: string,
  asOf: string,
  pending: Slice['pending'],
  parts: readonly SliceParts[],
): Slice {
  const nodes = uniqueBy(
    parts.flatMap((part) => part.nodes),
    (node) => node.id,
  );
  const known = new Set(nodes.map((node) => node.id));
  const axes = uniqueBy(
    parts.flatMap((part) => part.axes),
    (axis) => axis.id,
  );
  const named = new Set(axes.map((axis) => axis.id));
  return parseSlice({
    space,
    asOf,
    axes,
    nodes: nodes.map((node) => ({ ...node, axes: node.axes.filter((axis) => named.has(axis)) })),
    edges: uniqueBy(
      parts
        .flatMap((part) => part.edges)
        .filter((edge) => known.has(edge.subject) && known.has(edge.object)),
      edgeKey,
    ),
    pending,
  });
}

const mentions =
  (query: string) =>
  (node: SliceNode): boolean =>
    [node.title, node.summary ?? '', node.kind, ...node.axes].some((text) =>
      text.toLowerCase().includes(query.toLowerCase()),
    );

/** A slice, cut by an aperture. With scores, the nodes resonance found
 *  come first, nearest first, and the rest follow if they mention the
 *  query; without, mention alone decides. Newest first among equals;
 *  at most `topK`; edges between what remains; ghosts untouched. */
export function cut(
  slice: Slice,
  aperture: Aperture,
  scores: ReadonlyMap<string, number> = new Map(),
): Slice {
  const score = (node: SliceNode): number => scores.get(node.id) ?? Number.NEGATIVE_INFINITY;
  const kept = slice.nodes
    .filter(
      aperture.query === undefined
        ? () => true
        : (node) => scores.has(node.id) || mentions(aperture.query ?? '')(node),
    )
    .toSorted(
      (a, b) =>
        score(b) - score(a) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    )
    .slice(0, aperture.topK ?? Number.POSITIVE_INFINITY);
  const known = new Set(kept.map((node) => node.id));
  return parseSlice({
    ...slice,
    nodes: kept,
    edges: slice.edges.filter((edge) => known.has(edge.subject) && known.has(edge.object)),
  });
}
