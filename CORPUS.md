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

## Part three · Synthetic proof of the loop

*Added 2026-09-06, second session. The charter of this part is `CORPUS.md` above and the prompt "prove the loop synthetically," held as corpus. The prior session built the instrument and reported the truth: R(t) = 0 of 0 retrievals. The loop is architecturally complete and has never closed. This part closes it synthetically — proving the plumbing, that the metric discriminates, and how it scales — and hands over the smallest de-risked act that moves the real number off zero. The code is `packages/fabric/src/sim/`; the record is `DECISIONS.md` D-007 to D-011; the committed baseline is `fabric/sim/baseline.json`.*

### §0 · What synthetic proof establishes, and what it does not

This governs whether any number below means anything, so it comes first.

A generator that emits citations produces R(t) > 0 by construction. That proves the plumbing and nothing else. Synthetic data establishes three things, in ascending worth: **plumbing** — the loop closes end to end through the real code, event to file to fold to retrieval to citation to R_sim; **discrimination** — the metric responds monotonically to retrieval quality, which is the real prize, because a metric that cannot tell good retrieval from bad would green-light regressions; and **scaling** — latency and correctness characterized with numbers.

Synthetic data cannot establish that real retrieval will be useful to Danny — that is real R(t), and only real sessions produce it — and it cannot validate that a citation means genuine use. The synthetic citer cites its planted target by construction, so it can never test the inference the prior session flagged: that "citation implies use" is honest. A green synthetic R(t) does not settle that question, and this part does not pretend it does.

Two numbers are kept strictly apart below. **R_sim** is the synthetic measure, computed by the real `compounding()` fold over quarantined events. **R(t)** is the real measure `describe`, the README, and `orient` print, and it stays 0 of 0 until a real blessing and a real citation. The firewall is what keeps them apart.

### §1 · The firewall

A synthetic event is unrepresentable as a real one, held two ways (D-007, D-008, D-009).

**Provenance at the actor.** Every synthetic event carries actor `import:synthetic` — the import kind the grammar already has, no extension. A real session's activity is `agent:<session>`; the two never collide. The stamp is minted at the log seam, the one write in the fabric, over the real verb programs upstream of it, so every metric-bearing field is the real code's and only the label is the harness's.

**Physical separation.** A synthetic run writes to a temporary directory and a `sim:<run-id>` tenant, never `fabric/spaces/` and never `danny` or `agent`. No synthetic event log is committed; only the regenerable metrics are. The real fold reads `fabric/spaces/` alone, so it cannot see a synthetic event even in principle. `packages/fabric/src/sim/quarantine.test.ts` checks both halves, and that the committed real log folds to a synthetic-free R(t) of 0 of 0.

### §2 · The simulator

Every synthetic session runs through the real shell: `handleCall` parses the input, runs the real `slice` and `reflect` programs, and writes a receipt, exactly as a live session does. The ground truth is planted, not read off the output: seeding sessions record reflections, and each querying session has, by construction, one correct target among them — the node a faithful retriever should surface near rank one — or none, the honest miss. The corpus is not uniform noise: a few seeding reflections are hubs the queries return to eight times as often, a heavy tail of degree; a fixed fraction of queries (0.15) have no answer in the corpus. The generator is a pure seeded hash, so a run is a function of its parameters; the one thing it cannot know in advance is the fingerprint a reflection will get when the real `reflect` writes it, so the harness threads those ids back in. The generative model and its defensibility are in `packages/fabric/src/sim/model.ts`.

Retrieval quality is a dial. The synthetic retriever scores a node for a query as `θ · signal + (1 − θ) · noise`, where the signal is one for the planted target and zero otherwise and the noise is seeded; the real `cut` ranks by that score and the real `candidatesOf` builds the candidate list. The metric never sees θ. It sees only the ranks the real code produced.

### §3 · The metric has teeth

This is the deliverable that matters most, and the result is a clean yes. Sweeping θ from pure noise to real signal, over a forty-reflection corpus averaged across five seeds (`fabric/sim/baseline.json`):

| θ | hit@3 | MRR | rate | targets unsurfaced |
|---|---|---|---|---|
| 0.0 | 0.057 | 0.064 | 0.265 | 46.8 |
| 0.1 | 0.165 | 0.159 | 0.393 | 36.6 |
| 0.2 | 0.300 | 0.306 | 0.463 | 31.0 |
| 0.3 | 0.400 | 0.408 | 0.608 | 19.4 |
| 0.4 | 0.655 | 0.646 | 0.810 | 3.2 |
| 0.5 | 0.850 | 0.850 | 0.850 | 0.0 |
| 1.0 | 0.850 | 0.850 | 0.850 | 0.0 |

