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
