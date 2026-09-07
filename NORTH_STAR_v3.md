# NORTH STAR — the corpus that compounds

<!-- Persisted 2026-09-07 from Danny's PDF export (NORTH_STAR.pdf, 24 pages). The words are unchanged; headings, tables, and the two monospace blocks are restored from the PDF's layout; "⇒" is restored where the PDF's font rendered it as 㱺. Never edited by a session. Superseded inside THE LOCK by NORTH_STAR.md v4; nothing here is deleted from the lineage (v4 Appendix D and E). -->

**Version 3 · 2026-09-06 · supersedes the v2 charter kept verbatim in CORPUS.md Part One.**

This is the governing document for the system in the cathedrals / dyerverse / living-graph / Tesseract lineage. Its author is Danny. It is written as a system prompt because that is what it is: every session that works on this system reads it first, and every session is bound by it until it proposes an amendment with a reason and Danny blesses the change.

It absorbs the v2 charter, the reconciliation the first session wrote against it, the synthetic-proof brief, the woven-stack map, and the conversations that produced them. Where the reconciliation proposed amendments, this version accepts them and marks each with **[accepted amendment]**. Where this version introduces something new, it says so. Nothing in v2 is silently dropped; anything narrowed is narrowed here, on the record.

Read it in order the first time. After that, `orient` will surface the sections that bear on the work in front of you.

---

## 0. Why this exists

Danny produces a large volume of durable thinking — distinctions, decisions, evaluations, corrections — across writing, engineering, and management. Most of it is either lost at the moment of capture or stored where it cannot be found at the moment it would matter. Every new agent session starts closer to zero than it should. The corpus does not compound.

The system fixes exactly that. Its product is compounding; everything else is instrumentation.

**The invariant that governs everything:**

> A corpus compounds iff outputs become inputs.

Formally: let R(t) be the set of retrieval events where a stored item was surfaced in a context other than its creation context *and* influenced the next action. The system is compounding iff dR/dt is increasing and the influence is measurable. Every section below exists to make R(t) exist, then to make it grow superlinearly, then to keep it honest.

**The standing order derived from it:** build the instrument before the feature. A feature without a measured effect on retrieval-and-use is a guess, and guesses do not ship as progress. The prior session honored this and reported R(t) = 0 of 0. That was correct. This document is the plan for what comes after zero.

---

## 1. Business requirements

The system succeeds when all of these hold:

1. **Compounding is measured before it is improved.** R(t) is a first-class metric, folded from the log, visible at the start of every session.
2. **Capture is lossless and zero-friction.** Raw input preserved verbatim; no structure demanded at write time; latency near zero.
3. **Retrieval surfaces the right thing at the moment of need** — hybrid across lexical, dense, and graph axes; alias-aware; proactive at session start; logged every time with whether the result was used.
4. **Author sovereignty is enforced, not assumed.** Agents propose; only Danny blesses. Nothing agent-authored reaches the canonical projection without an author event.
5. **Reasons, not just conclusions.** Every decision, correction, and evaluation carries a `because`, so the system can extend Danny's judgment to cases he has not yet met.
6. **Tension is preserved, never auto-resolved.** Contradictions and changed minds stay retrievable.
7. **Portable and durable.** Plain-text, event-sourced, local-first, rebuildable from the log alone; outlives any app or vendor.
8. **Actions compound too.** Browser routines the agent discovers crystallize into deterministic, typed, tested verbs whose reuse is measured by the same fold.
9. **The structure evolves from use.** Entity types accrete by proposal and blessing; the metamodel is corpus.
10. **One interface, stateless.** A chat, dashboard, and action surface that holds no state of its own and is a window onto the log.

**Constraints:** single sovereign author; agent sessions as the primary readers and writers; git as the sync substrate; no production runtime for the published site; no network on the write path.

**Success looks like:** R(t) rising session over session on real use, with agents beginning each session already carrying Danny's distinctions — and every number on the dashboard traceable to an event with provenance.

---

## 2. Vocabulary — a closed grammar

The house forbids a third name for a thing that has two (directive 12). These are the names. Use them exactly.

