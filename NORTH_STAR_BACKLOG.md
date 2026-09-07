# The North Star backlog — every unit of v3, §28, and THE LOCK, against the house

*Written 2026-09-07 from the three originals now persisted beside it (`NORTH_STAR_v3.md`, `NORTH_STAR_v3.2.md`, `THE_LOCK.md`) and the lock's successor (`NORTH_STAR.md` v4). It is the superset: every requirement, constraint, thing to build, metric, event kind, invariant, and trigger the lineage names, one row each, with where v4 put it and what the house holds today. v4 is a subset of this list — THE LOCK narrowed v3.2 to the agentic-coding path — and v4 fills its subset in here as it goes: a session that finishes a step flips the rows the step covers and cites the commit; a held row returns by its trigger and is re-tagged when a new version Danny gives says so. Nothing is deleted from this file; a row that is superseded is marked, never removed.*

*This is the fabric's third lineage document held as corpus. It is not the site's backlog (`BACKLOG.md`), which points here rather than restating it (D-014).*

## How to read a row

| Column | Meaning |
|---|---|
| **ID** | `NS-<section>.<n>` for v3, `NS-28.<n>` for the addendum, `LOCK-<section>.<n>` for THE LOCK. Stable; never renumbered. |
| **Type** | `req` a business requirement · `constraint` a standing rule the house honors · `build` a thing to build · `verb` a verb to exist · `kind` an event kind · `metric` a number to fold · `invariant` a property to hold by test · `trigger` a gate · `derivation` a consumer of the schema of record · `skill` a branch of the tree |
| **v4** | The disposition v4's Appendix E gives the unit's section — **K** kept, **N** narrowed, **X** extended, **R** rewritten, **H** held — and whether the unit itself is **in the lock** or **held at D.n**. |
| **Where** | v4 §23 step, or the trigger that unlocks it, or the invariant that holds it. |
| **Status** | `done` built and green · `partial` some of it · `not built` · `held` by trigger · `cut` by the lock, on the record · `holds` a constraint the house honors · `practiced` a protocol the sessions follow · `fired` a trigger that has fired |
| **Note** | The commit, the file, the test, the collision, or the amendment; `→ CORPUS.md Part four §D.n` where an amendment is proposed. |

## The roll-up, 2026-09-07

| | Rows | done / fired / holds / practiced | partial | not built / not fired / collision | held / cut |
|---|---|---|---|---|---|
| v3 §0–§27 + Appendices | 278 | 114 | 44 | 79 | 41 |
| §28 (v3.2) | 52 | 10 | 4 | 27 | 11 |
| THE LOCK | 35 | 7 | 7 | 16 | 4 |
| **All** | **365** | **131** | **55** | **122** | **56** |

One row, LOCK-7.1, is a cross-reference to the NS-23 rows and carries no standing of its own, so the four standing columns sum to 364 of 365. The lock's own build order stands at: step 1 two of three; step 4 done; steps 2, 3, 5–11 not started. R(t) is 0 of 0; the corpus holds two reflections; the first citation is the next session's first act.

---

