import { Effect, Layer, Ref } from 'effect';
import { compounding, type Compounding } from '../compounding';
import { project } from '../log';
import { noCanon } from '../node/canon';
import { noMemoryCompile } from '../node/compile';
import { fileEventLog } from '../node/file-log';
import { fingerprint } from '../node/fingerprint';
import { graphSourceOver } from '../node/graph-source';
import {
  EventLog,
  consentOverLog,
  noResonance,
  type EventLogService,
  type ResonanceService,
} from '../ports';
import { RUNTIME_ACTOR, type FabricEvent } from '../schema';
import { OPERATOR_SPACE, Siblings, proposedVerbs, type CallContext } from '../verbs';
import {
  querySpecs,
  seedSpecs,
  targetsFrom,
  type QuerySpec,
  type SeedSpec,
  type SimParams,
  type Target,
} from './model';
import { simSpace, stamped } from './quarantine';
import { syntheticResonance, type Truth } from './resonance';
import { handleCall, runnerOver, type Runner } from '../server';

// ─── The harness ──────────────────────────────────────────────────
//
// Every synthetic session runs through the real shell: `handleCall`
// parses, runs the real `slice` and `reflect` programs, and writes a
// receipt, exactly as a live session does. Only two things are the
// harness's — the retriever's quality (θ, in resonance.ts) and the log's
// provenance stamp (import:synthetic, in quarantine.ts). The ranks, the
// candidates, the citations, and the fold that turns them into R_sim are
// all the real code's.

/** A log the harness can drive both phases against and read back. */
export interface LogHandle {
  readonly layer: Layer.Layer<EventLogService>;
  readonly read: () => Promise<readonly FabricEvent[]>;
}

/** One shared in-memory log, quarantined: fast enough to sweep, real
 *  enough that its fold is the same function the file log's is. */
export const memoryHandle = (): LogHandle => {
  const ref = Effect.runSync(Ref.make<readonly FabricEvent[]>([]));
  const base: EventLogService = {
    append: (event) =>
      Ref.modify(ref, (events) => {
        const stampedEvent = { ...event, step: events.length } as FabricEvent;
        return [stampedEvent, [...events, stampedEvent]] as const;
      }),
    read: () => Ref.get(ref),
  };
  return {
    layer: stamped(Layer.succeed(EventLog, base)),
    read: () => Effect.runPromise(base.read()),
  };
};

/** The real file log under a directory, quarantined: the adapter the
 *  live fabric uses, for the plumbing and round-trip proofs. */
export const fileHandle = (dir: string): LogHandle => {
  const base = fileEventLog(dir);
  const read = (): Promise<readonly FabricEvent[]> =>
    Effect.runPromise(Effect.provide(EventLog.pipe(Effect.flatMap((log) => log.read())), base));
  return { layer: stamped(base), read };
};

const runnerWith = (handle: LogHandle, resonance: Layer.Layer<ResonanceService>): Runner =>
  runnerOver(
    Layer.mergeAll(
      handle.layer,
      Layer.provide(consentOverLog, handle.layer),
      Layer.provide(
        graphSourceOver(() => Promise.resolve([])),
        handle.layer,
      ),
      resonance,
      noMemoryCompile,
      noCanon,
      Layer.succeed(Siblings, { list: () => Effect.succeed([]) }),
    ),
  );

const callFor = (session: string, at: string, space: string): CallContext => ({
  session,
  at,
  space,
  fingerprint,
});

/** The bootstrap a tenant needs before a session may act: both spaces
 *  opened, every verb proposed, `slice` and `reflect` blessed. Written
 *  through the quarantined log, so even the scaffolding is synthetic. */
const bootstrapEvents = (space: string): readonly Omit<FabricEvent, 'step'>[] => {
  const at = '2025-12-01T00:00:00.000Z';
  const base = { at, actor: RUNTIME_ACTOR } as const;
  const verbs = proposedVerbs();
  return [
    {
      ...base,
      kind: 'space.opened',
      space: OPERATOR_SPACE,
      payload: { id: OPERATOR_SPACE, kind: 'operator', sovereign: OPERATOR_SPACE },
    },
    {
      ...base,
      kind: 'space.opened',
      space,
      payload: { id: space, kind: 'agent', sovereign: space },
    },
    ...verbs.map((verb) => ({
      ...base,
      kind: 'verb.proposed' as const,
      space: verb.space,
      payload: verb,
    })),
    ...verbs.flatMap((verb) =>
      verb.name === 'slice' || verb.name === 'reflect'
        ? [
            {
              ...base,
              kind: 'verb.blessed' as const,
              space: verb.space,
              payload: { verb: verb.id, by: OPERATOR_SPACE, at },
            },
          ]
        : [],
    ),
  ];
};

const bootstrap = (handle: LogHandle, space: string): Promise<void> =>
  Effect.runPromise(
    Effect.provide(
      EventLog.pipe(
        Effect.flatMap((log) =>
          Effect.forEach(bootstrapEvents(space), (event) => log.append(event), { discard: true }),
        ),
      ),
      handle.layer,
    ),
  );

const inSeries = <T>(items: readonly T[], step: (item: T) => Promise<unknown>): Promise<unknown> =>
  items.reduce<Promise<unknown>>((prev, item) => prev.then(() => step(item)), Promise.resolve());

