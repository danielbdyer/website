# Evolution Protocol

*How the composite codebase changes over time: what kinds of change there are, who decides each, where each is recorded, and what checks it. `SPECIFICATION_MAP.md` named this file as a gap from the beginning: "The master plan. How the codebase grows over time … the one file that needs every other file's context to make sense." It is written on 2026-10-04 for the whole composite, which is this house, the harness and the vault, because by then the three were being joined. Downstream of everything, and most directly of [ARCHITECTURE.md](./ARCHITECTURE.md) (what must hold), [VISION.md](./VISION.md) (where it goes), [AGENTS.md](./AGENTS.md) (directives 1, 2, 10, 11, 12, 13, 17 and 18), and, in the harness, `CLAUDE.md` (§"Make a rule a check", §"Ask on a surface", §"Follow the intent") and `NORTH_STAR.md` §§11, 13 and 21.*

---

## The Conclusion First

1. **Every change is one of a closed set of kinds.** Each kind has one path, one place it is recorded, one person who decides it, and one check.
2. **There are two speeds, and both are true.** *What* to take on waits for its pull: the website's spanda, directive 1. *How* to do it, once pulled, does not wait to be sure: the harness's "Follow the intent." A session that builds the wrong thing and records why has done better than one that hands over a plan.
3. **The codebase changes through the same loop as the record** (`ARCHITECTURE.md` §"The Loop at Two Scales"). A session proposes an amendment with a hypothesis. Danny approves it or not. The next session reports whether the hypothesis held. The loop graduates by a stopping rule stated in advance.
4. **Danny decides what the system is for, what reaches his record, what a word means, and what a visitor sees.** The agent decides the rest and records each decision with the alternatives it rejected.
5. **Nothing is silently rewritten.** Documents lead code and land with it. The documents that hold a high-water mark (`VISION.md`, `ARCHITECTURE.md`, `COMPONENT_GRAMMAR.md`, `COMPONENT_CATALOG.md`) change by dated amendment, with the cause named.
6. **A better design than the documents describe is the hoped-for outcome, not a deviation.** If it keeps the coordinates in `ARCHITECTURE.md`, it is free to build. The document is amended to say what it improved.

---

## Who Decides What

| Danny decides | The agent decides, and records with rejected alternatives |
|---|---|
| What the system is for. | How to build what has been pulled. |
| What reaches his record (harness `CLAUDE.md`). | Folder layout, file names, package boundaries. |
| What a word means, and any rename. | Libraries and techniques, within the port rules and the budgets. |
| Every directive, and every amendment to a charter. | Refactors, within `ARCHITECTURE.md`'s coordinates. |
| What a visitor sees: visibility, publishing, the site's voice. | Tests, checks and measures, and when to add them. |
| The closed sets: rooms, facets, types of work, actors, moments. | The order of work within a phase. |
| Every approval of an agent's proposal, his own work's verdicts, and the retirement of an apparatus. | Whether a falsifier fired, reported to him with the evidence. |

When it is unclear whose decision a thing is, it is his. It goes to him on a surface he can answer with a keystroke, or in the conversation if that is where he is (harness `CLAUDE.md`, "Ask on a surface").

---

## The Two Speeds

The house's `CLAUDE.md`: "If you're filling space because the plan says to, stop. Work somewhere else. Come back." The harness's `CLAUDE.md`: "Take the work on. A session that deliberates and hands over a plan costs more than one that builds the wrong thing and records why it was wrong."

They govern different moments.

- **Before a phase starts, wait for its pull.** Every phase in `VISION.md` names one: a decision made, a work that wants a fragment, a falsifier that fired. Nothing starts because a list says it is next.
- **Inside a pulled phase, act.** Take the design the documents point at, build it, write the falsifier that would show it wrong, and say plainly what is uncertain.
- **A wrong turn is a record, not a failure.** It goes in the session's record with what showed it was wrong.

---

## The Kinds of Change