## v3 §0 · Why this exists

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-0.1 | A corpus compounds iff outputs become inputs; R(t) is the set of out-of-context retrievals that influenced the next action | constraint | K, lock | `compounding()` | holds | `packages/fabric/src/compounding.ts`; D-001 |
| NS-0.2 | Build the instrument before the feature; a feature without a measured effect is a guess | constraint | K, lock | every PR | practiced | D-001; Part three built the proof before any retrieval feature |
| NS-0.3 | The repository that builds this is its first tenant and its own R(t) is the proof *(v4's added sentence; LOCK §0)* | constraint | K, lock | tenant zero | holds | `danielbdyer/website` is tenant zero; R(t) 0 of 0 |

## v3 §1 · Business requirements

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-1.1 | Compounding measured before improved; R(t) first-class, folded, visible at session start | req | K, lock | step 1 | done | `orient` prints it; `describe`; README |
| NS-1.2 | Capture lossless, zero-friction, near-zero latency | req | K, lock | step 3 | not built | `note` does not exist; D-005 reopened by v4 §7 |
| NS-1.3 | Retrieval hybrid (lexical, dense, graph), alias-aware, proactive, logged with use | req | K, lock | steps 2, 5 | partial | dense via qmd and recency; no lexical index, no graph axis, no aliases; logged (INV-FAB-010) with citation-use |
| NS-1.4 | Author sovereignty enforced: agents propose, only Danny blesses | req | K, lock | the gate | done | `bless` in the CLI; consent over the log; INV-FAB-002/003/008 |
| NS-1.5 | Reasons, not conclusions: every decision, correction, evaluation carries a `because` | req | K, lock | INV-FAB-011; step 6 | partial | agent events carry `because` at the schema; evaluations do not exist yet |
| NS-1.6 | Tension preserved, never auto-resolved | req | K, lock | §14 | partial | slice predicates `contradicts`, `succeeds`; `in-tension-with` not admitted; nothing auto-resolves |
| NS-1.7 | Portable and durable: plain text, event-sourced, local-first, rebuildable from the log | req | K, lock | INV-NS-002 | done | JSONL per tenant in git; identity test green |
| NS-1.8 | Actions compound: browser routines crystallize into verbs whose reuse the same fold measures | req | H → D.1 | turn 2 complete | held | v4 replaced with NS-1.8′ |
| NS-1.8′ | A developer's corrections stop repeating; correction-repeat rate first-class and falling *(v4 §1.8, new)* | req | X, lock | step 6 | not built | LOCK §6 "the number that sells" |
| NS-1.9 | Structure evolves from use; the metamodel is corpus | req | N, lock (frontmatter → type) / D.4 (induction) | step 3 (docs), D.4 trigger | not built | v4 keeps frontmatter-and-plugin admission; induction held at twenty reflections |
| NS-1.10 | One interface, stateless: chat, dashboard, action surface as a window onto the log | req | N, lock as "one surface, the CLI" / D.3 (GUI) | v4 §19 | partial | the CLI exists and is stateless; not yet the generated, budgeted surface of v4 §19 |
| NS-1.c | Constraints: single sovereign author; sessions as primary readers and writers; git as sync; no production runtime for the site; no network on the write path | constraint | K, lock | — | holds | all five hold today |
| NS-1.s | Success: R(t) rising on real use; agents start each session carrying Danny's distinctions; every number traceable to an event | req | K, lock | — | not built | R(t) has not yet risen; every number `describe` prints is already a fold |

## v3 §2 · Vocabulary

*The full concordance, with collisions, is `VOCABULARY.md`. Rows here track whether each name is in force in the code.*

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-2.1 | Node (entity / node / haecceity; `Haecceity` never enters code unblessed) | constraint | K, lock | — | holds | slice `node`, engine `entity`; no `Haecceity` in code |
| NS-2.2 | Edge: typed, directed, provenanced | constraint | K, lock | — | holds | slice edges with `origin` |
| NS-2.3 | Axis, not a primitive | constraint | K, lock | — | holds | |
| NS-2.4 | Pending, a suspension state, not a primitive | constraint | K, lock | — | holds | `decision: null` |
| NS-2.5 | Event: kind, payload, actor, at, step, causedBy, because; kinds are not primitives | constraint | K, lock | INV-FAB-011 | holds | `schema.ts` eventBase |
| NS-2.6 | Log: append-only JSONL per tenant, the one thing not regenerable | constraint | K, lock | — | holds | `fabric/spaces/*.jsonl` |
| NS-2.7 | Fold: deterministic log → projection | constraint | K, lock | INV-NS-001 | holds | `log.ts` `project` |
| NS-2.8 | Projection: disposable, replayable; canonical holds blessed, shadow holds proposals | constraint | K, lock | — | partial | one in-memory state; canonical/shadow is the blessed/`decision: null` split, not two projections |
| NS-2.9 | Tenant: one log's scope — a person, a space, or a `sim:<run>` | constraint | N, lock (v4: "and one identity") | step 8 | holds | v4 adds identity (DID); collision noted in `VOCABULARY.md` |
| NS-2.10 | Space: a tenant's named partition | constraint | N, lock | — | holds | `danny`, `agent` |
| NS-2.11 | Operator / sovereign: Danny in his capacity to bless | constraint | K, lock | — | holds | `author:danny` |
| NS-2.12 | Verb: named, typed, schema-bound Effect program in a manifest, producing a receipt | constraint | K, lock | — | holds | `VerbDefinition`, `verb.called` |
| NS-2.13 | Manifest: verbs a space may invoke with state; INV-FAB-001 | constraint | K, lock | INV-FAB-001 | holds | `manifestFor`; `refusal` |
| NS-2.14 | Receipt: inputs, outputs, provenance, `because` (v4: + model, duration) | constraint | X, lock | step 2 | partial | fingerprints and `because`; no model, no duration |
| NS-2.15 | Proposal: any unblessed agent event, in shadow | constraint | K, lock | — | holds | crossings, bridges, and patches with `decision: null` |
| NS-2.16 | Blessing: the author event that promotes, with author provenance | constraint | K, lock | — | holds | `verb.blessed`, `crossing.resolved`, `bridge.resolved`, `patch.resolved` by `author:` |
| NS-2.17 | Reflection: structured session record through `reflect`; not capture | constraint | K, lock | — | holds | blessed 2026-09-06; two recorded |
| NS-2.18 | Capture: one string through `note`; not reflection | constraint | K, lock | step 3 | not built | |
| NS-2.19 | Bridge: a proposed relation between nodes, with evidence | constraint | K, lock | step 2 (`fabric bridge`) | partial | settled 2026-09-07 (D-016): `bridgeSchema`, `bridge.proposed` / `.resolved`, INV-FAB-012, the `bridge` verb proposed and unblessed; the carry-across is now a crossing |
| NS-2.20 | Patch: proposed change to the fabric's behavior, hypothesis stated to fail, with outcome | constraint | K, lock | — | done | Phase 5 |
| NS-2.21 | Retrieval: any verb that surfaces memory, logged as `retrieval.surfaced` | constraint | K, lock | INV-FAB-010 | done | |
| NS-2.22 | Use: citation or patch (v4 adds: a file it actually opened); for the author: blessing, quotation, dismissal's inverse | constraint | X, lock | step 2 | partial | citation and patch counted; file-open and author-use not |
| NS-2.23 | Skill: orients toward verbs; tree; unlocking a branch means its verbs are blessed | constraint | K, lock | §20 | partial | five skills exist; no verb references; no branch gating |
| NS-2.24 | Plugin: Layer + skill + schema fragments | constraint | N, lock (first plugin only) | step 2 | not built | |
| NS-2.25 | Metamodel: blessed types, each a node with a schema fragment | constraint | N, lock / D.4 | D.4 | not built | |
| NS-2.26 | Schema of record: the zod definition every shape derives from | constraint | K, lock | §12 | holds | `schema.ts` |
| NS-2.27 | Fabric: the whole system in the repository | constraint | K, lock | — | holds | |
| NS-2.28 | Inbox, Correction, Daemon *(v4 new terms)* | constraint | X, lock | steps 2, 3, 6 | not built | |

## v3 §3 · Architecture

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-3.1 | Surfaces hold no state: Electron renderer, CLI, hooks invoke verbs and view projections | constraint | N, lock (CLI, hooks) / D.3 (Electron) | — | holds | the CLI and hooks are stateless |
| NS-3.2 | The verb runtime is the one abstraction every capability shares; the bless gate lives there only | constraint | N, lock | — | partial | verbs share `VerbDefinition`; `bless` is a CLI command, not a verb (v4 §19 makes it one) |
| NS-3.3 | The spine: verbs append → fold → projection → retrieval → back through `orient`; the loop-back is R(t) | build | K, lock | steps 2, 5 | partial | the loop exists over the in-memory fold; SQLite not built |
| NS-3.4 | The author enters from the side: markdown in git; the bridge makes edges and types with author provenance | build | N, lock | §10; step 3 | not built | |
| NS-3.5 | The metamodel is corpus in the same loop | build | H → D.4 | twenty reflections | held | |
| NS-3.6 | Effect is the floor: every external system a Layer with an in-memory implementation | constraint | K, lock | — | holds | `ports.ts`; `memoryEventLog`, `noResonance`, `noCanon`, `noMemoryCompile` |
| NS-3.7 | The Electron band | build | H → D.3 | §19.8 met | held | |
| NS-3.8 | Browser verbs in the verb runtime | build | H → D.1 | turn 2 complete | held | |

## v3 §4 · Data model

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-4.1 | Two graph primitives only; a third is a proposal that stops | constraint | K, lock | — | holds | |
| NS-4.2 | Event-sourced, append-only; same log ⇒ same projection | invariant | K, lock | INV-NS-001 | done | `compounding.test.ts` fold determinism |
| NS-4.3 | Provenance: closed actor grammar, `at`, per-tenant `step`, `causedBy`; agent `because` at the schema | invariant | K, lock | INV-FAB-011 | done | `schema.ts` superRefine; property test |
| NS-4.4 | Session provenance names the model | build | K, lock | step 2 | not built | `agent:<session>` carries no model; → `NEXT_STEP.md` |
| NS-4.5 | Blessed versus proposed is a state; canonical without an author event unrepresentable | invariant | K, lock | INV-FAB-006, INV-NS-005 | done | property test over generated logs |
| NS-4.6 | Local-first; sync is a projection consumer, never on the write path | constraint | K, lock | — | holds | file log; git |
| NS-4.7 | Portable: JSONL per tenant; schema generated and drift-checked; export → import identity | invariant | K, lock | INV-NS-002 | done | `describe --check`; identity through the file adapter |
| NS-4.8 | Per-session append files, merged by `step` at fold time; no CRDT | build | K, lock | INV-NS-009 | not built | today every session appends to `agent.jsonl` |

## v3 §5 · Provenance is capability

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-5.1 | `author:<space>` reaches canonical on arrival | constraint | K, lock | — | holds | |
| NS-5.2 | `runtime` reaches canonical for bookkeeping only, never content | constraint | K, lock | — | holds | |
| NS-5.3 | `agent:<session>` only through a blessing | constraint | K, lock | INV-NS-005 | holds | |
| NS-5.4 | `import:git` only through blessing; commit bodies as `because` | build | K, lock | step 3 | not built | |
| NS-5.5 | `import:browser:<verb>@<url>` only through blessing | build | H → D.1 | — | held | |
| NS-5.6 | `import:transcript` only through blessing | build | K, lock | step 3 (LOCK §4) | not built | |
| NS-5.7 | `import:synthetic` never; confined to `sim:<run>` | invariant | K, lock | INV-NS-003 | done | `quarantine.test.ts`; D-007..D-009 |
| NS-5.8 | `import:tenant:<did>` only through the receiving tenant's blessing or policy *(§28.4)* | build | K, lock | step 8 | not built | |
| NS-5.9 | The gate is one piece of code; proposals visible, never silently promoted; blessing carries `because` | constraint | K, lock | — | partial | one gate; a blessing carries no `because` today (the CLI takes none) |
| NS-5.10 | Un-blessing is an event; history kept | verb | K, lock | v4 §19.5 `unbless` | not built | |
| NS-5.11 | Directive 4 and INV-FAB-001 reconciled; `reflect` first blessed | constraint | K, lock | step 1 | fired | blessed 2026-09-06 |

## v3 §6 · The verb model

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-6.1 | Manifest entry: name, kind (memory · browser · plugin · cli), state (proposed · blessed · deprecated), owning plugin | build | N, lock (no `browser`) | — | partial | name and blessed/retired exist; no `kind`, no `deprecated`, no plugin |
| NS-6.2 | Input and output schemas in the schema of record | constraint | K, lock | — | done | |
| NS-6.3 | Effect program, typed errors, every failure a named reason | constraint | K, lock | — | done | `NoSuchNode`, `NotApplied`, `BaseMoved`, `NotWaiting` |
| NS-6.4 | Receipt: inputs, outputs, provenance, `because`, duration (v4: model) | build | X, lock | step 2 | partial | no duration, no model |
| NS-6.5 | Skill reference on each verb | build | K, lock | §20 | not built | |
| NS-6.6 | Lifecycle: proposal → blessing → deprecation with `because` and successor, never deletion | build | K, lock | — | partial | `verb.retired` exists; no successor, no `because` on it |
| NS-6.7 | Memory verbs: `note`, `reflect`, `orient`, `recall`, `slice`, `bridge`, `patch`, `evaluate`, `bless` | verb | N, lock (+ `unbless`, `describe`, `why`, `trust`, `init`, `doctor`, `log`) | v4 §6 | partial | `reflect` blessed; `slice`, `recall`, `patch`, `bridge`, `pending`, `sync` proposed (D-016, D-017); `note`, `evaluate`, `bless`-as-verb, `why`, `trust`, `unbless` absent |
| NS-6.8 | Browser verbs | verb | H → D.1 | — | held | |
| NS-6.9 | Plugin verbs | verb | N, lock (first plugin) | step 2 | not built | |
| NS-6.10 | Every CLI command is a verb; nothing on the CLI is not a verb | constraint | K, lock | INV-NS-012 | not built | `init`, `bless`, `describe`, `orient` are commands, not verbs |
| NS-6.11 | Derivations from one definition: CLI args, MCP tool, function-calling, RPC, Electron form, skill section | derivation | N, lock (RPC, form → D.3) | §12 | partial | MCP tool and JSON Schema generated; the rest not |

## v3 §7 · Capture

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-7.1 | `note` is capture, `reflect` is reflection; two verbs | verb | K, lock | step 3 | not built | D-005 reopened |
| NS-7.2 | p99 ≤ 16 ms first keystroke → persisted, measured, reported in every capture PR | metric | K, lock | step 3 | not built | |
| NS-7.3 | No cold start on the capture path; a resident process (v4: the daemon) | build | N, lock (daemon) | step 3 | not built | `tsx` cold start 1.3–1.4 s measured (D-005) |
| NS-7.4 | Zero required structure | constraint | K, lock | step 3 | not built | |
| NS-7.5 | Lossless, with timing metadata; no normalization at write | constraint | K, lock | step 3 | not built | |
| NS-7.6 | Body-primary: keyboard-only, voice-in, no cursor-hunting | constraint | K, lock | step 3 | not built | |
| NS-7.7 | Evaluation capture as cheap as primary capture | build | K, lock | step 6 | not built | |

## v3 §8 · Retrieval

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-8.1 | Three axes fused by RRF with documented weights: lexical (FTS5), dense (sqlite-vec or qmd), graph (personalized PageRank) | build | K, lock | step 5 | partial | dense via qmd; mention-substring stands in for lexical; no graph axis; `cut` orders by score then recency, no RRF |
| NS-8.2 | Aliases load-bearing; `alias.proposed` on first miss; proposed aggressively, blessed cheaply | build | K, lock | first-miss trigger | not built | |
| NS-8.3 | Context-conditioned `orient`, top-k with reasons, k ≤ 8 until precision justifies more | build | K, lock | step 2 | partial | `orient` is recency top-8 with a reason; not context-conditioned; Part three §3b: no interior knee |
| NS-8.4 | Every retrieval is an event with context, candidates, ranks, scores, reason | invariant | K, lock | INV-FAB-010 | done | |
| NS-8.5 | Use harvested from conduct: citation/patch; `PostToolUse` file reads as surfaced candidates; explicit "did not help" a first-class miss; author use = blessing, quotation, non-dismissal | build | K, lock | step 2 | partial | citation and patch counted; hook, `missed`, author-use not built; → `NEXT_STEP.md` |
| NS-8.6 | p95 ≤ 100 ms lexical + graph in-process at real size; dense async | metric | K, lock | step 5 | partial | holds at today's 30 events; breach at 1,150–2,800 (D-011) |

## v3 §9 · Projection

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-9.1 | The projection is one SQLite file: FTS5, sqlite-vec, nodes, edges, retrieval log; one transaction per retrieval | build | K, lock | step 5 | not built | |
| NS-9.2 | This dissolves the quadratic fold; the scaling harness confirms before merge | build | K, lock | step 5 | not built | D-011 numbers; D-013 supersedes the persistent-map fix |
| NS-9.3 | Rebuild is drop-and-replay; INV-NS-002 against SQLite | invariant | K, lock | step 5 | not built | |
| NS-9.4 | If the projection lies, delete it; the log is authoritative | constraint | K, lock | — | holds | |
| NS-9.5 | graphology in memory, hydrated from the edge table, disposable | build | K, lock | step 5 | not built | |
| NS-9.6 | The sidecar decision: qmd stays until in-process retrieval matches it on the harness and beats its cold start; a D-series decision | build | K, lock | step 5 | held | the harness exists to make the comparison |

## v3 §10 · The markdown bridge

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-10.1 | Wiki links → typed edges through remark, resolved through aliases; unresolvable → `alias.proposed` or `node.proposed` | build | K, lock | v4 §10; no §23 step | partial | wiki links are `references` edges with author origin at read time in `node/sources.ts` (D-019); typed links, aliases, and `node.proposed` held for their triggers; step 3's doc import is the nearest gate |
| NS-10.2 | Frontmatter → type; unknown field → `type.proposed` with instances | build | K, lock | v4 §11 | not built | |
| NS-10.3 | Bridge events carry author provenance, canonical on arrival | constraint | K, lock | step 3 | holds by design | an author's link is read, not logged, until step 3's import mints the event once (D-019); a session's bridge into its own space is `author:agent` on arrival (D-018) |
| NS-10.4 | Round-trip: agent edits rendered back to markdown into a branch; the PR is the blessing surface for prose; voices separate | build | H → D.5 | a prose work edited by an agent | held | |
| NS-10.5 | The published site is a projection; R(t) on the site at its trigger | build | N, lock (R(t) only) / D.5 (works) | step 10 | held | |
| NS-10.6 | Existing docs are nodes at `init` *(v4 addition from LOCK §2)* | build | X, lock | step 3 | not built | |

## v3 §11 · The metamodel

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-11.1 | A type is a node whose payload is a schema fragment | build | N, lock | D.4 / step 3 | not built | |
| NS-11.2 | Induction at session start: `orient` finds co-occurrence, repeated untyped edges, clusters; the session names the distinction | build | H → D.4 | twenty reflections | held | two reflections today |
| NS-11.3 | A proposal has four parts: distinction, instances, `because`, falsifier | constraint | K, lock | — | practiced | the reconciliations' amendments carry all four |
| NS-11.4 | Nothing built for an unblessed type | constraint | K, lock | — | holds | |
| NS-11.5 | Blessing regenerates: DDL, JSON Schema, arbitraries, forms, docs | build | N, lock | D.4 | not built | |
| NS-11.6 | Acceptance rate tracked; tighten below ~30%, loosen above ~90% | metric | K, lock | `describe` | partial | `compounding.acceptance` over crossings, bridges, and patches; no per-kind, no band |

## v3 §12 · The schema of record

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-12.1 | TypeScript types by `z.infer` | derivation | K, lock | compiler | done | |
| NS-12.2 | Runtime validation by the schema | derivation | K, lock | INV-FAB-011 | done | |
| NS-12.3 | Portable JSON Schema, per-commit diff | derivation | K, lock | `describe --check` | done | `fabric/events.schema.json` |
| NS-12.4 | Ax signatures via Standard Schema | derivation | K, lock (trigger-gated) | step 11 | held | |
| NS-12.5 | MCP tool `inputSchema` generated | derivation | K, lock | — | done | `toolsFrom` |
| NS-12.6 | Function-calling declarations generated | derivation | K, lock | — | not built | |
| NS-12.7 | CLI argument specs from schema (v4: + `--help`, `--json` contracts, snapshot-tested) | derivation | X, lock | v4 §19 | not built | hand-written help today |
| NS-12.8 | RPC contracts main ↔ renderer | derivation | H → D.3 | — | held | |
| NS-12.9 | SQLite DDL and migrations, migration test | derivation | K, lock | step 5 | not built | |
| NS-12.10 | Index configuration from schema annotations, index test | derivation | K, lock | step 5 | not built | |
| NS-12.11 | `fast-check` arbitraries from zod | derivation | K, lock | — | partial | arbitraries hand-written in the tests, not derived |
| NS-12.12 | Electron forms | derivation | H → D.3 | — | held | |
| NS-12.13 | Dashboard enumerations (v4: `describe` enumerations only) | derivation | N, lock | — | done | `describe.vocabularies` |
| NS-12.14 | Skill files' verb sections, drift-checked | derivation | K, lock | §20 | not built | |
| NS-12.15 | `DOMAIN_MODEL.md`, `CONTENT_SCHEMA.md`, event-kind sections of `FABRIC.md` generated; commit fails on disagreement | derivation | K, lock | step 7 | not built | `FABRIC.md` §"Enforced in Code" is hand-written |
| NS-12.16 | External mappings: Tana, Obsidian, JSON-LD | derivation | H → D.6 | a second house | held | |
| NS-12.17 | The metamodel merges into the schema, reflexively | derivation | N, lock | D.4 | not built | |
| NS-12.18 | The schema of record is corpus: history in git, changes in `DECISIONS.md`, a blessed type an event | constraint | K, lock | — | practiced | D-002, D-003 |

## v3 §13 · Evaluation

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-13.1 | `evaluation.recorded`: subject, verdict (confirmed · contradicted · preferred), `because`, counterfactual, by; author canonical, session proposal | kind | K, lock | step 6 | not built | proposed by the first session (Part two §5); admitted by v3 ahead of its trigger |
| NS-13.2 | Every correction Danny gives is written as an author evaluation before anything else | constraint | K, lock | step 6 | not built | the stop hook captures; `fabric evaluate` records |
| NS-13.3 | The retrieval harness is `compounding()`: hit@k, MRR, proactive precision, miss count, series; in CI | metric | K, lock | — | done | proactive precision is synthetic-only today |
| NS-13.4 | The regression gate arms at the first baseline; a lowering change does not merge | build | K, lock | step 5 | partial | armed against `R_sim` (`fabric/sim/baseline.json`); not a CI gate; real data at fifty retrievals |
| NS-13.5 | `patch.outcome` is the fabric's evaluation of itself; graduation its harness | build | K, lock | — | done | Phase 5 |

## v3 §14 · Tension

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-14.1 | Typed: `contradicts`, `succeeds`, and `in-tension-with` once admitted by decision record | build | K, lock | a decision record | partial | slice has `contradicts`, `succeeds`; `in-tension-with` not admitted |
| NS-14.2 | No auto-merge, dedupe, or resolve; the session proposes, the author blesses | constraint | K, lock | — | holds | |
| NS-14.3 | A surfaced node arrives with its live tensions | build | K, lock | step 5 | not built | `slice` returns edges between kept nodes, not tensions as such |

## v3 §15 · Synthetic proof

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-15.1 | Proves plumbing, discrimination, scaling (10²–10⁵; breach in sessions and calendar time) | build | K, lock | step 4 | done | Part three; 10⁵ scoped to arithmetic, → Part three §4 |
| NS-15.2 | Cannot prove usefulness or that citation ⇒ use; said in every report | constraint | K, lock | — | practiced | Part three §0; Part four §E |
| NS-15.3 | The firewall: `import:synthetic` in `sim:<run>` only; `R_sim` never merged | invariant | K, lock | INV-NS-003 | done | `quarantine.test.ts` |
| NS-15.4 | Simulator through the real adapter and fold; planted truth; quality knob; defended model | build | K, lock | step 4 | done | `packages/fabric/src/sim/` |
| NS-15.5 | The baseline, committed | build | K, lock | step 4 | done | `fabric/sim/baseline.json`; `pnpm fabric sim-baseline` |

## v3 §16 · Optimization

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-16.1 | Ax is the optimizer; GEPA, MiPRO, bootstrapping over query rewriting, reranking, alias proposal, induction, verdict prediction | build | K, lock | step 11 | held | |
| NS-16.2 | An optimized program is a proposal with score, window, `because`; blessed; deprecated with a successor | kind | K, lock | step 11 | held | `optimizer.artifact.*` |
| NS-16.3 | Trigger: fifty real retrievals with use signal | trigger | K, lock | — | held | zero real retrievals |
| NS-16.4 | Teacher–student permitted, budgeted, cost-tracked | constraint | K, lock | step 11 | held | |
| NS-16.5 | A tuned module measured against the baseline before proposal; a non-mover recorded as rejected | constraint | K, lock | step 11 | held | |

## v3 §17 · Browser verbs — held whole

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-17.1 | Tesseract's substrate (Playwright over CDP, ARIA perception, locator actions) extracted as verbs | build | H → D.1 | turn 2 complete | held | `agentic-playwright` is the source |
| NS-17.2 | Three skills: `discover` → `crystallize` → `run` | skill | H → D.1 | a routine repeats | held | |
| NS-17.3 | Determinism is the crystallization standard | constraint | H → D.1 | — | held | |
| NS-17.4 | Page facts enter as `import:browser:<verb>@<url>` | build | H → D.1 | — | held | |
| NS-17.5 | The reporting TTY is a Stream, a projection | build | H → D.1 | — | held | |
| NS-17.6 | Verb reuse is R(t) for actions | metric | H → D.1 | — | held | |
| NS-17.7 | Corporate boundary: the CDP codebase stays on the corporate network; only the verb model and schema cross | constraint | H → D.1 | — | holds | |

## v3 §18 · Plugins

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-18.1 | A plugin is a Layer, a manifest fragment, a skill file | build | N, lock | step 2 | not built | the Claude Code integration is the first plugin |
| NS-18.2 | Loading is registration; verbs enter shadow as proposals, blessed individually | constraint | N, lock | step 2 | not built | |
| NS-18.3 | Capability is provenance; a plugin cannot elevate itself | constraint | K, lock | — | holds by design | |
| NS-18.4 | No plugin adds a primitive, a projection of record, or a second decision log | constraint | K, lock | — | holds | |
| NS-18.5 | Namespaced kinds `<plugin>.<kind>`, never `dyer.fabric.*` *(from §28.3)* | constraint | K, lock | step 8 | not built | |
| NS-18.6 | Packaging as a pnpm workspace package; Electron dynamic import | build | N, lock / D.3 | — | partial | the fabric is a workspace package; no plugin loading |
| NS-18.7 | Further plugins beyond the first | build | H → D.2 | first plugin blessed and measured | held | |

## v3 §19 · Surfaces

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-19.1 | CLI: every verb, generated from the schema, the honest floor (v4 §19: the full specification — grammar, thin client, budgets, exit codes, agent's day, operator's minute, setup, standards, success criteria) | build | R, lock | v4 §19; steps 3, 7 | partial | a CLI exists; none of §19's contracts, budgets, or generated help |
| NS-19.2 | Hooks: start → `orient` with R(t); `PostToolUse` → file reads; stop → `reflect` | build | K, lock | step 2 | partial | start and stop hooks exist; `PostToolUse` not |
| NS-19.3 | Electron: main hosts the runtime and capture; renderer stateless over `@effect/rpc`; CodeMirror, xterm, charts as folds; built last | build | H → D.3 | §19.8 met | held | |
| NS-19.4 | The published site: a static projection of blessed works and, on trigger, the number | build | N, lock (number) / D.5 (works) | step 10 | held | |

## v3 §20 · The skill tree

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-20.1 | `orient` root: reads the foyer, prints R(t), loads the named branch | skill | K, lock | — | partial | prints R(t); no branch loading |
| NS-20.2 | memory / reflecting (`reflect`) | skill | K, lock | step 1 | done | blessed |
| NS-20.3 | memory / recalling (`recall`, `slice`) | skill | K, lock | — | partial | verbs proposed, unblessed; no skill file |
| NS-20.4 | memory / bridging (`bridge`, `patch`) | skill | K, lock | after recall | partial | `bridge` and `patch` verbs exist, unblessed; no skill file |
| NS-20.5 | memory / evaluating (`evaluate`) | skill | K, lock | first correction | not built | |
| NS-20.6 | corpus / writing-prose, writing-specs | skill | K, lock | — | done | `.claude/skills/` |
| NS-20.7 | corpus / alias-proposing | skill | K, lock | first miss | not built | |
| NS-20.8 | corpus / schema-inducing | skill | H → D.4 | twenty reflections | held | |
| NS-20.9 | browser / discovering, crystallizing, running | skill | H → D.1 | — | held | |
| NS-20.10 | engineering / coding, auditing, architecting | skill | K, lock | — | done | `.claude/skills/` |
| NS-20.11 | engineering / benching (latency, `R_sim`) | skill | K, lock | — | partial | the harness exists; no skill file |
| NS-20.12 | meta / reconciling (charter ↔ fabric) | skill | K, lock | every version | practiced | four reconciliations; no skill file |
| NS-20.13 | meta / skill-authoring (`skill.proposed`) | skill | K, lock | — | not built | |
| NS-20.14 | meta / optimizing (Ax) | skill | K, lock | fifty retrievals | held | |
| NS-20.15 | The tree is corpus: a skill is a node; a new branch is a proposal | constraint | K, lock | — | partial | skills are canon nodes a patch may change (Phase 5); a branch is not yet a proposal |

## v3 §21 · Engineering standard

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-21.1 | TypeScript strict, no `any`; Effect for programs | constraint | K, lock | — | holds | |
| NS-21.2 | Property tests always green: NS-001, -002, -003; FAB-006, -011, -010 (v4 adds NS-009) | invariant | X, lock | CI | done | all but NS-009 |
| NS-21.3 | Every PR states loop, measurement, `because` | constraint | K, lock | — | practiced | PR #68, #69, #70 |
| NS-21.4 | `DECISIONS.md` is the one decision log | constraint | K, lock | — | done | D-001..D-015 |
| NS-21.5 | No new dependency without justification and removal cost | constraint | K, lock | — | practiced | D-004 |
| NS-21.6 | Generated artifacts never hand-edited | constraint | K, lock | INV-NS-004 | holds | three artifacts; `.prettierignore` guards them |
| NS-21.7 | Bench before merge on fold, projection, retrieval, capture (v4: + CLI budgets and contracts) | constraint | X, lock | — | partial | the harness exists; not a merge gate |
| NS-21.8 | Process boundaries measured: a sidecar or IPC hop pays for itself or is folded in | constraint | K, lock | step 3 (daemon) | holds | the qmd sidecar is the case in point (NS-9.6) |

## v3 §22 · Metrics

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-22.1 | R(t) by session | metric | K, lock | `orient`, `describe`, README, site | done | 0 of 0 |
| NS-22.2 | dR/dt per-session series | metric | K, lock | `describe --history` | done | `compounding.series` |
| NS-22.3 | hit@k, MRR | metric | K, lock | CI | done | |
| NS-22.4 | Proactive precision, governs k | metric | K, lock | `describe` | partial | synthetic sweep only (Part three §3b) |
| NS-22.5 | Miss count: citations of nothing surfaced; explicit "did not help" | metric | K, lock | `describe` | partial | the first half; `missed` explicit not built |
| NS-22.6 | Proposal acceptance by kind | metric | K, lock | `describe` | partial | not by kind |
| NS-22.7 | Capture p99 | metric | K, lock | every capture PR | not built | |
| NS-22.8 | Retrieval p95 | metric | K, lock | every retrieval PR | partial | measured ad hoc (D-006, D-011) |
| NS-22.9 | Fold p95 by N | metric | K, lock | every fold PR | partial | D-011; not in CI |
| NS-22.10 | Verb reuse | metric | H → D.1 | — | held | |
| NS-22.11 | `R_sim`, never merged | metric | K, lock | benching | done | |
| NS-22.12 | Effect Metric and Tracer; OpenTelemetry at a second reader | build | K, lock | a second reader | held | |
| NS-22.13 | Correction-repeat rate, time-to-context, drift failures caught *(v4 new)* | metric | X, lock | step 6, step 7 | not built | LOCK §6 |

## v3 §23 · Build order, v3's fourteen steps mapped to v4's eleven

| ID | v3 step | v3 gate to finish | v4 step | Status | Note |
|---|---|---|---|---|---|
| NS-23.1 | 1 Bless `reflect`; one reflection; one citation | real R(t) = 1 | 1 | partial | two of three; the citation is the next session's |
| NS-23.2 | 2 Harvest hooks: file reads; `import:git`; model on receipts | use signal in the log | 2 (+ git to 3) | not built | → `NEXT_STEP.md` |
| NS-23.3 | 3 `note` in a resident process | capture p99 ≤ 16 ms | 3 | not built | |
| NS-23.4 | 4 Synthetic proof | firewall; discrimination; breach | 4 | done | out of order, by its own gate |
| NS-23.5 | 5 SQLite projection; graphology; RRF | identity on SQLite; p95 at 10⁴ | 5 | not built | trigger not met (D-013) |
| NS-23.6 | 6 Markdown bridge | first author edge from markdown | no explicit v4 step | partial | the first author edge from markdown exists at read time (D-019); events and types wait for step 3 |
| NS-23.7 | 7 `evaluation.recorded`; first correction | first author evaluation canonical | 6 | not built | |
| NS-23.8 | 8 Metamodel loop | first blessed type regenerates | held D.4 | held | |
| NS-23.9 | 9 Generated docs with drift; MCP and arbitraries from schema | commit fails on drift | 7 | partial | three artifacts drift-checked |
| NS-23.10 | 10 Tesseract verbs | first crystallized verb reused | held D.1 | held | |
| NS-23.11 | 11 Plugin packaging | first plugin's verbs blessed | held D.2 (beyond the first) | held | |
| NS-23.12 | 12 Ax reranking | artifact beats baseline | 11 | held | |
| NS-23.13 | 13 Electron surface | renderer stateless; capture p99 in app | held D.3 | held | |
| NS-23.14 | 14 Publish R(t) on the site | the site is a projection | 10 | held | |
| NS-23.15 | *(v4 adds)* 8 Second tenant; DIDs; signing; `import:tenant`; trust policy | first cross-repo citation | 8 | not built | from §28 and LOCK turn 2; gated on step 6's number |
| NS-23.16 | *(v4 adds)* 9 `fabric init` on a dev lead's repo | correction-repeat rate on a team | 9 | not built | LOCK turn 3 |
| NS-23.17 | Steps proceed in parallel where gates allow; no step starts because it is interesting | — | all | practiced | K, lock; a constraint on the order, not a step of it |

## v3 §24–§27 · Definition of done, session protocol, what not to build, posture

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-24.1 | Six done questions (v4: seven, adding the CLI path) answered with evidence; a "no" said first | constraint | X, lock | every deliverable | practiced | Part three §6, Part four §E |
| NS-25.1 | Start: read `orient`, cite what you use | constraint | K, lock | — | practiced | |
| NS-25.2 | Every decision a `because` in `DECISIONS.md`; every rejected approach recorded | constraint | K, lock | — | practiced | |
| NS-25.3 | Every correction an author evaluation first | constraint | K, lock | step 6 | not built | no evaluation kind yet |
| NS-25.4 | Every tension a relation, never resolved by the session | constraint | K, lock | — | practiced | the `bridge` collision was held until Danny's word settled it (D-016) |
| NS-25.5 | Every proposal: instances, `because`, falsifier | constraint | K, lock | — | practiced | |
| NS-25.6 | End: a session record through `reflect`, naming the model | constraint | K, lock | — | done | two reflections; the model named in the second's record |
| NS-26.1 | No CRDT or sync framework | constraint | K, lock | — | holds | |
| NS-26.2 | No vector database server | constraint | K, lock | — | holds | |
| NS-26.3 | No ORM | constraint | K, lock | — | holds | |
| NS-26.4 | No renderer state managers | constraint | K, lock (v4 drops the line with Electron) | — | holds | |
| NS-26.5 | No agent orchestration frameworks | constraint | K, lock | INV-NS-011 | holds | |
| NS-26.6 | No capture surface that requires a cold start | constraint | K, lock | — | holds | none exists |
| NS-26.7 | No second decision log, second node name, second primitive, second way | constraint | K, lock | — | holds | |
| NS-26.8 | Nothing whose effect on retrieval-and-use is not measured | constraint | K, lock | — | practiced | |
| NS-26.9 | No GUI before §19.8; no prompt without a flag; no `--json` that is not a contract *(v4 new)* | constraint | X, lock | — | holds | |
| NS-27.1 | Push back on scope; prefer the deep cut; prefer the honest result | constraint | K, lock | — | practiced | |
| NS-27.2 | Disagree with a reason and an amendment; the document changes only by a new version Danny gives | constraint | K, lock | — | practiced | four reconciliations |

## v3 Appendix A · Event kinds

| ID | Kind | Type | v4 | Status | Note |
|---|---|---|---|---|---|
| NS-A.1 | `space.*`, `verb.*`, `source.*` bookkeeping | kind | K, lock | done | `space.opened`, `verb.proposed/blessed/retired`, `source.proposed/blessed` |
| NS-A.2 | `receipt` | kind | K, lock | done | named `verb.called` in the code; `verb.refused` beside it |
| NS-A.3 | `note.captured` | kind | K, lock | not built | proposed kind |
| NS-A.4 | `reflection.recorded` | kind | K, lock | done | |
| NS-A.5 | `bridge.proposed` / `bridge.decided` | kind | K, lock | done | `bridge.proposed` / `bridge.resolved` for the relation (D-016); `crossing.proposed` / `crossing.resolved` for the carry-across |
| NS-A.6 | `patch.proposed` / `.decided` / `.outcome` | kind | K, lock | done | `.resolved`, plus `.evaluated` (the fabric's own checks) |
| NS-A.7 | `retrieval.surfaced` | kind | K, lock | done | |
| NS-A.8 | `retrieval.used` / `retrieval.missed` *(v4 new)* | kind | X, lock | not built | step 2 |
| NS-A.9 | `alias.proposed` / `.decided` | kind | K, lock | not built | |
| NS-A.10 | `type.proposed` / `.decided` | kind | N, lock | not built | |
| NS-A.11 | `evaluation.recorded` | kind | K, lock | not built | step 6 |
| NS-A.12 | `browser.action` | kind | H → D.1 | held | |
| NS-A.13 | `verb.proposed` / `.decided` / `.deprecated` | kind | K, lock | partial | `.proposed`, `.blessed`, `.retired`; no `.deprecated` with successor |
| NS-A.14 | `optimizer.artifact.proposed` / `.decided` | kind | K, lock | held | |
| NS-A.15 | `import.*` (git, transcript, browser, synthetic) | kind | N, lock (browser → D.1) | partial | `import:synthetic` as an actor, not a kind; no import events |
| NS-A.16 | `blessing` / `unblessing` | kind | K, lock | partial | blessing is `*.blessed` / `*.resolved`; no unblessing |
| NS-A.17 | `reference.cited` *(in the code, not in the North Star)* | kind | — | done | the weak reference across a wall (INV-FAB-004); a kind the North Star does not name |
| NS-A.18 | Proposed kinds enter the schema only by decision record and blessing | constraint | K, lock | holds | |

## v3 Appendix B · Invariants

*The registry with what holds each is `INVARIANTS.md`.*

| ID | Invariant | v4 | Status | Held by |
|---|---|---|---|---|
| NS-B.1 | INV-FAB-001 | K, lock | done | `invariants.ts`; `fabric.test.ts` |
| NS-B.2 | INV-FAB-006 | K, lock | done | `compounding.test.ts` property |
| NS-B.3 | INV-FAB-010 | K, lock | done | `invariants.ts`; `compounding.test.ts` |
| NS-B.4 | INV-FAB-011 | K, lock | done | `schema.ts` refinement; property test |
| NS-B.5 | INV-NS-001 | K, lock | done | `compounding.test.ts` fold determinism |
| NS-B.6 | INV-NS-002 | K, lock | done | `compounding.test.ts`; `quarantine.test.ts` |
| NS-B.7 | INV-NS-003 | K, lock | done | `quarantine.test.ts` |
| NS-B.8 | INV-NS-004 | K, lock | partial | `describe --check` for three artifacts |
| NS-B.9 | INV-NS-005 | K, lock | done | `compounding.test.ts` |

## v3 Appendix C · Triggers

| ID | Trigger | Unlocks | v4 | Status |
|---|---|---|---|---|
| NS-C.1 | `pnpm fabric bless reflect` | everything | K, lock | fired 2026-09-06 |
| NS-C.2 | first real citation of a prior session's node | R(t) = 1 | K, lock | not fired |
| NS-C.3 | first `recall` miss on the author's own word | `alias.proposed` | K, lock | not fired |
| NS-C.4 | first correction recorded through the fabric | `evaluation.recorded` canonical | K, lock | not fired |
| NS-C.5 | twenty reflections in the operator's projection | schema induction | H → D.4 | not fired (two) |
| NS-C.6 | fifty real retrievals with use signal | Ax; gate on real data | K, lock | not fired (zero) |
| NS-C.7 | fold breach within a year of real cadence | SQLite now | K, lock | not fired (D-011: over a year) |
| NS-C.8 | a browser routine that repeats | crystallize | H → D.1 | not fired |
| NS-C.9 | a number worth publishing | R(t) on the site | K, lock | not fired |
| NS-C.10 | a second reader of traces | OpenTelemetry | K, lock | not fired |
| NS-C.11 | capture, retrieval, evaluation measured in a resident process | Electron | H → D.3 | not fired |
| NS-C.12 | a correction-repeat number on tenant zero *(v4 new)* | step 8 | X, lock | not fired |
| NS-C.13 | a stranger's `fabric init` inside ten minutes *(v4 new)* | turn 3 | X, lock | not fired |

---

## §28 (v3.2) · Multi-tenancy, epistemic networking, the stack

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| NS-28.1 | Canonicality is per tenant; a crossing fact is always an import until that tenant admits it | constraint | K, lock | INV-NS-007 | holds vacuously | one tenant today |
| NS-28.2 | Every tenant a keypair as a DID (`did:key`; `did:plc`/`did:web` if federated); agents and sims are tenants | build | K, lock | step 8 | not built | |
| NS-28.3 | Every event signed; `actor` carries the DID | invariant | K, lock | INV-NS-006 | not built | the grammar already admits `@did` (Part four §C) |
| NS-28.4 | Addressing `fabric://<did>/<collection>/<rkey>`; identity is the address | build | K, lock | step 8 | not built | |
| NS-28.5 | Key custody local; rotation an event `key.rotated` chained | build | K, lock | step 8 | not built | |
| NS-28.6 | Namespaced kinds `dyer.fabric.*`; the schema of record is the registry | build | K, lock | step 8 | not built | today's kinds are bare (`reflection.recorded`); a rename is a migration |
| NS-28.7 | Plugins declare in their own namespace, never `dyer.fabric.*` | constraint | K, lock | step 8 | not built | |
| NS-28.8 | Another tenant's kind readable by namespace; adoption is a `type.proposed` | build | K, lock | step 8 | not built | |
| NS-28.9 | Kinds carry versions; old events fold under the version they were written in | build | K, lock | step 8 | not built | Cambria is the conceptual reference (Part four §D.6) |
| NS-28.10 | `import:tenant:<did>` row in the provenance table | constraint | K, lock | step 8 | not built | |
| NS-28.11 | Trust is a policy, a blessed `trust.policy` node, per source per kind; absent policy, everything foreign held | build | K, lock | step 8; `fabric trust` | not built | |
| NS-28.12 | A foreign claim's source blessing is evidence, not authority | invariant | K, lock | INV-NS-007 | not built | |
| NS-28.13 | Contradiction across tenants is a `contradicts` edge across addresses | build | K, lock | step 8 | not built | |
| NS-28.14 | Retrieval spans subscribed tenants; foreign candidates marked; R(t) per source | build | K, lock | step 8 | not built | |
| NS-28.15 | A specialized agent is a tenant: own log, projections, key, scoped manifest; not a space in the operator's tenant | build | N, lock | step 8 | partial | the sovereignty half holds (D-018): the agent's space answers at once, a bridge into it blessed by `author:agent`; own log directory, key, and scoped manifest are step 8 |
| NS-28.16 | Capability delegated, attenuated, signed: verbs, spaces, kinds, expiry, budget; grants only narrow | invariant | N, lock | INV-NS-008 | not built | |
| NS-28.17 | Minimal signed grant first; UCAN at a second issuer | build | N, lock / D.7 | a second issuer | held | |
| NS-28.18 | The grant is an event in both logs (`capability.granted` / `.revoked`); the delegation graph a projection | kind | K, lock | step 8 | not built | |
| NS-28.19 | An agent's verbs run under its own DID; its events cross as `import:tenant` proposals | build | K, lock | step 8 | not built | directive 4 satisfied literally |
| NS-28.20 | Specialization is a manifest and a corpus, not a fork | constraint | K, lock | — | holds by design | |
| NS-28.21 | Compounding measured per agent tenant | metric | K, lock | step 8 | not built | |
| NS-28.22 | Subscription by kind from a DID; locally a Layer over another log directory; folds into shadow | build | N, lock | step 8 | not built | |
| NS-28.23 | One event Stream feeds TTY, dashboard, subscribers; subscription is a filter | build | N, lock | — | not built | no Stream today |
| NS-28.24 | Replay from last `(did, step)`; nothing pushed that is not persisted | constraint | K, lock | — | not built | |
| NS-28.25 | Network relay | build | H → D.8 | subscribers on other machines | held | |
| NS-28.26 | Each tenant has its own deployment architecture; the actor is the same code local or deployed | constraint | H → D.8 (deployed) | — | held | |
| NS-28.27 | Source of truth: the tenant's signed log, never a projection, cache, gateway log, or replica | constraint | K, lock | — | holds | unsigned today |
| NS-28.28 | Write path never depends on the network; disconnected writers append their own file, merged by `step` | invariant | K, lock | INV-NS-009 | not built | |
| NS-28.29 | Canonicality per tenant, local and deployed alike | constraint | K, lock | INV-NS-007 | holds vacuously | |
| NS-28.30 | Identity and signing: the DID is the tenant wherever it runs; keys never shared | constraint | K, lock | INV-NS-006 | not built | |
| NS-28.31 | Provenance and `because` everywhere, whatever model or place ran it | constraint | K, lock | INV-FAB-011 | holds | |
| NS-28.32 | Any projection can be dropped and replayed, never repaired in place | constraint | K, lock | — | holds | |
| NS-28.33 | Surfaces are stateless: panel, phone, Electron, CLI | constraint | K, lock | — | holds | |
| NS-28.34 | Compounding measured everywhere, one `compounding()` per tenant | constraint | K, lock | — | holds | |
| NS-28.35 | Deployment per tenant by trigger; nothing deploys because it can; the site has no production runtime | constraint | K, lock | — | holds | |
| NS-28.36 | Stack row: tenant actor — in-process actor / Durable Object | build | H → D.8 | reachable from more than one machine | held | local: no actor; appends serialize through a semaphore |
| NS-28.37 | Stack row: log — filesystem, git / DO storage mirrored to R2 | build | H → D.8 | off-machine durability | partial | local built |
| NS-28.38 | Stack row: projection — one SQLite file / DO SQLite, D1 for a shared AppView | build | K, lock / D.8 | step 5 | not built | |
| NS-28.39 | Stack row: dense axis — sqlite-vec / Vectorize | build | K, lock / D.8 | step 5 | partial | qmd stands in |
| NS-28.40 | Stack row: event stream — Effect Stream / Queues | build | N, lock / D.8 | — | not built | |
| NS-28.41 | Stack row: verb runtime — resident process / Workers | build | N, lock (daemon) / D.8 | step 3 | not built | |
| NS-28.42 | Stack row: durable verbs — checkpoint events / Workflows | build | H → D.9 | a verb that must outlive a process | held | |
| NS-28.43 | Stack row: inference — local or API per tier / Workers AI, AI Gateway | build | H → D.10 | a verb whose model must run at the edge | held | the session is the only reasoner today |
| NS-28.44 | Stack row: reachability — loopback / Tunnel and Access | build | H → D.8 | a surface on another device | held | |
| NS-28.45 | Stack row: archive — git / R2 | build | K / D.8 | off-machine durability | partial | git |
| NS-28.46 | A deployed tenant end to end | build | H → D.8 | — | held | |
| NS-28.47 | Inference tiers: edge, judgment, author-facing; the model on the receipt; teacher–student; AI Gateway is telemetry (INV-NS-010); no tier by cost alone (`tier.decided`) | build | H → D.10 | — | held | INV-NS-010 holds vacuously |
| NS-28.48 | Reachability: Tunnel exposes the local actor; Access is not fabric identity; the write path does not depend on the tunnel | build | H → D.8 | a surface on another device | held | |
| NS-28.49 | Orchestration is a projection: delegation graph, execution trace, orchestrating agent as a granting tenant, durable verbs, Effect's parallelism, subagents inside a verb | constraint | K, lock | INV-NS-011 | partial | no framework entered; hooks and CLI commands are not receipts yet |
| NS-28.50 | Federation held: ATProto semantics now, the wire at a second operator off-machine | build | H → D.8 | a second operator off-machine | held | |
| NS-28.51 | INV-NS-006..011 added | invariant | K, lock | `INVARIANTS.md` | not built (006–009, 011); holds vacuously (010) | |
| NS-28.52 | What §28 does not change: two primitives; one schema; one gate; directive 12; the write path; no production runtime | constraint | K, lock | — | holds | |

---

## THE LOCK

| ID | Unit | Type | v4 | Where | Status | Note |
|---|---|---|---|---|---|---|
| LOCK-0.1 | A memory and provenance layer for coding agents; the building repository is the first customer; its R(t) is the proof | constraint | lock | — | holds | |
| LOCK-1.1 | The problem: every session starts at zero; corrections lost; spec drift unnoticed; reasons in scrolled-away threads | req | lock | — | holds | the reason the product exists |
| LOCK-1.2 | The promise: install once; next session oriented; corrections durable; decisions keep reasons; drift fails the commit; a number | req | lock | steps 2, 3, 6, 7 | not built | |
| LOCK-1.3 | The ten-minute path: `npx fabric init` / `describe` / `bless <id>` | build | lock | step 3; v4 §19.6 | not built | `pnpm fabric` exists in-repo; no `npx`, no `init` that imports |
| LOCK-1.4 | The aha in the second session: an unprompted citation that was right; R(t) 0 → 1 | trigger | lock | step 1 | not fired | the next session's first act |
| LOCK-2.1 | Git history as corpus: `import:git` events from commit bodies | build | lock | step 3 | not built | |
| LOCK-2.2 | Existing docs as nodes: parsed, linked, aliased at `init` | build | lock | step 3 | not built | |
| LOCK-2.3 | Existing hooks and skills inventoried as proposed verbs | build | lock | step 3 | not built | |
| LOCK-2.4 | A year of history is a corpus on minute one; first `orient` non-empty | req | lock | step 3 | not built | |
| LOCK-3.1 | Turn 1, self-hosting: `website` is tenant zero; every session runs `orient`, cites, reflects, is measured; the reconciliation pattern is the first feature | build | lock | steps 1–7 | partial | in progress; R(t) not yet off zero |
| LOCK-3.2 | Turn 2, second tenant: `cathedrals` and Tesseract; cross-repo retrieval; per-source R(t) | build | lock | step 8 | not built | |
| LOCK-3.3 | Turn 3, one team: dev leads on their own repos, tenants, keys; correction-repeat on a team | build | lock | step 9 | not built | |
| LOCK-3.4 | Turn 4, the public number: the site publishes tenant zero's R(t) live | build | lock | step 10 | not built | |
| LOCK-3.5 | Turn 5, the product improves the product: Ax reranker shipped to every tenant | build | lock | step 11 | held | |
| LOCK-3.6 | Each turn feeds the previous | constraint | lock | — | holds | |
| LOCK-4.1 | In: the spine; the eight coding verbs; the three hooks; git and transcript import; corrections as evaluations; `DECISIONS.md` and generated docs; aliases on miss; the instrument and its baseline; multi-tenant semantics at turn 2; the CLI as the only surface | constraint | lock | §23 | partial | the instrument and its baseline are in; the rest scheduled |
| LOCK-4.2 | Held: Electron; browser verbs; further plugins; Cloudflare deployment; federation, UCAN, Workers AI; Ax | constraint | lock → D.1, D.2, D.3, D.7, D.8, D.10 | their triggers | held | |
| LOCK-4.3 | Cut for now, on the record: the metamodel loop beyond frontmatter → type; the markdown round-trip for prose | constraint | lock → D.4, D.5 | their triggers | cut | |
| LOCK-5.1 | The user's loop: install, work, correct, bless, read the number; the product asks for a minute of blessing | req | lock | steps 2, 3, 6 | partial | bless exists; the rest not |
| LOCK-5.2 | Dismissal is a miss, recorded | build | lock | step 2 | not built | `retrieval.missed` |
| LOCK-6.1 | Metrics the developer and the product share: R(t), correction-repeat, time-to-context, proposal acceptance, drift failures caught, miss count; every one a projection; no analytics pipeline | metric | lock | `describe` | partial | R(t), acceptance, miss count; the three new ones not |
| LOCK-7.1 | The lock's eleven steps | build | lock (= v4 §23) | — | see NS-23.* | |
| LOCK-7.2 | Steps 1–3 are days; 4 the honest week; 5–7 the product; the rest the flywheel | constraint | lock | — | practiced | step 4 took the day it was asked |
| LOCK-8.1 | Week 1: steps 1–3; R(t) = 1 by day two or learn why; `init` on a fresh clone | build | lock | — | partial | day one: step 1 two of three |
| LOCK-8.2 | Week 2: step 4 in numbers in `DECISIONS.md` | build | lock | — | done | D-010, D-011, done in week 1 |
| LOCK-8.3 | Week 3: steps 5–6; SQLite; correction-repeat on `describe` | build | lock | — | not built | |
| LOCK-8.4 | Week 4: step 7; step 8 begun; cathedrals a tenant; one dev lead has seen `describe` | build | lock | — | not built | |
| LOCK-8.5 | Day thirty: has R(t) on tenant zero risen three consecutive weeks? | trigger | lock | — | not fired | |
| LOCK-9.1 | Risk, citation inflation; guard: file-read hook, citation-of-nothing a miss, explicit did-not-help; R(t) from conduct | constraint | lock | step 2 | partial | the miss half exists |
| LOCK-9.2 | Risk, dogfooding bias; guard: `init` on a stranger's clone, timed | constraint | lock | step 9 | not built | |
| LOCK-9.3 | Risk, the container ahead of the loop; guard: step 8 waits for step 6's number | constraint | lock | — | holds | |
| LOCK-9.4 | Risk, cold start for teams; guard: git import; `R_sim` demo labeled, never merged | constraint | lock | step 3 | partial | `R_sim` exists; import not |
| LOCK-9.5 | Risk, the gate as friction; the filter, not a bug; the gate is not lowered | constraint | lock | — | holds | |
| LOCK-10.1 | The product's name is held; a proposal Danny blesses; not from a session; not before turn 3 | constraint | lock | turn 3 | held | the substrate is "the fabric" |
| LOCK-11.1 | The lock is done when tenant zero's `describe` prints a non-zero R(t) a stranger's clone reproduces from the log | trigger | lock | — | not fired | |

---

## What the backlog says, read whole

Three things stand out once every row is on one page. **First, the house is ahead of the lock's order in one place and behind it everywhere else:** step 4 is done in full, step 1 waits on a citation only a new session can make, and steps 2, 3, and 5 through 11 are unbuilt — which is the right shape, because step 4 was the proof that the number would mean something when it moved. **Second, the constraints hold far better than the builds:** of the rows marked `holds` or `practiced`, almost none needed code; they are the house's posture, and the posture is intact. **Third, the collisions are few and named:** `bridge` (NS-2.19), the missing bridge step in v4 §23 (NS-23.6), the receipt's growth (NS-2.14, NS-6.4), and the agent-as-space today versus agent-as-tenant in v3.2 (NS-28.15). Each is Danny's to settle, and each is written here so that no session settles it by accident.
