# Invariants — the registry, and what holds each

*Written 2026-09-07. One table for every invariant the lineage names — the fabric's own (INV-FAB-001 to -011, stated in `FABRIC.md` and carried by `describe`) and the North Star's (INV-NS-001 to -013, from v3 Appendix B, §28.12, and v4 Appendix B) — with the file that holds it, the test that proves it, and its standing today. v4 §21 asks that the property tests be always green; this is the list they are green against. A row moves from `not built` to `held` only with a test named in the last column, never with prose.*

*This file is derived from the specifications by hand today. v4 §12 puts `describe` enumerations under the schema of record; when the invariant list is generated from `describe.ts` (INV-NS-004), this file becomes a drift-checked projection of it.*

## Standing

| Standing | Meaning |
|---|---|
| **held** | a test or a schema refinement makes the violation fail or unrepresentable |
| **partial** | the mechanism exists for some of the invariant's scope |
| **vacuous** | true today because the thing it constrains does not exist yet |
| **not built** | nothing holds it; it is a row in `NORTH_STAR_BACKLOG.md` |

## The fabric's invariants

| Id | Statement (`FABRIC.md`) | North Star's restatement | Held by | Test | Standing |
|---|---|---|---|---|---|
| INV-FAB-001 | A call is to a verb in the manifest. | A verb not in the operator's manifest is refused. | `verbs.ts` `refusal`; `server.ts` `handleCall` appends `verb.refused` | `fabric.test.ts`, `slice.test.ts` (a refusal is an event) | held |
| INV-FAB-002 | A verb or a source is blessed by the sovereign of its space. | — | `invariants.ts` `strangerBlessings`, `strangerSources` | `fabric.test.ts` | held |
| INV-FAB-003 | A crossing crosses a wall and is closed once, by the target's sovereign. | — | `log.ts` first-answer-wins; `invariants.ts` `sameSpaceCrossings`, `strangerResolutions` | `fabric.test.ts` | held; named a bridge until D-016 |
| INV-FAB-004 | A weak reference crosses a wall as text. | — | `invariants.ts` `homelessReferences` | `fabric.test.ts` | held |
| INV-FAB-005 | The fold is a function: the same log yields the same state. | INV-NS-001 | `log.ts` `project` is a pure reduce | `compounding.test.ts` "the fold is deterministic" over generated logs | held |
| INV-FAB-006 | A tenant sees its own space whole and the other space through blessing. | A reflection is in the operator's projection iff a blessed crossing carries it. | `log.ts` `visibleReflections`, `homeOf` | `compounding.test.ts` "nothing an agent writes reaches the operator's projection without his blessing"; `fabric.test.ts` | held |
| INV-FAB-007 | A signature is frozen at blessing. | — | `verbs.ts` `refusal` compares the blessed `inputSchema` to the code's | `shell.test.ts` | held; live since `reflect` was blessed 2026-09-06 |
| INV-FAB-008 | A patch is applied only to the base it was proposed against, only by the sovereign, and once. | — | `verbs.ts` `decidePatch` (`BaseMoved`, `NotWaiting`); `invariants.ts` `strangerPatches` | `loop.test.ts` | held |
| INV-FAB-009 | An outcome cites a patch that was applied. | — | `verbs.ts` `outcomesOf` (`NotApplied`); `invariants.ts` `orphanOutcomes` | `loop.test.ts` | held |
| INV-FAB-010 | Every retrieval is an event, with its context and every candidate in rank order; a receipt for a retrieval verb has one. | same | `verbs.ts` `surfaced` in `slice` and `recall`; `cli.ts` `recordOrient`; `invariants.ts` `unrecordedRetrievals` | `compounding.test.ts` | held for the three retrieval verbs; the hook's file reads are step 2 |
| INV-FAB-011 | Every event names its actor in the closed grammar, and an agent event carries a `because`; the schema refuses one without. | An agent event without a non-empty `because` is unrepresentable in the log. | `schema.ts` `actorSchema` regex; `eventSchema.superRefine`; `invariants.ts` `unreasonedAgentEvents` | `compounding.test.ts` "every event says who wrote it and, for an agent, why" | held |
| INV-FAB-012 | A bridge relates two distinct nodes with evidence, is closed once by the sovereign of the space it lands in, and blessed is an edge in that space's slice. | v4 §2 (bridge), §10 (the markdown bridge makes the same edge) | `verbs.ts` `bridge` (`NotARelation`), `decideBridge`; `log.ts` first-answer-wins, `bridgesIn`; `graph.ts` `bridgeEdges`; `invariants.ts` `selfBridges`, `strangerBridges` | `shell.test.ts` "a bridge: a relation with evidence"; `fabric.test.ts` "a bridge in the fold" | held since 2026-09-07 (D-016) |

