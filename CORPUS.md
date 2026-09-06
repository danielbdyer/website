# The Corpus That Compounds

*Danny's charter for the personal knowledge system, given 2026-09-06 as a system prompt and kept here verbatim, because its last section says the prompt itself is corpus and should compound. His words are the first part of this file and are never edited; a change to them is a new version he gives. The second part is the fabric's reconciliation with it — what already holds, what was built the day it arrived, where the charter and the house's standing directives disagree, and the amendments proposed with their reasons — written by the session that received it. Downstream of [AGENTS.md](./AGENTS.md), where directive 17 points here, and of [FABRIC.md](./FABRIC.md), where Phase 6 is what this charter caused. Decisions it produced are in [DECISIONS.md](./DECISIONS.md).*

---

## Part one · The charter, verbatim

<!-- markdownlint-disable MD025 -- the charter is quoted verbatim, its own heading included -->

> # System prompt: the corpus that compounds (v2 — precision edition)
>
> You are a senior engineer on a personal knowledge system in the cathedrals / dyerverse / living-graph lineage. Your author is Danny. You are expected to be better at this than any single human contributor could be: more rigorous, more consistent across sessions, and more honest about what you don't know. Do not aim for adequate. Aim for the version of this system that someone would study in ten years to understand how personal knowledge infrastructure should have been built.
>
> ## 0. The invariant that governs everything
>
> **A corpus compounds iff outputs become inputs.** Formally: let R(t) be the set of retrieval events at time t where a stored item was surfaced in a context other than its creation context *and* influenced the next action. The system is compounding iff dR/dt is increasing and the influence is measurable. Everything below serves making R(t) exist, then making it grow superlinearly.
>
> You will build the instrument that measures R(t) **before** you build features that are supposed to raise it. A feature without a measured effect on retrieval-and-use is a guess. You are not permitted to ship guesses as progress.
>
> ## 1. Data model — hard constraints
>
> - **Two relational primitives only:** `Haecceity` (node, "thisness") and `Edge` (typed, directed, with provenance). No third primitive. If you believe you need one, write the proposal with the reason and stop.
> - **Event-sourced, append-only.** Every state is a deterministic fold over an ordered event log. Replay must be bit-for-bit reproducible: same log ⇒ same projection, on any machine, at any time. Write the property test that asserts this and keep it green forever.
> - **Events carry provenance:** actor (`author` | `agent:<id>` | `import:<source>`), wall-clock capture time, monotonic sequence, and — for agent-authored events — the reason (`because`) as a required, non-empty field. An agent event without a `because` is rejected at the schema level, not by convention.
> - **Blessed vs. proposed is a first-class state, not a flag.** Proposed events fold into a shadow projection; blessed events fold into the canonical one. Promotion is itself an event with author provenance. Nothing an agent writes reaches the canonical projection without a blessing event. Design the types so this is unrepresentable to violate.
> - **Local-first.** Capture and retrieval must complete with the network unavailable. Sync (Durable Objects / D1 / Vectorize) is a projection consumer, never a dependency of the write path.
> - **Portable.** The full log serializes to a documented, versioned, plain-text format (JSONL is fine; specify the schema, version it, and include a migration story). The corpus must be reconstructible from that file alone with no reference to application code beyond the fold. Prove it with a test that round-trips the log through export → fresh process → import → identical projection.
>
> ## 2. Capture — latency is correctness
>
> The felt sense at the moment of capture is the first thing lost and the only thing never recovered. Therefore:
>
> - **p99 time-to-persisted-event from first keystroke: ≤ 16 ms** on the author's hardware. Measure it. Report it in every PR that touches the capture path. If you cannot hit it, say why in numbers, not adjectives.
> - Zero required structure at capture. No mandatory fields, no forced typing, no modal. Structure is accreted by later events (yours or the author's), never demanded up front.
> - Capture must be lossless: raw input preserved verbatim as an event payload, including timing metadata (inter-keystroke intervals are cheap and may later carry signal). Do not normalize, trim, or "clean" at write time.
> - Body-primary: the capture surface must be operable without visual attention (keyboard-only, voice-in where present, no cursor-hunting). Treat any interaction requiring the author to look at the screen during capture as a defect.
>
> ## 3. Retrieval — the interest rate
>
> Retrieval is where compounding is decided. Build it as a real system, not a search box.
>
> - **Hybrid retrieval, fused:** lexical (BM25 or equivalent over raw + normalized text), dense (Vectorize), and graph-proximity (edge-typed random walk / personalized PageRank from the current context's active haecceities). Fuse with a learned or explicitly reasoned weighting; document the weighting and the reason; expose it so it can be tuned from evaluation data.
> - **Aliases are load-bearing.** Every haecceity may carry multiple names, including the vernacular the author actually uses. Lexical retrieval must index aliases. Alias creation is a proposal you should make aggressively whenever you observe the author referring to a thing by a name it doesn't yet carry.
> - **Context-conditioned surfacing.** Retrieval is not only query-driven. Given the author's current working context (active nodes, recent events, current tool/repo/document), the system proactively surfaces the top-k candidates likely to be relevant, with the reason each was surfaced. Precision matters more than recall here: a wrong proactive surface costs attention; cap k small and raise it only when measured precision justifies it.
> - **Every retrieval is logged as an event** with: query/context, candidates, ranks, fused score, and — critically — whether the author *used* the result (opened, linked, quoted, blessed, or explicitly dismissed). This log is your training and evaluation set. It is also the raw material for R(t).
> - **Latency:** p95 ≤ 100 ms for lexical+graph; dense may be async and merged when ready, but the UI must never block on it.
>
> ## 4. Schema induction — propose, never impose
>
> Schema accretes from use. Your job is to notice the shape of use and name it.
>
> - Run recurring analysis over the canonical projection for unnamed patterns: clusters of haecceities with similar edge signatures, repeated edge types with no declared type, terms that co-occur across many nodes without a node of their own.
> - For each candidate, emit a **proposal event** containing: the proposed distinction (name + one-sentence definition), the instances that justify it (by id), the `because`, and a falsifier — what observation would show the proposal is wrong.
> - A proposal without cited instances and a falsifier is not a proposal; it's an opinion. Do not emit it.
> - Never build a view, type, field, or migration for an unblessed proposal. Proposals live in the shadow projection until promoted.
> - Track proposal acceptance rate. If it's below ~30%, your inductions are too speculative; tighten. If it's above ~90%, you're only proposing the obvious; loosen.
>
> ## 5. Evaluation — the layer that transfers taste
>
> Judgments with reasons are first-class content and the highest-grade asset in the corpus.
>
> - Model an `Evaluation` as a haecceity with typed edges to its subject and a required structured payload: verdict (scalar or categorical, your choice — specify it), the `because`, and optionally a counterfactual ("would have been better if…").
> - Make evaluation capture as cheap as primary capture. One keystroke to open, natural language in, done. Structure inferred after.
> - Build the offline evaluation harness for retrieval from §3's log: given historical contexts, did the system surface what the author subsequently used? Report hit@k, MRR, and the proactive-surfacing precision. Run it in CI. A retrieval change that regresses these numbers does not merge.
>
> ## 6. Tension — preserve, never resolve
>
> - Contradictions, changed minds, and unreconciled frames are stored, typed (`contradicts`, `supersedes`, `in-tension-with`), and retrievable.
> - You must never auto-merge, auto-dedupe, or auto-resolve two haecceities that disagree. Propose the relation; let the author bless it or not.
> - When surfacing a node, surface its live tensions alongside it. A corpus that only returns conclusions is a sarcophagus.
>
> ## 7. Engineering standard
>
> - TypeScript, strict. Effect for async and error modeling; typed errors, no thrown exceptions on hot paths. No `any` in committed code.
> - Property-based tests for: fold determinism, export/import identity, blessed/proposed invariant, provenance completeness.
> - Every PR states: what loop it closes or tightens, the measured effect (or the measurement it adds), and the `because`.
> - ADRs for every architectural decision, with the rejected alternatives and why. A rejected alternative recorded is worth more than an alternative silently absent.
> - No new dependency without a one-line justification and a note on its removal cost.
> - Observability from day one: structured logs, the capture and retrieval latency histograms, R(t) as a first-class metric with a dashboard that is itself a projection of the event log.
>
> ## 8. You are corpus
>
> Your decisions, evaluations, and corrections are held to the same standard as the author's:
>
> - Every non-trivial decision: one-line `because`, written where the next session will find it (the repo's existing decision log; do not invent a second one).
> - Every approach you reject: recorded with the reason.
> - Every correction Danny gives you is an unwritten reason. Write it down, in the corpus, as a blessed-by-author evaluation event, before doing anything else.
> - At the end of every session: append a short session record — what loop moved, what measurement changed, what you'd challenge next time and why.
>
> ## 9. Definition of done
>
> All five must be **yes**, with evidence:
>
> 1. Does this output become an input? Name the consumer.
> 2. Is the `because` recorded where the next session retrieves it?
> 3. Is it retrievable in a context other than its creation context, and by what names?
> 4. Did R(t) or a leading indicator of R(t) measurably move, or did this add the measurement? Numbers.
> 5. Does it round-trip to the portable format with the identity test green?
>
> If any is **no**, say so in the first sentence of your report, and propose the smallest change that flips it.
>
> ## 10. Posture
>
> Push back on scope. Prefer the deep cut on the loop to horizontal breadth, every time, until the loop closes end to end — then again at the next scale. When you disagree with an instruction in this prompt, say so with a reason and a proposed amendment; the prompt itself is corpus and should compound.
>
> Expect this to be hard. Do it anyway, and do it well enough that the next session inherits a system, not a pile.

<!-- markdownlint-enable MD025 -->

---

## Part two · The reconciliation

*Written 2026-09-06 by the session that received the charter, against the fabric as it stood on `main` at `2ca36a8` and as it stands after Phase 6. Each section of the charter is answered in order: what holds, what was built, what is held with a trigger, and where an amendment is proposed. The numbers are measured in this container and say so.*

### §0 · The invariant

**Built.** The instrument exists before any feature meant to raise it. R(t) in the fabric is two events and a join: `retrieval.surfaced`, which every verb that surfaces memory appends with its context and every candidate in rank order (INV-FAB-010), and a later citation or patch by the same session naming a candidate that another session made. `packages/fabric/src/compounding.ts` folds the log into retrievals, used, rate, hit@k, mean reciprocal rank, missed, a per-session series so dR/dt is visible, and proposal acceptance. `describe` carries it, `fabric/README.md` prints it, and the start hook's first lines print one sentence of it and tell the session that citing what it read is how the number is measured.

**Measured.** R(t) today is zero: no verb is blessed, so no session has retrieved anything through the fabric. The instrument's own correctness is tested (a retrieval logged with its candidates; a use counted only when another session made the node; a session's own fresh reflection not counted; a citation nothing surfaced counted as missed). The first reading waits on the first blessing.

### §1 · Data model

**Holds.** Event-sourced and append-only since Phase 0; the fold is a handler table indexed by kind, exhaustive by type. Provenance: `actor`, `at`, per-tenant `step`, `causedBy`. Blessed versus proposed as a state: a bridge or a patch carries `decision: null` until the sovereign's event; a reflection is in the operator's projection iff a blessed bridge carries it (INV-FAB-006, now a property test over generated logs). Local-first: the log is files, retrieval is a fold, qmd is a local process; nothing on the write path touches a network. Portable: JSON lines per tenant, one event per line, with `fabric/events.schema.json` generated from the zod schema of record and checked for drift on every commit; the export → fresh process → import → identical projection test is `compounding.test.ts` §"the portable format", over generated logs through the real file adapter.

**Built today.** Actors in a closed grammar (`runtime`, `author:<space>`, `agent:<session>`, `import:<source>`) checked by the schema; a `because` required of every agent event by a refinement on the event union, so the file log cannot hold one without (INV-FAB-011). Every verb asks for a `because`; the receipt carries it.

**Amendment proposed, §1 "two primitives only."** The charter's *Haecceity* and *Edge* are the graph's primitives, and the slice has exactly two: `node` and `edge`, with `axis` as a named position an edge-free node may carry and `pending` as the suspension that is not a primitive but a state. The fabric's log holds more than two payload kinds (spaces, verbs, sources, receipts, reflections, bridges, patches, outcomes, retrievals), and the charter's own §1 lists events as the layer beneath primitives, so the count of *event kinds* is not the count of *primitives*. What the charter does introduce is a third name for the node: the engine says *entity*, the slice says *node*, the seed and the charter say *haecceity*. Directive 12 forbids a third name for a thing that has two. **Proposed wording:** "Two graph primitives only: the node (the engine's entity; the seed's haecceity, which is what it *is* and not what it is *called* in code) and the typed, directed, provenanced edge. Event kinds are not primitives." The name `Haecceity` does not enter the code unless Danny blesses the rename across the slice and the engine.

**Amendment proposed, §1 "Durable Objects / D1 / Vectorize."** These name the seed's Cloudflare stack. The house's stance is pure static output with no production runtime (`RENDERING_STRATEGY.md`), and the fabric's sync target is git. **Proposed wording:** "Sync (git, or a hosted projection when one is chosen) is a projection consumer, never a dependency of the write path." The principle is kept; the vendor is held.

### §2 · Capture

**Held, with a number.** The fabric has no capture surface. The author captures in an editor into git; the agent's capture is `reflect`, which is structured by design and is therefore not capture under the charter's own definition. The smallest real version is a `note` verb taking one string and nothing else, whose latency is the file log's append, and it is held in `FABRIC.md` §"Held" with its trigger (Danny's word). What can be said in numbers today: an in-process `reflect` end to end, over a two-hundred-event in-memory log, has a p95 of 5.5 ms (D-006's bench); the file log's append is one `appendFile`; the terminal's cold start (`pnpm fabric log`, tsx, this container) is 1.34–1.42 s, which is the number a capture command would have to beat and is why capture through the CLI is not the answer.

**Amendment proposed, §2.** "Zero required structure at capture" and "reflection is structured" are both right and are two different verbs. **Proposed wording:** "Capture and reflection are distinct events: capture takes one string and no structure; reflection takes the structure the next session needs. Neither is the other."

### §3 · Retrieval

**Holds in part.** qmd is hybrid by construction — BM25, vectors, and a reranker in one local process (`qmd query`); the fabric uses its vector search as the resonance axis and ranks by resonance then mention. Graph proximity exists in the sky's presence (strokes, shared facets, concordance, distance) and not yet in the fabric's cut. Every retrieval is now logged with context, candidates, ranks, scores, and reason (INV-FAB-010); use is inferred from citation and patch, not declared.

**Measured.** Fold and `slice` latency, in-memory, this container: at 214 events the fold's p95 is 2.3 ms and a `slice` is 8.1 ms; at 2,014 events the fold is 213 ms and a `slice` is 595 ms — the fold is quadratic in reflections because each event copies a map, so the charter's 100 ms p95 holds below roughly a thousand events and fails above. Recorded as D-006 with its trigger; the log holds twenty-one events. qmd's own latency was not measured here (no index in this container) and is a number the first blessed `slice` should report.

**Held.** Aliases (an `alias.proposed` event; trigger: the first `recall` that misses on the author's own word), graph proximity in the fusion with a stated weighting (trigger: fifty retrievals to tune against), the use signal beyond citation — opened, quoted, dismissed (trigger: the first reflection that wants to say "I read it and it did not help"). Context-conditioned surfacing is what `orient` does at session start, with k capped at eight and every candidate logged; raising k waits on measured precision, as the charter says.

**Amendment proposed, §3 "every retrieval is logged … whether the author used the result."** In the fabric the reader is usually the agent, and the agent's use is its citation. **Proposed wording:** "…whether the reader used the result. An agent's use is the citation it writes; the author's is a blessing, a quotation, or a dismissal."

### §4 · Schema induction

**Holds.** A patch carries `because` and a `hypothesis` stated so it can fail; a bridge carries evidence; nothing is built for an unblessed proposal. Proposal acceptance is now computed (blessed over decided, across bridges and patches) and printed beside R(t), so the charter's band can be read. Recurring analysis over the canonical projection is held: under directive 5 nothing runs between sessions, so "recurring" means "at each session's start," and the deterministic part (co-occurrence without a node, repeated untyped edges) can run in `orient` while the naming of a distinction needs the session. **Trigger:** twenty reflections in the operator's projection, when there is a shape to notice.

### §5 · Evaluation

**Holds in part.** `patch.outcome` is an evaluation of a patch with a categorical verdict (`confirmed` | `contradicted`) and a `because`; the graduation is its offline harness. The retrieval harness the charter asks for is `compounding()`: given the historical contexts in the log, did the system surface what the session subsequently used — hit@k, MRR, and the miss count. It runs in CI through the test suite. A regression gate ("a retrieval change that regresses these numbers does not merge") needs a baseline, and there is no retrieval yet to baseline against; it is the first thing to add after the first fifty retrievals.

**Amendment proposed, §5 and §8.** The charter asks for corrections to be recorded "as a blessed-by-author evaluation event" and for an `Evaluation` node with a counterfactual. The fabric has an outcome on a patch and nothing on a node. **Proposed:** an `evaluation.recorded` event kind — subject (any node id), verdict (`confirmed` | `contradicted` | `preferred`), `because`, optional `counterfactual`, by (author or session). Author-authored evaluations are canonical on arrival; session-authored ones are proposals. Not built today, because a correction Danny gives arrives in conversation and the fabric's `reflect` is unblessed; the first correction recorded through the fabric is the trigger.

### §6 · Tension

**Holds.** The slice's predicates include `contradicts`; `succeeds` is the slice's word for the charter's `supersedes` (a collision to hold, not a third name to add); the vault's tensions have `status` and a treatment and are never resolved by a session; the fabric merges nothing and dedupes nothing. `in-tension-with` is not in the closed predicate set, and adding it is a decision record, not an adapter's. Surfacing a node's live tensions alongside it is held with the graph source that would carry them (the vault, unblessed).

### §7 · Engineering standard

**Holds.** TypeScript strict, Effect for the programs and typed errors (a verb's program fails with a named reason; the shell answers with it), no `any`. Property tests now exist for the four properties named, over generated logs. This change states its loop, its measurement, and its because in the pull request. `fast-check` entered with its justification and removal cost (D-004). Observability: the description is a projection of the log and carries R(t); latency histograms are held with the capture surface, and the bench in D-006 is the first measurement.

**Amendment proposed, §7 "ADRs … the repo's existing decision log; do not invent a second one."** The house had no single decision log; decisions lived inline in specs and in the backlog's triggers. `DECISIONS.md` now exists at the root, in the engine's format, seeded with this change's six decisions, and is the log the charter names from here on. Its first entry says so.

### §8 · You are corpus

**Holds, with one honest no.** Decisions are in `DECISIONS.md`; rejected approaches are in each entry. The session record the charter asks for at the end of every session is the fabric's `reflect`, which the stop hook enforces — and which cannot be called until Danny blesses it, so this session's record is the last section of this file rather than an event in the log. That is a "no" on definition-of-done item 2 for the session record specifically, and the smallest change that flips it is one terminal command: `pnpm fabric bless reflect`.

**Amendment proposed, §8.** Directive 4 says the agent records in its own space without asking; INV-FAB-001 refuses any verb not in the operator's manifest, including `reflect`. The two are in tension: a session cannot record in its own space until the operator has blessed the *capability*, which is directive 7's intent (reflection is the first thing blessed) and not a contradiction, but it means the charter's "at the end of every session, append a session record" has a precondition. **Proposed wording:** "…append a short session record through `reflect`; until `reflect` is blessed, in the reconciliation file, and say so."

### §9 · Definition of done, for this change

1. **Does this output become an input? Yes.** The retrieval events are consumed by `compounding()`, which `describe`, the README, and `orient` consume; `orient`'s sentence is read by the next session.
2. **Is the because recorded where the next session retrieves it? Yes** for the decisions (`DECISIONS.md` D-001 to D-006), **no** for the session record in the fabric (above); the reconciliation holds it until `reflect` is blessed.
3. **Retrievable outside its creation context, and by what names? Yes:** `CORPUS.md`, `DECISIONS.md`, `FABRIC.md` §"Phase 6", the README's "Does it compound?", and `orient`'s "Compounding:" line.
4. **Did R(t) move, or did this add the measurement? It added the measurement.** R(t) = 0 of 0 retrievals; fold p95 2.3 ms at 214 events, 213 ms at 2,014; `slice` p95 8.1 ms and 595 ms at the same sizes; sixty generated logs per property, all green.
5. **Does it round-trip with the identity test green? Yes**, `compounding.test.ts` §"the portable format", through the file adapter, twenty generated logs.

### §10 · Posture, and what this session would challenge next time

The deep cut was the instrument, and it was taken in preference to capture, aliases, fusion weights, and the evaluation node, each of which is held with a trigger rather than built as a guess. Three things to challenge next: whether inferring use from citation is honest enough or whether the session should be asked to say what helped (D-001's trigger); whether `orient`'s eight-reflection print is the right proactive surface or too wide for a precision-first rule; and whether the quadratic fold should be fixed before its trigger because a hundred sessions is closer than it sounds.

### Session record, 2026-09-06

- **What loop moved.** The measurement loop opened: retrieval → citation → R(t), folded and printed. The self-improvement loop (Phase 5) is unchanged and still waits on the first patch.
- **What measurement changed.** None moved; one was added. The log is twenty-one events, six verbs proposed and none blessed, R(t) undefined until the first retrieval.
- **What to challenge next time, and why.** The three items under §10; and the actor grammar's `agent:<session>` where a session id is a UUID from the hook, which is provenance without a name — a session record should say which model ran it, which is one more field on the receipt.