const recordSeed = (run: Runner, space: string) => (spec: SeedSpec) =>
  handleCall(run, callFor(spec.session, spec.at, space), 'reflect', {
    attempted: spec.attempted,
    observed: spec.observed,
  });

const runQuery = (run: Runner, space: string) => (spec: QuerySpec) =>
  handleCall(run, callFor(spec.session, spec.at, space), 'slice', {
    space,
    query: spec.query,
    topK: 12,
    because: spec.because,
  }).then(() =>
    handleCall(run, callFor(spec.session, spec.at, space), 'reflect', {
      attempted: spec.attempted,
      observed: spec.observed,
      cites: spec.targetId === undefined ? [] : [{ space, node: spec.targetId }],
    }),
  );

const truthFrom = (targets: readonly Target[], queries: readonly QuerySpec[]): Truth => {
  const map = new Map(queries.map((query) => [query.query, query.targetId]));
  return { corpus: targets.map((target) => target.id), targetOf: (query) => map.get(query) };
};

/** One synthetic run at quality θ: bootstrap, seed the corpus, learn the
 *  planted targets' real ids, then query and cite through the real
 *  verbs. Returns R_sim and the whole log. */
export const driveRun = async (
  params: SimParams,
  theta: number,
  handle: LogHandle,
): Promise<{ readonly compounding: Compounding; readonly events: readonly FabricEvent[] }> => {
  const space = simSpace(`${params.seed}-${theta}`);
  const specs = seedSpecs(params);
  await bootstrap(handle, space);
  const seedRunner = runnerWith(handle, noResonance);
  await inSeries(specs, recordSeed(seedRunner, space));
  const seeded = project(await handle.read());
  const idOf = (session: string): string | undefined =>
    [...seeded.reflections.values()].find((reflection) => reflection.session === session)?.id;
  const targets = targetsFrom(specs, idOf);
  const queries = querySpecs(params, targets);
  const queryRunner = runnerWith(
    handle,
    syntheticResonance(theta, params.seed, truthFrom(targets, queries)),
  );
  await inSeries(queries, runQuery(queryRunner, space));
  const events = await handle.read();
  return { compounding: compounding(project(events)), events };
};

/** One point on the discrimination curve: the metric at a planted
 *  quality, averaged over seeds so the noise does not carry it. */
export interface SweepPoint {
  readonly theta: number;
  readonly hitAtK: number;
  readonly mrr: number;
  readonly rate: number;
  readonly missed: number;
}

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const pointAt = async (
  base: SimParams,
  theta: number,
  seeds: readonly string[],
): Promise<SweepPoint> => {
  const runs = await Promise.all(
    seeds.map((seed) => driveRun({ ...base, seed }, theta, memoryHandle())),
  );
  const measures = runs.map((run) => run.compounding);
  return {
    theta,
    hitAtK: mean(measures.map((measure) => measure.hitAtK ?? 0)),
    mrr: mean(measures.map((measure) => measure.mrr ?? 0)),
    rate: mean(measures.map((measure) => measure.rate ?? 0)),
    missed: mean(measures.map((measure) => measure.missed)),
  };
};

/** The discrimination sweep: the metric across the whole quality range,
 *  each θ averaged over the seeds. The proof is that it climbs. */
export const sweepTheta = (
  base: SimParams,
  thetas: readonly number[],
  seeds: readonly string[],
): Promise<readonly SweepPoint[]> =>
  Promise.all(thetas.map((theta) => pointAt(base, theta, seeds)));

// ─── orient's k, from the same corpus ─────────────────────────────
//
// `orient` surfaces the k newest reflections at session start, with no
// query — recency, not resonance. Its proactive precision and recall
// are a property of the corpus alone, so they are computed here without
// the verbs: for each query session's planted need, whether the k newest
// reflections before it hold the target.

export interface OrientPoint {
  readonly k: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1: number;
}

const newestBefore = (
  targets: readonly { readonly id: string; readonly at: string }[],
  at: string,
  k: number,
): readonly string[] =>
  targets
    .filter((target) => target.at < at)
    .toSorted((a, b) => b.at.localeCompare(a.at))
    .slice(0, k)
    .map((target) => target.id);

const f1Of = (precision: number, recall: number): number =>
  precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

/** orient's precision, recall, and F1 at each k over a planted corpus,
 *  so the k where added recall stops paying can be read off the curve. */
export const orientKSweep = (params: SimParams, ks: readonly number[]): readonly OrientPoint[] => {
  const specs = seedSpecs(params);
  const corpus = specs.map((spec, index) => ({ id: `${spec.session}#${index}`, at: spec.at }));
  const byId = new Map(specs.map((spec, index) => [spec.session, `${spec.session}#${index}`]));
  const targets = targetsFrom(specs, (session) => byId.get(session));
  const needs = querySpecs(params, targets).flatMap((query) =>
    query.targetId === undefined ? [] : [{ at: query.at, target: query.targetId }],
  );
  return ks.map((k) => {
    const surfaced = needs.map((need) => ({
      hit: newestBefore(corpus, need.at, k).includes(need.target),
    }));
    const hits = surfaced.filter((entry) => entry.hit).length;
    const recall = hits / needs.length;
    const precision = hits / (surfaced.length * k);
    return { k, precision, recall, f1: f1Of(precision, recall) };
  });
};
