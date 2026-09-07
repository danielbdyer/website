import { Effect, Layer } from 'effect';
import { EventLog, type EventLogService } from '../ports';
import { importActor, isAgent, type FabricEvent } from '../schema';

// ─── The firewall ─────────────────────────────────────────────────
//
// Synthetic proof must de-risk the real loop without ever polluting
// the real measurement. The charter's §1 makes the wall between made-up
// and lived events the same kind of wall as blessed-versus-proposed: a
// synthetic event must be unrepresentable as a real one. Two guarantees
// hold it, and both are checked by `quarantine.test.ts`.
//
// First, provenance at the actor. A real session's activity is
// `agent:<session>`; a synthetic session's is `import:synthetic`, the
// existing import kind (no grammar was extended; the decision is
// D-007). The stamp is minted at the log seam — the one write in the
// fabric — over the real verb programs upstream of it, so every field
// the instrument reads is produced by the real code and only the
// provenance label is the harness's.
//
// Second, physical separation. A synthetic run writes to its own
// directory and its own `sim:<run-id>` tenant, never `fabric/spaces/`
// and never `danny` or `agent`. The real fold reads `fabric/spaces/`
// alone, so it cannot see a synthetic event even in principle. No
// synthetic event log ever enters the repository (D-008); only the
// regenerable metrics do.

/** The one import source a synthetic event may claim. */
export const SYNTHETIC_SOURCE = 'synthetic';

/** The actor every synthetic event carries: `import:synthetic`. */
export const SYNTHETIC_ACTOR = importActor(SYNTHETIC_SOURCE);

/** Whether an actor is the synthetic one. */
export const isSynthetic = (actor: string): boolean => actor === SYNTHETIC_ACTOR;

/** Whether any event in a set is synthetic: the guard a real consumer
 *  runs to prove its projection is clean. */
export const containsSynthetic = (events: readonly { readonly actor: string }[]): boolean =>
  events.some((event) => isSynthetic(event.actor));

/** The prefix of a synthetic tenant, so a run's space is unmistakable
 *  and disjoint from `danny` and `agent`. */
export const simSpace = (run: string): string => `sim:${run}`;

/** One log service with every append restamped `import:synthetic`,
 *  the underlying read unchanged. Provenance is a property of the
 *  event, minted here at the seam. */
const stampService = (base: EventLogService): EventLogService => ({
  append: (event) => base.append({ ...event, actor: SYNTHETIC_ACTOR }),
  read: base.read,
});

/** A log layer that quarantines whatever log it wraps: the real file
 *  adapter for the plumbing and round-trip proofs, the in-memory one
 *  for the sweeps, either way every event it writes is synthetic. */
export const stamped = (base: Layer.Layer<EventLogService>): Layer.Layer<EventLogService> =>
  Layer.effect(EventLog, EventLog.pipe(Effect.map(stampService))).pipe(Layer.provide(base));

/** Every synthetic event a run wrote is `import:synthetic`, and none is
 *  an agent event; the two halves of the actor firewall as one check. */
export const quarantined = (events: readonly FabricEvent[]): boolean =>
  events.every((event) => isSynthetic(event.actor) && !isAgent(event.actor));
