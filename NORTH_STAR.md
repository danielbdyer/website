# NORTH STAR v4 — the corpus that compounds, locked to agentic coding memory

**v4 · 2026-09-06 · supersedes v3 (`NORTH_STAR.md`) and addendum v3.2 (§28) for everything inside THE LOCK. Nothing outside the lock is deleted; it is held in Appendix D with its trigger and its original text location.**

Every section carries a disposition tag against v3/§28: **[kept]** — carried whole; **[narrowed]** — carried with the lock's cuts applied and named; **[new]** — required by the lock or by the CLI's first-class status; **[held]** — moved to Appendix D with a trigger. The ledger in Appendix E reconciles every unit of the originals against this document.

Read it in order the first time. After that, `fabric orient` surfaces what bears on the work in front of you.

---

## 0. Why this exists — **[kept]**

Danny produces a large volume of durable thinking — distinctions, decisions, evaluations, corrections — across writing, engineering, and management. Most of it is either lost at the moment of capture or stored where it cannot be found at the moment it would matter. Every new agent session starts closer to zero than it should. The corpus does not compound.

The system fixes exactly that. Its product is compounding; everything else is instrumentation.

**The invariant that governs everything:**

> A corpus compounds iff outputs become inputs.

Formally: let R(t) be the set of retrieval events where a stored item was surfaced in a context other than its creation context *and* influenced the next action. The system is compounding iff dR/dt is increasing and the influence is measurable. Every section below exists to make R(t) exist, then to make it grow superlinearly, then to keep it honest.

**The standing order derived from it:** build the instrument before the feature. A feature without a measured effect on retrieval-and-use is a guess, and guesses do not ship as progress. The prior session honored this and reported R(t) = 0 of 0. That was correct. This document is the plan for what comes after zero.

**The lock adds one sentence:** the repository that builds this is its first tenant, and its own R(t) is the product's proof.

---

## 1. Business requirements — **[narrowed]**

The system succeeds when all of these hold:

1. **Compounding is measured before it is improved.** R(t) is a first-class metric, folded from the log, visible at the start of every session.
2. **Capture is lossless and zero-friction.** Raw input preserved verbatim; no structure demanded at write time; latency near zero.
3. **Retrieval surfaces the right thing at the moment of need** — hybrid across lexical, dense, and graph axes; alias-aware; proactive at session start; logged every time with whether the result was used.
4. **Author sovereignty is enforced, not assumed.** Agents propose; only the operator blesses. Nothing agent-authored reaches the canonical projection without an author event.
5. **Reasons, not just conclusions.** Every decision, correction, and evaluation carries a `because`, so the system can extend the operator's judgment to cases not yet met.
6. **Tension is preserved, never auto-resolved.** Contradictions and changed minds stay retrievable.
7. **Portable and durable.** Plain-text, event-sourced, local-first, rebuildable from the log alone; outlives any app or vendor.
8. **A developer's corrections stop repeating.** Correction-repeat rate is a first-class metric and falls toward zero on a working system. *(replaces v3 §1.8, browser actions — held, D.1)*
9. **Structure is admitted from use, not designed ahead of it.** Frontmatter and observed patterns become types by proposal and blessing. *(v3 §1.9, narrowed to the coding case — the induction loop is held, D.4)*
10. **One surface, stateless, and excellent.** The CLI is the product's only surface; it is usable by an agent every turn without friction and by an operator for blessing without ceremony. *(v3 §1.10, Electron — held, D.3)*

**Constraints:** single sovereign operator per tenant; agent sessions as the primary readers and writers; git as the sync substrate; no production runtime for the published site; no network on the write path.

**Success looks like:** R(t) rising session over session on real use on the repository that builds the product, with agents beginning each session already carrying the operator's distinctions — and every number `fabric describe` prints traceable to an event with provenance.

---

## 2. Vocabulary — a closed grammar — **[narrowed]**

The house forbids a third name for a thing that has two (directive 12). These are the names. Use them exactly.

