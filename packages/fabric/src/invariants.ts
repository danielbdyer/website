import { RETRIEVAL_VERBS, isAgent, type FabricEvent } from './schema';
import { project, type FabricState } from './log';

// ─── Invariants ───────────────────────────────────────────────────
//
// Every way a log can fail to be a fabric, as messages. Pure. Empty
// when the log holds INV-FAB-001..004 and 008..012; the fifth, sixth,
// and seventh are properties of the fold and the gate, held by tests.

const blessedByOwner = (state: FabricState, space: string, by: string): boolean =>
  state.spaces.get(space)?.sovereign === by;

const retrievalVerbs = new Set(RETRIEVAL_VERBS.map((verb) => `verb/${verb}`));

/** A receipt for a retrieval verb with no retrieval event beside it (INV-FAB-010). */
const unrecordedRetrievals = (state: FabricState): readonly string[] =>
  state.receipts.flatMap((receipt) =>
    retrievalVerbs.has(receipt.verb) &&
    !state.retrievals.some(
      (retrieval) => retrieval.session === receipt.session && retrieval.at === receipt.at,
    )
      ? [
          `INV-FAB-010: receipt ${receipt.id} for ${receipt.verb} has no retrieval event for session ${receipt.session} at ${receipt.at}`,
        ]
      : [],
  );

/** An agent event that reached the log with no because (INV-FAB-011);
 *  the schema refuses these at the edge, so one here was hand-edited. */
const unreasonedAgentEvents = (events: readonly FabricEvent[]): readonly string[] =>
  events.flatMap((event) =>
    isAgent(event.actor) && !event.because
      ? [`INV-FAB-011: ${event.kind} at step ${event.step} by ${event.actor} carries no because`]
      : [],
  );

const unblessedCalls = (state: FabricState): readonly string[] =>
  state.receipts.flatMap((receipt) => {
    const verb = state.verbs.get(receipt.verb);
    return verb?.blessedAt === undefined || verb.retiredAt !== undefined
      ? [`INV-FAB-001: receipt ${receipt.id} calls ${receipt.verb}, which is not in the manifest`]
      : [];
  });

// A withdrawal takes back a proposal nothing was granted on; taking
// back a blessed verb is retiring it, which is the sovereign's.
const withdrawnBlessings = (
  state: FabricState,
  events: readonly FabricEvent[],
): readonly string[] =>
  events.flatMap((event) => {
    if (event.kind !== 'verb.withdrawn') return [];
    const verb = state.verbs.get(event.payload.verb);
    if (!verb) return [`INV-FAB-002: verb.withdrawn names ${event.payload.verb}, never proposed`];
    return verb.blessedAt === undefined
      ? []
      : [
          `INV-FAB-002: ${event.actor} withdrew ${verb.id}, which ${state.spaces.get(verb.space)?.sovereign ?? 'its sovereign'} had blessed; only the sovereign retires a blessed verb`,
        ];
  });

const strangerBlessings = (state: FabricState, events: readonly FabricEvent[]): readonly string[] =>
  events.flatMap((event) => {
    if (event.kind !== 'verb.blessed' && event.kind !== 'verb.retired') return [];
    const verb = state.verbs.get(event.payload.verb);
    if (!verb) return [`INV-FAB-002: ${event.kind} names ${event.payload.verb}, never proposed`];
    return blessedByOwner(state, verb.space, event.payload.by)
      ? []
      : [
          `INV-FAB-002: ${event.payload.by} ${event.kind === 'verb.blessed' ? 'blessed' : 'retired'} ${verb.id} in ${verb.space}, whose sovereign is ${state.spaces.get(verb.space)?.sovereign ?? 'unknown'}`,
        ];
  });

const strangerSources = (state: FabricState, events: readonly FabricEvent[]): readonly string[] =>
  events.flatMap((event) => {
    if (event.kind !== 'source.blessed') return [];
    const source = state.sources.get(event.payload.source);
    if (!source)
      return [`INV-FAB-002: source.blessed names ${event.payload.source}, never proposed`];
    return blessedByOwner(state, source.space, event.payload.by)
      ? []
      : [
          `INV-FAB-002: ${event.payload.by} blessed source ${source.id} in ${source.space}, whose sovereign is ${state.spaces.get(source.space)?.sovereign ?? 'unknown'}`,
        ];
  });