hit@3 and MRR climb monotonically with planted quality, a fifteen-fold separation between noise and signal, and the count of planted targets nothing surfaced falls to zero. Past θ ≈ 0.5 the curve saturates: retrieval that is at least half signal reliably surfaces the target at rank one in a corpus this size, so the ceiling is the corpus's own coverage, one minus the miss fraction. The metric discriminates. A retrieval change that degrades quality will show as a lower hit@3 and MRR, which is exactly what the charter's §5 regression gate needs, and the deterministic curve in `fabric/sim/baseline.json` is its anchor (D-010). The fast, asserted form runs in CI as `discrimination.test.ts`; the full curve regenerates with `pnpm fabric sim-baseline`.

One honest note on the aggregate. A miss query cites nothing, so it lowers the rate and hit@k as a fixed offset across every θ; at a fixed miss fraction the sweep isolates surfacing quality, which is what makes the climb legible, but the aggregate metric blends retrieval quality with corpus coverage, and a reader of the real number should hold both.

### §3b · orient's k has no interior knee

`orient` surfaces the k newest reflections at session start, with no query — recency, not resonance. Sweeping its k over the same corpus, precision stays poor at every k (never above 0.03) while recall rises only as k approaches the whole corpus; full recall arrives at k = the corpus size, by surfacing everything. There is no interior k where added recall pays for the precision it costs. The finding: proactive recency surfacing cannot substitute for query-time resonance, because the targets a session needs are often older hub reflections that recency pushes down. Keep `orient`'s k small — its current eight is already past any precision benefit — and treat `slice` and its resonance as the retrieval lever, not `orient`'s breadth. This rests on one modeling choice worth naming: hubs in the corpus are among the earlier reflections, which is defensible (foundational insights tend to be older and returned to) but does bias recency's recall down; the conclusion is scoped to a corpus where the most-referenced nodes are not the newest.

### §4 · The fold's breach, and the decision (D-011)

The fold plus `compounding` is cleanly quadratic. Measured 2026-09-06 in this container, p95 over repeated folds on a realistic session mix: 12.8 ms at 1,024 events, 56.9 ms at 2,048, 220.8 ms at 4,096, 848.3 ms at 8,192 — a constant of about 12.6 × 10⁻⁶ ms per event². The charter's 100 ms p95 breaches near 2,800 events on that mix. The cost is mix-dependent: a reflection-heavy log, the worst case, breaches near 1,150, because `withEntry` copies the reflections map every event. The prior session's D-006 estimate of "near a thousand" was that worst case; the realistic breach is roughly 2,800.

The decision is **hold, with a sharper trigger**. At Danny's cadence — about ten to fifteen events a session — even the worst-case breach is a hundred sessions away, well over a year. Fixing it now is core surgery for a payoff a year out, against the charter's preference for the discrimination proof over breadth. The trigger is 800 total `fabric/spaces` events; the recommended fix is persistent structurally-shared maps in `log.ts`, which removes the O(n)-per-append copy while keeping the pure-fold shape and INV-FAB-005, with the identity test as its guard. The full reasoning and the rejected alternatives are in D-011.

A scoped deviation from the charter's §4: it asks for characterization to 10⁵ events. That is not run. At the measured constant a single 10⁵-event fold is about 126 seconds, the interesting breach is at one to three thousand events, two orders of magnitude below, and the quadratic is already pinned by the 128-to-8,192 grid; extrapolation to 10⁵ is arithmetic, and burning hours to confirm it would be measurement for its own sake.

### §5 · The handoff — moving the real number off zero

Everything above de-risks one small act. The minimal sequence that moves real R(t) to its first nonzero value:

1. `pnpm fabric bless reflect`, in Danny's terminal, once.
2. One real reflection this session, through the blessed `reflect`, citing what it read.
3. One real citation of it, next session.

State plainly what that will and will not show. It closes the real loop once — R(t) becomes 1 — and proves the plumbing on real provenance, real `agent:<session>` actors, a real citation. It does not yet prove real usefulness, which only accumulates across real sessions, and it does not settle whether citation means genuine use — the question §0 keeps open. That honesty is the point of the whole exercise: the synthetic work exists so the first real blessing is a small, well-understood act and not a leap.

### §6 · Definition of done, for this change

