import { z } from 'zod';
import { canonical } from './canonical';
import { compounding, type Compounding } from './compounding';
import {
  bridgesPendingIn,
  crossingsPendingIn,
  patchesPendingIn,
  sourcesOf,
  type FabricState,
} from './log';
import { manifestFor } from './manifest';
import {
  CHANGE_TARGETS,
  CONSEQUENCE_CLASSES,
  DECISIONS,
  SOURCE_KINDS,
  SPACE_KINDS,
  eventUnion,
  type Manifest,
  type Source,
  type Space,
} from './schema';

// ─── Self-description ─────────────────────────────────────────────
//
// The system sees itself: one document, derived from the log and the
// schema, that any other system can read to speak to the fabric. It is
// the manifest with its surroundings — the spaces, the sources, what
// is waiting, the event schema as JSON Schema, the invariants, and the
// protocol — and it is a projection, so `describe --check` can tell
// when the committed copy has drifted from the log. Nothing here is
// hand-maintained. `asOf` is the last event's time, not the clock, so
// the same log describes itself the same way twice.

export const OPERATOR_SPACE = 'danny';
export const AGENT_SPACE = 'agent';

/** The invariants, as data, so the description can carry them. The
 *  statements are the spec's; the checks live in invariants.ts. */
export const INVARIANTS = [
  { id: 'INV-FAB-001', statement: 'A call is to a verb in the manifest.' },
  { id: 'INV-FAB-002', statement: 'A verb or a source is blessed by the sovereign of its space.' },
  {
    id: 'INV-FAB-003',
    statement: "A crossing crosses a wall and is closed once, by the target's sovereign.",
  },
  { id: 'INV-FAB-004', statement: 'A weak reference crosses a wall as text.' },
  { id: 'INV-FAB-005', statement: 'The fold is a function: the same log yields the same state.' },
  {
    id: 'INV-FAB-006',
    statement: 'A tenant sees its own space whole and the other space through blessing.',
  },
  { id: 'INV-FAB-007', statement: 'A signature is frozen at blessing.' },
  {
    id: 'INV-FAB-008',
    statement:
      'A patch is applied only to the base it was proposed against, only by the sovereign, and once.',
  },
  { id: 'INV-FAB-009', statement: 'An outcome cites a patch that was applied.' },
  {
    id: 'INV-FAB-010',
    statement:
      'Every retrieval is an event, with its context and every candidate in rank order; a receipt for a retrieval verb has one.',
  },
  {
    id: 'INV-FAB-011',
    statement:
      'Every event names its actor in the closed grammar, and an agent event carries a because; the schema refuses one without.',
  },
  {
    id: 'INV-FAB-012',
    statement:
      "A bridge relates two distinct nodes with evidence, is closed once by the sovereign of the space it lands in, and blessed is an edge in that space's slice.",
  },
] as const;

/** The loop's own measure, stated in advance: over the last `window`
 *  outcomes, the share confirmed must reach `floor` for the loop to
 *  count as graduated. Graduation gates nothing; it is the number the
 *  operator reads before trusting the loop with more. */
export const GRADUATION = { floor: 0.5, window: 5 } as const;

export interface Graduation {
  readonly floor: number;
  readonly window: number;
  readonly proposed: number;
  readonly applied: number;
  readonly confirmed: number;
  readonly contradicted: number;
  readonly rate: number | undefined;
  readonly graduated: boolean;
}

/** The loop measured against its own floor. Pure. */
export function graduation(state: FabricState): Graduation {
  const patches = [...state.patches.values()];
  const recent = state.outcomes
    .toSorted((a, b) => a.at.localeCompare(b.at))
    .slice(-GRADUATION.window);
  const confirmed = recent.filter((outcome) => outcome.outcome === 'confirmed').length;
  const contradicted = recent.length - confirmed;
  const rate = recent.length > 0 ? confirmed / recent.length : undefined;
  return {
    ...GRADUATION,
    proposed: patches.length,
    applied: patches.filter((patch) => patch.applied).length,
    confirmed,
    contradicted,
    rate,
    graduated: recent.length >= GRADUATION.window && (rate ?? 0) >= GRADUATION.floor,
  };
}

export interface Description {
  readonly fabric: {
    readonly name: string;
    readonly version: string;
    readonly log: string;
    readonly session: string;
  };
  readonly asOf: string;
  readonly spaces: readonly Space[];
  readonly manifest: Manifest;
  readonly sources: readonly Source[];
  readonly waiting: {
    readonly verbs: readonly string[];
    readonly sources: readonly string[];
    readonly crossings: number;
    readonly bridges: number;
    readonly patches: number;
  };
  readonly vocabularies: {
    readonly consequenceClasses: readonly string[];
    readonly spaceKinds: readonly string[];
    readonly decisions: readonly string[];
    readonly changeTargets: readonly string[];
    readonly sourceKinds: readonly string[];
    readonly eventKinds: readonly string[];
  };
  readonly events: Record<string, unknown>;
  readonly invariants: readonly { readonly id: string; readonly statement: string }[];
  readonly graduation: Graduation;
  /** Whether the corpus compounds: retrievals, and how many a later act used. */
  readonly compounding: Compounding;
  readonly protocol: {
    readonly transport: 'stdio';
    readonly start: string;
    readonly resources: readonly string[];
    readonly hooks: { readonly start: string; readonly stop: string };
    readonly bless: string;
  };
}

