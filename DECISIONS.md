# Decisions

*The house's decision log: one entry per architectural decision, with the alternatives it rejected and why, so a later session inherits a reason and not a pile. Opened 2026-09-06 at the corpus charter's ask (`CORPUS.md` §7: "ADRs for every architectural decision, with the rejected alternatives and why. A rejected alternative recorded is worth more than an alternative silently absent"; §8: written "where the next session will find it — the repo's existing decision log; do not invent a second one"). The house had no single log before this file; its decisions lived inline, in each spec's "Held questions, resolved" and in `BACKLOG.md`'s triggers. Those stay where they are and are not migrated by hand; a decision that is revisited is re-recorded here in the commit that revisits it. The engine's `DECISIONS.md` is the format's precedent.*

*An entry is a number, a title, the decision in one line, the reason, the alternatives with why each was not taken, and what would reopen it. Entries are never edited after the fact; a change is a new entry that supersedes by number.*

---

## D-001 · The instrument before the feature

**Decision.** The fabric measures R(t) — retrievals where a later act of the same session used a candidate another session made — before any retrieval feature is built to raise it. The measure is a pure fold over two event kinds, `retrieval.surfaced` and the citations in `reflection.recorded` and `patch.proposed`, and it is reported in `describe`, in the README, and in the start hook's first lines.

**Because.** The corpus charter's invariant governs everything (`CORPUS.md` §0), and a feature without a measured effect on retrieval-and-use is a guess.

**Alternatives.**

- *Measure use by an explicit `used` flag the session sets.* Rejected for now: a flag the session must remember to set is convention, and the citation the session already writes is a signal it has a reason to give. Held as the sharper measure (`FABRIC.md` §"Held", "The use signal beyond citation").
- *Count any citation as a use.* Rejected: a session citing its own fresh reflection is not the corpus compounding; the definition requires a context other than the creation context, so the maker's session must differ.
- *Log retrievals only in `slice`.* Rejected: `recall` and the start hook's memory print surface memory too, and a retrieval that is not logged makes the measure lie by omission (INV-FAB-010).

**Reopens when.** The first session reports a retrieval that helped and was not cited, or one that was cited and did not help.

## D-002 · Provenance at the schema, not by convention

**Decision.** Every event's actor is a string in a closed grammar (`runtime`, `author:<space>`, `agent:<session>`, `import:<source>`), and an agent event without a non-empty `because` fails to parse. Every verb asks for a `because` in its input, and the receipt carries it.

**Because.** The charter's §1: "an agent event without a `because` is rejected at the schema level, not by convention." A refinement on the event union is the smallest thing that makes the violation unrepresentable in the file log.

**Alternatives.**

- *Require `because` only on proposal events (bridge, patch, reflection) and not on observations.* Rejected: an observation's `because` is the context of the retrieval, which is exactly what R(t) needs to be interpretable; it is also one sentence per call, which is the cost the charter accepted.
- *A structured actor object (`{ kind, id }`) instead of a prefixed string.* Rejected: the string is what the JSON-lines file already holds, the grammar is one regular expression, and every existing event with actor `runtime` stays valid without migration.
- *Reflect's `because` as its own field beside `attempted`.* Rejected: they would be the same sentence twice; `attempted` is the because.

**Reopens when.** A second kind of author appears, or an import adapter needs more than a source name.

## D-003 · The verbs' signatures moved while nothing was blessed

**Decision.** Adding `because` to every verb's input changed six input schemas; the unblessed log was regenerated so each verb node carries its current schema, rather than proposing six new verbs.

**Because.** INV-FAB-007 freezes a signature at blessing, and nothing is blessed; the log held only proposals. Regenerating an unblessed proposal is the same move Phase 2 and Phase 5 made and is recorded so the next session does not mistake it for editing history.

**Alternatives.**

- *Propose `slice2`, `recall2`, and so on.* Rejected: the doctrine that a change is a new verb protects a blessed signature, and none exists yet; six retired-before-blessed verbs would be noise.

**Reopens when.** The first verb is blessed. From that day a schema change is a new verb, without exception.

## D-004 · Property tests with fast-check

