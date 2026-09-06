import type { FabricEvent } from './schema';
import { project, type FabricState } from './log';

// ─── Invariants ───────────────────────────────────────────────────
//
// Every way a log can fail to be a fabric, as messages. Pure. Empty
// when the log holds INV-FAB-001..004; the fifth and sixth are
// properties of the fold itself and are held by tests.

const blessedByOwner = (state: FabricState, space: string, by: string): boolean =>
  state.spaces.get(space)?.sovereign === by;

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
    ...homelessReferences,
  ];
}
