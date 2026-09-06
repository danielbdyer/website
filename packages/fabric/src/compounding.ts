import type { FabricState } from './log';
import type { Retrieval } from './schema';

// ─── Does the corpus compound? ────────────────────────────────────
//
// A corpus compounds when outputs become inputs: something stored is
// surfaced in a context other than the one it was made in, and the
// next action uses it. The fabric measures this before it builds
// anything meant to raise it. A retrieval is an event with its
// candidates in rank order; a use is a later event of the same session
// that names one of them; a candidate counts only when another session
// made it, so a session citing its own fresh reflection is not
// compounding. Everything here is a pure fold over the log.

/** How one retrieval fared: which candidate was first used, at what
 *  rank, or none. */
export interface RetrievalResult {
  readonly retrieval: string;
  readonly session: string;
  readonly at: string;
  readonly verb: Retrieval['verb'];
  readonly firstUsedRank: number | undefined;
}

/** One session's retrievals and how many compounded, in time order:
 *  the series whose slope is the question. */
export interface SessionPoint {
  readonly session: string;
  readonly at: string;
  readonly retrievals: number;
  readonly used: number;
}

export interface Compounding {
  /** The rank a candidate must be within to count as a hit. */
  readonly k: number;
  /** How many sessions the series keeps. */
  readonly window: number;
  readonly retrievals: number;
  /** Retrievals after which the session used a candidate. */
  readonly used: number;
  /** used / retrievals; undefined before any retrieval. */
  readonly rate: number | undefined;
  /** Retrievals whose first used candidate was within rank k. */
  readonly hitAtK: number | undefined;
  /** Mean reciprocal rank of the first used candidate, zero for a retrieval nothing used. */
  readonly mrr: number | undefined;
  /** Nodes a session used that no retrieval had surfaced to it: found some other way. */
  readonly missed: number;
  readonly series: readonly SessionPoint[];
  /** Proposals the operator has answered, and the share he blessed. */
  readonly acceptance: {
    readonly decided: number;
    readonly blessed: number;
    readonly rate: number | undefined;
  };
}

export const COMPOUNDING = { k: 3, window: 8 } as const;

interface Use {
  readonly session: string;
  readonly at: string;
  readonly node: string;
}

/** Every time a session named a node in something it made: a citation
 *  in a reflection, or the node a patch changes. */
const usesIn = (state: FabricState): readonly Use[] => [
  ...[...state.reflections.values()].flatMap((reflection) =>
    reflection.cites.map((citation) => ({
      session: reflection.session,
      at: reflection.at,
      node: citation.node,
    })),
  ),
  ...[...state.patches.values()].map((patch) => ({
    session: patch.proposedBy,
    at: patch.proposedAt,
    node: patch.node,
  })),
];

/** The session that made a node, when a session did: a reflection's.
 *  A work, a claim, or a skill has no session and counts for anyone. */
const makerOf = (state: FabricState, node: string): string | undefined =>
  state.reflections.get(node)?.session;

const resultOf =
  (state: FabricState, uses: readonly Use[]) =>
  (retrieval: Retrieval): RetrievalResult => {
    const later = new Set(
      uses.flatMap((use) =>
        use.session === retrieval.session && use.at >= retrieval.at ? [use.node] : [],
      ),
    );
    const firstUsed = retrieval.candidates
      .filter(
        (candidate) =>
          later.has(candidate.node) && makerOf(state, candidate.node) !== retrieval.session,
      )
      .toSorted((a, b) => a.rank - b.rank)[0];
    return {
      retrieval: retrieval.id,
      session: retrieval.session,
      at: retrieval.at,
      verb: retrieval.verb,
      firstUsedRank: firstUsed?.rank,
    };
  };

/** The nodes a session used that nothing had surfaced to it first,
 *  its own fresh reflections aside. */
const surfacedTo = (state: FabricState, use: Use): boolean =>
  state.retrievals.some(
    (retrieval) =>
      retrieval.session === use.session &&
      retrieval.at <= use.at &&
      retrieval.candidates.some((candidate) => candidate.node === use.node),
  );

const missedIn = (state: FabricState, uses: readonly Use[]): number =>
  new Set(
    uses.flatMap((use) =>
      makerOf(state, use.node) !== use.session && !surfacedTo(state, use)
        ? [`${use.session} ${use.node}`]
        : [],
    ),
  ).size;

const seriesOf = (results: readonly RetrievalResult[], window: number): readonly SessionPoint[] =>
  [
    ...results
      .toSorted((a, b) => a.at.localeCompare(b.at))
      .reduce((points, result) => {
        const point = points.get(result.session) ?? {
          session: result.session,
          at: result.at,
          retrievals: 0,
          used: 0,
        };
        return new Map([
          ...points,
          [
            result.session,
            {
              ...point,
              retrievals: point.retrievals + 1,
              used: point.used + (result.firstUsedRank === undefined ? 0 : 1),
            },
          ],
        ]);
      }, new Map<string, SessionPoint>())
      .values(),
  ].slice(-window);

const mean = (values: readonly number[]): number | undefined =>
  values.length === 0 ? undefined : values.reduce((sum, value) => sum + value, 0) / values.length;

/** Every retrieval in the log, scored against what its session did next. */
export const retrievalResults = (state: FabricState): readonly RetrievalResult[] =>
  state.retrievals.map(resultOf(state, usesIn(state)));

/** The corpus measured against its own definition of compounding. Pure. */
export function compounding(
  state: FabricState,
  options: { readonly k: number; readonly window: number } = COMPOUNDING,
): Compounding {
  const uses = usesIn(state);
  const results = state.retrievals.map(resultOf(state, uses));
  const usedRanks = results.flatMap((result) =>
    result.firstUsedRank === undefined ? [] : [result.firstUsedRank],
  );
  const decided = [
    ...[...state.bridges.values()].map((bridge) => bridge.decision),
    ...[...state.patches.values()].map((patch) => patch.decision),
  ].filter((decision) => decision !== null);
  const blessed = decided.filter((decision) => decision === 'blessed').length;
  return {
    k: options.k,
    window: options.window,
    retrievals: results.length,
    used: usedRanks.length,
    rate: mean(results.map((result) => (result.firstUsedRank === undefined ? 0 : 1))),
    hitAtK: mean(
      results.map((result) =>
        result.firstUsedRank !== undefined && result.firstUsedRank <= options.k ? 1 : 0,
      ),
    ),
    mrr: mean(
      results.map((result) => (result.firstUsedRank === undefined ? 0 : 1 / result.firstUsedRank)),
    ),
    missed: missedIn(state, uses),
    series: seriesOf(results, options.window),
    acceptance: {
      decided: decided.length,
      blessed,
      rate: decided.length === 0 ? undefined : blessed / decided.length,
    },
  };
}