1. **Does this output become an input? Yes.** The retrieval and citation events a synthetic session writes are folded by the real `compounding()` into R_sim; the discrimination curve is written to `fabric/sim/baseline.json`, which a future retrieval change reads and must not lower.
2. **Is the because recorded where the next session retrieves it? Yes.** The decisions are `DECISIONS.md` D-007 to D-011; this part is `CORPUS.md`, which `orient` surfaces; the session record closes it. The fabric's own `reflect` is still unblessed, so this session's record is here, not an event — the same "no" the first session recorded, and the §5 handoff is its fix.
3. **Retrievable outside its creation context, and by what names? Yes:** `CORPUS.md` Part three, `DECISIONS.md` D-007 to D-011, `fabric/sim/README.md`, `FABRIC.md` §"Phase 7", and the tests named there.
4. **Did R(t) move, or did this add the measurement? Neither — it proved the measurement.** R(t) stays 0 of 0, by the firewall's design. R_sim ran the loop closed and showed the metric climbs from hit@3 0.057 at noise to 0.850 at signal. The numbers above are R_sim; the real R(t) is untouched.
5. **Does it round-trip with the identity test green? Yes.** `quarantine.test.ts` drives a synthetic run through the real file adapter and asserts a fresh reader of the same directory folds to the identical projection (INV-FAB-005), and that the run breaks no invariant.

### Session record, 2026-09-06 · synthetic proof

- **What loop moved.** The synthetic loop, and only it. A generated corpus with planted ground truth ran through the real `slice` and `reflect` verbs, closed retrieval to citation to R_sim, and the metric was swept against retrieval quality. The real loop is untouched by design: R(t) is still 0 of 0.
- **What R_sim reads, and at what planted quality.** At real signal (θ ≥ 0.5), R_sim is hit@3 0.850, MRR 0.850, no planted target unsurfaced; at pure noise (θ = 0), hit@3 0.057, MRR 0.064, 46.8 of 80 targets unsurfaced. The climb between them is the proof the metric discriminates.
- **The fold's breach.** 100 ms p95 near 2,800 events on a realistic mix, near 1,150 on a reflection-heavy one; held with a trigger at 800 events (D-011).
- **What to challenge next time, and why.** Whether the θ-as-a-scalar model of retrieval quality is faithful enough to a real embedding space to trust the saturation point, or whether the baseline should be regenerated against a real qmd index once one exists; and whether the honest-miss fraction blended into the aggregate should be reported apart from surfacing quality, so a reader of the real number is not told a coverage gap is a retrieval failure.

## Part four · The North Star v4, reconciled

*Added 2026-09-07. `NORTH_STAR.md` arrived from Danny late on 2026-09-06 as v4 — "the corpus that compounds, locked to agentic coding memory" — and is persisted verbatim, never edited, at the repository root. It supersedes a v3 and a v3.2 addendum (§28) that were not in any of the six repositories when it arrived; Danny supplied both, with THE LOCK, the same day, and they are filed beside v4 (D-015), so Appendix E's ledger ("nothing cut was lost") is checkable against its originals. The charter's §27 asks for disagreement with a reason and a proposed amendment; §D below is that. The record is `DECISIONS.md` D-012 to D-014.*

### §A · Where the house stands against §23, the build order

| Step | Work | Status on 2026-09-07 |
|---|---|---|
| 1 | `bless reflect`; one reflection; one citation next session | **Two of three.** Blessed 2026-09-06 (`verb.blessed`, `by: danny`, issued on his behalf from mobile; the decision his, the record his). One reflection, `reflection/0ecfbab77d92bd63`, written by this session through the real verb. The citation waits, and cannot come from this session: `compounding()` counts a use only when another session made the node, so a session continuing past midnight is still the session that wrote it. R(t) = 1 needs a genuinely new session id. |
| 2 | Hooks: `PostToolUse` file-read harvest; stop-hook correction capture; model on receipt | **Not built.** The next deep cut; see §D.4 for what it does to the number. |
| 3 | `import:git`, doc import, `fabric init`, the daemon and thin client | **Not built.** |
| 4 | Synthetic harness: firewall, discrimination proof, scaling numbers, committed baseline | **Done, before steps 2 and 3.** Part three; `packages/fabric/src/sim/`; `fabric/sim/baseline.json`. The gate's own terms hold: the metric has teeth (hit@3 0.057 → 0.850 across planted quality) and the fold's breach point is known (1,150–2,800 events by mix; D-011). INV-NS-003 is `quarantine.test.ts`. |
| 5 | SQLite projection; FTS5 + sqlite-vec + graphology; RRF; regression gate armed | **Not built, and not forced.** Appendix C's trigger — "fold breach point within a year of real cadence → SQLite projection now" — is not met: D-011 places the breach at 100 to 250 sessions, over a year at Danny's cadence. SQLite comes in order. The regression gate is armed today against `R_sim`'s baseline, not yet against real data (§16's fifty-retrieval trigger). |
| 6 | `evaluation.recorded`; `fabric bless` review mode; correction-repeat rate | **Not built.** `evaluation.recorded` was proposed by the first session (Part two, §5) and is now scheduled here. |
| 7 | Generated docs + drift check; CLI snapshot and contract tests | **In part.** `describe --check` drift-checks `manifest.json`, `events.schema.json`, and `fabric/README.md` on every commit; `DOMAIN_MODEL.md` and `CONTENT_SCHEMA.md` are not generated. No CLI snapshot or contract tests. |
| 8–11 | Second tenant and DIDs; a dev lead's repo; R(t) on the site; Ax | **Not started.** Step 8 is gated on step 6's correction-repeat number by §23's own rule. |