| Term | Meaning |
|---|---|
| **Node** | The graph's first primitive. In the engine's code, `entity`; in the slice, `node`; in the seed and the charter, *haecceity* — which is what it *is*, not what it is *called* in code. The name `Haecceity` does not enter the code unless Danny blesses the rename. |
| **Edge** | The graph's second primitive. Typed, directed, provenanced. |
| **Axis** | A named position an edge-free node may carry. Not a primitive. |
| **Pending** | A suspension state. Not a primitive. |
| **Event** | One line in the log. Carries `kind`, payload, `actor`, `at`, `step`, `causedBy`, and — for agent actors — `because`. Event kinds are not primitives. |
| **Log** | The append-only JSONL per tenant. The only thing that cannot be regenerated. |
| **Fold** | The deterministic function from an ordered log to a projection. |
| **Projection** | Any state derived by a fold. Disposable; replayable. Canonical holds blessed content; shadow holds proposals. |
| **Tenant** | One log's scope and one identity. A person, a specialized agent, or a `sim:<run>`. |
| **Space** | A tenant's named partition. |
| **Operator / sovereign** | The tenant's human, in the capacity to bless. On tenant zero, Danny. |
| **Verb** | A named, typed, schema-bound Effect program registered in a manifest, producing a receipt event. The one shape for every capability. |
| **Manifest** | The set of verbs a space may invoke, with their blessed/proposed state. INV-FAB-001: a verb not in the operator's manifest is refused. |
| **Receipt** | The event a verb appends on completion: inputs, outputs, provenance, model, duration, `because`. |
| **Proposal** | Any agent-authored or imported event not yet blessed. Lives in the shadow projection. |
| **Blessing** | The author event that promotes a proposal to canonical. Itself an event with `author` provenance. |
| **Inbox** | The set of proposals awaiting the operator's decision, as `fabric describe` and `fabric bless` present it. *(new term)* |
| **Reflection** | A structured session record written through `reflect`. Not capture. |
| **Capture** | One string, no structure, through `note`. Not reflection. |
| **Correction** | An operator's instruction that an agent's output or behavior was wrong, recorded as an author evaluation. *(new term; the lock's central event)* |
| **Bridge** | A proposed relation between nodes, with evidence. |
| **Patch** | A proposed change to the fabric's own behavior, with a `hypothesis` stated so it can fail, and an `outcome`. |
| **Retrieval** | Any verb that surfaces memory. Logged as `retrieval.surfaced`. INV-FAB-010. |
| **Use** | A surfaced candidate influencing the next action. For an agent: a citation, a patch, or a file it actually opened. For the operator: a blessing, a quotation, or the inverse of a dismissal. |
| **Skill** | A file that orients a session toward a set of verbs and the specs behind them. Skills form a tree; unlocking a branch means its verbs are blessed. |
| **Plugin** | An Effect Layer that provides verbs, plus the skill file that orients toward them, plus the schema fragments those verbs need. The first plugin is the Claude Code integration. |
| **Metamodel** | The set of blessed entity types. Each type is a node whose payload is a schema fragment. In the lock: the types the coding case needs, admitted by frontmatter and blessing. |
| **Schema of record** | The zod definition from which every other shape derives. |
| **Daemon** | The resident process that owns the tenant actor; the CLI is its thin client. *(new term)* |
| **Fabric** | The whole system as it stands in the repository. |

---

## 3. Architecture — three bands and one spine — **[narrowed]**

```
  Surfaces        CLI (thin client) · hooks · agent sessions            (stateless)
                      │              │              │
  Verb runtime    manifest · bless gate · receipts · one verb type
                  memory verbs · the Claude Code plugin's verbs
                      │
  Spine           daemon ▸ event log ──fold──▶ projection (SQLite) ──▶ retrieval ──▶ back to verbs
                      ▲
  Author side     markdown corpus (wiki links, frontmatter → type) · git history
  ─────────────────────────────────────────────────────────────────────
  Backbone        Effect: Layers, typed errors, Streams, Metric, Tracer
```

**Surfaces hold no state.** The CLI, the hooks, and agent sessions invoke verbs and read projections. State lives in the log; views are folds. *(Electron — held, D.3.)*

**The verb runtime is the one abstraction every capability shares.** A memory verb, the Claude Code plugin's contribution, and a CLI command are the same type. The bless gate lives here and nowhere else. *(Browser verbs — held, D.1.)*

**The spine is where engineering compounds.** The daemon owns the tenant actor; verbs append to the log; the fold writes the projection; retrieval reads it and logs itself; `orient` carries retrieval back into the next session. The loop-back arrow is R(t).

**The author enters from the side.** Markdown in git is the operator's write surface; git history is the day-one corpus. The bridge turns wiki links into edges and frontmatter into types, as events with `author` provenance. *(Prose round-trip — held, D.5.)*

**Effect is the floor.** Every external system — file system, SQLite, embeddings, the LLM — is a Layer with an in-memory implementation.

---

## 4. Data model — hard constraints — **[kept]**

- **Two graph primitives only:** node and edge. Event kinds are not primitives. If you believe a third primitive is needed, write the proposal with the reason and stop.
- **Event-sourced, append-only.** Every projection is a deterministic fold over an ordered log. Same log ⇒ same projection, bit for bit, on any machine, at any time. INV-NS-001, green forever.
- **Provenance on every event:** `actor` in a closed grammar (`runtime` · `author:<space>@did` · `agent:<session>@did` · `import:<source>`), `at`, per-tenant monotonic `step`, `causedBy`. For agent actors, `because` is required and non-empty, enforced by a refinement on the event union. INV-FAB-011.
- **Session provenance names the model.** `agent:<session>` carries the session id from the hook and the model that ran it.
- **Blessed versus proposed is a state, not a flag.** Reaching canonical without an author event is unrepresentable in the types. INV-FAB-006, INV-NS-005.
- **Local-first.** Capture and retrieval complete with the network unavailable. Sync — git — is a projection consumer, never a dependency of the write path.
- **Portable.** JSON lines per tenant, one event per line, schema generated from the schema of record and drift-checked on every commit. Export → fresh process → import → identical projection is INV-NS-002.
- **Per-session append files.** Concurrent agent sessions never append to the same file; each session writes its own, merged by `step` by the tenant actor. INV-NS-009. No CRDT enters the house.

---

## 5. Provenance is capability; sovereignty is a gate — **[narrowed]**

| Actor | May reach canonical? | Notes |
|---|---|---|
| `author:<space>@did` | Yes, on arrival | The operator's own writes, including markdown via the bridge |
| `runtime` | Yes, for runtime bookkeeping only | Never content |
| `agent:<session>@did` | Only through a blessing event | Reflections, bridges, patches, aliases, type proposals, evaluations |
| `import:git` | Only through blessing | Commit bodies harvested as `because`; the day-one corpus |
| `import:transcript` | Only through blessing | Conversations are corpus, as proposals |
| `import:tenant:<did>` | Only through the receiving tenant's blessing or a blessed policy | Any event from another tenant's log, however trusted *(from §28.4)* |
| `import:synthetic` | **Never.** | Confined to `sim:<run>` tenants; INV-NS-003 |

*(`import:browser:<verb>@<url>` — held with browser verbs, D.1.)*

**The gate is one piece of code and the most important piece.** Proposals in the shadow projection are visible, retrievable, and marked; they are never silently promoted. A blessing is an author event with its own provenance and an optional `because`. Un-blessing is also an event; history is kept.

**Directive 4 and INV-FAB-001 reconciled.** An agent records in its own space without asking, but only through verbs in the operator's manifest. `reflect` is the first verb blessed (directive 7). Until it is, a session's record goes in the reconciliation file and says so.

---

## 6. The verb model — one shape for every capability — **[narrowed]**

A verb is:

1. A **manifest entry**: name, kind (`memory` · `plugin` · `cli`), state (`proposed` · `blessed` · `deprecated`), owning plugin if any. *(`browser` kind — held, D.1.)*
2. An **input schema** and **output schema** in the schema of record.
3. An **Effect program** with typed errors; no thrown exceptions on the hot path; every failure a named reason the CLI can print and an agent can parse.
4. A **receipt** appended on completion: inputs, outputs, provenance, model, duration, `because`.
5. A **skill reference**: which skill orients toward it.

**Lifecycle.** A verb enters as a proposal, is blessed into the operator's manifest, and is deprecated by an event with a `because` and a successor — never deleted.

**The lock's verbs.** `note`, `reflect`, `orient`, `recall`, `slice`, `bridge`, `patch`, `evaluate`, `bless`, `unbless`, `describe`, `why`, `trust`, `init`, `doctor`, `log`. Section 19 specifies each.

**Derivations.** From one verb definition the system generates its CLI arguments and help, its JSON output schema, its MCP tool definition, its function-calling declaration, and the verb section of its skill file. A verb is defined once. *(RPC contract and Electron form — held, D.3.)*

---

## 7. Capture — latency is correctness — **[narrowed]**

The felt sense at the moment of capture is the first thing lost and the only thing never recovered.

- **`note` is capture; `reflect` is reflection. They are two verbs.**
- **p99 time-to-persisted-event from first keystroke: ≤ 16 ms** for `note`, measured on the operator's hardware, reported in every PR that touches the capture path.
- **No cold start on the capture path.** The house measured 1.3–1.4 s for a `tsx` cold start. Capture runs in the **daemon**; the CLI is a thin client over a local socket. *(v3 named "the Electron main runtime, or a daemon"; the lock names the daemon.)*
- **Zero required structure.** No mandatory fields, no forced typing, no interactive prompt.
- **Lossless.** Raw input preserved verbatim including timing metadata. No normalization at write time.
- **Body-primary.** Operable without visual attention: `fabric note "…"` from any shell, and stdin.
- **Evaluation capture is as cheap as primary capture.** `fabric evaluate <id> --confirmed|--contradicted "because"` is one line.

---

## 8. Retrieval — the interest rate — **[kept]**

- **Three axes, fused.** Lexical (FTS5, BM25 over raw text, normalized text, and aliases); dense (sqlite-vec over local embeddings, or qmd's vectors while the sidecar stands); graph proximity (personalized PageRank from the current context's active nodes over the edge table). Fused by reciprocal rank fusion with explicit, documented weights, exposed so evaluation data can tune them.
- **Aliases are load-bearing.** A node carries every name the operator actually uses. `alias.proposed` fires on the first `recall` that misses on the operator's own word.
- **Context-conditioned surfacing.** `orient` surfaces the top-k candidates for the session's current context — active nodes, recent events, the repo and files in hand — with the reason each was surfaced. k is capped at eight until measured precision justifies more.
- **Every retrieval is an event.** `retrieval.surfaced` carries context, candidates, ranks, fused scores, and reason. INV-FAB-010.
- **Use is harvested from conduct, not asked for.** A `PostToolUse` hook logs every file the agent opens as a surfaced candidate; an agent's citation or patch is use; an explicit "did not help" is a first-class miss. The operator's use is a blessing, a quotation, or the absence of a dismissal.
- **Latency.** p95 ≤ 100 ms for lexical plus graph, in the daemon, at the projection's real size. Dense may be async; the surface never blocks on it.

---

## 9. Projection — SQLite, disposable, replayable — **[kept]**

- **The projection is a SQLite file.** The fold writes rows. FTS5, sqlite-vec, the node table, the edge table, and the retrieval log live in one file; a retrieval and its candidates commit in one transaction.
- **This dissolves the quadratic fold.** The scaling harness confirms it with numbers before the change merges.
- **Rebuild is drop-and-replay.** INV-NS-002 runs against SQLite as it ran against memory.
- **If the projection ever lies, delete it.** The log is authoritative.
- **The graph in memory** (graphology) is hydrated from the edge table at daemon start and is disposable.
- **The sidecar decision.** qmd stays until in-process retrieval matches its quality on the discrimination harness and beats its cold start. A measured decision, D-series.

---

## 10. The markdown bridge — the author's write surface — **[narrowed]**

- **Wiki links become edges.** `[[name]]` parses through remark to a typed edge, resolved through aliases. An unresolvable link is an `alias.proposed` or a `node.proposed`, never a dangling reference silently dropped.
- **Frontmatter becomes type.** A frontmatter field maps to a metamodel type; an unknown field is a `type.proposed` with the instances that used it.
- **Bridge events carry `author` provenance** and reach canonical on arrival.
- **Existing docs are nodes.** `CLAUDE.md`, ADRs, `DECISIONS.md`, READMEs — parsed, linked, aliased at `init`. The spec layer becomes retrievable structure. *(new to this section; from THE LOCK §2)*
- **R(t) may be published on the site** at its trigger, as a projection. *(v3 §10's last line, kept; the site as projection of blessed works and the prose round-trip — held, D.5.)*

---

## 11. Types — admitted from use — **[narrowed]**

*(v3 §11 "The metamodel", narrowed to the coding case. The induction loop is held, D.4.)*

- **A type is a node** whose payload is a schema fragment. The set of blessed types is the metamodel.
- **In the lock, types arrive two ways only:** a frontmatter field the bridge does not recognize (`type.proposed`, with instances), and a plugin's declared kinds in its own namespace (§18).
- **A proposal has four parts** or it is not a proposal: the distinction (name and one-sentence definition), the instances that justify it by id, the `because`, and a falsifier.
- **Nothing is built for an unblessed type.** No view, field, migration, or frontmatter admission.
- **Blessing regenerates.** A blessed type merges into the schema of record; DDL, JSON Schema, arbitraries, help text, and docs regenerate from it (§12).
- **Acceptance rate is tracked** across all proposal kinds. Below ~30%, proposals are too speculative; above ~90%, only the obvious is proposed.

---

## 12. The schema of record — one shape, every consumer — **[narrowed]**

The zod schema is the single source of shape. Every other representation derives from it, and drift between any two fails the build.

| Consumer | Derivation | Drift check |
|---|---|---|
| TypeScript types | `z.infer` | compiler |
| Runtime validation | the schema itself | INV-FAB-011 |
| Portable JSON Schema (`events.schema.json`) | zod-to-json-schema | per-commit diff |
| **CLI argument specs, `--help`, and `--json` output contracts** | schema → `@effect/cli` and output formatters | generated; snapshot-tested (§19) |
| MCP tool `inputSchema` | JSON Schema | generated |
| Function-calling declarations | JSON Schema | generated |
| SQLite DDL and migrations | schema diff → migration | migration test |
| Index configuration (FTS5 fields, embedded fields, alias fields) | schema annotations | index test |
| `fast-check` arbitraries | zod → arbitrary | property tests and the simulator |
| `describe` enumerations (kinds, verdicts, states) | schema → enums | generated |
| Skill files, verb sections | verb schema | drift check |
| `DOMAIN_MODEL.md`, `CONTENT_SCHEMA.md`, event-kind sections of `FABRIC.md` | generated | **commit fails when prose and schema disagree** |
| Ax signatures | Standard Schema v1 | type-level, when Ax arms (§16) |
| The metamodel itself | blessed types merge into the schema | reflexive |

*(RPC contracts, Electron forms, dashboard enumerations beyond `describe`, and external mappings — held, D.3 and D.6.)*

**The schema of record is corpus.** Its history is in git; its changes are decisions in `DECISIONS.md`; a blessed type is an event that changed it.

---

## 13. Evaluation — the layer that transfers taste — **[kept]**

- **`evaluation.recorded` is an event kind.** Subject (any node id), verdict (`confirmed` · `contradicted` · `preferred`), `because`, optional `counterfactual`, `by`. Author-authored evaluations are canonical on arrival; session-authored ones are proposals.
- **Every correction the operator gives is an unwritten reason.** It is written as an author evaluation before anything else happens in the session. The stop hook captures corrections from the session as proposed evaluations for the operator to bless; a correction the operator types through `fabric evaluate` is canonical on arrival.
- **The retrieval harness is `compounding()`.** From the log's historical contexts: did the system surface what was subsequently used? hit@k, MRR, proactive precision, miss count, per-session series. Runs in CI.
- **The regression gate arms at the first baseline** (§15). A retrieval change that lowers hit@k or MRR does not merge.
- **`patch.outcome` is the fabric's own evaluation of itself.**

---

## 14. Tension — preserve, never resolve — **[kept]**

- Contradictions, changed minds, and unreconciled frames are stored and typed: `contradicts`, `succeeds`, and `in-tension-with` once the predicate set admits it by decision record.
- No auto-merge, no auto-dedupe, no auto-resolve. The session proposes the relation; the operator blesses it or not.
- A surfaced node arrives with its live tensions. A corpus that returns only conclusions is a sarcophagus.

---

## 15. Synthetic proof — the firewall and the three proofs — **[kept]**

- **What it proves:** plumbing, discrimination (the prize), scaling (the fold's breach point in sessions and calendar time at real cadence).
- **What it cannot prove:** that real retrieval is useful; that citation ⇒ use is honest. Say so in every report.
- **The firewall.** `import:synthetic` events live only in `sim:<run>` tenants. `R_sim` is reported under its own name, never merged. INV-NS-003.
- **The simulator emits through the real adapter and the real fold,** with planted ground truth, a quality knob, and a defended generative model.
- **The baseline.** Metric values at current fusion weights on a fixed synthetic corpus, committed, so the regression gate has a comparison.

---

## 16. Optimization — the log is the training set — **[kept, trigger-gated]**

- **Ax (`@ax-llm/ax`) is the optimizer.** Signatures from the schema of record. GEPA, MiPRO, and bootstrapping tune query rewriting, reranking, alias proposal, and verdict prediction.
- **An optimized program is a proposal,** stored as a portable artifact with its score, training window, and `because`; blessed like anything else.
- **Trigger: fifty real retrievals with use signal.** Compiling before that is the render.
- **Teacher–student is permitted** and budgeted.
- **A tuned module is measured against the baseline before it is proposed.**

---

## 17. Browser verbs — **[held → D.1]**

## 18. Plugins — a Layer, a manifest, a skill — **[narrowed]**

A plugin is exactly three things: an **Effect Layer** providing verbs with an in-memory implementation; a **manifest fragment** declaring those verbs, schemas, and initial state (`proposed`); a **skill file**.

- **The first plugin is the Claude Code integration:** the three hooks (start → `orient`; `PostToolUse` → file reads as retrievals; stop → `reflect` and correction capture), the `.claude/skills/` tree, and the MCP surface for the lock's verbs.
- **Loading is registration, not execution.** A plugin's verbs enter the shadow manifest as proposals; the operator blesses them individually.
- **Capability is provenance.** A plugin's verbs run as `agent:<session>` when an agent invokes them and as `author` only when the operator does, directly.
- **Plugins declare kinds in their own namespace** (`<plugin>.<kind>`) and cannot define kinds in `dyer.fabric.*`. *(from §28.3)*
- **No plugin adds a primitive, a projection of record, or a second decision log.**
- **Packaging is a workspace package** under pnpm. *(Electron dynamic import and further plugins — held, D.3.)*

---

## 19. The CLI — a first-class citizen — **[new; replaces v3 §19 "Surfaces"]**

The CLI is the product's only surface, and it is used by two people who want different things from it every day. **An agent** invokes it dozens of times a session and needs it to be fast, parseable, deterministic, and never blocking. **An operator** opens it once a day and needs to see the number, decide on what's waiting, and be done in a minute. The CLI is S-tier when both are true at once. This section is the specification of that.

### 19.1 One binary, one grammar

```
fabric <verb> [arguments] [--json] [--because "<reason>"] [--yes] [--dry]
```

- **Every verb is a subcommand;** there is nothing on the CLI that is not a verb, and no verb that is not on the CLI.
- **Arguments, help, and output contracts are generated** from the verb's schema (§12). Hand-written help text does not exist.
- **Line grammar is fixed** and the same everywhere a node or event is printed: `<id>  <kind>  <title>  —  <why>`. Ids are short, prefix-unique, and stable across sessions; any prefix that is unique resolves.
- **Two output modes, chosen by the terminal, overridable by flag.** A TTY gets columns and color; a pipe or `--json` gets one JSON object per line whose schema is the verb's output schema. Nothing appears in machine mode that is not in the contract; nothing in TTY mode is needed to act.
- **`--because` is accepted by every verb** and required when the actor is an agent. The hook injects the session id; the agent supplies the reason. A missing reason is exit 3 with the message *"because is required for agent actors"* — never a silent default.
- **`--yes` suppresses every interactive prompt; `--dry` performs no write and prints the receipt it would have appended.** In a non-TTY context, `--yes` is implied and any verb that would have prompted returns exit 3 with the prompt's question in the error, so an agent is never blocked and never guesses.

### 19.2 The thin client and the daemon

- **The CLI is a thin client** over a local socket to the daemon, which owns the tenant actor, the log, the projection, and the in-memory graph. The client does argument parsing, transport, and formatting. Nothing else.
- **If the daemon is absent, the client starts it and proceeds.** The first call in a cold environment pays the start once; every subsequent call is warm. `fabric doctor` reports which path a call took.
- **Latency budgets, p95, warm, measured in CI on the scaling harness's 10⁴-event corpus:**

| Verb | Budget | Why |
|---|---|---|
| `note` | 16 ms end to end | capture is correctness (§7) |
| `orient` | 150 ms | runs at every session start |
| `recall`, `slice` | 100 ms | lexical + graph; dense merged async |
| `describe` | 100 ms | the operator's first look |
| `bless` (one decision) | 50 ms to feedback | a keystroke must feel like a keystroke |
| `evaluate`, `reflect` | 50 ms | one line, one event |
| any verb, cold path | ≤ 2 s including daemon start | reported by `doctor` |

A budget regression fails the PR. The numbers live in one file and print in `fabric doctor --bench`.

### 19.3 Exit codes and refusal

| Code | Meaning | What the message contains |
|---|---|---|
| 0 | done | the receipt id |
| 2 | refused — unblessed verb, policy, or gate | **the exact command an operator would run to permit it**, printed but never executed |
| 3 | invalid input against the schema | the field, the constraint, and an example that would pass |
| 4 | not found | the nearest ids by prefix or alias |
| 5 | daemon unavailable and cold path failed | the `doctor` command |

Refusal is informative by design: an agent that hits exit 2 learns what the operator would need to bless and can say so in its reflection. It never retries around a gate.

### 19.4 The agent's day

The agent's whole use of the CLI, in the order it happens:

1. **Session start — the hook runs `fabric orient --json`.** Output: one line of R(t), then ≤ 8 candidates in line grammar with a `why` each, then any proposals *this session's predecessor* left in the inbox. Token budget is respected: `--budget <n>` caps total output characters, and the verb trims candidates before trimming the number.
2. **Work — the hook logs every file read** as a surfaced candidate. The agent does nothing.
3. **Retrieval on demand — `fabric recall "<query>" --json`** returns ranked candidates with ids the agent can cite verbatim. Citing an id in a reflection or a commit body is use. `fabric slice <id>` returns a node with its edges and live tensions.
4. **Recording — `fabric note`, `fabric bridge`, `fabric patch`, `fabric evaluate`** each take their arguments on one line, append one event, and print its id. Nothing interactive.
5. **Session end — the hook runs `fabric reflect`** with the session record on stdin: what loop moved, what measurement changed, what to challenge next, which model ran. Corrections detected in the session transcript are appended as proposed evaluations with the transcript span as evidence.
6. **Honesty — `fabric used <id> --because "…"` and `fabric missed <id> --because "…"`** let the agent say a candidate helped or did not. Neither is required; both are counted.

An agent never sees a prompt, a pager, a color code in `--json`, or a wait it did not pay for on a cold path.

### 19.5 The operator's minute

The operator's whole use of the CLI, in the order it happens:

1. **`fabric describe`** — the number first, then the inbox:

   ```
   Compounding: 14 of 31 retrievals used this week (R ↑ 3 sessions). Corrections repeated: 1.
   Waiting: 6 aliases · 3 evaluations · 2 bridges · 1 type · 1 foreign (did:…7f2a)
   ```

   One screen. Nothing below the fold that isn't optional.

2. **`fabric bless`** — the review. A keyboard-driven pass over the inbox, one proposal at a time, one keystroke per decision:

   ```
   [3/13]  a1f4  alias  "the seam" → managerial-praxis/membrane
           why: recall missed on this word twice (r7c2, r7d9)
           y bless   n dismiss   s skip   d detail   b batch-kind   u undo   ? help   q quit
   ```

   - `y` and `n` write one event and advance in under 50 ms; `s` leaves it; `d` shows the diff of what canonical would look like if blessed; `b` blesses every remaining proposal of this kind from this source after a single confirmation; `u` reverses the last decision; `q` exits with a one-line summary.
   - `because` is optional for the operator and taken from the same key: `y "good"` or just `y`.
   - **Batch and policy from the same place:** `fabric bless --kind alias --from did:… --all` for a one-off; `fabric trust did:… --kind alias --auto` to write a `trust.policy` so the next ones never reach the inbox.
   - **Selective and scriptable:** `fabric bless a1f4 b220 c9e1`, or `fabric bless --kind evaluation --yes` in a script, both honoring `--dry`.

3. **`fabric why <id>`** — the provenance chain for any node or event: who wrote it, caused by what, blessed when, cited where. A `causedBy` walk in line grammar. This is the operator's trust instrument.
4. **`fabric evaluate <id> --contradicted "because"`** — a correction typed directly, canonical on arrival.
5. **`fabric unbless <id>`, `fabric undo`** — every operator action is an event; every one reverses.

An operator is never asked to type an id they can see, never asked the same question twice, and never blocked on a decision they'd rather batch.

### 19.6 Setup and health

- **`fabric init`** is the ten-minute path, timed in CI on a fresh clone of a stranger's repo: installs the hooks and the skill tree, starts the daemon, imports git history and existing docs, runs the first `orient`, and prints what it did in line grammar. Idempotent; `--dry` shows the plan. If the first `orient` is empty on a repo with history, `init` has failed and says so.
- **`fabric doctor`** reports: daemon status and path, hooks present, schema drift, projection freshness, latency self-test against the budgets, and the last error with its `causedBy`. `--bench` runs the budgets.
- **`fabric log --tail`** streams receipts as they land, in line grammar; `--json` for the stream contract.

### 19.7 Standards the CLI is held to

- **Snapshot tests for every verb's TTY and `--json` output** on a fixed synthetic corpus. A change in output is a decision in `DECISIONS.md`, because agents and skills depend on it.
- **Contract tests for every exit code** and every refusal message's "what the operator would run."
- **No interactive path without a non-interactive equivalent.** Every keystroke in `bless` has a flag.
- **No pager, spinner, or color in machine mode.** Ever.
- **Help is generated and complete:** `fabric --help` lists every verb with its state (blessed/proposed) and one line; `fabric <verb> --help` prints arguments, an example, exit codes, and the budget.
- **Zero-dependency install beyond Node** for the client; native modules (SQLite, sqlite-vec, embeddings) live in the daemon.
- **Accessibility:** color is never the only signal; every TTY view has a plain equivalent (`--plain`).

### 19.8 Success criteria for the surface

The CLI is S-tier when, measured:

- `init` on a stranger's repo with a year of history produces a non-empty first `orient` in ≤ 10 minutes wall-clock, including install.
- An agent session runs with zero prompts, zero waits over budget on the warm path, and every output parsed by the hooks without a heuristic.
- An operator clears a thirteen-item inbox in under a minute using only `y`, `n`, and `b`, and can explain any item with `why` in one command.
- Every number `describe` prints reproduces from the log with `fabric describe --replay`.

---

## 20. The skill tree — **[narrowed]**

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
│   └── alias-proposing      alias.proposed     (first recall miss on the operator's word)
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

*(`corpus/schema-inducing` — held, D.4. `browser/*` — held, D.1.)*

---

## 21. Engineering standard — **[kept, extended]**

- TypeScript strict; no `any`. Effect for programs, typed errors, Layers, Streams.
- **Property tests, always green:** INV-NS-001, -002, -003; INV-FAB-006, -010, -011; INV-NS-009.
- **Every PR states** the loop it closes or tightens, the measured effect or measurement added, and the `because`. Numbers, not adjectives.
- **`DECISIONS.md` is the one decision log.**
- **No new dependency without** a one-line justification and its removal cost.
- **Generated artifacts are never hand-edited.**
- **Bench before merge** on any change to the fold, projection, retrieval, capture, **or the CLI's budgets and output contracts.** *(extended)*
- **Process boundaries are measured.** The daemon boundary pays for itself in the warm-path numbers of §19.2 or it is folded in.

---

## 22. Observability and the metrics that matter — **[narrowed, extended]**

Every metric is a fold; `describe` is the dashboard; there is no metrics store that is not the log.

| Metric | Definition | Where it shows |
|---|---|---|
| **R(t)** | Retrievals surfaced out-of-context and used, by session | `orient`'s first line, `describe`, README, site on trigger |
| **dR/dt** | Per-session series | `describe --history` |
| **Correction-repeat rate** | Corrections whose subject matches a prior blessed evaluation | `describe`; the number that sells *(new)* |
| **Time-to-context** | Turns from session start to first cited candidate | `describe` *(new)* |
| **hit@k, MRR** | From `compounding()` | CI, `describe --history` |
| **Proactive precision** | Used ÷ surfaced for `orient`'s k | governs k |
| **Miss count** | Citations of nothing surfaced; explicit `missed` | `describe` |
| **Proposal acceptance** | Blessed ÷ decided, by kind | `describe`; governs proposal rate |
| **Drift failures caught** | Commits failed by generated-doc drift | `describe` *(new)* |
| **Capture p99, retrieval p95, fold p95 by N** | Budgets of §19.2 | `doctor --bench`, every relevant PR |
| **R_sim** | R(t) on synthetic tenants, never merged | benching only |

*(Verb reuse — held with browser verbs, D.1.)*

---

## 23. Build order — THE LOCK's, gated by the log — **[narrowed; replaces v3 §23]**

| Step | Work | Finishes when |
|---|---|---|
| 1 | `bless reflect`; one reflection; one citation next session | **real R(t) = 1 on tenant zero** |
| 2 | Hooks: `PostToolUse` file-read harvest; stop-hook correction capture; model on receipt | use signal and evaluations appear without asking |
| 3 | `import:git` and doc import; `fabric init`; the daemon and thin client | a fresh clone has a non-empty first `orient` inside the budgets |
| 4 | Synthetic harness: firewall, discrimination proof, scaling numbers, committed baseline | the metric has teeth; the fold's breach point is known |
| 5 | SQLite projection; FTS5 + sqlite-vec + graphology; RRF; regression gate armed | retrieval p95 ≤ 100 ms at 10⁴; identity test green |
| 6 | `evaluation.recorded`; `fabric bless` review mode; correction-repeat rate in `describe` | the operator's minute exists; the number that sells exists |
| 7 | Generated docs + drift check; CLI snapshot and contract tests | a doc that lies fails the commit; an output change is a decision |
| 8 | Second tenant (cathedrals); DIDs, signing, `import:tenant`, trust policy, `fabric trust` | first cross-repo citation |
| 9 | `fabric init` on a dev lead's repo | correction-repeat rate on a team |
| 10 | Publish R(t) on the site | the site is a projection |
| 11 | Ax reranker at fifty retrievals | artifact beats baseline; proposed; blessed |

Steps may proceed in parallel where their gates allow. No step starts because it is interesting. Step 8 does not start until step 6 has produced a correction-repeat number on tenant zero.

---

## 24. Definition of done — **[kept, extended]**

1. **Does this output become an input?** Name the consumer.
2. **Is the `because` recorded** where the next session retrieves it?
3. **Is it retrievable outside its creation context,** and by what names?
4. **Did R(t) or a leading indicator move, or did this add the measurement?** Numbers; say which are `R_sim`.
5. **Does it round-trip** to the portable format with the identity test green?
6. **Does it derive from the schema of record** — no hand-written shape, no generated artifact edited by hand?
7. **Does its CLI path hold its budget and its output contract,** for the agent and for the operator? *(new)*

If any answer is no, say so in the first sentence of the report and propose the smallest change that flips it.

---

## 25. You are corpus — the session protocol — **[kept]**

- **Start.** Read what `orient` surfaces. Cite what you use; citation is how R(t) is measured.
- **Every non-trivial decision:** one-line `because` in `DECISIONS.md`. Every rejected approach: recorded with its reason.
- **Every correction from the operator:** written as an author evaluation before anything else happens.
- **Every tension you notice:** recorded as a relation, never resolved by you.
- **Every proposal** carries cited instances, a `because`, and a falsifier, or it is an opinion and you do not emit it.
- **End.** A session record through `reflect` — what loop moved, what measurement changed, what you would challenge next and why, which model ran. Until `reflect` is blessed, in the reconciliation file, saying so.

---

## 26. What not to build — **[kept, extended]**

- **CRDT and sync frameworks.** Single sovereign operator per tenant; git is the sync; per-session append files are the concurrency answer.
- **A vector database server.** sqlite-vec in the projection file is the whole requirement.
- **An ORM.**
- **Any GUI before the CLI meets §19.8.** *(new)*
- **Agent orchestration frameworks.** The verb runtime is the framework; Ax is for optimization only. INV-NS-011. *(from §28.10)*
- **A capture surface that requires a cold start.**
- **An interactive prompt without a flag, or a `--json` mode that is not a contract.** *(new)*
- **A second decision log, a second name for the node, a second relational primitive, a second way to do anything the verb model already does.**
- **Anything whose effect on retrieval-and-use is not measured.**

---

## 27. Posture — and how this document changes — **[kept]**

Push back on scope. Prefer the deep cut on the loop to horizontal breadth, every time, until the loop closes end to end — then again at the next scale. Prefer the honest result to the impressive one.

When you disagree with anything here, say so with a reason and a proposed amendment. This document is corpus. It changes only by a new version Danny gives; a session's proposed amendments go in the reconciliation with their `because`, and the accepted ones are marked in the next version.

Expect this to be hard. Do it anyway, and do it well enough that the next session inherits a system, not a pile — and that a stranger's `fabric init` reproduces the number.

---

## 28. Multi-tenancy and epistemic semantics — the lock's portion — **[narrowed from §28]**

### 28.1 The governing sentence — **[kept]**

**Canonicality is per-tenant.** There is no global projection of record. A fact that crosses a tenant boundary is always an import — proposed in the receiving tenant, never canonical — until that tenant's blessing, or a blessed policy of that tenant, admits it. Multi-tenant means multi-canonical.

### 28.2 Tenants are identities — **[kept]**

- Every tenant has a keypair, expressed as a DID (`did:key` locally). The operator is a tenant; each specialized agent is a tenant; a `sim:<run>` has a throwaway key.
- Every event is signed by its tenant's key. INV-NS-006.
- Any node, edge, or event is addressable as `fabric://<did>/<collection>/<rkey>`.
- Private keys never enter the log, the projection, or any export. Rotation is `key.rotated`, chained.

### 28.3 Namespaced kinds — **[kept]**

Event kinds and types are reverse-DNS identifiers (`dyer.fabric.reflection`, `dyer.fabric.retrieval.surfaced`, `dyer.meta.type`); the schema of record is the registry; plugins declare in their own namespace; kinds carry versions and old events fold under the version they were written in.

### 28.4 Cross-tenant provenance and trust — **[kept]**

- `import:tenant:<did>` reaches canonical only by the receiving tenant's blessing or blessed policy (§5 table).
- **Trust is a policy, and a policy is a blessed node** — per source, per kind; written by `fabric trust`. Absent a policy, everything foreign is held.
- A foreign claim carries its source's blessing state as evidence, not authority. INV-NS-007.
- Contradiction across tenants is a `contradicts` edge across addresses; neither projection changes.
- Retrieval may span subscribed tenants; foreign candidates are marked; R(t) reports per source.

### 28.5 Specialized agents as tenants with delegated capability — **[narrowed]**

- A dedicated agent is a tenant: own log, projections, key, and a manifest scoped to its verbs.
- Capability is delegated, attenuated, and signed: verbs, spaces it may propose into, kinds, expiry, budget. Grants only narrow. INV-NS-008. The minimal signed grant is built; *(UCAN adoption — held, D.7)*.
- The grant is an event in both logs (`capability.granted`, `.revoked`); the delegation graph is a projection.
- An agent's verbs run under its own DID; its events cross as `import:tenant` proposals gated by policy. Directive 4 satisfied literally.
- Specialization is a manifest and a corpus, not a fork. Compounding is measured per agent tenant.

### 28.6 Subscription and the local stream — **[narrowed]**

- A tenant subscribes to another's stream by kind; locally this is reading another log directory through a Layer. The subscriber folds what arrives into shadow under `import:tenant`.
- The stream is the same Effect Stream that feeds `log --tail`.
- A subscriber that falls behind replays from its last `(did, step)`. *(Network relay — held, D.8.)*

### 28.7 The semantics that never change — **[kept from §28.7.1]**

| Semantic | Statement |
|---|---|
| Source of truth | The tenant's signed, append-only log. Never a projection, cache, gateway log, or replica. |
| Write path | Never depends on the network; a disconnected writer appends its own file and is merged by `step`. INV-NS-009. |
| Canonicality | Per tenant. INV-NS-007. |
| Identity and signing | The DID is the tenant wherever it runs; keys are never shared. INV-NS-006. |
| Provenance and `because` | Every event carries actor, model, and reason. INV-FAB-011. |
| Projection disposability | Any projection can be dropped and replayed. |
| Surfaces are stateless | The CLI, the hooks: invoke verbs, read projections, hold nothing. |
| Compounding is measured everywhere | One `compounding()` per tenant. |
| Deployment is per tenant, by trigger | Nothing deploys because it can. *(All deployed rows — held, D.8.)* |

### 28.8 Orchestration — a projection, not a framework — **[kept from §28.10; checkpoint kind held]**

Orchestration frameworks do not enter the house. Who may do what is the delegation graph; what happened is the trace over receipts and `causedBy`; an "orchestrating agent" is a tenant with grants that sub-delegates; parallelism and retry are Effect's, inside a verb; subagents are permitted as the *inside* of a verb, never as a layer that decides which verbs run. INV-NS-011. *(Durable verbs with checkpoints and Workflows — held, D.9.)*

---

## Appendix A — event kinds in the lock — **[narrowed]**

| Kind | Actor | State on arrival | Notes |
|---|---|---|---|
| `space.*`, `verb.*`, `source.*` | runtime / author | canonical | bookkeeping |
| `receipt` | any | as actor | every verb's completion, with model |
| `note.captured` | author / agent | as actor | one string; **proposed kind** |
| `reflection.recorded` | agent | proposal | via `reflect` |
| `bridge.proposed` / `.decided` | agent / author | proposal / canonical | relation with evidence |
| `patch.proposed` / `.decided` / `.outcome` | agent / author / agent | proposal / canonical / proposal | hypothesis stated to fail |
| `retrieval.surfaced` | any | canonical (bookkeeping) | INV-FAB-010; includes hook file reads |
| `retrieval.used` / `retrieval.missed` | agent / author | canonical (bookkeeping) | explicit honesty; **proposed kind** |
| `alias.proposed` / `.decided` | agent / author | proposal / canonical | **proposed kind** |
| `type.proposed` / `.decided` | agent / author | proposal / canonical | frontmatter and plugin kinds only; **proposed kind** |
| `evaluation.recorded` | author / agent | canonical / proposal | corrections; **proposed kind** |
| `verb.proposed` / `.decided` / `.deprecated` | agent / author / author | proposal / canonical / canonical | plugin verbs |
| `optimizer.artifact.proposed` / `.decided` | agent / author | proposal / canonical | Ax at its trigger |
| `import:git`, `import:transcript`, `import:tenant:<did>` | import | proposal | day-one corpus; conversations; foreign |
| `import:synthetic` | import | sim tenants only | INV-NS-003 |
| `blessing` / `unblessing` | author | canonical | the gate |
| `key.rotated` | own tenant | canonical | chained *(§28)* |
| `capability.granted` / `.revoked` | issuer | canonical in both tenants | delegation graph *(§28)* |
| `trust.policy` | author | canonical | per source, per kind *(§28)* |
| `subscription.opened` / `.closed` | subscriber | canonical | by kind, from a DID *(§28)* |

*(`browser.action` — D.1; `checkpoint` — D.9; `tier.decided` — D.10.)*

## Appendix B — invariants in the lock — **[kept, extended]**

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
| INV-NS-006 | An event whose signature does not verify against its actor's DID is unrepresentable. |
| INV-NS-007 | No event reaches a tenant's canonical by virtue of another tenant's blessing. |
| INV-NS-008 | A delegated capability can only narrow. |
| INV-NS-009 | A tenant's log is appended only by its actor; sessions append to their own files and are merged. |
| INV-NS-010 | No gateway, cache, or telemetry store is read by any fold. *(kept as general principle)* |
| INV-NS-011 | No action is taken in any tenant except through a verb in its manifest, and every execution is a receipt with a `because`. |
| **INV-NS-012** | Every verb is a CLI subcommand with a generated `--json` contract, and no CLI path prompts without a flag equivalent. *(new)* |
| **INV-NS-013** | A refusal (exit 2) prints the permitting command and never executes it. *(new)* |

## Appendix C — triggers in the lock — **[narrowed]**

| Trigger | Unlocks |
|---|---|
| `pnpm fabric bless reflect` | everything |
| first real citation of a prior session's node | R(t) = 1 |
| first `recall` miss on the operator's own word | `alias.proposed` |
| first correction recorded through the fabric | `evaluation.recorded` in canonical |
| a correction-repeat number on tenant zero | step 8 (second tenant) |
| fold breach point within a year of real cadence | SQLite projection now, not held |
| a second tenant on this machine | DIDs, signing, capability grants, `fabric trust` |
| the first cross-tenant citation | per-source R(t) |
| fifty real retrievals with use signal | Ax; regression gate armed on real data |
| a number worth publishing | R(t) on the site |
| a stranger's `fabric init` inside ten minutes | turn 3 |

## Appendix D — held outside the lock, with trigger and original location — **[held]**

| # | What | Original | Trigger to return |
|---|---|---|---|
| D.1 | Browser verbs: Tesseract as verbs; `discover`/`crystallize`/`run`; `import:browser`; `browser.action`; verb-reuse metric; skill branch `browser/*`; req. §1.8 | v3 §17, §1.8, §5 row, §6 kind, §20 branch, §22 row, App A | turn 2 complete; a second product on the same spine |
| D.2 | Further plugins beyond the Claude Code integration; Electron dynamic import | v3 §18 | first plugin blessed and measured |
| D.3 | Electron surface; RPC contracts; Electron forms; TTY in xterm; dashboard beyond `describe`; TanStack Query, CodeMirror, chart library; req. §1.10 as GUI | v3 §19, §12 rows, §6 derivations, §1.10 | capture, retrieval, evaluation measured in the daemon; §19.8 met |
| D.4 | The metamodel induction loop: session-start analysis for unnamed patterns; `schema-inducing` skill; regenerate-everything from blessed types beyond §11's scope | v3 §11, §20 branch | twenty reflections in the operator's projection |
| D.5 | Markdown round-trip: agent edits to prose rendered back to markdown; PR as blessing surface for prose; voice separation by skill; the site as projection of blessed works | v3 §10 | a prose work edited by an agent |
| D.6 | External mappings: Tana, Obsidian, Logseq, JSON-LD | v3 §12 rows | a second house the corpus must visit |
| D.7 | UCAN adoption | §28.5 | a second issuer of capabilities |
| D.8 | Network relay; every deployed row — Durable Objects, D1, Vectorize, R2, Queues, Workers; Tunnel and Access; deployed tenant walkthrough; federation and the wire | §28.6, §28.7.2, §28.7.3, §28.9, §28.11 | a surface on another device; a tenant reachable from another machine; a second operator off-machine |
| D.9 | Durable verbs with checkpoints; `checkpoint` kind; Workflows | §28.10, App A | a verb that must outlive a process |
| D.10 | Inference tiers; Workers AI; AI Gateway; `tier.decided` kind | §28.8, App A | a verb whose model must run at the edge |

Nothing in this appendix is deleted from the lineage. Each returns by its trigger, as a new version Danny gives.

## Appendix E — the ledger: every unit of v3 and §28 against v4 — **[new]**

**Disposition key:** K = kept whole · N = narrowed (cut named inline, held part in D) · R = replaced/rewritten for the lock · H = held whole in D · X = extended (kept plus additions marked *new*)

| Original unit | Disposition | Where in v4 | Cut, if any → held at |
|---|---|---|---|
| v3 preamble | R | preamble | scope statement rewritten; tags added |
| v3 §0 | K | §0 | — (one sentence added, marked) |
| v3 §1 | N | §1 | 1.8 → D.1; 1.9 induction → D.4; 1.10 GUI → D.3 |
| v3 §2 | N | §2 | browser/Electron terms; four terms added (Inbox, Correction, Daemon, plugin scope) |
| v3 §3 | N | §3 | Electron band → D.3; browser verbs → D.1; round-trip → D.5 |
| v3 §4 | K | §4 | — |
| v3 §5 | N | §5 | `import:browser` row → D.1; `import:tenant` row added from §28.4 |
| v3 §6 | N | §6 | `browser` kind → D.1; RPC/form derivations → D.3; lock's verb list added |
| v3 §7 | N | §7 | Electron main as resident process → D.3; daemon named |
| v3 §8 | K | §8 | — |
| v3 §9 | K | §9 | — |
| v3 §10 | N | §10 | round-trip, voice, site-of-works → D.5; docs-as-nodes added from THE LOCK |
| v3 §11 | N | §11 | induction loop → D.4; frontmatter/plugin-kind admission kept |
| v3 §12 | N | §12 | RPC, Electron forms, dashboard enums → D.3; external mappings → D.6; CLI contracts added |
| v3 §13 | K | §13 | — (hook capture of corrections made explicit) |
| v3 §14 | K | §14 | — |
| v3 §15 | K | §15 | — |
| v3 §16 | K | §16 | — (trigger unchanged) |
| v3 §17 | H | D.1 | whole |
| v3 §18 | N | §18 | further plugins, Electron import → D.2/D.3; namespacing added from §28.3 |
| v3 §19 | R | §19 | Electron, TTY-in-xterm, dashboard → D.3; CLI expanded to a full specification |
| v3 §20 | N | §20 | `browser/*` → D.1; `schema-inducing` → D.4 |
| v3 §21 | X | §21 | CLI budgets and contracts added to bench-before-merge |
| v3 §22 | X/N | §22 | verb reuse → D.1; correction-repeat, time-to-context, drift-caught added |
| v3 §23 | R | §23 | replaced by THE LOCK's eleven steps; gating semantics kept |
| v3 §24 | X | §24 | criterion 7 added |
| v3 §25 | K | §25 | — |
| v3 §26 | X | §26 | GUI-before-CLI, prompt-without-flag added; orchestration line from §28.10 |
| v3 §27 | K | §27 | — (last clause updated to the stranger's `init`) |
| v3 App A | N | App A | `browser.action` → D.1; `checkpoint` → D.9; `tier.decided` → D.10; `retrieval.used/missed` added; §28 kinds merged |
| v3 App B | X | App B | §28 invariants merged; INV-NS-012, -013 added |
| v3 App C | N | App C | held triggers → D; correction-repeat gate and stranger's-init added |
| §28.1 | K | §28.1 | — |
| §28.2 | K | §28.2 | — |
| §28.3 | K | §28.3 (+§18) | — |
| §28.4 | K | §28.4 (+§5 row) | — |
| §28.5 | N | §28.5 | UCAN → D.7 |
| §28.6 | N | §28.6 | network relay → D.8 |
| §28.7 (28.7.1) | K | §28.7 | — |
| §28.7 (28.7.2, 28.7.3) | H | D.8 | whole |
| §28.8 | H | D.10 | model-on-receipt already in §4; INV-NS-010 kept in App B as general |
| §28.9 | H | D.8 | whole |
| §28.10 | N | §28.8 | checkpoint/Workflows → D.9 |
| §28.11 | K→H | D.8 | federation was already held; recorded there |
| §28.12 | K | App B | — |
| §28.13 | N | App A | `checkpoint`, `tier.decided` → D.9, D.10 |
| §28.14 | N | App C / D | held triggers moved to D |
| §28.15 | K | §28 closing, §26 | — |

**The equation.**

Original units: v3 = 32 (preamble, §0–§27, App A–C) · §28 = 16 (28.1–28.15, with 28.7 counted as two) · **total 48**.

Dispositions, counted row by row above:

| | v3 | §28 | Total |
|---|---|---|---|
| K — kept whole | 10 (§0, 4, 8, 9, 13, 14, 15, 16, 25, 27) | 7 (28.1, 28.2, 28.3, 28.4, 28.7.1, 28.12, 28.15) | 17 |
| N — narrowed | 14 (§1, 2, 3, 5, 6, 7, 10, 11, 12, 18, 20, 22, App A, App C) | 5 (28.5, 28.6, 28.10, 28.13, 28.14) | 19 |
| X — extended | 4 (§21, 24, 26, App B) | 0 | 4 |
| R — rewritten for the lock | 3 (preamble, §19, §23) | 0 | 3 |
| H — held whole | 1 (§17) | 4 (28.7.2–3, 28.8, 28.9, 28.11) | 5 |
| | **32** | **16** | **48** |

The two dual-tagged rows resolve as follows: §22 (X/N) is counted under N because it lost a metric to D.1; §28.11 (K→H) is counted under H because federation was already held and now lives in D.8. Every unit appears in exactly one row. Every cut names its D entry. Every D entry names its trigger and its original.

Additions that did not exist in v3 or §28: §19 (the CLI specification), four vocabulary terms, three metrics, DoD criterion 7, two "what not to build" lines, two invariants, two event kinds, two triggers, Appendix D's structure, and this ledger. Each is marked *new* at its location.

**Nothing was cut that the lock did not require; nothing the lock required was left uncut; nothing cut was lost.**