| Kind | Path | Recorded in | Decided by | Checked by |
|---|---|---|---|---|
| **A new event kind** | A decision, then one new case in the schema of record, then one new case in `apply`, then regeneration of every derived artifact | The zone's `DECISIONS.md` | The agent, or Danny if it changes what reaches his record | Drift checks (INV-NS-004), the fold's properties (INV-NS-001, INV-OL-001), exhaustive matching |
| **A new type or field** | Induction at arrival (§11), or the node's menu. Then a four-part proposal (distinction, instances, because, falsifier), approval, and regeneration | The log (`type.proposed`, `type.decided`) | Danny | Acceptance rate between 30 and 90 percent (§11); "nothing is built for an unapproved type" |
| **A new verb** | Define the name, a sentence, the consequence class, the schema, then the program (directive 16). Then approval. The signature is frozen at approval | The harness's registry and manifest | Danny, for any verb that writes or reaches the world | INV-FAB-001; frozen signatures (to port from the fabric, INV-FAB-007) |
| **A new mode or crossing** | A storyboard first, then a composition. No new intents | `COMPONENT_GRAMMAR.md`, and the storyboard | Danny reads the storyboard | INV-ARC-040, 041, 043 |
| **A new component** | Within the tiers and thresholds of both React specifications. Promoted to shared at its second consumer | `COMPONENT_CATALOG.md`, if it changes a concern | The agent | The specifications' lint thresholds |
| **A new port or adapter** | At the second implementation, with an in-memory twin passing the same contract tests | The zone's `DECISIONS.md` | The agent | A-07's lint; the contract suite |
| **A new dependency** | A one-line justification and its removal cost | The pull request, and `DECISIONS.md` if it is architectural | The agent; Danny if it runs in a visitor's browser | §21; the bundle budget |
| **A new zone or binding** | A pin recorded as data (a name plus a hash), and a namespace | The root's `DECISIONS.md` | Danny | INV-ARC-020, 021, A-13 |
| **A closed-set change** (a room, a facet, a type of work) | Sit with it for a season (`DYERVERSE.md`); then a decision | `DOMAIN_MODEL.md` and a decision | Danny | The schema's closed enums |
| **A name** | Held as a candidate, with its collisions listed. A rename is one decision applied to every file in one commit, as D-018 was | `DECISIONS.md`, and the names tables | Danny | The glossary check (INV-ARC-022, to build) |
| **A new invariant** | An id, a failing test first, then the check (directive 11) | The zone's invariant ledger | The agent; Danny if it constrains him | Shown to fail without the thing it guards |
| **A charter amendment** | An amendment with its hypothesis and falsifier | The harness's `RECONCILIATION.md` (A-nn) | Danny | Its falsifier, reported by later sessions |
| **A directive** | Only Danny states one | `AGENTS.md`; a `CLAUDE.md` section where it must survive compaction | Danny | Whatever check the directive names; D-142 names its own |
| **Retiring an apparatus** | Its stated condition fires. A decision, then removal in one change | `DECISIONS.md` | Danny, on the agent's report | The condition, stated in advance |
| **A structural refactor** | A trigger (below), then a pull request that keeps every coordinate | The pull request | The agent | `ARCHITECTURE.md`'s checks still pass |

---

## Triggers

These are the signals that start structural change. Each is already written somewhere, and they are gathered here so a session can find them in one place.

| Trigger | Change it starts | Source |
|---|---|---|
| A component file passes 80 lines, a hook 100, a pure function 40 | Split by concern | Both React specifications |
| An import would cross a feature boundary | Promote to shared | Both React specifications |
| A feature's `components/` passes seven entries | Split into sub-features | Both React specifications |
| Providers nest deeper than three | Recompose state | Both React specifications; the outline has six (harness `RECONCILIATION.md` §0a) |
| A second implementation of an external system | Extract a port | A-07 |
| A second consumer of a component or core function | Make it a package or a shared module | `COMPONENT_GRAMMAR.md` |
| A mode seems to need a `mode` prop | The grammar is wrong somewhere. Find the missing composition | INV-ARC-040 |
| A change to the outline and the site needs two pull requests after the join | The join did not do its job | `VISION.md` Phase 3 |
| Shown proposals fall outside 70 to 80 percent welcome | Tune the chief of staff's projection | `VISION.md` Phase 10 |
| R(t) stays flat across ten real sessions | The retrieval design is wrong, and no ordering fixes it | harness `RECONCILIATION.md` §3 |
| The scaling test breaches its shape | Snapshots, and not before | harness `CLAUDE.md` |
| Danny says something feels wrong | Find what he felt before changing anything (directive 2). Write it as his Evaluation first (§13) | `AGENTS.md`; harness `NORTH_STAR.md` §13 |

---

## A Session, From Start to Finish

