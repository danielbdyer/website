import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_PARAMS, type SimParams } from './model';
import { orientKSweep, sweepTheta, type OrientPoint, type SweepPoint } from './harness';

// ─── The committed baseline (charter §3, §5) ──────────────────────
//
// The metric's response to retrieval quality, at a fixed corpus and a
// fixed set of seeds, written to `fabric/sim/baseline.json`. It anchors
// the §5 regression gate: a change to the retrieval code — `cut`,
// `candidatesOf`, `resonate`, or the fold that scores them — re-runs
// `pnpm fabric sim-baseline` and must not lower the curve. The numbers
// are deterministic, so a drop is a regression, not noise. Only the
// discrimination and orient curves are committed; wall-clock scaling
// numbers are machine-dependent and live in the report instead.

export const BASELINE_PARAMS: SimParams = DEFAULT_PARAMS;
export const BASELINE_THETAS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1] as const;
export const BASELINE_SEEDS = ['a', 'b', 'c', 'd', 'e'] as const;
export const BASELINE_KS = [1, 2, 3, 5, 8, 12, 20, 40] as const;

export interface Baseline {
  readonly generatedFor: SimParams;
  readonly thetas: readonly number[];
  readonly seeds: readonly string[];
  readonly ks: readonly number[];
  readonly discrimination: readonly SweepPoint[];
  readonly orient: readonly OrientPoint[];
  readonly note: string;
}

/** The baseline, computed. The discrimination sweep is the slow part
 *  (seeds × thetas real runs); the orient sweep is pure. */
export const baselineData = async (): Promise<Baseline> => {
  const discrimination = await sweepTheta(
    BASELINE_PARAMS,
    [...BASELINE_THETAS],
    [...BASELINE_SEEDS],
  );
  const orient = orientKSweep(BASELINE_PARAMS, [...BASELINE_KS]);
  return {
    generatedFor: BASELINE_PARAMS,
    thetas: [...BASELINE_THETAS],
    seeds: [...BASELINE_SEEDS],
    ks: [...BASELINE_KS],
    discrimination,
    orient,
    note: 'Regenerate with `pnpm fabric sim-baseline`. A retrieval-code change must not lower the discrimination curve. See CORPUS.md Part three.',
  };
};

/** Write the baseline beside the log, under `fabric/sim/`, never in
 *  `fabric/spaces/` — the firewall keeps synthetic artifacts out of the
 *  real read path. Returns the file written. */
export const writeBaseline = async (root: string): Promise<string> => {
  const file = path.join(root, 'fabric', 'sim', 'baseline.json');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(await baselineData(), null, 2)}\n`, 'utf8');
  return file;
};
