// The concordance — how near two works are in their words.
//
// A library term for a semantic weight: a concordance indexes where
// the same words fall across texts. Here it is a term-frequency ×
// inverse-document-frequency cosine over each work's title, summary,
// and body, computed once at build time from the same markdown the
// site renders. Pure and deterministic; no service, no network. It
// feeds the sky's *presence* (presence.ts) — which stars are near in
// context from where you stand — and the whisper's "in concordance"
// line: the work whose words echo yours though no facet joins them.
//
// The seam for something richer (embeddings from qmd or a model) is
// this module's one export: anything that returns a Concordance for
// the same documents can replace the implementation without touching
// a consumer. CONSTELLATION_WALK.md §"Presence".

export interface Concordant {
  readonly key: string;
  /** Cosine similarity ∈ (0, 1]. */
  readonly weight: number;
}

/** For each work key, its most concordant others, strongest first. */
export type Concordance = Readonly<Record<string, readonly Concordant[]>>;

export interface ConcordanceDocument {
  readonly key: string;
  readonly text: string;
}

/** How many concordant works each entry keeps. */
export const CONCORDANCE_TOP = 6;

// Function words carry no concordance. A small list — the corpus is
// English prose; stemming below folds the rest.
const STOP_WORDS: ReadonlySet<string> = new Set(
  (
    'a an and are as at be but by for from had has have he her here his how i if in into is it its ' +
    'just me my not of on or our out she so than that the their them then there these they this ' +
    'those to too was we were what when where which while who whom why will with would you your ' +
    'about after again all also am any because been before being between both can could did do ' +
    'does doing down during each few more most much no nor now off once only other over own same ' +
    'should some such through under until up very way well went where whether yet'
  ).split(/\s+/),
);

/** A light stemmer: enough to fold *containers* into *container* and
 *  *waiting* into *wait*; never a full Porter pass. */
export function stem(word: string): string {
  if (word.length > 6 && word.endsWith('ness')) return word.slice(0, -4);
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && (word.endsWith('ed') || word.endsWith('ly'))) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/** Markdown and punctuation fall away; what remains are the words
 *  that could fall in concordance. */
export function tokenize(text: string): readonly string[] {
  return text
    .toLowerCase()
    .replaceAll(/```[\s\S]*?```/g, ' ')
    .replaceAll(/https?:\/\/\S+/g, ' ')
    .replaceAll(/[^a-zÀ-ɏ']+/g, ' ')
    .split(' ')
    .flatMap((raw) => {
      const word = raw.replaceAll(/^'+|'+$/g, '');
      return word.length >= 3 && !STOP_WORDS.has(word) ? [stem(word)] : [];
    });
}

type Vector = ReadonlyMap<string, number>;

function termFrequencies(tokens: readonly string[]): Vector {
  const counts = tokens.reduce<Map<string, number>>(
    (acc, token) => acc.set(token, (acc.get(token) ?? 0) + 1),
    new Map(),
  );
  const total = Math.max(tokens.length, 1);
  return new Map([...counts].map(([term, count]) => [term, count / total]));
}

function documentFrequencies(vectors: readonly Vector[]): Vector {
  return vectors.reduce<Map<string, number>>(
    (acc, vector) =>
      [...vector.keys()].reduce((m, term) => m.set(term, (m.get(term) ?? 0) + 1), acc),
    new Map(),
  );
}

function weigh(tf: Vector, df: Vector, docCount: number): Vector {
  return new Map(
    [...tf].map(([term, f]) => [
      term,
      f * (Math.log((docCount + 1) / ((df.get(term) ?? 0) + 1)) + 1),
    ]),
  );
}

function cosine(a: Vector, b: Vector): number {
  const dot = [...a].reduce((sum, [term, w]) => sum + w * (b.get(term) ?? 0), 0);
  const norm = (v: Vector) => Math.sqrt([...v.values()].reduce((s, w) => s + w * w, 0));
  const denominator = norm(a) * norm(b);
  return denominator > 0 ? dot / denominator : 0;
}

/**
 * Build the concordance for a set of documents. Each entry lists the
 * `top` most concordant other documents with a positive weight,
 * strongest first, ties broken by key for determinism.
 *
 * @bigO Time: O(N² · V) for N documents with vocabulary V — pairwise
 *       cosines over sparse vectors. Build-time only, never per frame.
 */
export function buildConcordance(
  documents: readonly ConcordanceDocument[],
  top: number = CONCORDANCE_TOP,
): Concordance {
  const tfs = documents.map((d) => termFrequencies(tokenize(d.text)));
  const df = documentFrequencies(tfs);
  const vectors = tfs.map((tf) => weigh(tf, df, documents.length));
  return Object.fromEntries(
    documents.map((doc, i) => {
      const others = documents
        .flatMap((other, j) => {
          const weight = i === j ? 0 : cosine(vectors[i]!, vectors[j]!);
          return weight > 1e-9 ? [{ key: other.key, weight }] : [];
        })
        .toSorted((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
        .slice(0, top)
        .map((c) => ({ key: c.key, weight: Math.min(1, Math.round(c.weight * 1e4) / 1e4) }));
      return [doc.key, others];
    }),
  );
}

/** The weight between two works, 0 when neither lists the other. */
export function concordanceBetween(
  concordance: Concordance | undefined,
  a: string,
  b: string,
): number {
  return concordance?.[a]?.find((c) => c.key === b)?.weight ?? 0;
}
