import { parseSlice, type Ghost, type Slice, type SliceEdge, type SliceNode } from '@dbd/slice';
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