## The North Star's invariants

| Id | Statement | Introduced | Held by | Test | Standing |
|---|---|---|---|---|---|
| INV-NS-001 | Same log ⇒ same projection, bit for bit, on any machine. | v3 §4 | `log.ts` pure fold (= INV-FAB-005) | `compounding.test.ts` fold determinism, 60 generated logs | held |
| INV-NS-002 | Export → fresh process → import ⇒ identical projection. | v3 §4 | `node/file-log.ts` parses every line through `parseEvent`; `canonical.ts` | `compounding.test.ts` "the portable format" through the file adapter; `quarantine.test.ts` fresh reader over a synthetic directory | held |
| INV-NS-003 | No real projection contains an `import:synthetic` event. | v3 §15 | `sim/quarantine.ts`: the `import:synthetic` stamp at the log seam and physical separation (temp directories only; D-008) | `quarantine.test.ts`: every synthetic event is `import:synthetic`; the committed real log is synthetic-free with R(t) 0 of 0 | held |
| INV-NS-004 | Every generated artifact matches the schema of record; drift fails the commit. | v3 §12 | `describe.ts`; `pnpm fabric describe --check` in `lint:fabric`, run by the pre-push gate | the drift check itself | partial: `manifest.json`, `events.schema.json`, `fabric/README.md`; the prose documents v4 §12 names are not generated |
| INV-NS-005 | Nothing agent-authored reaches canonical without a blessing event. | v3 §4 | the same mechanism as INV-FAB-006: `decision: null` until an `author:` event | `compounding.test.ts` blessed-versus-proposed property | held |
| INV-NS-006 | An event whose signature does not verify against its actor's DID is unrepresentable in the log. | §28.2 | — | — | not built (v4 step 8) |
| INV-NS-007 | No event reaches a tenant's canonical projection by virtue of another tenant's blessing. | §28.4 | — | — | vacuous: one tenant |
| INV-NS-008 | A delegated capability can only narrow; no grant confers more than its issuer holds. | §28.5 | — | — | not built (v4 step 8) |
| INV-NS-009 | A tenant's log is appended only by that tenant's actor; sessions and disconnected surfaces append to their own files and are merged by the actor. | §28.7.1 | — (today every session appends to `agent.jsonl` through one semaphore) | — | not built |
| INV-NS-010 | No inference gateway, cache, or telemetry store is read by any fold. | §28.8 | the fold reads the log alone (`log.ts` takes events, nothing else) | by construction | vacuous: no gateway exists |
| INV-NS-011 | No action is taken in any tenant except through a verb in its manifest, and every verb execution is a receipt with a `because`. | §28.10 | `server.ts` `handleCall` writes `verb.called` with `because` for every verb | `compounding.test.ts`, `shell.test.ts` | partial: verbs yes; `bless`, `orient`, and the hooks are CLI commands without receipts (v4 §19 makes them verbs) |
| INV-NS-012 | Every verb is a CLI subcommand with a generated `--json` contract, and no CLI path prompts without a flag equivalent. | v4 §19 | — | — | not built (v4 step 7) |
| INV-NS-013 | A refusal (exit 2) prints the permitting command and never executes it. | v4 §19 | — | — | not built (v4 step 7) |

## Where the two lists overlap

INV-FAB-005 and INV-NS-001 are one property stated twice; INV-FAB-006 and INV-NS-005 are two halves of one mechanism (what a tenant sees, and what reaches canonical). The North Star's Appendix B lists four of the fabric's twelve; the other eight (002, 003, 004, 005, 007, 008, 009, 012) are the fabric's own and hold regardless. When the registry is generated from `describe.ts`, the overlap becomes a cross-reference, not a duplicate.

## What would move a row

- **INV-NS-004 to held:** generate `DOMAIN_MODEL.md`'s and `FABRIC.md`'s event-kind sections from the schema and add them to `describe --check` (v4 step 7).
- **INV-NS-009 to held:** per-session append files under `fabric/spaces/`, merged by `step` in the file adapter, with a property test that two interleaved sessions fold identically in either read order.
- **INV-NS-011 to held:** make `bless`, `orient`, `describe`, `init`, `doctor`, and `log` verbs with receipts (v4 §19.1), and give hook-originated retrievals a receipt or a stated exemption.
- **INV-NS-006, -007, -008 to held:** step 8, and not before step 6's correction-repeat number (v4 §23).
