// ─── @dbd/fabric/sim — synthetic proof of the loop ────────────────
//
// The loop is architecturally complete and has, in the real log, never
// closed: R(t) = 0 of 0. This module proves it closes, that the metric
// discriminates good retrieval from bad, and how it scales — all before
// a real session runs, and all quarantined so the real R(t) stays 0
// until a real blessing and a real citation. CORPUS.md Part three is the
// report; DECISIONS.md D-007..D-011 are the record.

export {
  SYNTHETIC_SOURCE,
  SYNTHETIC_ACTOR,
  isSynthetic,
  containsSynthetic,
  quarantined,
  simSpace,
  stamped,
} from './quarantine';
export {
  DEFAULT_PARAMS,
  seedSpecs,
  targetsFrom,
  querySpecs,
  unit,
  type SimParams,
  type SeedSpec,
  type Target,
  type QuerySpec,
} from './model';
export { syntheticResonance, type Truth } from './resonance';
export {
  memoryHandle,
  fileHandle,
  driveRun,
  sweepTheta,
  orientKSweep,
  type LogHandle,
  type SweepPoint,
  type OrientPoint,
} from './harness';