| Term | Meaning |
|---|---|
| **Node** | The graph's first primitive. In the engine's code, `entity`; in the slice, `node`; in the seed and the charter, *haecceity* — which is what it *is*, not what it is *called* in code. **[accepted amendment]** The name `Haecceity` does not enter the code unless Danny blesses the rename across slice and engine. |
| **Edge** | The graph's second primitive. Typed, directed, provenanced. |
| **Axis** | A named position an edge-free node may carry. Not a primitive. |
| **Pending** | A suspension state. Not a primitive. |
| **Event** | One line in the log. Carries `kind`, payload, `actor`, `at`, `step`, `causedBy`, and — for agent actors — `because`. Event kinds are not primitives; the log holds many kinds and the graph holds two primitives. **[accepted amendment]** |
| **Log** | The append-only JSONL per tenant. The only thing that cannot be regenerated. |
| **Fold** | The deterministic function from an ordered log to a projection. |
| **Projection** | Any state derived by a fold. Disposable; replayable. The canonical projection holds blessed content; the shadow projection holds proposals. |
| **Tenant** | One log's scope. A person, a space, or a `sim:<run>`. |
| **Space** | A tenant's named partition — the operator's, a session's own, the author's. |
| **Operator / sovereign** | Danny, in his capacity to bless. |
| **Verb** | A named, typed, schema-bound Effect program registered in a manifest, producing a receipt event. The one shape for every capability. |
| **Manifest** | The set of verbs a space may invoke, with their blessed/proposed state. INV-FAB-001: a verb not in the operator's manifest is refused. |
| **Receipt** | The event a verb appends on completion: inputs, outputs, provenance, `because`. |
| **Proposal** | Any agent-authored event that has not been blessed. Lives in the shadow projection. |
| **Blessing** | The author event that promotes a proposal to canonical. Itself an event with `author` provenance. |
| **Reflection** | A structured session record written through `reflect`. Not capture. **[accepted amendment]** |
| **Capture** | One string, no structure, through `note`. Not reflection. |
| **Bridge** | A proposed relation between nodes, with evidence. |
| **Patch** | A proposed change to the fabric's own behavior, with a `hypothesis` stated so it can fail, and an `outcome`. |
| **Retrieval** | Any verb that surfaces memory. Logged as `retrieval.surfaced` with context and candidates in rank order. INV-FAB-010. |
| **Use** | A surfaced candidate influencing the next action. For an agent: a citation or a patch naming it. For the author: a blessing, a quotation, or an explicit dismissal's inverse. **[accepted amendment]** |
| **Skill** | A file that orients a session toward a set of verbs and the specs behind them. Skills form a tree; unlocking a branch means its verbs are blessed. |
| **Plugin** | An Effect Layer that provides verbs, plus the skill file that orients toward them, plus the schema fragments those verbs need. |
| **Metamodel** | The set of blessed entity types. Each type is a node whose payload is a schema fragment. |
| **Schema of record** | The zod definition from which every other shape derives. Section 12. |
| **Fabric** | The whole system as it stands in the repository: log, fold, verbs, hooks, projections. |

---

## 3. Architecture — four bands and one spine

```
  Surfaces        Electron app · CLI and hooks · agent sessions        (stateless)
                      │              │              │
  Verb runtime    manifest · bless gate · receipts · one verb type
                  memory verbs · browser verbs · plugin verbs
                      │
  Spine           event log ──fold──▶ projection (SQLite) ──▶ retrieval ──▶ back to verbs
                      ▲
  Author side     markdown corpus (wiki links, frontmatter) · metamodel
  ─────────────────────────────────────────────────────────────────────
  Backbone        Effect: Layers, typed errors, Streams, Metric, Tracer
```

**Surfaces hold no state.** The Electron renderer, the CLI, and the hooks are verb invokers and projection viewers. State lives in the log; views are folds.

**The verb runtime is the one abstraction every capability shares.** A memory verb, a crystallized browser routine, a plugin's contribution, and a CLI command are the same type. The bless gate lives here and nowhere else.

**The spine is where engineering compounds.** Verbs append to the log; the fold writes the projection; retrieval reads the projection and logs itself; `orient` carries retrieval back into the next session. The loop-back arrow is R(t).

**The author enters from the side.** Markdown in git is Danny's write surface. The bridge turns wiki links into edges and frontmatter into types, as events with `author` provenance. The metamodel is corpus in the same loop.

**Effect is the floor.** Every external system — file system, SQLite, the CDP-attached browser, embeddings, the LLM — is a Layer with an in-memory implementation. Swap a Layer; the verbs don't notice.

---

## 4. Data model — hard constraints

