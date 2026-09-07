// ─── The generative model ─────────────────────────────────────────
//
// A corpus whose ground truth is planted, not read off the output. Each
// querying session has, by construction, one correct target among the
// seeding sessions' reflections — the node a faithful retriever should
// surface near rank one — or none, the honest miss. The distribution is
// not uniform noise: a few seeding sessions are hubs the queries return
// to far more often (a heavy tail of degree), sessions arrive in bursts,
// and a fixed fraction of contexts have no answer in the corpus at all.
//
// Everything here is pure and seeded, so a run is a function of its
// parameters. The only thing the model cannot know in advance is the
// fingerprint a reflection will get when the real `reflect` verb writes
// it; the harness threads those ids back in through `targetsFrom`.

/** The knobs of a corpus. Ground truth is the seed, never the output. */
export interface SimParams {
  readonly seed: string;
  /** How many seeding sessions, each recording one reflection: the
   *  retrievable corpus. */
  readonly seeds: number;
  /** How many querying sessions, each a retrieval and (usually) a use. */
  readonly queries: number;
  /** How many of the seeding sessions are hubs the queries favor. */
  readonly hubs: number;
  /** The share of queries with no correct target: the honest miss. */
  readonly missRate: number;
}

export const DEFAULT_PARAMS: SimParams = {
  seed: 'proof',
  seeds: 40,
  queries: 80,
  hubs: 5,
  missRate: 0.15,
};

/** One seeding session's reflection, before the real verb gives it an
 *  id. `hub` is whether the queries will favor it. */
export interface SeedSpec {
  readonly session: string;
  readonly at: string;
  readonly attempted: string;
  readonly observed: readonly string[];
  readonly theme: string;
  readonly hub: boolean;
}

/** A planted target once its id is known: what a query needs and how
 *  heavily the queries lean on it. */
export interface Target {
  readonly id: string;
  readonly theme: string;
  readonly weight: number;
}

/** One querying session: a retrieval, then a use of its planted target,
 *  or nothing when the corpus has no answer. */
export interface QuerySpec {
  readonly session: string;
  readonly at: string;
  readonly query: string;
  readonly targetId: string | undefined;
  readonly because: string;
  readonly attempted: string;
  readonly observed: readonly string[];
}

const THEMES = [
  'inheritance',
  'container',
  'devotion',
  'recognition',
  'threshold',
  'resonance',
  'stutter',
  'gearless',
] as const;

const HUB_WEIGHT = 8;
const LEAF_WEIGHT = 1;
const BASE_MS = Date.parse('2026-01-01T00:00:00.000Z');
const DAY_MS = 86_400_000;

/** A unit value in [0, 1) from a key: FNV-1a folded over the key's code
 *  points, then scaled. Deterministic and pure; the model's only
 *  randomness. */
export const unit = (key: string): number => {
  // FNV-1a over the key's code points: offset basis 2_166_136_261
  // (0x811c9dc5), prime 16_777_619 (0x01000193).
  const folded = [...key].reduce(
    (acc, char) => Math.imul(acc ^ char.codePointAt(0)!, 16_777_619) >>> 0,
    2_166_136_261,
  );
  // FNV alone leaves adjacent integer-suffixed keys correlated — the
  // last byte shifts the result by a fixed step — so a Murmur3 fmix
  // finalizer (constants 2_146_121_005 and 2_221_713_035) avalanches it:
  // a one-bit change in the key flips about half the output bits,
  // decorrelating `k:0`, `k:1`, `k:2`.
  const a = Math.imul(folded ^ (folded >>> 16), 2_146_121_005) >>> 0;
  const b = Math.imul(a ^ (a >>> 15), 2_221_713_035) >>> 0;
  const hash = (b ^ (b >>> 16)) >>> 0;
  return hash / 4_294_967_296;
};

const themeOf = (index: number): string => THEMES[index % THEMES.length]!;

/** Seeding times arrive in bursts of five within an hour, then jump a
 *  day, so the corpus is not a metronome. */
const seedAt = (index: number): string =>
  new Date(BASE_MS + Math.floor(index / 5) * DAY_MS + (index % 5) * 90_000).toISOString();

/** Query times all fall after every seeding time, one every few minutes. */
const queryAt = (index: number, seeds: number): string =>
  new Date(BASE_MS + (seeds + 10) * DAY_MS + index * 180_000).toISOString();

/** The seeding sessions: the first `hubs` are hubs. Each records one
 *  reflection whose text carries its theme, so the corpus has real
 *  clustering rather than interchangeable rows. */
export const seedSpecs = (params: SimParams): readonly SeedSpec[] =>
  Array.from({ length: params.seeds }, (_unused, index) => {
    const theme = themeOf(index);
    return {
      session: `${params.seed}-seed-${index}`,
      at: seedAt(index),
      attempted: `hold the ${theme} that session ${index} was working`,
      observed: [`${theme} showed up as a shape session ${index} could name`],
      theme,
      hub: index < params.hubs,
    };
  });

/** The planted targets, once the harness knows each seed's real id:
 *  hubs weigh more, so the queries form a heavy tail. */
export const targetsFrom = (
  specs: readonly SeedSpec[],
  idOf: (session: string) => string | undefined,
): readonly Target[] =>
  specs.flatMap((spec) => {
    const id = idOf(spec.session);
    return id === undefined
      ? []
      : [{ id, theme: spec.theme, weight: spec.hub ? HUB_WEIGHT : LEAF_WEIGHT }];
  });

/** The target a query leans on, drawn by weight so hubs dominate; the
 *  draw is a cumulative walk over a seeded point, no loop. */
const pickTarget = (targets: readonly Target[], point: number): Target => {
  const total = targets.reduce((sum, target) => sum + target.weight, 0);
  const threshold = point * total;
  const walk = targets.reduce<{ readonly acc: number; readonly hit: Target | undefined }>(
    (state, target) => {
      const acc = state.acc + target.weight;
      return { acc, hit: state.hit ?? (acc > threshold ? target : undefined) };
    },
    { acc: 0, hit: undefined },
  );
  return walk.hit ?? targets.at(-1)!;
};

/** The querying sessions over a known target set: each a retrieval with
 *  a distinctive query, then a use of its target, except a `missRate`
 *  share that need something the corpus does not hold. */
export const querySpecs = (params: SimParams, targets: readonly Target[]): readonly QuerySpec[] =>
  targets.length === 0
    ? []
    : Array.from({ length: params.queries }, (_unused, index) => {
        const miss = unit(`${params.seed}:miss:${index}`) < params.missRate;
        const target = miss ? undefined : pickTarget(targets, unit(`${params.seed}:pick:${index}`));
        const token = unit(`${params.seed}:q:${index}`).toString(36).slice(2, 10);
        return {
          session: `${params.seed}-query-${index}`,
          at: queryAt(index, params.seeds),
          query: `retrieve ${token}`,
          targetId: target?.id,
          because: `session ${index} is reaching for what it half-remembers`,
          attempted: `resume the ${target?.theme ?? 'unknown'} thread from an earlier session`,
          observed: [`session ${index} picked the thread back up`],
        };
      });
