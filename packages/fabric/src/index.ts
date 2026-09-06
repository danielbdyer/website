// ─── @dbd/fabric ──────────────────────────────────────────────────
//
// The interaction fabric: the well-permissioned runtime a local agent
// session lives in. FABRIC.md is the specification.

export {
  CHANGE_TARGETS,
  CONSEQUENCE_CLASSES,
  DECISIONS,
  OUTCOMES,
  RUNTIME_ACTOR,
  SOURCE_KINDS,
  SPACE_KINDS,
  refusalSchema,
  sourceSchema,
  bridgeProposalSchema,
  changeRequestSchema,
  checkSchema,
  citationSchema,
  evaluationSchema,
  eventSchema,
  outcomeReportSchema,
  outcomeSchema,
  patchSchema,
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
  Check,
  Citation,
  Evaluation,
  Outcome,
  OutcomeRecord,
  OutcomeReport,
  Patch,
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
  patchesPendingIn,
  pendingIn,
  project,
  sourcesOf,
  visibleReflections,
} from './log';
export type { FabricState, PatchRecord } from './log';

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
export { changed, diffLines, unified } from './diff';
export type { Hunk } from './diff';
export {
  EVENT_KINDS,
  GRADUATION,
  INVARIANTS,
  RESOURCES,
  describe,
  eventJsonSchema,
  graduation,
  readmeFrom,
} from './describe';
export type { Description, Graduation } from './describe';
export {
  AGENT_SPACE,
  BaseMoved,
  Canon,
  MemoryCompile,
  NoSuchNode,
  NotApplied,
  NotWaiting,
  OPERATOR_SPACE,
  REGISTRY,
  Siblings,
  collectionsFor,
  decidePatch,
  pending,
  propose,
  proposedVerbs,
  recall,
  reflect,
  refusal,
  slice,
  sync,
  targetOf,
  turnsFrom,
  unmeasuredIn,
} from './verbs';
export type {
  CallContext,
  CanonService,
  MemoryCompileService,
  NodeText,
  Recollection,
  Sibling,
  SiblingsService,
  SourceTurn,
  VerbDefinition,
  VerbEnvironment,
} from './verbs';