1. **Arrive.** The zone's start hook runs: `orient`, R(t), and the last session's record. If the session began outside the repository, run the hook by hand (`VISION.md` §"Hints").
2. **Read in order.** The zone's `CLAUDE.md`. `AGENTS.md`. `VISION.md`'s conclusion and open decisions. `ARCHITECTURE.md`'s coordinates. Then the specification for the work at hand.
3. **Find the pull.** If nothing has pulled, ask. Do not invent one.
4. **Document, then invariant, then test, then code**, in one change set (directives 10 and 11).
5. **Verify by driving.** Run the checks. Open what is felt. Report what passed, what failed with its output, and what was not done (directive 13).
6. **Record.**
   - In the harness, the session's record goes in `RECONCILIATION.md` until `record` is approved, and the retrieval events are committed separately.
   - In the house, it goes in `CORPUS.md`'s reconciliation until `reflect` is blessed (directive 17).
7. **Push, open the pull request, say so in one line, and stop.** Never monitor it.

---

## The Loop That Changes the Loop

The codebase improves itself the way the record grows: by proposals that wait for Danny.

- **An amendment carries a hypothesis and a falsifier.** It names the text it was written against, so it can be applied only to that version. That is the fabric's patch loop, which `VISION.md` Phase 3 carries into the harness before the fabric retires.
- **The next session reports the outcome.** *Confirmed* or *contradicted*, with its evidence, as an Evaluation (§13).
- **The loop graduates by a rule stated in advance.** The fabric's was a floor of 0.5 over a window of 5. The number gates nothing. The operator reads it before trusting the loop with more.
- **Danny's corrections are written down before anything else happens.** "Every correction Danny gives contains a reason not yet written down" (§13).

---

## How Documents Change

- **Specifications** are authoritative. Code that disagrees is fixed, unless the code has shown the specification to be wrong, in which case the specification catches up in the same commit (directive 10).
- **High-water documents** (`VISION.md`, `ARCHITECTURE.md`, `COMPONENT_GRAMMAR.md`, `COMPONENT_CATALOG.md`) change by a dated entry in their amendments section. Each entry names what caused it: a decision, a falsifier that fired, something Danny felt, or a better design found while building. The conclusion is updated in place. The earlier text lives in git, and the site's archaeological layer will one day show it (`TRANSPARENCY.md`).
- **Records of conversation** (`HYPOTHESIS.md`) keep Danny's words verbatim and are never edited. Reflections in them are corrected by a dated note beside them, never by rewriting.
- **Generated artifacts** are never edited by hand (§21).
- **Every new top-level document** is placed in `SPECIFICATION_MAP.md`, in its layer.

---

## When a Plan Is Bettered

Danny's hope, on 2026-10-04: "the next agent can find joy in implementing it how they wish alongside your recommendations. They might discover refactors you didn't see possible and that would be an even more delightful outcome."

So this is part of the protocol:

1. **The recommendations in these documents are notes, not orders.** A session that sees a better separation of concerns, a simpler function, or a component that dissolves three others builds it.
2. **The coordinates are the only constraint.** If the better design keeps every invariant in `ARCHITECTURE.md`, it needs no permission. If it moves a coordinate, it proposes the change to the invariant with a falsifier, and Danny decides.
3. **The improvement is recorded where the old recommendation was.** It goes in that document's amendments section, as "bettered by," with what it made simpler. The record of a better idea replacing a good one is worth keeping.
4. **No recommendation here is ever a reason to refuse a better design.**

---

## Measuring Evolution

| What | Measure | Retires when |
|---|---|---|
| Whether the corpus compounds | R(t): retrieval hit rate and mean reciprocal rank | Danny says the number no longer changes what he does |
| Whether proposals are welcome | Acceptance of shown proposals, against 70 to 80 percent; all proposals, against 30 to 90 | The chief of staff's projection holds the band for a season without tuning |
| Whether the invariants are real | The number of invariants in `ARCHITECTURE.md` still marked *to build* | It reaches zero |
| Whether shortcuts are paid down | The count of `// GLUE(reason):` couplings (A-08) | Never, while code is written |
| Whether the glide holds | The keystroke and frame budgets | Never, while the outline exists |
| Whether the writing is protected | Danny's Evaluation after each phase that changes his surfaces | Never |

---

## What This Protocol Refuses

- A high-water document rewritten without a dated amendment.
- A decision that is Danny's, made for him.
- A change to the shape of the record without a decision.
- A check that cannot fail.
- A calendar. Work moves by pulls.
- Growth that displaces the writing.

---

## Amendments

*None yet. The first entry will say what changed, when, and why.*

*Written 2026-10-04 from the site at `05b6933` and the harness at `ecfbce7`.*
