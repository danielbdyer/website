// @dby/sky — the constellation surface as a self-contained
// package. Today this index is a re-export shim over the
// in-tree implementations; Phase 2 of the extraction moves the
// files into packages/sky/src/ and the shim retires.
//
// The boundary already exists in import paths: anything that
// imports the constellation from `@dby/sky` is consuming the
// package's contract; anything still importing from
// `@/shared/*` is consuming an internal of the main app. The
// distinction lets the perf harness and any future package
// consumer compose against the package alone.

export { Constellation } from '@/shared/organisms/Constellation/Constellation';
export type {
  ConstellationGraph,
  ConstellationNode,
  ConstellationEdge,
  ConstellationHue,
} from '@/shared/content/constellation';
