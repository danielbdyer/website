import { Context, Data, Effect, Layer, Ref } from 'effect';
import type { Slice } from '@dbd/slice';
import type { BridgeProposal, Decision, FabricEvent } from './schema';
import { pendingIn, project, type FabricState } from './log';

// ─── Ports ────────────────────────────────────────────────────────
//
// The fabric is an Effect program. Its ports are the seams an adapter
// implements at an edge: the log a tenant appends to, the graph a
// session loads a slice from, and the consent loop. Effect stays on
// this side of the contract; the schema and the fold never import it.

/** The append-only log of one tenant. `append` is the only write in
 *  the fabric; `read` returns the whole log for projection. */
export interface EventLogService {
  readonly append: (event: Omit<FabricEvent, 'step'>) => Effect.Effect<FabricEvent, LogRejected>;
  readonly read: () => Effect.Effect<readonly FabricEvent[]>;
}
export const EventLog = Context.GenericTag<EventLogService>('@dbd/fabric/EventLog');

/** The graph as memory. A session loads a bounded view for one turn;
 *  the source may be the works, the engine, or a sidecar that speaks
 *  the slice. */
export interface GraphSourceService {
  readonly slice: (space: string, aperture: Aperture) => Effect.Effect<Slice>;
}
export const GraphSource = Context.GenericTag<GraphSourceService>('@dbd/fabric/GraphSource');

/** One thing resonance found: a node, how near, and the span that
 *  matched. `id` is the fabric's node id, mapped by the adapter. */
export interface Hit {
  readonly id: string;
  readonly score: number;
  readonly title: string;
  readonly snippet: string;
}

/** Resonance: the third axis of the aperture. `nearest` ranks a
 *  collection's nodes by meaning; `refresh` re-indexes what changed.
 *  qmd is the first provider; an absent one ranks nothing. */
export interface ResonanceService {
  readonly nearest: (collection: string, query: string, k: number) => Effect.Effect<readonly Hit[]>;
  /** Re-index what changed: only the reflections, which a session
   *  writes, or every collection, which the operator asks for. */
  readonly refresh: (scope: 'reflections' | 'all') => Effect.Effect<void>;
}
export const Resonance = Context.GenericTag<ResonanceService>('@dbd/fabric/Resonance');

/** No resonance at all: what a test or a bare checkout provides. */
export const noResonance: Layer.Layer<ResonanceService> = Layer.succeed(Resonance, {
  nearest: () => Effect.succeed([]),
  refresh: () => Effect.void,
});

/** The consent loop. `propose` lands as pending in the target space;
 *  `resolve` is the sovereign's act and is never exposed as a verb. */
export interface ConsentService {
  readonly propose: (
    proposal: Omit<BridgeProposal, 'decision' | 'decidedAt' | 'decidedBy'>,
  ) => Effect.Effect<BridgeProposal, LogRejected>;
  readonly pending: (space: string) => Effect.Effect<readonly BridgeProposal[]>;
  readonly resolve: (
    proposal: string,
    decision: Decision,
    by: string,
    at: string,
  ) => Effect.Effect<BridgeProposal, LogRejected | NotPending>;
}
export const Consent = Context.GenericTag<ConsentService>('@dbd/fabric/Consent');

/** How much of a graph a turn may see, and who is looking, and when.
 *  Identity, structure, resonance: the engine's triple addressing,
 *  carried as data. Time is an argument. */
export interface Aperture {
  readonly viewer?: string;
  readonly asOf?: string;
  readonly ids?: readonly string[];
  readonly anchors?: readonly string[];
  readonly hops?: number;
  readonly query?: string;
  readonly topK?: number;
}

/** The log refused an append: a store that could not write, or an
 *  event that failed the schema at the edge. */
export interface LogRejected {
  readonly _tag: 'LogRejected';
  readonly reason: string;
}
export const LogRejected = Data.tagged<LogRejected>('LogRejected');

/** A resolution named a proposal that is not waiting. */
export interface NotPending {
  readonly _tag: 'NotPending';
  readonly proposal: string;
}
export const NotPending = Data.tagged<NotPending>('NotPending');

// ─── The in-memory adapter ────────────────────────────────────────
//
// Enough to run the fold end to end in a test or a spike. The step is
// assigned at append, from the log's length, so replay is exact.

export const memoryEventLog = (
  initial: readonly FabricEvent[] = [],
): Layer.Layer<EventLogService> =>
  Layer.effect(
    EventLog,
    Effect.gen(function* () {
      const log = yield* Ref.make<readonly FabricEvent[]>(initial);
      return {
        append: (event) =>
          Ref.modify(log, (events) => {
            const stamped = { ...event, step: events.length } as FabricEvent;
            return [stamped, [...events, stamped]] as const;
          }),
        read: () => Ref.get(log),
      };
    }),
  );

/** Consent over any EventLog: proposals and resolutions are events. */
export const consentOverLog: Layer.Layer<ConsentService, never, EventLogService> = Layer.effect(
  Consent,
  Effect.gen(function* () {
    const log = yield* EventLog;
    const state = (): Effect.Effect<FabricState> => log.read().pipe(Effect.map(project));
    return {
      propose: (proposal) =>
        log
          .append({
            kind: 'bridge.proposed',
            at: proposal.proposedAt,
            space: proposal.to,
            actor: proposal.from,
            payload: { ...proposal, decision: null },
          })
          .pipe(
            Effect.map((event) =>
              event.kind === 'bridge.proposed' ? event.payload : { ...proposal, decision: null },
            ),
          ),
      pending: (space) => state().pipe(Effect.map((current) => pendingIn(current, space))),
      resolve: (proposal, decision, by, at) =>
        Effect.gen(function* () {
          const current = yield* state();
          const bridge = current.bridges.get(proposal);
          if (bridge?.decision !== null) return yield* Effect.fail(NotPending({ proposal }));
          yield* log.append({
            kind: 'bridge.resolved',
            at,
            space: bridge.to,
            actor: by,
            causedBy: bridge.id,
            payload: { proposal, decision, by, at },
          });
          return { ...bridge, decision, decidedAt: at, decidedBy: by };
        }),
    };
  }),
);