**Decision.** `fast-check` enters as a dev dependency of `@dbd/fabric` for the four properties the charter names: fold determinism, portable-format identity, blessed-versus-proposed, and provenance completeness, each over generated logs.

**Because.** A hand-written log tests the case its author imagined; the charter asks for the property. `fast-check` is the property-testing library the TypeScript ecosystem has settled on, it is a test-time dependency only, and its removal cost is three test blocks.

**Alternatives.**

- *Hand-rolled generators with a seeded random.* Rejected: shrinking is the part worth having and the part not worth writing.
- *Effect's own `Arbitrary` from `@effect/schema`.* Rejected for now: the fabric's schemas are zod, and a second schema library for tests alone is a dependency for a dependency.

**Reopens when.** The fabric's schemas move to Effect Schema, if they do.

## D-005 · No capture surface yet

**Decision.** The charter's capture requirements (§2: p99 of 16 ms from first keystroke, zero structure, lossless, body-primary) are held rather than met, with a trigger, because the fabric has no capture surface: the author captures in an editor into git, and the agent's `reflect` is structured by design and is not capture.

**Because.** Building a capture path to hit a latency number nobody has asked to use would be a feature shipped as a guess (§0). The smallest real version is named in `FABRIC.md` §"Held" so it is not lost.

**Alternatives.**

- *Treat `reflect` as capture and measure it.* Rejected: `reflect` demands structure (attempted, observed); the charter forbids required structure at capture.
- *Treat the vault's `inbox/` as the capture surface.* Rejected for this repository: it is the vault's, and its latency is the author's editor's.

**Reopens when.** Danny says he wants to capture through the fabric.

## D-006 · The fold is quadratic, and that is a held cost with a number

**Decision.** The projection stays a pure fold with immutable maps, copied on every event, and the runtime re-folds the whole log on every call. This is recorded as a measured cost, not fixed, with the trigger below.

**Because.** Measured on 2026-09-06 in this container (Node 22, in-memory log, one process): at 214 events the fold's p95 is 2.3 ms and a `slice` call end to end is 8.1 ms; at 2,014 events the fold is 213 ms and a `slice` is 595 ms. Ten times the events, a hundred times the time: each `withEntry` copies a map, so the fold is O(n²) in reflections. The charter's §3 asks for a p95 of 100 ms on lexical-plus-graph retrieval; the fabric meets it below roughly a thousand events and fails it above. Today the log holds twenty-one events, and a session writes about ten, so the ceiling is roughly a hundred sessions away. Fixing it now would be a feature shipped ahead of its measurement.

**Alternatives.**

- *Mutable accumulators inside `project`, pure at the boundary.* The likely fix: one file joins the rim with a `@bigO` note, and the fold becomes O(n). Held until the trigger.
- *A cached projection in the runtime, advanced on append.* Also likely, and it removes the O(n) re-read of the file log per call; it is the ActiveGraph "runtime over the log" the spec already holds.
- *Persistent (structurally shared) maps.* Rejected: a dependency for a problem a hundred sessions away.

**Reopens when.** The real log's fold p95 crosses 100 ms, which the bench above places near a thousand events; or the first session that notices a slow `slice`.

## D-007 · Synthetic events are the existing import kind, not a new actor

**Decision.** A synthetic event carries actor `import:synthetic` — the `import:<source>` kind the grammar already has, with source `synthetic`. The closed actor grammar (D-002) is not extended.

**Because.** A synthetic session is an import into the fabric from a generator, which is exactly what the import kind means. Extending the grammar for it would touch the schema, the JSON Schema, `describe`, and the README for no gain, and the charter's §1 firewall asks only that a synthetic event be unrepresentable as a real one — which `import:synthetic` already is, since a real session's activity is `agent:<session>`.

**Alternatives.**

- *A new actor kind, `synthetic:<run>`.* Rejected: a fourth prefix in the closed grammar is a schema change with no behavior behind it; the source name inside the import kind already carries the run's identity.
- *Reuse `runtime` for synthetic events.* Rejected: `runtime` is the fabric's own scaffolding (bootstrap, evaluations), and a synthetic session's activity must be told apart from it; `import:synthetic` is that distinction.

