import { z } from 'zod';
import { METABOLIC_STATES, ORIGINS } from '@dbd/slice';

// ─── @dbd/fabric — the schema of record ─────────────────────────────
//
// The fabric is the runtime a local agent session lives in. Everything
// it knows is an event in an append-only log, one log per tenant; the
// working state is a projection of that log and can be rebuilt from
// nothing. FABRIC.md is the specification. The invariants carry the
// ids named there.
//
// Plain data with a zod schema of record, so a session, a sidecar, and
// a test all read the same shape. Effect lives in ports.ts and never
// reaches this file.

// ─── Vocabularies ─────────────────────────────────────────────────
//
// Closed. Extended by decision record, never by an adapter.

/** What calling a verb can do to the world. Decides what the call must
 *  carry and where its result may land. */
export const CONSEQUENCE_CLASSES = ['observe', 'derive', 'propose', 'world'] as const;
export type ConsequenceClass = (typeof CONSEQUENCE_CLASSES)[number];

/** Who a space belongs to. Each kind is sovereign over its own space. */
export const SPACE_KINDS = ['operator', 'agent'] as const;
export type SpaceKind = (typeof SPACE_KINDS)[number];

/** The two answers a sovereign can give. The third state, no answer yet,
 *  is `null` — the gap the whole runtime is built to hold. */
export const DECISIONS = ['blessed', 'rejected'] as const;
export type Decision = (typeof DECISIONS)[number];

/** What a reflection may ask to change. Each is a node in the operator
 *  space, so a change to any of them is a proposal like any other. */
export const CHANGE_TARGETS = ['prompt', 'skill', 'verb', 'policy'] as const;
export type ChangeTarget = (typeof CHANGE_TARGETS)[number];

/** Where a space's contents come from besides the log. Each kind has one
 *  adapter in the rim; the operator blesses a source into his space the
 *  way he blesses a verb, and blessing a source is disclosing it. */
export const SOURCE_KINDS = ['vault', 'works', 'skills'] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

/** Who wrote an event when no session or sovereign did. */
export const RUNTIME_ACTOR = 'runtime';

// ─── Atoms ────────────────────────────────────────────────────────

const id = z.string().min(1);
const at = z.iso.datetime();
const unit = z.number().min(0).max(1);
const step = z.number().int().min(0);

/** A JSON Schema document, carried as data. The fabric validates verb
 *  payloads against it at the boundary; it never interprets it here. */
const jsonSchema = z.record(z.string(), z.unknown());

// ─── Spaces ───────────────────────────────────────────────────────

/** An ownership boundary. `sovereign` names who blesses inside it. */
export const spaceSchema = z.object({
  id,
  kind: z.enum(SPACE_KINDS),
  sovereign: id,
});
export type Space = z.infer<typeof spaceSchema>;

// ─── Verbs ────────────────────────────────────────────────────────

/** A verb is a node. It carries its schemas as data and becomes
 *  callable only when blessed; the manifest is the projection of the
 *  blessed verbs (INV-FAB-001). */
export const verbSchema = z.object({
  id,
  space: id,
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_.]*$/, 'a verb name is lowercase, dotted or underscored'),
  description: z.string().min(1),
  consequence: z.enum(CONSEQUENCE_CLASSES),
  inputSchema: jsonSchema,
  outputSchema: jsonSchema,
  origin: z.enum(ORIGINS),
  blessedAt: at.optional(),
  retiredAt: at.optional(),
});
export type Verb = z.infer<typeof verbSchema>;

/** One entry of the manifest a session reads once. Signatures are
 *  frozen from the moment of blessing. */
export const manifestVerbSchema = verbSchema
  .pick({
    id: true,
    name: true,
    description: true,
    consequence: true,
    inputSchema: true,
    outputSchema: true,
  })
  .extend({ blessedAt: at });
export type ManifestVerb = z.infer<typeof manifestVerbSchema>;

export const manifestSchema = z.object({
  space: id,
  asOf: at,
  verbs: z.array(manifestVerbSchema),
});
export type Manifest = z.infer<typeof manifestSchema>;

// ─── Receipts ─────────────────────────────────────────────────────

/** Every verb call leaves one. Inputs and outputs travel as
 *  fingerprints; the payloads stay in the event that carried them. */
export const receiptSchema = z.object({
  id,
  verb: id,
  space: id,
  session: id,
  at,
  consequence: z.enum(CONSEQUENCE_CLASSES),
  inputFingerprint: z.string().min(1),
  outputFingerprint: z.string().min(1),
});
export type Receipt = z.infer<typeof receiptSchema>;

// ─── Reflection ───────────────────────────────────────────────────

/** A citation to a node, by id, with the span that was read. The
 *  fabric resolves it; it never becomes an edge across a wall
 *  (INV-FAB-004). */
