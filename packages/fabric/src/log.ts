import type {
  BridgeProposal,
  FabricEvent,
  Receipt,
  Reflection,
  Space,
  Verb,
  WeakReference,
} from './schema';

// ─── The projection ───────────────────────────────────────────────
//
// State is a pure fold over the log. Replaying the same events yields
// the same state (INV-FAB-005); the only write anywhere is an append.
// Nothing here performs an effect.

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

const withEntry = <V>(map: ReadonlyMap<string, V>, key: string, value: V): ReadonlyMap<string, V> =>
  new Map([...map, [key, value]]);

/** One event applied to one state. Unknown ids are left alone rather
 *  than invented: a bless for a verb the log never proposed is a no-op,
 *  and the invariants report it. */
export function apply(state: FabricState, event: FabricEvent): FabricState {
  const next = { ...state, step: event.step };
  switch (event.kind) {
    case 'space.opened': {
      return { ...next, spaces: withEntry(state.spaces, event.payload.id, event.payload) };
    }
    case 'verb.proposed': {
      return { ...next, verbs: withEntry(state.verbs, event.payload.id, event.payload) };
    }
    case 'verb.blessed': {
      const verb = state.verbs.get(event.payload.verb);
      return verb
        ? {
            ...next,
            verbs: withEntry(state.verbs, verb.id, { ...verb, blessedAt: event.payload.at }),
          }
        : next;
    }
    case 'verb.retired': {
      const verb = state.verbs.get(event.payload.verb);
      return verb
        ? {
            ...next,
            verbs: withEntry(state.verbs, verb.id, { ...verb, retiredAt: event.payload.at }),
          }
        : next;
    }
    case 'verb.called': {
      return { ...next, receipts: [...state.receipts, event.payload] };
    }
    case 'reflection.recorded': {
      return {
        ...next,
        reflections: withEntry(state.reflections, event.payload.id, event.payload),
      };
    }
    case 'bridge.proposed': {
      return { ...next, bridges: withEntry(state.bridges, event.payload.id, event.payload) };
    }
    case 'bridge.resolved': {
      const bridge = state.bridges.get(event.payload.proposal);
      return bridge?.decision === null
        ? {
            ...next,
            bridges: withEntry(state.bridges, bridge.id, {
              ...bridge,
              decision: event.payload.decision,
              decidedAt: event.payload.at,
              decidedBy: event.payload.by,
            }),
          }
        : next;
    }
    case 'reference.cited': {
      return { ...next, references: [...state.references, event.payload] };
    }
  }
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

/** The reflections a session in `space` may retrieve. Inside its own
 *  space a tenant sees everything it recorded. Across the wall it sees
 *  only what was carried over and blessed (INV-FAB-006). */
export function visibleReflections(state: FabricState, space: string): readonly Reflection[] {
  const carried = new Set(
    [...state.bridges.values()].flatMap((bridge) =>
      bridge.to === space && bridge.decision === 'blessed' ? [bridge.node] : [],
    ),
  );
  return [...state.reflections.values()].filter(
    (reflection) => reflection.space === space || carried.has(reflection.id),
  );
}