**Reopens when.** A real consumer needs to tell a synthetic import from a real vault import at the actor level, which today the source name `synthetic` already does.

## D-008 · Synthetic event logs never enter the repository

**Decision.** A synthetic run writes its event log to a temporary directory and a `sim:<run-id>` tenant. No synthetic `.jsonl` is committed; the only committed synthetic artifact is `fabric/sim/baseline.json`, the regenerable metrics. The real read path is `fabric/spaces/` alone.

**Because.** The file log's `read` folds every `*.jsonl` in its directory. A synthetic log committed beside the real one is one misconfigured directory away from polluting the real R(t) that `describe`, the README, and `orient` print. The firewall must be structural, not vigilant: physical separation makes the pollution unrepresentable rather than merely forbidden.

**Alternatives.**

- *Commit an example synthetic log for inspection.* Rejected: the inspection value is small and the pollution vector is real; the baseline JSON and the tests are the inspectable artifacts.
- *Write synthetic logs to `fabric/sim/*.jsonl` and rely on the real read pointing only at `fabric/spaces/`.* Rejected: it makes the firewall a property of a path string in the CLI, not of the filesystem; a temp directory outside the repo cannot be read by the real fold by accident.

**Reopens when.** The real read path gains an actor-level filter that excludes `import:synthetic`, at which point co-location would be safe — but that filter would be cost on the hot path for a risk physical separation already removes.

## D-009 · Provenance is stamped at the log seam, over the real verbs

**Decision.** The synthetic harness runs the real `slice` and `reflect` programs through the real shell (`handleCall`), and stamps `import:synthetic` at the one write in the fabric — an `EventLog` decorator over the real file or memory adapter. Every metric-bearing field (candidates, ranks, citations, the fold) is produced by the real code upstream of the stamp.

**Because.** The charter's §2: "If you bypass the actual code to make numbers, you have proven nothing about the actual system." Stamping provenance at the seam is the smallest change that quarantines the run while leaving the real code path intact, and provenance minted at the event is the fabric's own principle.

**Alternatives.**

- *Forge events directly with `import:synthetic`.* Rejected: it bypasses the verb programs, so a green synthetic number would say nothing about `cut`, `candidatesOf`, or the fold — the code a retrieval change would touch.
- *Give synthetic sessions import identities upstream, in the verbs.* Rejected: `surfaced` and `reflect` hardcode `agent:<session>`, and changing them would change real verb behavior to serve the harness.

**Reopens when.** The real verbs ever take the actor as a parameter, at which point the stamp moves from the seam to the call.

## D-010 · The metric discriminates; the committed baseline is the §5 gate

**Decision.** The compounding metric responds monotonically to retrieval quality — over a planted corpus, hit@3 climbs from 0.057 at pure noise to 0.850 at real signal, and MRR tracks it — so `fabric/sim/baseline.json` is the anchor the §5 regression gate needs, and a retrieval-code change that lowers the curve is a regression.

**Because.** The charter's §3 names discrimination the real prize: a metric that cannot tell good retrieval from bad would green-light regressions. The synthetic sweep varies retrieval quality with a dial the metric never sees and reads the metric off the real fold; that it climbs is the proof the metric has teeth, and the deterministic curve is a baseline a future change compares against.

**Alternatives.**

- *Baseline a qmd fusion-weight vector.* Rejected: qmd is not synthetically testable, and the baseline's job is to guard the retrieval code — `cut`, `candidatesOf`, the fold — not an embedding model's weights.
- *Trust that R_sim > 0 proves the metric.* Rejected explicitly by the charter: a synthetic citer cites by construction, so a nonzero number proves only plumbing; discrimination is the separate, higher claim.

**Reopens when.** Real retrieval accumulates and a real baseline can stand beside the synthetic one.

## D-011 · The fold's 100 ms breach is 1,150–2,800 events, mix-dependent; still a hold, sharper trigger

