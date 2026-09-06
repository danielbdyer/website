import { RETRIEVAL_VERBS, isAgent, type FabricEvent } from './schema';
import { project, type FabricState } from './log';

// ─── Invariants ───────────────────────────────────────────────────
//
// Every way a log can fail to be a fabric, as messages. Pure. Empty
// when the log holds INV-FAB-001..004 and 008..011; the fifth, sixth,
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

export function fabricIssues(events: readonly FabricEvent[]): readonly string[] {
  const state = project(events);

  const unblessedCalls = state.receipts.flatMap((receipt) => {
    const verb = state.verbs.get(receipt.verb);
    return verb?.blessedAt === undefined || verb.retiredAt !== undefined
      ? [`INV-FAB-001: receipt ${receipt.id} calls ${receipt.verb}, which is not in the manifest`]
      : [];
  });

  const strangerBlessings = events.flatMap((event) => {
    if (event.kind !== 'verb.blessed' && event.kind !== 'verb.retired') return [];
    const verb = state.verbs.get(event.payload.verb);
    if (!verb) return [`INV-FAB-002: ${event.kind} names ${event.payload.verb}, never proposed`];
    return blessedByOwner(state, verb.space, event.payload.by)
      ? []
      : [
          `INV-FAB-002: ${event.payload.by} ${event.kind === 'verb.blessed' ? 'blessed' : 'retired'} ${verb.id} in ${verb.space}, whose sovereign is ${state.spaces.get(verb.space)?.sovereign ?? 'unknown'}`,
        ];
  });

  const strangerSources = events.flatMap((event) => {
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

  const sameSpaceBridges = [...state.bridges.values()].flatMap((bridge) =>
    bridge.from === bridge.to
      ? [`INV-FAB-003: bridge ${bridge.id} does not cross a wall (${bridge.from} to ${bridge.to})`]
      : [],
  );

  const strangerResolutions = events.flatMap((event) => {
    if (event.kind !== 'bridge.resolved') return [];
    const bridge = state.bridges.get(event.payload.proposal);
    if (!bridge) return [`INV-FAB-003: resolution names ${event.payload.proposal}, never proposed`];
    return blessedByOwner(state, bridge.to, event.payload.by)
      ? []
      : [
          `INV-FAB-003: ${event.payload.by} resolved bridge ${bridge.id} into ${bridge.to}, whose sovereign is ${state.spaces.get(bridge.to)?.sovereign ?? 'unknown'}`,
        ];
  });

  const strangerPatches = events.flatMap((event) => {
    if (event.kind !== 'patch.resolved') return [];
    const patch = state.patches.get(event.payload.patch);
    if (!patch) return [`INV-FAB-008: resolution names ${event.payload.patch}, never proposed`];
    return blessedByOwner(state, patch.space, event.payload.by)
      ? []
      : [
          `INV-FAB-008: ${event.payload.by} resolved patch ${patch.id} in ${patch.space}, whose sovereign is ${state.spaces.get(patch.space)?.sovereign ?? 'unknown'}`,
        ];
  });

  const orphanOutcomes = state.outcomes.flatMap((outcome) => {
    const patch = state.patches.get(outcome.patch);
    return patch?.applied
      ? []
      : [`INV-FAB-009: outcome ${outcome.outcome} cites ${outcome.patch}, which was never applied`];
  });

  const homelessReferences = state.references.flatMap((reference) =>
    reference.space === reference.to.space
      ? [
          `INV-FAB-004: reference on ${reference.onNode} cites ${reference.to.node} in its own space; a weak reference crosses a wall`,
        ]
      : [],
  );

  return [
    ...unblessedCalls,
    ...strangerBlessings,
    ...strangerSources,
    ...sameSpaceBridges,
    ...strangerResolutions,
    ...strangerPatches,
    ...orphanOutcomes,
    ...unrecordedRetrievals(state),
    ...unreasonedAgentEvents(events),
    ...homelessReferences,
  ];
}