const sameSpaceCrossings = (state: FabricState): readonly string[] =>
  [...state.crossings.values()].flatMap((crossing) =>
    crossing.from === crossing.to
      ? [
          `INV-FAB-003: crossing ${crossing.id} does not cross a wall (${crossing.from} to ${crossing.to})`,
        ]
      : [],
  );

const strangerResolutions = (
  state: FabricState,
  events: readonly FabricEvent[],
): readonly string[] =>
  events.flatMap((event) => {
    if (event.kind !== 'crossing.resolved') return [];
    const crossing = state.crossings.get(event.payload.crossing);
    if (!crossing)
      return [`INV-FAB-003: resolution names ${event.payload.crossing}, never proposed`];
    return blessedByOwner(state, crossing.to, event.payload.by)
      ? []
      : [
          `INV-FAB-003: ${event.payload.by} resolved crossing ${crossing.id} into ${crossing.to}, whose sovereign is ${state.spaces.get(crossing.to)?.sovereign ?? 'unknown'}`,
        ];
  });

// A bridge relates two nodes, and is answered by the sovereign of the
// space it lands in (INV-FAB-012).
const selfBridges = (state: FabricState): readonly string[] =>
  [...state.bridges.values()].flatMap((bridge) =>
    bridge.subject === bridge.object
      ? [`INV-FAB-012: bridge ${bridge.id} relates ${bridge.subject} to itself`]
      : [],
  );

const strangerBridges = (state: FabricState, events: readonly FabricEvent[]): readonly string[] =>
  events.flatMap((event) => {
    if (event.kind !== 'bridge.resolved') return [];
    const bridge = state.bridges.get(event.payload.bridge);
    if (!bridge) return [`INV-FAB-012: resolution names ${event.payload.bridge}, never proposed`];
    return blessedByOwner(state, bridge.space, event.payload.by)
      ? []
      : [
          `INV-FAB-012: ${event.payload.by} resolved bridge ${bridge.id} in ${bridge.space}, whose sovereign is ${state.spaces.get(bridge.space)?.sovereign ?? 'unknown'}`,
        ];
  });

const strangerPatches = (state: FabricState, events: readonly FabricEvent[]): readonly string[] =>
  events.flatMap((event) => {
    if (event.kind !== 'patch.resolved') return [];
    const patch = state.patches.get(event.payload.patch);
    if (!patch) return [`INV-FAB-008: resolution names ${event.payload.patch}, never proposed`];
    return blessedByOwner(state, patch.space, event.payload.by)
      ? []
      : [
          `INV-FAB-008: ${event.payload.by} resolved patch ${patch.id} in ${patch.space}, whose sovereign is ${state.spaces.get(patch.space)?.sovereign ?? 'unknown'}`,
        ];
  });

const orphanOutcomes = (state: FabricState): readonly string[] =>
  state.outcomes.flatMap((outcome) => {
    const patch = state.patches.get(outcome.patch);
    return patch?.applied
      ? []
      : [`INV-FAB-009: outcome ${outcome.outcome} cites ${outcome.patch}, which was never applied`];
  });

const homelessReferences = (state: FabricState): readonly string[] =>
  state.references.flatMap((reference) =>
    reference.space === reference.to.space
      ? [
          `INV-FAB-004: reference on ${reference.onNode} cites ${reference.to.node} in its own space; a weak reference crosses a wall`,
        ]
      : [],
  );

export function fabricIssues(events: readonly FabricEvent[]): readonly string[] {
  const state = project(events);

  return [
    ...unblessedCalls(state),
    ...withdrawnBlessings(state, events),
    ...strangerBlessings(state, events),
    ...strangerSources(state, events),
    ...sameSpaceCrossings(state),
    ...strangerResolutions(state, events),
    ...selfBridges(state),
    ...strangerBridges(state, events),
    ...strangerPatches(state, events),
    ...orphanOutcomes(state),
    ...unrecordedRetrievals(state),
    ...unreasonedAgentEvents(events),
    ...homelessReferences(state),
  ];
}