**Decision.** Refines D-006. The fold stays a pure immutable fold. The 100 ms p95 breach is now measured precisely and is mix-dependent: fold-plus-compounding is quadratic with constant about 12.6 × 10⁻⁶ ms per event² on a realistic session mix, breaching 100 ms near 2,800 events, and about 76 × 10⁻⁶ on a reflection-heavy log, breaching near 1,150. The trigger is sharpened to 800 total `fabric/spaces` events.

**Because.** Measured 2026-09-06 (Node 22, this container, p95 over repeated folds): a realistic mix — one reflection, one retrieval, two receipts per unit — folds at 12.8 ms / 1,024 events, 56.9 ms / 2,048, 220.8 ms / 4,096, 848.3 ms / 8,192, a clean quadratic. A reflection-only log, the worst case because `withEntry` copies the reflections map every event, breaches at ~1,150. D-006's estimate of "near a thousand events" was the worst case; the realistic breach is roughly 2,800. At Danny's cadence — about ten to fifteen events a session — that is 100 to 250 sessions, well over a year. Fixing it now is core surgery for a payoff a year out, against the charter's preference for the discrimination proof over breadth.

**Alternatives.**

- *Fix now with persistent (structurally shared) maps in `log.ts`.* The recommended fix when the trigger fires: replace the O(n)-per-append `new Map([...map, entry])` with a persistent map of O(log n) insert, which removes the quadratic while keeping the pure-fold shape and INV-FAB-005; the identity test guards it. Held: no present payoff.
- *A cached projection advanced on append.* Also removes the fold's cost and the file re-read per call, but adds cache-invalidation state the pure fold does not have. Held as the heavier option.
- *Characterize to 10⁵ events as the charter's §4 asks.* Not run: at the measured constant, a 10⁵-event fold is about 126 seconds, and the interesting breach is at 1–3k events, two orders of magnitude below. The quadratic is pinned by the 128–8,192 grid; extrapolation to 10⁵ is arithmetic, and burning hours to confirm it would be measurement for its own sake.

**Reopens when.** The real `fabric/spaces` log crosses 800 events, or a session notices a slow start.

## D-012 · The North Star v4 is persisted in the house; its predecessors arrive by Danny's hand

**Decision.** `NORTH_STAR.md` v4 (2026-09-06) is kept verbatim at the repository root, never edited, beside `CORPUS.md`; its reconciliation is `CORPUS.md` Part four. v3 and the v3.2 addendum (§28), which v4 supersedes and which were in none of the six repositories, are filed as `NORTH_STAR_v3.md` and `NORTH_STAR_v3.2.md` when Danny supplies them, also verbatim.

**Because.** v4 §27: "This document is corpus. It changes only by a new version Danny gives; a session's proposed amendments go in the reconciliation." The house already holds one charter this way (the v2 charter in `CORPUS.md` Part one), so the pattern is established. The predecessors are needed because Appendix E ledgers every unit of them, and a ledger is verifiable only beside what it ledgers.

**Alternatives.**

- *Fold v4 into `CORPUS.md` as Part four's opening, like the v2 charter.* Rejected: v4 names itself `NORTH_STAR.md` and says `orient` will surface it; a document meant to be surfaced by name should exist under that name.
- *Place it in `cathedrals/`, where a `NORTH_STAR.md` already exists.* Rejected: that file is the engine's layered ontology, a different lineage; v4's referents (`fabric orient`, `DECISIONS.md`, INV-FAB-*) are all this repository's.
- *Treat the missing v3 as lost and rely on Appendix E.* Rejected: the charter's own claim is that nothing cut was lost, and the house should be able to check it.

**Reopens when.** A v5 arrives, by Danny's hand.

## D-013 · D-011's fix is superseded by the SQLite projection; the hold stands

**Decision.** The fold's quadratic cost stays held (D-011's trigger of 800 events is unchanged), but the recommended fix is no longer persistent structurally-shared maps; it is v4 §9's SQLite projection, built at step 5 of §23.

**Because.** v4 §9 dissolves the fold into a projection file that FTS5, sqlite-vec, the node and edge tables, and the retrieval log share, which removes the O(n²) fold *and* the O(n) file re-read per call that persistent maps would have left in place. Two recommended fixes for one measured problem is the pile the decision log exists to prevent. Appendix C's trigger for doing it now — a breach within a year of real cadence — is not met: D-011 places the breach at 100 to 250 sessions.