export const EVENT_KINDS = eventUnion.options.map((option) => option.shape.kind.value);

/** The event log's schema, as JSON Schema, canonical. One `oneOf` per
 *  kind: the discriminated union crosses into JSON Schema whole. */
export const eventJsonSchema = (): Record<string, unknown> =>
  canonical(z.toJSONSchema(eventUnion)) as Record<string, unknown>;

export const RESOURCES = [
  'fabric://manifest',
  'fabric://events.schema',
  'fabric://readme',
] as const;

/** The fabric, described from its log. Pure. */
export function describe(state: FabricState): Description {
  const asOf = state.lastAt;
  const verbs = [...state.verbs.values()];
  const sources = [...state.sources.values()];
  return {
    fabric: {
      name: '@dbd/fabric',
      version: '0.0.0',
      log: 'fabric/spaces/<space>.jsonl',
      session: 'fabric/.session',
    },
    asOf,
    spaces: [...state.spaces.values()],
    manifest: manifestFor(OPERATOR_SPACE, asOf, verbs),
    sources: sourcesOf(state, OPERATOR_SPACE),
    waiting: {
      verbs: verbs.flatMap((verb) =>
        verb.blessedAt === undefined && verb.retiredAt === undefined ? [verb.name] : [],
      ),
      sources: sources.flatMap((source) => (source.blessedAt === undefined ? [source.id] : [])),
      crossings: crossingsPendingIn(state, OPERATOR_SPACE).length,
      bridges: bridgesPendingIn(state, OPERATOR_SPACE).length,
      patches: patchesPendingIn(state, OPERATOR_SPACE).length,
    },
    vocabularies: {
      consequenceClasses: [...CONSEQUENCE_CLASSES],
      spaceKinds: [...SPACE_KINDS],
      decisions: [...DECISIONS],
      changeTargets: [...CHANGE_TARGETS],
      sourceKinds: [...SOURCE_KINDS],
      eventKinds: EVENT_KINDS,
    },
    events: eventJsonSchema(),
    invariants: INVARIANTS,
    graduation: graduation(state),
    compounding: compounding(state),
    protocol: {
      transport: 'stdio',
      start: 'pnpm fabric serve',
      resources: RESOURCES,
      hooks: { start: 'pnpm fabric orient', stop: 'pnpm fabric stop-check' },
      bless: 'pnpm fabric bless <verb | source | crossing | bridge | patch>',
    },
  };
}

const row = (cells: readonly string[]): string => `| ${cells.join(' | ')} |`;

const verbTable = (description: Description): readonly string[] => {
  const { manifest, waiting } = description;
  const rows =
    manifest.verbs.length > 0
      ? manifest.verbs.map((verb) =>
          row([
            `\`${verb.name}\``,
            verb.consequence,
            verb.description.replaceAll('|', String.raw`\|`),
          ]),
        )
      : [row(['—', '—', 'No verb is blessed yet; the manifest is empty.'])];
  return [
    `## Manifest of \`${manifest.space}\``,
    '',
    'Each verb carries its input and output schema as JSON Schema in `manifest.json`. A session lists these as tools; a call outside this table is refused and the refusal is an event.',
    '',
    row(['Verb', 'Consequence', 'What it does']),
    row(['---', '---', '---']),
    ...rows,
    '',
    ...(waiting.verbs.length > 0
      ? [
          `Waiting for the operator's blessing: ${waiting.verbs.map((name) => `\`${name}\``).join(', ')}.`,
          '',
        ]
      : []),
  ];
};

const sourceTable = (description: Description): readonly string[] => {
  const { sources, waiting, manifest } = description;
  const rows =
    sources.length > 0
      ? sources.map((source) => row([`\`${source.id}\``, source.kind, `\`${source.path}\``]))
      : [row(['—', '—', 'No source is blessed yet.'])];
  return [
    '## Sources',
    '',
    'Where the operator’s space reads from besides the log. A source is proposed and blessed like a verb; blessing it is disclosing it.',
    '',
    row(['Source', 'Kind', 'Path']),
    row(['---', '---', '---']),
    ...rows,
    '',
    ...(waiting.sources.length > 0
      ? [
          `Waiting for the operator's blessing: ${waiting.sources.map((id) => `\`${id}\``).join(', ')}.`,
          '',
        ]
      : []),
    `Waiting in \`${manifest.space}\`: ${waiting.crossings} crossing(s) to carry a node in, ${waiting.bridges} bridge(s) to relate two, ${waiting.patches} patch(es) to change one.`,
    '',
  ];
};

