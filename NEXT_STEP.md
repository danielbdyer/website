# Next step — v4 §23 step 2: use signal without asking

*Written 2026-09-07 for the next session, so it starts oriented rather than re-deriving. This is a brief, not a build: it names what step 2 is, the decisions it forces, the smallest version that closes it, and what not to touch. v4 §23: "Hooks: `PostToolUse` file-read harvest; stop-hook correction capture; model on receipt — finishes when use signal and evaluations appear without asking." Read `NORTH_STAR.md` §8 and §19.4 first; then this.*

## Before step 2: the citation

Step 1 is two of three. The third clause — one real citation next session — is not step 2's and cannot be this session's (the instrument excludes self-citation). **The next session's first act is to read `orient`, then cite one of the nodes it surfaces in its own reflection — or, once Danny has blessed `bridge`, relate two of them with evidence, which counts the same way.** That moves R(t) from 0 of 0 to 1 of 1, and it should happen before any code, because it is the only act in the whole plan that costs nothing and proves the real loop. Two blessings are Danny's and no session's: `pnpm fabric bless patch` and `pnpm fabric bless bridge` (D-016, D-017).

## What step 2 is, in the house's terms

Today the fabric learns that a session used a node only when the session *says so*, by citing it in `reflect.cites` or naming it in a patch. Step 2 makes the fabric learn from **conduct**: what the session actually opened, which model ran, and what the operator corrected. Three deliverables, and one amendment that travels with them.

### 2a · Model on receipt

- **What.** `receiptSchema` gains `model` (the model that ran the verb) and `duration` (milliseconds); `CallContext` carries `model` from the session hook; `handleCall` stamps both.
- **Why it is safe.** A receipt is a verb's *output* side. INV-FAB-007 freezes a verb's *input* signature at blessing; `reflect`'s input is unchanged, so no new verb is needed. `events.schema.json` regenerates; `describe --check` stays green after `pnpm fabric describe`.
- **Where the model comes from.** The start hook knows the session id today (`fabric/.session`); it does not know the model. The hook's payload or an environment variable must carry it, and the receipt records `unknown` honestly when neither does — never a default that looks like a fact.
- **Test.** A property: every `verb.called` carries `model` and `duration`; a receipt without them fails to parse.

### 2b · The file-read harvest

- **What.** A `PostToolUse` hook appends a `retrieval.surfaced` event for every file the session reads, with the file as the one candidate.
- **The decision it forces: what a file read *is*.** Two honest readings, and they change the number differently.
  1. *A file read is a retrieval.* Every opened file is a surfaced candidate; a later citation of it is a use. This widens R(t)'s denominator by every file the agent touches — most of which no citation will name — and the rate falls at the hook's arrival for definitional reasons, not retrieval ones (`CORPUS.md` Part four §D.4).
  2. *A file read is a conduct check on a citation.* The hook records what was opened so that a citation of a node whose file was never opened can be flagged, and a citation of an opened, surfaced node is confirmed. This is THE LOCK §9's guard against citation inflation stated precisely: "the file-read hook logs what it actually opened."
  **Recommendation: both, kept apart.** Record the read as `retrieval.surfaced` with `verb: 'read'` (a new value in `RETRIEVAL_VERBS`), actor `runtime`, and a `because` that says the hook recorded it — the same shape `orient` uses today — so INV-FAB-010 holds and nothing pretends the agent gave a reason it did not. Then report `compounding()` **per retrieval verb**, so `slice`, `recall`, `orient`, and `read` each have their own rate and hit@k and the aggregate is never read across a definitional seam. The conduct check is a third number: citations whose node was opened ÷ citations, which is what LOCK §9 actually wants.
- **The candidate's node id.** A file is not a fabric node. The candidate needs an id the fold can join to a citation: `file/<repo-relative path>` for a file, and the reflection's or claim's id when the file *is* one (a reflection's qmd export, a vault claim, a work). The mapping from path to node id is the hook's one piece of knowledge, and it lives in one function with a test.
- **The hook's cost.** A `tsx` cold start is 1.3–1.4 s (D-005). A per-file-read hook at that cost is not acceptable; a session reads dozens of files. Until the daemon (step 3), the hook must append with a plain Node script that touches no TypeScript loader — a few milliseconds — or batch reads and flush once at the stop hook. **Measure it before choosing;** the budget for a hook is the budget v4 §19.2 gives `note`, 16 ms.
- **Test.** The fold counts a `read` retrieval as used when the same session later cites its node; `compounding()` returns a per-verb breakdown; the committed baseline (`fabric/sim/baseline.json`) is regenerated and its schema gains the per-verb rows, with the old aggregate kept so the discrimination proof still reads.

### 2c · Correction capture at the stop hook

- **What.** The stop hook scans the session's transcript for the operator's corrections and appends each as a *proposed* evaluation for the operator to bless.
- **The dependency it exposes.** A correction is an `evaluation.recorded` event, and that kind is v4 §23 **step 6**, not step 2. Step 2 as written needs step 6's kind. Two ways through, one decision: admit the kind at step 2 (the first session already proposed its shape, `CORPUS.md` Part two §5, and v3 §13 admitted it "ahead of its trigger"), or land the capture with step 6 and let step 2 be 2a and 2b. **Recommendation: admit the kind at step 2**, because the stop hook is already running and the correction is, per THE LOCK §4, "the single most valuable event a coding session produces" — but as a proposal only, never canonical from a hook. What the hook *detects* as a correction is its own decision: a session-authored heuristic is a proposal with a falsifier (v3 §11), and its acceptance rate is the number that tunes it.
- **Test.** An evaluation from a hook carries actor `agent:<session>`, `by` the session, and a `because` quoting the transcript span; it folds into shadow; it reaches canonical only through `fabric bless`.

## The amendment that travels with step 2

`compounding()` reports per retrieval verb, and re-baselines when a verb is added. Without this, step 2 makes the one number the product sells look like it fell. With it, the aggregate is still printed, and beside it the number that means what it meant yesterday. → `CORPUS.md` Part four §D.4.

## The order inside step 2

1. The citation (step 1's third clause). R(t) = 1.
2. **2a**, model on receipt — smallest, safest, and every later receipt benefits.
3. The per-verb `compounding()` and the re-baselined `fabric/sim/baseline.json` — *before* the hook, so the hook lands into a number already prepared for it.
4. **2b**, the file-read hook, with its cost measured and its node-id mapping tested.
5. **2c**, correction capture, once the `evaluation.recorded` decision is recorded in `DECISIONS.md`.

Step 2 finishes when `fabric describe` shows a `read` retrieval and a proposed evaluation that no one typed on purpose.

## What step 2 does not touch

Not the daemon (step 3), not SQLite (step 5; its trigger is not met, D-013), not DIDs (step 8), not the CLI rewrite (step 7). If 2b's hook cost cannot meet its budget without the daemon, say so in numbers and land 2a and the per-verb number alone; a step scaled down on evidence is the charter's own posture.

## Decisions step 2 will write

- D-020: what a file read is (both, kept apart), and the name `read` for the hook's retrieval verb.
- D-021: `evaluation.recorded` admitted at step 2 as a proposal-only kind, with its shape.
- D-022: `model` and `duration` on the receipt, and `unknown` as the honest absent value.
- A row in `NORTH_STAR_BACKLOG.md` for each, flipped from `not built`, citing the commit.

D-016 through D-019 were taken on 2026-09-07 by the four names Danny settled — bridge, patch, tenant, the markdown bridge — before step 2 began.