export const citationSchema = z.object({
  space: id,
  node: id,
  span: z.string().min(1).optional(),
});
export type Citation = z.infer<typeof citationSchema>;

/** What a reflection may ask to change, and why. */
export const changeRequestSchema = z.object({
  target: z.enum(CHANGE_TARGETS),
  node: id,
  change: z.string().min(1),
  because: z.string().min(1),
});
export type ChangeRequest = z.infer<typeof changeRequestSchema>;

/** The first thing the fabric holds: what a session noticed, in a
 *  shape the next session can retrieve. Structured at the boundary,
 *  never a paragraph. */
export const reflectionSchema = z.object({
  id,
  session: id,
  space: id,
  at,
  attempted: z.string().min(1),
  observed: z.array(z.string().min(1)).min(1),
  inferred: z.array(z.string().min(1)).default([]),
  shouldChange: z.array(changeRequestSchema).default([]),
  cites: z.array(citationSchema).default([]),
  status: z.enum(METABOLIC_STATES).default('nascent'),
});
export type Reflection = z.infer<typeof reflectionSchema>;

// ─── Sources ──────────────────────────────────────────────────────

/** A place a space reads from: a vault of claims, a house of works, a
 *  folder of skills. Read only once blessed. */
export const sourceSchema = z.object({
  id,
  space: id,
  kind: z.enum(SOURCE_KINDS),
  path: z.string().min(1),
  origin: z.enum(ORIGINS),
  blessedAt: at.optional(),
});
export type Source = z.infer<typeof sourceSchema>;

/** A call the fabric would not run, and why. Refusals are events, never
 *  exceptions: the audit trail extends, control flow does not break. */
export const refusalSchema = z.object({
  verb: z.string().min(1),
  session: id,
  at,
  reason: z.string().min(1),
});
export type Refusal = z.infer<typeof refusalSchema>;

// ─── Crossing the wall ────────────────────────────────────────────

/** A proposal to carry a node from one space into another. It lands as
 *  pending in the target space, with `decision` null until the target's
 *  sovereign answers (INV-FAB-003). */
export const bridgeProposalSchema = z.object({
  id,
  from: id,
  to: id,
  node: id,
  evidence: z.string().min(1),
  confidence: unit.optional(),
  proposedAt: at,
  decision: z.enum(DECISIONS).nullable(),
  decidedAt: at.optional(),
  decidedBy: id.optional(),
});
export type BridgeProposal = z.infer<typeof bridgeProposalSchema>;

/** A weak reference: a citation written onto the relating node, in its
 *  own space, pointing across the wall by text. Never an edge. */
export const weakReferenceSchema = z.object({
  space: id,
  onNode: id,
  to: citationSchema,
  citation: z.string().min(1),
  at,
});
export type WeakReference = z.infer<typeof weakReferenceSchema>;

// ─── Events ───────────────────────────────────────────────────────
//
// The log is the only thing written. Each event carries its step in
// the tenant's log, the time it was recorded, the space it belongs to,
// who wrote it, and, when something did, what caused it. The projection
// in log.ts folds these into state.

const eventBase = z.object({
  step,
  at,
  space: id,
  actor: id,
  causedBy: id.optional(),
});

export const eventSchema = z.discriminatedUnion('kind', [
  eventBase.extend({ kind: z.literal('space.opened'), payload: spaceSchema }),
  eventBase.extend({ kind: z.literal('verb.proposed'), payload: verbSchema }),
  eventBase.extend({
    kind: z.literal('verb.blessed'),
    payload: z.object({ verb: id, by: id, at }),
  }),
  eventBase.extend({
    kind: z.literal('verb.retired'),
    payload: z.object({ verb: id, by: id, at }),
  }),
  eventBase.extend({ kind: z.literal('verb.called'), payload: receiptSchema }),
  eventBase.extend({ kind: z.literal('verb.refused'), payload: refusalSchema }),
  eventBase.extend({ kind: z.literal('source.proposed'), payload: sourceSchema }),
  eventBase.extend({
    kind: z.literal('source.blessed'),
    payload: z.object({ source: id, by: id, at }),
  }),
  eventBase.extend({ kind: z.literal('reflection.recorded'), payload: reflectionSchema }),
  eventBase.extend({ kind: z.literal('bridge.proposed'), payload: bridgeProposalSchema }),
  eventBase.extend({
    kind: z.literal('bridge.resolved'),
    payload: z.object({ proposal: id, decision: z.enum(DECISIONS), by: id, at }),
  }),
  eventBase.extend({ kind: z.literal('reference.cited'), payload: weakReferenceSchema }),
]);
export type FabricEvent = z.infer<typeof eventSchema>;
export type FabricEventKind = FabricEvent['kind'];

/** Parse unknown input as one event, or throw with every issue named. */
export function parseEvent(input: unknown): FabricEvent {
  return eventSchema.parse(input);
}
