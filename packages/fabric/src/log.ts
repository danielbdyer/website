import type {
  BridgeProposal,
  Evaluation,
  FabricEvent,
  FabricEventKind,
  OutcomeRecord,
  Patch,
  Receipt,
  Reflection,
  Refusal,
  Retrieval,
  Source,
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

/** A patch as the fold holds it: the proposal, and the fabric's
 *  evaluation once it arrives. */
export type PatchRecord = Patch & { readonly evaluation?: Evaluation };

export interface FabricState {
  readonly spaces: ReadonlyMap<string, Space>;
  readonly verbs: ReadonlyMap<string, Verb>;
  readonly receipts: readonly Receipt[];
  readonly refusals: readonly Refusal[];
  readonly sources: ReadonlyMap<string, Source>;
  readonly reflections: ReadonlyMap<string, Reflection>;
  readonly bridges: ReadonlyMap<string, BridgeProposal>;
  readonly references: readonly WeakReference[];
  readonly patches: ReadonlyMap<string, PatchRecord>;
  readonly outcomes: readonly OutcomeRecord[];
  readonly retrievals: readonly Retrieval[];
  readonly step: number;
  /** The latest time any event carried, whatever order the tenants' logs were read in. */
  readonly lastAt: string;
}

export const emptyState: FabricState = {
  spaces: new Map(),
  verbs: new Map(),
  receipts: [],
  refusals: [],
  sources: new Map(),
  reflections: new Map(),
  bridges: new Map(),
  references: [],
  patches: new Map(),
  outcomes: [],
  retrievals: [],
  step: -1,
  lastAt: '1970-01-01T00:00:00.000Z',
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
  'verb.refused': (state, { payload }) => ({ ...state, refusals: [...state.refusals, payload] }),
  'source.proposed': (state, { payload }) => ({
    ...state,
    sources: withEntry(state.sources, payload.id, payload),
  }),
  'source.blessed': (state, { payload }) => {
    const source = state.sources.get(payload.source);
    return source
      ? {
          ...state,
          sources: withEntry(state.sources, source.id, { ...source, blessedAt: payload.at }),
        }
      : state;
  },
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
  'patch.proposed': (state, { payload }) => ({
    ...state,
    patches: withEntry(state.patches, payload.id, payload),
  }),
  'patch.evaluated': (state, { payload }) => {
    const patch = state.patches.get(payload.patch);
    return patch
      ? { ...state, patches: withEntry(state.patches, patch.id, { ...patch, evaluation: payload }) }
      : state;
  },
  // The first answer wins here too (INV-FAB-008).
  'patch.resolved': (state, { payload }) => {
    const patch = state.patches.get(payload.patch);
    return patch?.decision === null
      ? {
          ...state,
          patches: withEntry(state.patches, patch.id, {
            ...patch,
            decision: payload.decision,
            decidedAt: payload.at,
            decidedBy: payload.by,
            applied: payload.applied,
          }),
        }
      : state;
  },
  'patch.outcome': (state, { payload }) => ({ ...state, outcomes: [...state.outcomes, payload] }),
  'retrieval.surfaced': (state, { payload }) => ({
    ...state,
    retrievals: [...state.retrievals, payload],
  }),
};

/** The later of two ISO times, which sort as text. */
const later = (a: string, b: string): string => (a.localeCompare(b) > 0 ? a : b);

/** One event applied to one state: the handler for its kind, then the
 *  step advanced. */
export function apply(state: FabricState, event: FabricEvent): FabricState {
  const handle = handlers[event.kind] as Handler<typeof event.kind>;
  return {
    ...handle(state, event),
    step: event.step,
    lastAt: later(event.at, state.lastAt),
  };
}

/** The whole log, folded. */
export function project(events: readonly FabricEvent[]): FabricState {
  return events.reduce(apply, emptyState);
}

/** The sources a space reads from: blessed, in proposal order. */
export function sourcesOf(state: FabricState, space: string): readonly Source[] {
  return [...state.sources.values()].filter(
    (source) => source.space === space && source.blessedAt !== undefined,
  );
}

/** The patches still waiting in a space. */
export function patchesPendingIn(state: FabricState, space: string): readonly PatchRecord[] {
  return [...state.patches.values()].filter(
    (patch) => patch.space === space && patch.decision === null,
  );
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
