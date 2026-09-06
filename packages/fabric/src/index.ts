// ─── @dbd/fabric ──────────────────────────────────────────────────
//
// The interaction fabric: the well-permissioned runtime a local agent
// session lives in. FABRIC.md is the specification.

export {
  CHANGE_TARGETS,
  CONSEQUENCE_CLASSES,
  DECISIONS,
  RUNTIME_ACTOR,
  SOURCE_KINDS,
  SPACE_KINDS,
  refusalSchema,
  sourceSchema,
  bridgeProposalSchema,
  changeRequestSchema,
  citationSchema,
  eventSchema,
  manifestSchema,
  manifestVerbSchema,
  parseEvent,
  receiptSchema,
  reflectionSchema,
  spaceSchema,
  verbSchema,
  weakReferenceSchema,
} from './schema';
export type {
  BridgeProposal,
  ChangeRequest,
  ChangeTarget,
  Citation,
  ConsequenceClass,
  Decision,
  FabricEvent,
  FabricEventKind,
  Manifest,
  ManifestVerb,
  Receipt,
  Reflection,
  Refusal,
  Source,
  SourceKind,
  Space,
  SpaceKind,
  Verb,
  WeakReference,
} from './schema';

export {
  apply,
  emptyState,
  homeOf,
  pendingIn,
  project,
  sourcesOf,
  visibleReflections,
} from './log';
export type { FabricState } from './log';

export { manifestFor, toolsFrom } from './manifest';
export type { ToolListing } from './manifest';

export { fabricIssues } from './invariants';

export {
  Consent,
  EventLog,
  GraphSource,
  LogRejected,
  NotPending,
  Resonance,
  consentOverLog,
  memoryEventLog,
  noResonance,
} from './ports';
export type {
  Aperture,
  ConsentService,
  EventLogService,
  GraphSourceService,
  Hit,
  ResonanceService,
} from './ports';

export { canonical, canonicalJson, same } from './canonical';
export { cut, mergeParts, sliceFromState } from './graph';
export type { SliceParts } from './graph';
export {
  EVENT_KINDS,
  INVARIANTS,
  RESOURCES,
  describe,
  eventJsonSchema,
  readmeFrom,
} from './describe';
export type { Description } from './describe';
export {
  AGENT_SPACE,
  MemoryCompile,
  OPERATOR_SPACE,
  REGISTRY,
  Siblings,
  collectionsFor,
  pending,
  proposedVerbs,
  recall,
  reflect,
  refusal,
  slice,
  sync,
  turnsFrom,
} from './verbs';
export type {
  CallContext,
  MemoryCompileService,
  Recollection,
  Sibling,
  SiblingsService,
  SourceTurn,
  VerbDefinition,
  VerbEnvironment,
} from './verbs';
