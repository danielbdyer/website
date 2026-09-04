import { z } from 'zod';

// ─── @dbd/slice — the contract that crosses the wall ───────────────
//
// A slice is a bounded view of a graph, cut for one turn: the engine's
// own word (`graph.slice.load` in its protocol). It is plain data with
// a schema of record, and it is the only thing the site and the engine
// share. Neither imports the other; both depend on this. CATHEDRALS.md
// §"The Contract: The Slice" is the specification; the invariants
// below carry the ids named there.
//
// The package depends on TypeScript and zod and nothing else. Effect
// never crosses this boundary; React never crosses it.

// ─── Vocabularies ─────────────────────────────────────────────────
//
// Closed. Extended by decision record, never by an adapter.

/** How an edge came to be. Immutable once written. */
export const ORIGINS = ['declared', 'discovered', 'emergent'] as const;
export type Origin = (typeof ORIGINS)[number];

/** The canonical predicates: the engine's eight, as written in its code. */
export const PREDICATES = [
  'references',
  'is_a',
  'expands_on',
  'responds_to',
  'contradicts',
  'part_of',
  'inspired_by',
  'succeeds',
] as const;
export type Predicate = (typeof PREDICATES)[number];

/** The one soft predicate. A resonance is noticed, never blessed as
 *  itself; it can carry any origin but `declared` (INV-SLC-003). */
export const SOFT_PREDICATES = ['resonates'] as const;
export type SoftPredicate = (typeof SOFT_PREDICATES)[number];

/** Where a node is in its life. The engine's five states. */
export const METABOLIC_STATES = [
  'nascent',
  'privated',
  'full',
  'flourishing',
  'composting',
] as const;
export type MetabolicState = (typeof METABOLIC_STATES)[number];

/** The proposals a sky can draw as ghosts. */
export const GHOST_OPERATIONS = ['create_entity', 'create_relation'] as const;
export type GhostOperation = (typeof GHOST_OPERATIONS)[number];

// ─── Schema ───────────────────────────────────────────────────────

const id = z.string().min(1);
const unit = z.number().min(0).max(1);

/** One bearing of the compass: the site's facets, the vault's
 *  constellations. Azimuth in degrees, [0, 360). */
export const axisSchema = z.object({
  id,
  name: z.string().min(1),
  azimuthDeg: z.number().min(0).lt(360),
  hue: z.string().min(1).optional(),
});
export type Axis = z.infer<typeof axisSchema>;

/** An entity as the sky needs it. No body: the body is primary and
 *  stays at home. `group` is the source's home for the node (the
 *  site's room); absent when the source has none. */
export const sliceNodeSchema = z.object({
  id,
  title: z.string().min(1),
  kind: z.string().min(1),
  axes: z.array(id).default([]),
  summary: z.string().optional(),
  createdAt: z.iso.datetime(),
  status: z.enum(METABOLIC_STATES).optional(),
  href: z.string().min(1).optional(),
  group: z.string().min(1).optional(),
});
export type SliceNode = z.infer<typeof sliceNodeSchema>;

/** A relation with its origin. */
export const sliceEdgeSchema = z.object({
  subject: id,
  predicate: z.enum([...PREDICATES, ...SOFT_PREDICATES]),
  object: id,
  origin: z.enum(ORIGINS),
  weight: unit.optional(),
});
export type SliceEdge = z.infer<typeof sliceEdgeSchema>;

/** A proposal not yet blessed: a star not yet lit, where it would land. */
export const ghostSchema = z.object({
  id,
  operation: z.enum(GHOST_OPERATIONS),
  title: z.string().min(1).optional(),
  subject: id.optional(),
  predicate: z.enum(PREDICATES).optional(),
  object: id.optional(),
  confidence: unit.optional(),
  evidence: z.string().optional(),
});
export type Ghost = z.infer<typeof ghostSchema>;

export const pendingSchema = z.object({
  unresolved: z.number().int().min(0),
  ghosts: z.array(ghostSchema).default([]),
});
export type Pending = z.infer<typeof pendingSchema>;

const sliceShape = z.object({
  space: id,
  asOf: z.iso.datetime(),
  axes: z.array(axisSchema),
  nodes: z.array(sliceNodeSchema),
  edges: z.array(sliceEdgeSchema),
  pending: pendingSchema,
});
export type Slice = z.infer<typeof sliceShape>;

// ─── Invariants ───────────────────────────────────────────────────

/** Every way a slice can fail to be grounded, as messages. Pure; the
 *  schema's refinement reports these, and a test can read them without
 *  the schema. Empty when the slice holds INV-SLC-001..003. */
export function groundingIssues(slice: Slice): readonly string[] {
  const nodes = new Set(slice.nodes.map((node) => node.id));
  const axes = new Set(slice.axes.map((axis) => axis.id));
  const ungrounded = slice.edges.flatMap((edge) =>
    [edge.subject, edge.object].flatMap((end) =>
      nodes.has(end)
        ? []
        : [
            `INV-SLC-001: edge ${edge.subject} ${edge.predicate} ${edge.object} names a node not in the slice: ${end}`,
          ],
    ),
  );
  const unnamedAxes = slice.nodes.flatMap((node) =>
    node.axes.flatMap((axis) =>
      axes.has(axis)
        ? []
        : [`INV-SLC-002: node ${node.id} names an axis not in the slice: ${axis}`],
    ),
  );
  const declaredResonance = slice.edges.flatMap((edge) =>
    edge.predicate === 'resonates' && edge.origin === 'declared'
      ? [
          `INV-SLC-003: ${edge.subject} resonates ${edge.object} is declared; a resonance is never declared`,
        ]
      : [],
  );
  return [...ungrounded, ...unnamedAxes, ...declaredResonance];
}

/** The schema of record. Shape, then grounding. */
export const sliceSchema = sliceShape.superRefine((slice, ctx) => {
  groundingIssues(slice).forEach((message) => {
    ctx.addIssue({ code: 'custom', message });
  });
});

/** Parse unknown input as a slice, or throw with every issue named. */
export function parseSlice(input: unknown): Slice {
  return sliceSchema.parse(input);
}
