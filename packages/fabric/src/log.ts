import type {
  BridgeProposal,
  FabricEvent,
  FabricEventKind,
  Receipt,
  Reflection,
  Space,
  Verb,
  WeakReference,
} from './schema';

// ─── The projection ───────────────────────────────────────────────
//
// State is a pure fold over the log: `project` is `reduce(apply)`, and
// `apply` is a table with one handler per event kind. The table's type
// is indexed by the union of kinds, so adding an event to the schema
// is a compile error here until it has a handler — exhaustiveness the
// types demand, never a default branch. Replaying the same events
// yields the same state (INV-FAB-005); the only write anywhere is an
// append. Nothing here performs an effect.

export interface FabricState {
  readonly spaces: ReadonlyMap<string, Space>;
  readonly verbs: ReadonlyMap<string, Verb>;
  readonly receipts: readonly Receipt[];
  readonly reflections: ReadonlyMap<string, Reflection>;
  readonly bridges: ReadonlyMap<string, BridgeProposal>;
  readonly references: readonly WeakReference[];
  readonly step: number;
}

export const emptyState: FabricState = {
  spaces: new Map(),
  verbs: new Map(),
  receipts: [],
  reflections: new Map(),
  bridges: new Map(),
  references: [],
  step: -1,
};

type EventOf<K extends FabricEventKind> = Extract<FabricEvent, { kind: K }>;

type Handler<K extends FabricEventKind> = (state: FabricState, event: EventOf<K>) => FabricState;

/** A map with one more entry, the old map untouched. */
const withEntry = <V>(map: ReadonlyMap<string, V>, key: string, value: V): ReadonlyMap<string, V> =>
  new Map([...map, [key, value]]);

/** Change one verb by id, or leave the state alone when the log never
 *  proposed it. Unknown ids are reported by the invariants, never
 *  invented by the fold. */
const amendVerb =
  (change: (verb: Verb) => Verb): Handler<'verb.blessed' | 'verb.retired'> =>
  (state, event) => {
    const verb = state.verbs.get(event.payload.verb);
    return verb ? { ...state, verbs: withEntry(state.verbs, verb.id, change(verb)) } : state;
  };

const handlers: { readonly [K in FabricEventKind]: Handler<K> } = {
  'space.opened': (state, { payload }) => ({
    ...state,
    spaces: withEntry(state.spaces, payload.id, payload),
  }),
  'verb.proposed': (state, { payload }) => ({
    ...state,
    verbs: withEntry(state.verbs, payload.id, payload),
  }),
  'verb.blessed': (state, event) =>
    amendVerb((verb) => ({ ...verb, blessedAt: event.payload.at }))(state, event),
  'verb.retired': (state, event) =>
    amendVerb((verb) => ({ ...verb, retiredAt: event.payload.at }))(state, event),
  'verb.called': (state, { payload }) => ({ ...state, receipts: [...state.receipts, payload] }),
  'reflection.recorded': (state, { payload }) => ({
    ...state,
    reflections: withEntry(state.reflections, payload.id, payload),
  }),
  'bridge.proposed': (state, { payload }) => ({
    ...state,
    bridges: withEntry(state.bridges, payload.id, payload),
  }),
  // The first answer wins: a proposal is closed once (INV-FAB-003).
  'bridge.resolved': (state, { payload }) => {
    const bridge = state.bridges.get(payload.proposal);
    return bridge?.decision === null
      ? {
          ...state,
          bridges: withEntry(state.bridges, bridge.id, {
            ...bridge,
            decision: payload.decision,
            decidedAt: payload.at,
            decidedBy: payload.by,
          }),
        }
      : state;
  },
  'reference.cited': (state, { payload }) => ({
    ...state,
    references: [...state.references, payload],
  }),
};

/** One event applied to one state: the handler for its kind, then the
 *  step advanced. */
export function apply(state: FabricState, event: FabricEvent): FabricState {
  const handle = handlers[event.kind] as Handler<typeof event.kind>;
  return { ...handle(state, event), step: event.step };
}

/** The whole log, folded. */
export function project(events: readonly FabricEvent[]): FabricState {
  return events.reduce(apply, emptyState);
}

/** The proposals still waiting in a space: the gap, counted. */
export function pendingIn(state: FabricState, space: string): readonly BridgeProposal[] {
  return [...state.bridges.values()].filter(
    (bridge) => bridge.to === space && bridge.decision === null,
  );
}

/** The space a reflection lives in now: its own until a bridge carried
 *  it across and the sovereign blessed it. */
export function homeOf(state: FabricState, reflection: Reflection): string {
  return (
    [...state.bridges.values()].find(
      (bridge) => bridge.node === reflection.id && bridge.decision === 'blessed',
    )?.to ?? reflection.space
  );
}

/** The reflections a session in `space` may retrieve. Inside its own
 *  space a tenant sees everything it recorded. Across the wall it sees
 *  only what was carried over and blessed (INV-FAB-006). */
export function visibleReflections(state: FabricState, space: string): readonly Reflection[] {
  return [...state.reflections.values()].filter(
    (reflection) => reflection.space === space || homeOf(state, reflection) === space,
  );
}
