import { describe, expect, it } from 'vitest';
import { orientKSweep, sweepTheta, type SimParams } from './index';

// ─── Does the metric have teeth? (charter §3) ─────────────────────
//
// A synthetic citer cites by construction, so R_sim > 0 proves only
// plumbing. The prize is discrimination: the metric must respond to
// retrieval quality. Here the planted quality θ is swept and the metric
// is read off the real fold. If hit@k and MRR climb with θ, a retrieval
// change that degrades quality will show as a lower number, and the
// charter's §5 regression gate has a foundation. The sweep is fully
// seeded, so these numbers recur exactly; the margins guard only float
// noise. The full-resolution curve is committed as `fabric/sim/
// baseline.json` and is the gate's anchor.

const BASE: SimParams = { seed: 'x', seeds: 16, queries: 24, hubs: 3, missRate: 0.15 };
const THETAS = [0, 0.25, 0.5, 1];
const SEEDS = ['a', 'b', 'c'];

const nonDecreasing = (values: readonly number[]): boolean =>
  values.every((value, index) => index === 0 || value >= values[index - 1]! - 1e-9);

describe('the compounding metric discriminates retrieval quality', () => {
  it('climbs monotonically in planted quality, with a wide endpoint gap', async () => {
    const curve = await sweepTheta(BASE, THETAS, SEEDS);
    const hits = curve.map((point) => point.hitAtK);
    const mrrs = curve.map((point) => point.mrr);
    const rates = curve.map((point) => point.rate);

    expect(nonDecreasing(hits)).toBe(true);
    expect(nonDecreasing(mrrs)).toBe(true);
    expect(nonDecreasing(rates)).toBe(true);

    // Noise floor separated from signal ceiling by a wide margin.
    expect(hits[0]!).toBeLessThan(0.3);
    expect(hits.at(-1)!).toBeGreaterThan(0.75);
    expect(hits.at(-1)! - hits[0]!).toBeGreaterThan(0.4);
    expect(mrrs.at(-1)! - mrrs[0]!).toBeGreaterThan(0.4);
  }, 20_000);

  it('surfaces every planted target once quality is real, and none at noise', async () => {
    const curve = await sweepTheta(BASE, THETAS, SEEDS);
    const missed = curve.map((point) => point.missed);
    // At noise, planted targets go unsurfaced; at real quality, none do.
    expect(missed[0]!).toBeGreaterThan(0);
    expect(missed.at(-1)!).toBe(0);
  }, 20_000);
});

describe("orient's k has no interior knee (charter §3)", () => {
  it('buys recall with precision it never earns back — keep k small', () => {
    const curve = orientKSweep(BASE, [1, 3, 5, 8, 16]);
    const recalls = curve.map((point) => point.recall);
    // Recall only ever rises with breadth...
    expect(nonDecreasing(recalls)).toBe(true);
    expect(recalls.at(-1)!).toBeGreaterThan(recalls[0]!);
    // ...but precision stays poor at every k: proactive recency is a weak
    // retriever, so there is no k at which orient becomes the lever.
    expect(curve.every((point) => point.precision < 0.15)).toBe(true);
    expect(curve.every((point) => point.f1 < 0.2)).toBe(true);
    // Full recall arrives only by surfacing the whole corpus (k = seeds).
    expect(curve.at(-1)!.recall).toBe(1);
  });
});
