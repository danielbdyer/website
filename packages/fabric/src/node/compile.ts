import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { Effect, Layer, Option } from 'effect';
import { z } from 'zod';
import {
  MemoryCompile,
  type MemoryCompileService,
  type Recollection,
  type SourceTurn,
} from '../verbs';

// ─── The memory compile, behind a port ────────────────────────────
//
// The vendor's compile is Python. It runs as a sidecar the fabric
// starts for one question and ends: our turns go in as JSON on stdin,
// its compiled objects and answer come back as JSON on stdout, and the
// shape is checked at the boundary. No reasoner is wired, so the run
// is deterministic. If the interpreter or the package is missing, the
// port answers "no compiler" and `recall` says so; nothing throws.

const run = promisify(execFile);

/** The interpreter with the vendor package installed. Held name. */
export const PYTHON_ENV = 'FABRIC_PYTHON';

export const SIDECAR = path.join('packages', 'fabric', 'sidecar', 'memory.py');

const maybe = z.string().nullable().optional();

/** What the sidecar promises to print. */
export const recollectionSchema = z.object({
  compiler: z.string().min(1),
  claims: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        kind: z.string().default('fact'),
        validFrom: maybe,
        observedAt: maybe,
        sources: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  events: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        predicate: z.string().default('state'),
        start: maybe,
        end: maybe,
        observedAt: maybe,
        quantities: z
          .array(z.object({ property: z.string(), value: z.number(), unit: z.string() }))
          .default([]),
      }),
    )
    .default([]),
  entities: z.array(z.object({ id: z.string(), label: z.string() })).default([]),
  conflicts: z.array(z.object({ id: z.string(), claims: z.array(z.string()) })).default([]),
  answer: z.object({
    text: z.string().default(''),
    selected: z.array(z.string()).default([]),
    status: maybe,
  }),
});

const undefinedForNull = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

/** The sidecar's JSON as a recollection, or nothing when it is not one. */
export function recollectionFrom(raw: unknown): Option.Option<Recollection> {
  const parsed = recollectionSchema.safeParse(raw);
  if (!parsed.success) return Option.none();
  const { claims, events, answer, ...rest } = parsed.data;
  return Option.some({
    ...rest,
    claims: claims.map((claim) => ({
      ...claim,
      validFrom: undefinedForNull(claim.validFrom),
      observedAt: undefinedForNull(claim.observedAt),
    })),
    events: events.map((event) => ({
      ...event,
      start: undefinedForNull(event.start),
      end: undefinedForNull(event.end),
      observedAt: undefinedForNull(event.observedAt),
    })),
    answer: { ...answer, status: undefinedForNull(answer.status) },
  });
}

const ask = async (
  root: string,
  python: string,
  turns: readonly SourceTurn[],
  query: string,
  asOf: string,
): Promise<unknown> => {
  const child = run(python, [path.join(root, SIDECAR)], { cwd: root, maxBuffer: 16 * 1024 * 1024 });
  child.child.stdin?.end(JSON.stringify({ turns, query, asOf }));
  const { stdout } = await child;
  return JSON.parse(stdout) as unknown;
};

/** The compile over a Python interpreter named by the environment, or
 *  `python3`. Absent package, absent interpreter, or malformed output
 *  all answer with nothing. */
export const pythonMemoryCompile = (
  root: string,
  python: string | undefined = process.env[PYTHON_ENV],
): Layer.Layer<MemoryCompileService> =>
  Layer.succeed(MemoryCompile, {
    recall: (turns, query, asOf) =>
      Effect.promise(() =>
        ask(root, python ?? 'python3', turns, query, asOf).then(recollectionFrom, () =>
          Option.none(),
        ),
      ),
  });

/** No compiler at all: what a test or a bare checkout provides. */
export const noMemoryCompile: Layer.Layer<MemoryCompileService> = Layer.succeed(MemoryCompile, {
  recall: () => Effect.succeed(Option.none()),
});