### §B · Which of Appendix B's invariants already hold, and where

- **Held today, by test:** INV-FAB-001, -006, -010, -011 (`fabric.test.ts`, `compounding.test.ts`); INV-NS-001 and INV-NS-002 (fold determinism and portable-format identity, `compounding.test.ts` over generated logs; `quarantine.test.ts` through the real file adapter); INV-NS-003 (`quarantine.test.ts`, both halves of the firewall and the committed real log's clean R(t)); INV-NS-005 (blessed-versus-proposed, `compounding.test.ts`).
- **Held in part:** INV-NS-004 — the three generated fabric artifacts are drift-checked; the prose documents §12 names are not yet generated.
- **Not yet built:** INV-NS-006 through -009 (signing, per-tenant canonicality, narrowing grants, per-session append files), INV-NS-011 (every action a receipt — true for verbs, not yet for hooks), INV-NS-012 and -013 (the CLI's generated contracts and informative refusals; today's CLI has hand-written help and no `--json` contract).

### §C · Vocabulary, where v4 and the code meet

- **The actor grammar gains `@did`.** v4 writes `author:<space>@did` and `agent:<session>@did`. The schema's regex is `\S+` after the prefix, so `author:danny@did:key:…` already parses; no schema change is needed until step 8 makes the suffix meaningful.
- **`note` returns.** D-005 held capture with the trigger "Danny says he wants to capture through the fabric." v4 §7 is that word: `note` is a lock verb. D-005 reopens by its own rule; the verb is step 3's, because its latency budget (16 ms) needs the daemon.
- **Three held items are now scheduled.** `retrieval.used` / `retrieval.missed` (the use signal beyond citation) at step 2; `evaluation.recorded` at step 6; `alias.proposed` at Appendix C's first-miss trigger. Their entries in `FABRIC.md` §"Held" now point at the step (D-014).
- **`bridge` carries two meanings.** In the fabric a bridge carries a node across a wall (INV-FAB-003); in v4 §2 a bridge is "a proposed relation between nodes, with evidence." One word, two concerns, and directive 12 forbids a third name. Held as a collision to resolve by Danny's word when step 2's `fabric bridge` is built, not by a session's coinage.
- **The receipt grows.** v4's receipt carries `model` and `duration`; today's carries neither. "Model on receipt" is step 2, and it answers the first session's own challenge (Part two, session record).

### §D · Amendments proposed, with their because

1. **Persist the originals.** v4's first line says it supersedes `NORTH_STAR.md` v3 and the §28 addendum, and neither was in the house. Appendix E is a careful ledger, and a ledger is checkable only against what it ledgers. *Because:* the charter's own rule is that nothing cut is lost; the house can only verify that with the originals beside the successor. Danny supplied them the same day; they are filed as `NORTH_STAR_v3.md`, `NORTH_STAR_v3.2.md`, and `THE_LOCK.md`, never edited (D-015), and the whole lineage is now one backlog, `NORTH_STAR_BACKLOG.md`, with `INVARIANTS.md`, `VOCABULARY.md`, and `NEXT_STEP.md` beside it.
2. **§9 supersedes D-011's fix, not its hold.** D-011 recommended persistent structurally-shared maps when the fold's trigger fires. v4 §9 dissolves the fold into a SQLite projection at step 5 instead, which also removes the file re-read per call. The hold stands (the breach is over a year out); the recommended fix changes to v4's. *Because:* two recommended fixes for one problem is the pile the decision log exists to prevent. D-013.
3. **§19.2's "scaling harness's 10⁴-event corpus" should be constructed, not driven.** The synthetic harness produces corpora two ways: through the real verbs (for discrimination, where every rank must be the real code's) and by direct construction (for scaling, where only the fold's cost is measured). Driving 10⁴ events through `handleCall` at the current fold is hours; constructing them is seconds, and the fold's cost is the same either way. *Proposed wording:* "measured in CI on a directly constructed 10⁴-event log of the realistic mix." *Because:* a budget that is expensive to measure will not be measured.
4. **Step 2 changes what R(t) counts, and the number should say so.** When the `PostToolUse` hook logs every file the agent opens as a surfaced candidate, the denominator of R(t) grows by every file read, most of which no citation will ever name. The rate and hit@k will fall when the hook lands — not because retrieval got worse, but because the measure got wider. *Proposed:* report R(t) per retrieval verb (`orient`, `recall`, `slice`, and the hook's file-read as its own verb) and re-baseline at the hook's arrival, so a change in coverage is never read as a regression in retrieval. This is the same honesty Part three §3 asked for about the miss fraction. *Because:* the regression gate must not fire on a definitional change.
5. **Step 1's third clause needs a new session, not a new day.** Not an amendment to the text; a note against a natural mistake. The session that wrote the first node cannot be the session that cites it into R(t), by the instrument's definition (Part three §0). The first citation is the first act of the next session, and `orient` should say so in its first line until it happens.
6. **The vendor question, reconciled against v4.** This session's earlier suggestions — persistent maps for the fold, Orama or MiniSearch for lexical search, KùzuDB for graph proximity — are superseded by v4's own choices: SQLite with FTS5 and sqlite-vec in one file (§9), graphology hydrated from the edge table (§9), reciprocal rank fusion with documented weights (§8), remark for the bridge (§10), `@effect/cli` for the surface (§12), Ax at its trigger (§16), `did:key` at step 8. Two survive. **RFC 8785 (JSON Canonicalization Scheme)** for `canonical.ts`: today it backs fingerprints; at §28.2 it backs signatures, where canonical bytes are not optional — *proposed* for adoption at or before step 8, with its removal cost one file. **Cambria's schema lenses** as the conceptual reference for §28.3's versioned kinds ("old events fold under the version they were written in"), not a dependency.

### §E · Definition of done, for this change, in v4's seven questions

1. **Does this output become an input? Yes.** `NORTH_STAR.md` is the document v4 says `orient` will surface; until `orient` is rewired (step 2), `SPECIFICATION_MAP.md`, `FABRIC.md` §"The Sequence," and `BACKLOG.md` point at it, and this part is what the next session reads.
2. **Is the because recorded where the next session retrieves it? Yes.** D-012 to D-014, and a reflection through the now-blessed `reflect`, the corpus's second node.
3. **Retrievable outside its creation context, and by what names? Yes:** `NORTH_STAR.md`, `CORPUS.md` Part four, `DECISIONS.md` D-012 to D-014, `FABRIC.md` §"Held."
4. **Did R(t) or a leading indicator move, or did this add the measurement? Neither moved; a leading indicator did.** R(t) is 0 of 0. The corpus went from one node to two. No new `R_sim` was computed.
5. **Does it round-trip with the identity test green? Yes**, and trivially: no event kind or log format changed; the tests are unchanged and green.
6. **Does it derive from the schema of record? Not applicable and honestly so:** the deliverable is prose corpus and decisions; no shape was hand-written, no generated artifact hand-edited.
7. **Does its CLI path hold its budget and contract? Not applicable:** no verb was added or changed.

### Session record, 2026-09-07 · receiving the North Star

- **What loop moved.** None. A plan arrived and was placed: persisted verbatim, mapped onto the house step by step, its collisions named, six amendments proposed with their because.
- **What measurement changed.** None. R(t) stays 0 of 0; the corpus holds two reflections; the first citation is the next session's first act.
- **What to challenge next time, and why.** Whether step 2 should land the file-read harvest and the per-verb R(t) together in one change, so the number is never reported under two definitions; and whether the `bridge` collision (§C) should be settled before `fabric bridge` exists, since a verb name is frozen at blessing and a wrong name would then be a new verb forever.
- **Which model ran.** Fable 5.1 (`claude-fable-5-1`), the same session id as the day before, which is exactly why it cannot cite its own node.
