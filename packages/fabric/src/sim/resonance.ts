import { Effect, Layer } from 'effect';
import { Resonance, type Hit, type ResonanceService } from '../ports';
import { unit } from './model';

// ─── The quality knob ─────────────────────────────────────────────
//
// A retriever whose accuracy is a dial. For a query with a planted
// target, a node's score is `θ · signal + (1 − θ) · noise`, where the
// signal is one for the target and zero for everything else and the
// noise is a seeded unit value. At θ = 1 the target scores highest and
// the real `cut` ranks it first; at θ = 0 the score is pure noise and
// the target lands at a random rank, or below the k the retriever
// returns, and is never surfaced. The metric never sees θ — it sees
// only the ranks the real code produced from these scores, which is the
// whole point: if hit@k and MRR climb with θ, the metric has teeth.
//
// This does not model a real embedding space; it models retrieval
// quality as a scalar so the sweep can isolate the metric's response to
// it. What it proves and what it cannot are stated in the report.

/** The nodes a query's answer could be: the corpus the retriever ranks
 *  over, and the one target each query truly needs. */
export interface Truth {
  /** Every retrievable node id, the retriever's index. */
  readonly corpus: readonly string[];
  /** The correct target for a query, or absent for an honest miss. */
  readonly targetOf: (query: string) => string | undefined;
}

const REFLECTIONS = 'reflections';

/** A node's score for a query at quality θ: signal for the target,
 *  noise for the rest, mixed by θ. */
const scoreOf =
  (theta: number, seed: string, truth: Truth) =>
  (query: string, node: string): number => {
    const signal = truth.targetOf(query) === node ? 1 : 0;
    const noise = unit(`${seed}:${query}:${node}`);
    return theta * signal + (1 - theta) * noise;
  };

/** The k highest-scoring corpus nodes for a query, as resonance hits in
 *  rank order: the real retrieval interface, backed by the θ score. */
const nearestIn =
  (theta: number, seed: string, truth: Truth) =>
  (collection: string, query: string, k: number): readonly Hit[] => {
    if (collection !== REFLECTIONS) return [];
    const score = scoreOf(theta, seed, truth);
    return truth.corpus
      .map((id): Hit => ({ id, score: score(query, id), title: id, snippet: query }))
      .toSorted((a, b) => b.score - a.score)
      .slice(0, k);
  };

/** Resonance at quality θ over a planted corpus. `refresh` is a no-op:
 *  the index is the closure, recomputed each call, so it is always
 *  current. */
export const syntheticResonance = (
  theta: number,
  seed: string,
  truth: Truth,
): Layer.Layer<ResonanceService> => {
  const nearest = nearestIn(theta, seed, truth);
  return Layer.succeed(Resonance, {
    nearest: (collection, query, k) => Effect.succeed(nearest(collection, query, k)),
    refresh: () => Effect.void,
  });
};