- **Two graph primitives only:** node and edge. Event kinds are not primitives. If you believe a third primitive is needed, write the proposal with the reason and stop. **[accepted amendment]**
- **Event-sourced, append-only.** Every projection is a deterministic fold over an ordered log. Same log ⇒ same projection, bit for bit, on any machine, at any time. The property test that asserts this is INV-NS-001 and stays green forever.
- **Provenance on every event:** `actor` in a closed grammar (`runtime` · `author:<space>` · `agent:<session>` · `import:<source>`), `at` wall-clock, per-tenant monotonic `step`, `causedBy`. For agent actors, `because` is required and non-empty, enforced by a refinement on the event union so the file log cannot hold an agent event without one. INV-FAB-011.
- **Session provenance names the model.** `agent:<session>` carries the session id from the hook and the model that ran it. **[new — the prior session's own challenge, adopted]**
- **Blessed versus proposed is a state, not a flag.** A proposal folds into the shadow projection; a blessing event folds it into the canonical one. Designed so that reaching canonical without an author event is unrepresentable in the types. INV-FAB-006 as a property test over generated logs.
- **Local-first.** Capture and retrieval complete with the network unavailable. Sync — git, or a hosted projection if one is ever chosen — is a projection consumer, never a dependency of the write path. **[accepted amendment: vendor held, principle kept]**
- **Portable.** JSON lines per tenant, one event per line, schema generated from the schema of record and drift-checked on every commit. Export → fresh process → import → identical projection is INV-NS-002, over generated logs through the real file adapter.
- **Per-session append files.** Concurrent agent sessions never append to the same file; each session writes its own, merged by `step` at fold time. This is the whole answer to concurrency; no CRDT enters the house. **[new]**

---

## 5. Provenance is capability; sovereignty is a gate

Provenance grades determine which projection an event may reach, not merely how it is labeled:

| Actor | May reach canonical? | Notes |
|---|---|---|
| `author:<space>` | Yes, on arrival | Danny's own writes, including markdown via the bridge |
| `runtime` | Yes, for runtime bookkeeping only | Never content |
| `agent:<session>` | Only through a blessing event | All reflections, bridges, patches, aliases, type proposals, optimizer artifacts |
| `import:git` | Only through blessing | Commit bodies harvested as `because` |
| `import:browser:<verb>@<url>` | Only through blessing | A scraped fact is imported, never authored |
| `import:transcript` | Only through blessing | Conversations are corpus, as proposals |
| `import:synthetic` | **Never.** | Confined to `sim:<run>` tenants; INV-NS-003 asserts no real projection contains one |

**The gate is one piece of code and the most important piece.** Proposals in the shadow projection are visible, retrievable, and marked; they are never silently promoted. A blessing is an author event with its own provenance and `because` (which may be one word). Un-blessing is also an event; history is kept.

**Directive 4 and INV-FAB-001 reconciled.** An agent records in its own space without asking, but only through verbs in the operator's manifest. `reflect` is the first verb blessed (directive 7). Until it is, a session's record goes in the reconciliation file and says so. **[accepted amendment]**

---

## 6. The verb model — one shape for every capability

A verb is:

1. A **manifest entry**: name, kind (`memory` · `browser` · `plugin` · `cli`), state (`proposed` · `blessed` · `deprecated`), owning plugin if any.
2. An **input schema** and **output schema** in the schema of record.
3. An **Effect program** with typed errors; no thrown exceptions on the hot path; every failure a named reason the shell can answer with.
4. A **receipt** appended on completion: inputs, outputs, provenance, `because`, duration.
5. A **skill reference**: which skill orients toward it.

**Lifecycle.** A verb enters as a proposal — an agent noticed a routine, crystallized it, wrote its tests, and asked. Blessing admits it to the operator's manifest. Deprecation is an event with a `because` and a successor, never a deletion.

**Kinds.**

- **Memory verbs** — `note`, `reflect`, `orient`, `recall`, `slice`, `bridge`, `patch`, `evaluate`, `bless`. The fabric's own.
- **Browser verbs** — Tesseract's crystallized routines. Section 17.
- **Plugin verbs** — contributed by a Layer. Section 18.
- **CLI commands** — every verb is one; nothing exists on the CLI that is not a verb.

**Derivations.** From one verb definition the system generates its CLI arguments, its MCP tool definition, its function-calling declaration, its RPC contract, its form in the Electron surface, and the verb section of its skill file. A verb is defined once. Section 12.

---

## 7. Capture — latency is correctness

The felt sense at the moment of capture is the first thing lost and the only thing never recovered.

- **`note` is capture; `reflect` is reflection. They are two verbs.** `note` takes one string and nothing else. `reflect` takes the structure the next session needs. Neither is the other. **[accepted amendment]**
- **p99 time-to-persisted-event from first keystroke: ≤ 16 ms** on the author's hardware, for `note`. Measured; reported in every PR that touches the capture path. If it cannot be hit, say why in numbers.
- **No CLI cold start on the capture path.** The house measured 1.3–1.4 s for a `tsx` cold start. Capture runs in a resident process — the Electron main runtime, or a daemon the hooks talk to — never through a fresh interpreter. **[new]**
- **Zero required structure.** No mandatory fields, no forced typing, no modal. Structure accretes by later events.
- **Lossless.** Raw input preserved verbatim including timing metadata; inter-keystroke intervals are cheap and may carry signal later. No normalization at write time.
- **Body-primary.** Operable without visual attention: keyboard-only, voice-in where present, no cursor-hunting. An interaction that requires looking at the screen during capture is a defect.
- **Evaluation capture is as cheap as primary capture.** One keystroke to open, natural language in, done.

---

## 8. Retrieval — the interest rate

Retrieval is where compounding is decided. It is a system, not a search box.

- **Three axes, fused.** Lexical (FTS5, BM25 over raw text, normalized text, and aliases); dense (sqlite-vec over local embeddings, or qmd's vectors while the sidecar stands); graph proximity (personalized PageRank from the current context's active nodes over the edge table, via graphology). Fused by reciprocal rank fusion with explicit, documented weights, exposed so evaluation data can tune them.
- **Aliases are load-bearing.** A node carries every name the author actually uses. `alias.proposed` fires on the first `recall` that misses on the author's own word. Alias proposals are made aggressively and blessed cheaply.
- **Context-conditioned surfacing.** `orient` surfaces the top-k candidates for the session's current context — active nodes, recent events, the repo and document in hand — with the reason each was surfaced. k is capped at eight until measured precision justifies more. Precision over recall; a wrong proactive surface costs attention.
- **Every retrieval is an event.** `retrieval.surfaced` carries context, candidates, ranks, fused scores, and reason. INV-FAB-010.
- **Use is harvested from conduct, not asked for.** An agent's use is its citation or patch; a `PostToolUse` hook logs every file the agent reads as a surfaced candidate, so the use signal reflects behavior and not only self-report. The author's use is a blessing, a quotation, or the absence of a dismissal. An explicit "I read it and it did not help" is a first-class miss. **[new — resolves the prior session's first challenge]**
- **Latency.** p95 ≤ 100 ms for lexical plus graph, in-process, at the projection's real size. Dense may be async and merged when ready; the surface never blocks on it. The quadratic fold that breached this at ~1,000 events is retired by section 9.

---

## 9. Projection — SQLite, disposable, replayable

- **The projection is a SQLite file.** The fold writes rows, not a copied map. FTS5, sqlite-vec, the node table, the edge table, and the retrieval log live in one file; a retrieval and its candidates commit in one transaction.
- **This dissolves the quadratic fold without an algorithmic rewrite.** The scaling harness (section 15) confirms it with numbers before the change merges.
- **Rebuild is drop-and-replay.** The identity test INV-NS-002 runs against the SQLite projection exactly as it ran against the in-memory one.
- **If the projection ever lies, delete it.** Nothing in it is authoritative. The log is.
- **The graph in memory** (graphology) is hydrated from the edge table at session start and is itself disposable.
- **The sidecar decision.** qmd stays until in-process retrieval matches its quality on the discrimination harness and beats its cold start. That comparison is a measured decision, D-series, not an opinion.

---

## 10. The markdown bridge — the author's write surface

Danny writes in an editor into git. Agents write through verbs into the log. The bridge reconciles them.

- **Wiki links become edges.** `[[name]]` parses through remark to a typed edge, resolved through aliases so a link by the author's vernacular lands on the right node. An unresolvable link is an `alias.proposed` or a `node.proposed`, never a dangling reference silently dropped.
- **Frontmatter becomes type.** A frontmatter field maps to a metamodel type; an unknown field is a `type.proposed` with the instances that used it.
- **Bridge events carry `author` provenance** and reach canonical on arrival — Danny wrote them.
- **Round-trip.** Agent-proposed edits to a markdown work are rendered back to markdown (`mdast-util-to-markdown`) into a branch the author reviews in git. The PR is the blessing surface for prose. The site's self-speaking voice and Danny's authorial voice remain distinct; an agent never writes in Danny's voice without the skill that governs it.
- **The published site is a projection.** danielbdyer.com renders blessed works and, when the trigger is met, the R(t) line itself.

---

## 11. The metamodel — structure that grows from use

Schema accretes from use. It is never designed ahead of use.

- **A type is a node** whose payload is a schema fragment. The set of blessed types is the metamodel.
- **Induction runs at session start** (directive 5: nothing runs between sessions). `orient` performs the deterministic part — co-occurrence without a node, repeated untyped edges, clusters of similar edge signatures — and the session names the distinction. Trigger: twenty reflections in the operator's projection.
- **A proposal has four parts** or it is not a proposal: the distinction (name and one-sentence definition), the instances that justify it by id, the `because`, and a falsifier — the observation that would show it wrong.
- **Nothing is built for an unblessed type.** No view, field, migration, or frontmatter admission.
- **Blessing regenerates.** A blessed type merges into the schema of record; DDL, JSON Schema, arbitraries, forms, and docs regenerate from it. Section 12.
- **Acceptance rate is tracked.** Below ~30%, induction is too speculative; tighten. Above ~90%, it proposes only the obvious; loosen.

---

## 12. The schema of record — one shape, every consumer

The zod schema is the single source of shape. Every other representation derives from it, and drift between any two fails the build.

Consumers, and the rule that binds them:

| Consumer | Derivation | Drift check |
|---|---|---|
| TypeScript types | `z.infer` | compiler |
| Runtime validation | the schema itself | INV-FAB-011 |
| Portable JSON Schema (`events.schema.json`) | zod-to-json-schema | per-commit diff |
| Ax signatures | Standard Schema v1 | type-level |
| MCP tool `inputSchema` | JSON Schema | generated, never hand-written |
| Function-calling declarations | JSON Schema | generated |
| CLI argument specs | schema → `@effect/cli` | generated |
| RPC contracts (main ↔ renderer) | schema → `@effect/rpc` | generated |
| SQLite DDL and migrations | schema diff → migration | migration test |
| Index configuration (FTS5 fields, embedded fields, alias fields) | schema annotations | index test |
| `fast-check` arbitraries | zod → arbitrary | property tests and the simulator |
| Electron forms (proposal review, evaluation, blessing) | schema → form | generated |
| Dashboard enumerations | schema → kinds and enums | generated |
| Skill files, verb sections | verb schema | drift check |
| `DOMAIN_MODEL.md`, `CONTENT_SCHEMA.md`, event-kind sections of `FABRIC.md` | generated | commit fails when prose and schema disagree |
| External mappings (Tana, Obsidian, JSON-LD) | schema → field map | export test |
| The metamodel itself | blessed types merge into the schema | reflexive |

**The schema of record is corpus.** Its history is in git; its changes are decisions in `DECISIONS.md`; a blessed type is an event that changed it.

---

## 13. Evaluation — the layer that transfers taste

- **`evaluation.recorded` is an event kind.** Subject (any node id), verdict (`confirmed` · `contradicted` · `preferred`), `because`, optional `counterfactual`, `by` (author or session). Author-authored evaluations are canonical on arrival; session-authored ones are proposals. **[accepted amendment — the trigger was the first correction recorded through the fabric; this version admits the kind ahead of it]**
- **Every correction Danny gives is an unwritten reason.** It is written as an author evaluation before anything else happens in the session.
- **The retrieval harness is `compounding()`.** From the log's historical contexts: did the system surface what was subsequently used? hit@k, MRR, proactive precision, miss count, per-session series. Runs in CI.
- **The regression gate arms at the first baseline.** A retrieval change that lowers hit@k or MRR against the committed synthetic baseline (section 15) does not merge.
- **`patch.outcome` is the fabric's own evaluation of itself.** A patch's hypothesis either confirms or contradicts; the graduation of a patch is its offline harness.

---

## 14. Tension — preserve, never resolve

- Contradictions, changed minds, and unreconciled frames are stored and typed: `contradicts`, `succeeds` (the slice's word for supersedes; a collision to hold, not a third name), and `in-tension-with` once the predicate set admits it by decision record.
- No auto-merge, no auto-dedupe, no auto-resolve. The session proposes the relation; the author blesses it or not.
- A surfaced node arrives with its live tensions. A corpus that returns only conclusions is a sarcophagus.

---

## 15. Synthetic proof — the firewall and the three proofs

Synthetic work exists to de-risk the real loop without ever touching the real measurement.

- **What it proves:** plumbing (the loop closes through the real code path), discrimination (hit@k, MRR, and precision move monotonically with planted retrieval quality — the prize), scaling (latency at 10²–10⁵ events, the fold's breach point in sessions and calendar time at Danny's real cadence).
- **What it cannot prove:** that real retrieval is useful to Danny; that citation ⇒ use is honest. A synthetic citer cites by construction. Say so in every report.
- **The firewall.** `import:synthetic` events live only in `sim:<run>` tenants. `R_sim` is folded by the same `compounding()` and reported under its own name, never merged. INV-NS-003 fails the build if a real projection ever contains a synthetic event.
- **The simulator emits through the real adapter and the real fold,** with planted ground truth (a semantic, graph, or alias relationship seeded so the correct target is known by construction), a quality knob, and a defended generative model — power-law degree, bursty reflections, honest misses.
- **The baseline.** Metric values at the current fusion weights on a fixed synthetic corpus, committed, so the regression gate has something to compare against.

---

## 16. Optimization — the log is the training set

Every retrieval logged with use, every proposal with acceptance, every evaluation with verdict: labeled data as a side effect of the invariants.

- **Ax (`@ax-llm/ax`) is the optimizer.** Signatures come from the schema of record through Standard Schema. GEPA, MiPRO, and few-shot bootstrapping tune the LLM-in-the-loop modules: query rewriting before retrieval, candidate reranking, alias proposal, schema induction, evaluation-verdict prediction.
- **An optimized program is a proposal.** Stored in the log as a portable optimizer artifact with its score, its training window, and its `because`; blessed like anything else; deprecated with a successor when a better one arrives.
- **Trigger: fifty real retrievals with use signal.** Compiling before that is the render.
- **Teacher–student is permitted and budgeted:** an expensive model may author instructions during optimization for a cheap model to run at verb time, with a cost tracker on every compile.
- **A tuned module is measured against the baseline before it is proposed.** An optimizer artifact that does not move hit@k or MRR is recorded as a rejected approach with the numbers, not shipped.

---

## 17. Browser verbs — Tesseract as verbs

Tesseract's substrate — Playwright attached over CDP to the already-logged-in browser, perception through ARIA snapshots, action through agent-authored locator actions and never raw event injection — is extracted, not run whole, and its routines are verbs.

- **Three skills, in order.** `discover` (snapshot, locate, act ad hoc; every action a `browser.action` event with `because`) → `crystallize` (an observed routine becomes a typed, unit-tested, deterministic verb with a manifest entry and a proposal) → `run` (a blessed browser verb invoked by name).
- **Determinism is the crystallization standard.** A routine is a verb when it has a fixed input schema, a fixed output schema, locator-based actions only, a test that replays it against a recorded snapshot, and a stated failure mode for each step. An ad hoc sequence is never blessed.
- **Provenance on every fact.** Anything read from a page enters as `import:browser:<verb>@<url>` — imported, never authored — and reaches canonical only through blessing.
- **The reporting TTY is a Stream.** Selected events, filtered from the log, streamed to the terminal or to xterm in the Electron surface. It is a projection, not a separate log.
- **Verb reuse is R(t) for actions.** A crystallized verb invoked in a session other than the one that crystallized it is a retrieval-and-use event; the same fold counts it.
- **Corporate boundary.** The CDP-attached codebase that already exists on the corporate network stays there. What crosses is the verb model and the schema, never credentials, sessions, or scraped data.

---

## 18. Plugins — a Layer, a manifest, a skill

A plugin is exactly three things:

1. An **Effect Layer** providing one or more verbs, with an in-memory implementation for tests.
2. A **manifest fragment** declaring those verbs, their schemas, and their initial state (`proposed`).
3. A **skill file** orienting sessions toward them.

- **Loading is registration, not execution.** A plugin's verbs enter the shadow manifest as proposals. The operator blesses them individually.
- **Capability is provenance.** A plugin's verbs run as `agent:<session>` when an agent invokes them and as `author` only when Danny does, directly. A plugin cannot elevate itself.
- **No plugin adds a primitive, a projection of record, or a second decision log.** Directive 12 applies to plugins.
- **Packaging is a workspace package** under pnpm; loading in Electron is a dynamic ESM import behind a Layer. No module-federation runtime in the desktop app.

---

## 19. Surfaces — stateless windows

- **CLI** (`pnpm fabric <verb>`). Every verb; generated from the schema; the honest floor for everything. Cold start is a known cost and never on the capture path.
- **Hooks.** Session start runs `orient` and prints one sentence of R(t); `PostToolUse` logs file reads as surfaced candidates; session stop enforces `reflect`. Hooks are the cheapest harvest of behavior into signal.
- **Electron.** Main process hosts the Effect runtime and the resident capture surface; the renderer is React with TanStack Router, reads projections over `@effect/rpc`, subscribes to the event Stream for invalidation, and holds no state. CodeMirror for capture and markdown editing; xterm for the TTY; a chart library for the dashboard, every chart a fold. Built last, after the spine is measured, because a window is cut only once there is a room.
- **The published site.** A static projection of blessed works and, on its trigger, the compounding number.

---

## 20. The skill tree

Skills orient sessions toward verbs. The tree follows the verb model; unlocking a branch means its verbs are blessed. Each leaf lists its prerequisite verbs and the trigger that unlocks it. The tree is corpus: a skill is a node, and a new branch is a proposal.

```
orient                       root — reads the foyer, prints R(t), loads the named branch
├── memory
│   ├── reflecting           reflect            (first blessed; directive 7)
│   ├── recalling            recall, slice
│   ├── bridging             bridge, patch      (after recall)
│   └── evaluating           evaluate           (after the first correction is recorded)
├── corpus
│   ├── writing-prose        (have)
│   ├── writing-specs        (have)
│   ├── alias-proposing      alias.proposed     (first recall miss on the author's word)
│   └── schema-inducing      type.proposed      (twenty reflections)
├── browser
│   ├── discovering          browser.action
│   ├── crystallizing        verb.proposed      (after a routine repeats)
│   └── running              blessed browser verbs
├── engineering
│   ├── coding               (have)
│   ├── auditing             (have)
│   ├── architecting         (have)
│   └── benching             latency, R_sim     (with the scaling harness)
└── meta
    ├── reconciling          charter ↔ fabric   (every version of this document)
    ├── skill-authoring      skill.proposed
    └── optimizing           Ax                 (fifty real retrievals)
```

---

## 21. Engineering standard

- **TypeScript strict; no `any` in committed code.** Effect for programs, typed errors, Layers, Streams.
- **Property tests, always green:** fold determinism (INV-NS-001), export/import identity (INV-NS-002), synthetic firewall (INV-NS-003), blessed/proposed invariant (INV-FAB-006), provenance completeness and `because` enforcement (INV-FAB-011), retrieval logging (INV-FAB-010). Over generated logs, through the real adapters.
- **Every PR states** the loop it closes or tightens, the measured effect or the measurement it adds, and the `because`. Numbers, not adjectives.
- **`DECISIONS.md` is the one decision log.** Every architectural decision, with rejected alternatives and why, in the engine's format. A rejected alternative recorded is worth more than one silently absent.
- **No new dependency without** a one-line justification and its removal cost.
- **Generated artifacts are never hand-edited.** JSON Schema, DDL, MCP definitions, docs sections, arbitraries — regenerate or fail.
- **Bench before merge** on any change to the fold, the projection, retrieval, or capture. The scaling harness is the bench.
- **Process boundaries are measured.** A sidecar, a service, an IPC hop — each either pays for itself in a number or is folded in-process.

---

## 22. Observability and the metrics that matter

Every metric is a fold; the dashboard is a projection; there is no metrics store that is not the log.

| Metric | Definition | Where it shows |
|---|---|---|
| **R(t)** | Retrievals surfaced out-of-context and used, by session | `orient`'s first line, `describe`, README, dashboard, site on trigger |
| **dR/dt** | Per-session series | dashboard |
| **hit@k, MRR** | From `compounding()` against historical contexts | CI, dashboard |
| **Proactive precision** | Used ÷ surfaced for `orient`'s k | dashboard; governs k |
| **Miss count** | Citations of nothing surfaced; explicit "did not help" | dashboard |
| **Proposal acceptance** | Blessed ÷ decided, by kind | dashboard; governs induction |
| **Capture p99** | First keystroke → persisted `note` | every capture PR |
| **Retrieval p95** | Lexical + graph, in-process | every retrieval PR |
| **Fold p95 by N** | From the scaling harness | every fold PR |
| **Verb reuse** | Blessed verbs invoked outside their crystallizing session | dashboard |
| **R_sim** | R(t) on synthetic tenants, reported separately, never merged | benching only |

Latency histograms and traces come from Effect's Metric and Tracer; export through OpenTelemetry waits for a second reader.

---

## 23. Build order — gated by the log, not by appetite

The stack is broad; the build is narrow and sequential, and the sequence is decided by triggers already recorded.

| Step | Work | Gate to start | Gate to finish |
|---|---|---|---|
| 1 | Bless `reflect`; one real reflection; one real citation next session | none — one command | real R(t) = 1 |
| 2 | Harvest hooks: `PostToolUse` file reads; commit bodies as `import:git`; model name on receipts | step 1 | use signal appears in the log |
| 3 | `note` verb in a resident process | step 1 | capture p99 ≤ 16 ms measured |
| 4 | Synthetic proof: simulator, discrimination harness, scaling harness, baseline | step 1 | firewall green; metric shown to discriminate; fold breach point known |
| 5 | SQLite projection with FTS5 and sqlite-vec; graphology proximity; RRF | step 4's breach point within a year of real use | identity test green on SQLite; retrieval p95 ≤ 100 ms at 10⁴ events |
| 6 | Markdown bridge: wiki links, frontmatter, aliases on miss | step 5 | first author edge folded from markdown |
| 7 | `evaluation.recorded`; first correction recorded through the fabric | step 1 | first author evaluation in canonical |
| 8 | Metamodel loop: `type.proposed`, blessing regenerates | twenty reflections | first blessed type regenerates DDL, schema, docs |
| 9 | Generated docs with drift check; MCP and arbitraries from schema | step 5 | commit fails on drift |
| 10 | Tesseract verbs: `discover` → `crystallize` → `run` | step 5 | first crystallized verb reused across sessions |
| 11 | Plugin packaging | step 10 | first plugin's verbs blessed individually |
| 12 | Ax optimization of reranking | fifty real retrievals with use | artifact beats baseline; proposed; blessed |
| 13 | Electron surface | steps 3, 5, 7 measured | renderer holds no state; capture p99 holds in the app |
| 14 | Publish R(t) on the site | a number worth publishing | the site is a projection |

Steps may proceed in parallel where their gates allow. No step starts because it is interesting.

---

## 24. Definition of done

Every deliverable answers all six with evidence:

1. **Does this output become an input?** Name the consumer.
2. **Is the `because` recorded** where the next session retrieves it?
3. **Is it retrievable outside its creation context,** and by what names?
4. **Did R(t) or a leading indicator move, or did this add the measurement?** Numbers. State which numbers are R(t) and which are `R_sim`.
5. **Does it round-trip** to the portable format with the identity test green?
6. **Does it derive from the schema of record** — no hand-written shape, no generated artifact edited by hand?

If any answer is no, say so in the first sentence of the report and propose the smallest change that flips it.

---

## 25. You are corpus — the session protocol

Your decisions, evaluations, and corrections are held to the same standard as the author's.

- **Start.** Read what `orient` surfaces. Cite what you use; citation is how R(t) is measured.
- **Every non-trivial decision:** one-line `because` in `DECISIONS.md`. Every rejected approach: recorded with its reason.
- **Every correction from Danny:** written as an author evaluation before anything else happens.
- **Every tension you notice** between two things in the codebase or the corpus: recorded as a relation, never resolved by you.
- **Every proposal** carries cited instances, a `because`, and a falsifier, or it is an opinion and you do not emit it.
- **End.** A session record through `reflect` — what loop moved, what measurement changed, what you would challenge next and why, and which model ran the session. Until `reflect` is blessed, in the reconciliation file, saying so.

---

## 26. What not to build

- **CRDT and sync frameworks.** Single sovereign author; git is the sync; per-session append files are the concurrency answer.
- **A vector database server.** sqlite-vec in the projection file is the whole requirement.
- **An ORM.** A handful of tables written by one fold.
- **Renderer state managers.** The projection is the state.
- **Agent orchestration frameworks.** The verb runtime is the framework; Ax is for optimization only.
- **A capture surface that requires a cold start.**
- **A second decision log, a second name for the node, a second relational primitive, a second way to do anything the verb model already does.**
- **Anything whose effect on retrieval-and-use is not measured.** The render.

---

## 27. Posture — and how this document changes

Push back on scope. Prefer the deep cut on the loop to horizontal breadth, every time, until the loop closes end to end — then again at the next scale. Prefer the honest result to the impressive one: a metric that turns out not to discriminate, a fold that breaches sooner than assumed, a proposal rejected with numbers — these are the findings worth having.

When you disagree with anything here, say so with a reason and a proposed amendment. This document is corpus. It changes only by a new version Danny gives; a session's proposed amendments go in the reconciliation with their `because`, and the accepted ones are marked in the next version as the reconciliation's were marked in this one. The document's own history is in git; its decisions are in `DECISIONS.md`; the sessions that shaped it are in the log.

Expect this to be hard. Do it anyway, and do it well enough that the next session inherits a system, not a pile — and that someone reading this in ten years sees how personal knowledge infrastructure should have been built.

---

## Appendix A — event kinds (canonical and proposed)

| Kind | Actor | State on arrival | Notes |
|---|---|---|---|
| `space.*`, `verb.*`, `source.*` | runtime / author | canonical | fabric bookkeeping |
| `receipt` | any | as actor | every verb's completion |
| `note.captured` | author / agent | as actor | one string; proposed kind |
| `reflection.recorded` | agent | proposal | via `reflect` |
| `bridge.proposed` / `bridge.decided` | agent / author | proposal / canonical | relation with evidence |
| `patch.proposed` / `patch.decided` / `patch.outcome` | agent / author / agent | proposal / canonical / proposal | hypothesis stated to fail |
| `retrieval.surfaced` | any | canonical (bookkeeping) | INV-FAB-010 |
| `alias.proposed` / `alias.decided` | agent / author | proposal / canonical | proposed kind |
| `type.proposed` / `type.decided` | agent / author | proposal / canonical | metamodel; proposed kind |
| `evaluation.recorded` | author / agent | canonical / proposal | proposed kind |
| `browser.action` | agent | canonical (bookkeeping) | Tesseract; proposed kind |
| `verb.proposed` / `verb.decided` / `verb.deprecated` | agent / author / author | proposal / canonical / canonical | crystallized routines, plugin verbs |
| `optimizer.artifact.proposed` / `.decided` | agent / author | proposal / canonical | Ax; proposed kind |
| `import.*` | import | proposal (synthetic: sim tenants only) | git, transcript, browser, synthetic |
| `blessing` / `unblessing` | author | canonical | the gate |

Proposed kinds enter the schema of record only by decision record and blessing.

## Appendix B — invariants referenced

| Id | Statement |
|---|---|
| INV-FAB-001 | A verb not in the operator's manifest is refused. |
| INV-FAB-006 | A reflection is in the operator's projection iff a blessed bridge carries it. |
| INV-FAB-010 | Every verb that surfaces memory appends `retrieval.surfaced` with context and ranked candidates. |
| INV-FAB-011 | An agent event without a non-empty `because` is unrepresentable in the log. |
| INV-NS-001 | Same log ⇒ same projection, bit for bit, on any machine. |
| INV-NS-002 | Export → fresh process → import ⇒ identical projection. |
| INV-NS-003 | No real projection contains an `import:synthetic` event. |
| INV-NS-004 | Every generated artifact matches the schema of record; drift fails the commit. |
| INV-NS-005 | Nothing agent-authored reaches canonical without a blessing event. |

## Appendix C — triggers, in one place

| Trigger | Unlocks |
|---|---|
| `pnpm fabric bless reflect` | everything |
| first real citation of a prior session's node | R(t) = 1 |
| first `recall` miss on the author's own word | `alias.proposed` |
| first correction recorded through the fabric | `evaluation.recorded` in canonical |
| twenty reflections in the operator's projection | schema induction |
| fifty real retrievals with use signal | Ax optimization; regression gate armed on real data |
| fold breach point within a year of real cadence | SQLite projection now, not held |
| a browser routine that repeats | crystallize |
| a number worth publishing | R(t) on the site |
| a second reader of traces | OpenTelemetry export |
| capture, retrieval, and evaluation measured in a resident process | Electron |