const loop = (description: Description): readonly string[] => {
  const { graduation: measure } = description;
  const rate = measure.rate === undefined ? 'no outcome yet' : measure.rate.toFixed(2);
  return [
    '## The loop, pointed at itself',
    '',
    'A session proposes a change to one of the operator’s nodes with `patch`: the node’s whole new text, the base it read, why, and a hypothesis the next session can check. The fabric evaluates what it can and the patch waits; the operator applies it from his terminal, only to the base it named. The next session sees the applied patch at start and reports through `reflect` whether the hypothesis held. Graduation is a number the operator reads, and it gates nothing.',
    '',
    row([
      'Proposed',
      'Applied',
      'Confirmed',
      'Contradicted',
      'Rate',
      'Floor',
      'Window',
      'Graduated',
    ]),
    row(['---', '---', '---', '---', '---', '---', '---', '---']),
    row([
      String(measure.proposed),
      String(measure.applied),
      String(measure.confirmed),
      String(measure.contradicted),
      rate,
      String(measure.floor),
      String(measure.window),
      measure.graduated ? 'yes' : 'not yet',
    ]),
    '',
  ];
};

const speaking = (description: Description): readonly string[] => {
  const { protocol } = description;
  return [
    '## Speaking to it',
    '',
    `- **Transport:** ${protocol.transport}. Start the server with \`${protocol.start}\`; it speaks the Model Context Protocol.`,
    `- **Resources:** ${protocol.resources.map((uri) => `\`${uri}\``).join(', ')}.`,
    `- **Hooks:** \`${protocol.hooks.start}\` at session start prints memory into context; \`${protocol.hooks.stop}\` at stop asks once for a reflection.`,
    `- **Blessing:** \`${protocol.bless}\`, in the operator's terminal. Never a verb.`,
    `- **The log:** \`${description.fabric.log}\`, one event per line, validated by \`events.schema.json\`. Steps are per tenant.`,
    '',
  ];
};

const ratio = (value: number | undefined): string =>
  value === undefined ? 'none yet' : value.toFixed(2);

const compounds = (description: Description): readonly string[] => {
  const measure = description.compounding;
  return [
    '## Does it compound?',
    '',
    'A corpus compounds when outputs become inputs: something stored is surfaced in a context other than the one it was made in, and the next act uses it. Every retrieval a session makes is an event with its candidates in rank order; a use is a later citation, patch, or bridge by the same session naming a candidate another session made. The numbers below are that measure, folded from the log. They gate nothing; they are what the operator reads before building anything meant to raise them.',
    '',
    row([
      'Retrievals',
      'Used',
      'Rate',
      `Hit@${measure.k}`,
      'MRR',
      'Missed',
      'Proposals decided',
      'Blessed',
    ]),
    row(['---', '---', '---', '---', '---', '---', '---', '---']),
    row([
      String(measure.retrievals),
      String(measure.used),
      ratio(measure.rate),
      ratio(measure.hitAtK),
      ratio(measure.mrr),
      String(measure.missed),
      String(measure.acceptance.decided),
      ratio(measure.acceptance.rate),
    ]),
    '',
    ...(measure.series.length > 0
      ? [
          `By session, oldest first, the last ${measure.window}: ${measure.series.map((point) => `${point.used}/${point.retrievals}`).join(', ')}.`,
          '',
        ]
      : []),
  ];
};

/** The description as a page any other system, or person, can read
 *  before speaking to the fabric. Generated; never edited by hand. */
export function readmeFrom(description: Description): string {
  return [
    '# The fabric, described',
    '',
    `*Generated from the log by \`pnpm fabric describe\`; do not edit. As of ${description.asOf}. The specification is \`FABRIC.md\` one level up; this page is what a system that only has this folder needs.*`,
    '',
    '## What this is',
    '',
    'An append-only log per tenant, a graph as memory, verbs as blessed nodes projected into a manifest, a receipt on every call, and consent as the only way across a wall. A crossing carries a node from one space into another; a bridge relates two nodes with evidence; a patch changes one. Each waits for the sovereign of the space it lands in. The session that connects is the only reasoner; the fabric remembers and acts deterministically.',
    '',
    '## Spaces',
    '',
    row(['Space', 'Kind', 'Sovereign']),
    row(['---', '---', '---']),
    ...description.spaces.map((space) =>
      row([`\`${space.id}\``, space.kind, `\`${space.sovereign}\``]),
    ),
    '',
    ...verbTable(description),
    ...sourceTable(description),
    ...loop(description),
    ...compounds(description),
    ...speaking(description),
    '## Vocabularies',
    '',
    ...Object.entries(description.vocabularies).map(
      ([name, values]) => `- **${name}:** ${values.map((value) => `\`${value}\``).join(', ')}`,
    ),
    '',
    '## Invariants',
    '',
    ...description.invariants.map((invariant) => `- **${invariant.id}** — ${invariant.statement}`),
    '',
  ].join('\n');
}