**Alternatives.**

- *Build the SQLite projection now, since the plan names it.* Rejected: §23 says no step starts because it is interesting, and the trigger is not met; step 5 follows steps 2 and 3 in order.
- *Keep both fixes on the books, choose at the trigger.* Rejected: the decision log records one recommendation with its because; a later session can overturn it with a numbered entry.

**Reopens when.** D-011's trigger fires, or the discrimination harness shows in-process retrieval matching qmd's quality (v4 §9, "the sidecar decision").

## D-014 · Held items with a step in §23 point at the step, not at a free trigger

**Decision.** Three entries in `FABRIC.md` §"Held" that v4's build order now schedules — the use signal beyond citation (`retrieval.used` / `retrieval.missed`, step 2), capture as a measured path (`note`, step 3, reopening D-005), and `evaluation.recorded` (step 6) — carry a pointer to their step beside their original trigger. Aliases keep Appendix C's trigger, which is the same one the house already held.

**Because.** A held item with two homes — a trigger in one file and a step in another — is answered twice or not at all. The pointer keeps the original trigger's reasoning and says where the work now lives.

**Alternatives.**

- *Delete the held entries, since the plan owns them now.* Rejected: each entry carries the house's own reasoning for holding, which the plan's one-line step does not, and a future session deciding whether to start the step should read both.
- *Copy §23 into `BACKLOG.md`.* Rejected: a second copy of the build order is a second build order; `BACKLOG.md` points at §23.

**Reopens when.** A v5 changes the build order.

## D-015 · The three originals are in the house; the backlog is the superset the lock fills in

**Decision.** `NORTH_STAR_v3.md`, `NORTH_STAR_v3.2.md` (the §28 addendum), and `THE_LOCK.md` are persisted at the repository root, converted from Danny's PDF exports with the words unchanged and the headings, tables, and monospace blocks restored from the PDFs' layout; each carries an HTML-comment provenance line and is never edited by a session. `NORTH_STAR_BACKLOG.md` is the one backlog of the lineage: every unit of v3, §28, and THE LOCK as a row with its v4 disposition, its step or trigger, and its standing in the house. v4's build order is a subset of it and is filled in there. Three artifacts sit beside it — `INVARIANTS.md`, `VOCABULARY.md`, `NEXT_STEP.md` — each a conformance surface v4 fills in as it goes: what must hold and what holds it, what things are called and where the names collide, and what the smallest next thing is.

**Because.** D-012 promised the originals on arrival so Appendix E could be checked against them rather than trusted; they arrived. The backlog exists because v4 is a narrowing, and a narrowing is only safe if the whole it narrows stays on one page with every cut named; THE LOCK says "both return with their triggers," and a trigger nobody can see never fires. The three artifacts were chosen over others (a lineage document, an event-kind registry alone, a step-2 implementation) because each is a table a later session updates rather than an essay it rereads, and because together they cover the three things a session needs at its start: the rules, the names, the next move.

**Alternatives.**

- *Convert the PDFs by hand into markdown and edit for clarity.* Rejected: the documents are corpus and "never edited"; only formatting the PDF lost is restored, and the provenance comment says so.
- *Commit the PDFs as the originals.* Rejected for now: the PDFs are exports of markdown Danny wrote; the markdown is the natural form, and the conversion is near-lossless. The PDFs stay with Danny; if a discrepancy is ever suspected, they are the arbiter.
- *Fold the backlog into `BACKLOG.md`.* Rejected: D-014's reason — a second copy of the build order is a second build order; the site's backlog points at the North Star's.
- *Write the step-2 code instead of a brief.* Rejected: the charter's posture and Danny's ask ("so v4 can fill in its subset as it goes along"); the brief makes the next session's first hour a decision rather than a rediscovery, and the first act it names costs nothing.

**Reopens when.** A v5 arrives; or a row in the backlog is found to misstate a unit of its original, in which case the original wins and the row is corrected with a note.
