import type { Manifest, ManifestVerb, Verb } from './schema';

// ─── The manifest ─────────────────────────────────────────────────
//
// The manifest is a projection: the verbs of one space that are
// blessed and not retired, and nothing else. A session reads it once.
// The agent's tool list is this list, verbatim (INV-FAB-001).

const isCallable = (verb: Verb): verb is Verb & { blessedAt: string } =>
  verb.blessedAt !== undefined && verb.retiredAt === undefined;

const toManifestVerb = (verb: Verb & { blessedAt: string }): ManifestVerb => ({
  id: verb.id,
  name: verb.name,
  description: verb.description,
  consequence: verb.consequence,
  inputSchema: verb.inputSchema,
  outputSchema: verb.outputSchema,
  blessedAt: verb.blessedAt,
});

export function manifestFor(space: string, asOf: string, verbs: Iterable<Verb>): Manifest {
  const callable = [...verbs].flatMap((verb) =>
    verb.space === space && isCallable(verb) ? [toManifestVerb(verb)] : [],
  );
  return {
    space,
    asOf,
    verbs: callable.toSorted((a, b) => a.name.localeCompare(b.name)),
  };
}

/** The shape a Model Context Protocol server lists. Derived, never
 *  hand-maintained; the consequence rides in the description so the
 *  session can see what a call will do before it calls. */
export interface ToolListing {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
}

export function toolsFrom(manifest: Manifest): readonly ToolListing[] {
  return manifest.verbs.map((verb) => ({
    name: verb.name,
    description: `[${verb.consequence}] ${verb.description}`,
    inputSchema: verb.inputSchema,
  }));
}
