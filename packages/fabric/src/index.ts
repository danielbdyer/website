// ─── @dbd/fabric ──────────────────────────────────────────────────
//
// The interaction fabric: the well-permissioned runtime a local agent
// session lives in. FABRIC.md is the specification.

export {
  CHANGE_TARGETS,
  CONSEQUENCE_CLASSES,
  DECISIONS,
  SPACE_KINDS,
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
  Space,
  SpaceKind,
  Verb,
  WeakReference,
} from './schema';

export { apply, emptyState, homeOf, pendingIn, project, visibleReflections } from './log';
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
  consentOverLog,
  memoryEventLog,
} from './ports';
export type { Aperture, ConsentService, EventLogService, GraphSourceService } from './ports';

export { canonical, canonicalJson, same } from './canonical';
export { sliceFromState } from './graph';
export {
  AGENT_SPACE,
  OPERATOR_SPACE,
  REGISTRY,
  Siblings,
  pending,
  proposedVerbs,
  reflect,
  refusal,
  slice,
  sync,
} from './verbs';
export type { CallContext, Sibling, SiblingsService, VerbDefinition } from './verbs';
