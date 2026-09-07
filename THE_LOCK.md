# THE LOCK — agentic coding memory, flywheeled on itself

<!-- Persisted 2026-09-07 from Danny's PDF export (THE_LOCK.pdf, 7 pages). The words are unchanged; headings, tables, and the one monospace block are restored from the PDF's layout. Never edited by a session. v4 of NORTH_STAR.md is this lock applied to v3.2; the lock's own build order is v4 §23. -->

**v1 · 2026-09-06 · downstream of NORTH STAR v3.2. Narrows, does not replace.**

## 0. The lock, in one sentence

We build a memory and provenance layer for coding agents, and the repository that builds it is its first customer — every session that advances the product runs on the product, and the product's R(t) on its own repo is its proof.

Everything in the North Star still holds. This document decides what we build first, what we hold, and how the thing feeds itself.

## 1. The wedge

**The problem, as a developer feels it:** every agent session starts at zero. The correction you gave yesterday is gone. The spec drifted from the code three sessions ago and nobody noticed. The reason behind the architecture decision lives in a Slack thread that scrolled away. You are paying frontier-model prices to re-explain your own codebase.

**The promise:** install once; the next session starts oriented. Your corrections become durable. Your decisions keep their reasons. Docs that drift from code fail the commit. And a number tells you whether any of it is working.

**The ten-minute path:**

```
npx fabric init          # hooks into Claude Code (Copilot, Cursor next); seeds from git history
# ...work as normal...
npx fabric describe      # R(t), corrections captured, proposals waiting
npx fabric bless <id>    # promote what's right
```

**The aha, and it happens in the second session:** the agent cites something the first session wrote, unprompted, and it was right. R(t) goes from 0 to 1 and the developer saw it happen.

## 2. Day-one value — the corpus is already there

The cold-start problem (R(t) = 0 for a week) is solved by import, not patience:

- **Git history as corpus.** `fabric init` folds commit bodies into `import:git` events. Every "because" a developer ever wrote in a commit message is retrievable by the next session, immediately.
- **Existing docs as nodes.** `CLAUDE.md`, ADRs, `DECISIONS.md`, READMEs — parsed, linked, aliased. The spec layer becomes retrievable structure.
- **Existing hooks and skills as verbs.** Whatever `.claude/` already holds is inventoried into the manifest as proposed verbs.

A developer with a year of history has a corpus on minute one. Their first `orient` is not empty.

## 3. The flywheel — five turns

**Turn 1 — self-hosting.** `danielbdyer/website` is tenant zero. Every session building the product runs `orient`, cites, reflects, and is measured. The `CORPUS.md` reconciliation pattern is the product's first feature, discovered by using it. Real R(t) moves off zero here or the product is not real.

**Turn 2 — second tenant.** `cathedrals` and Tesseract become tenants. Cross-repo retrieval — a distinction from one repo surfacing in another — is the first evidence that the corpus is Danny's and not the repo's. Per-source R(t) appears.

**Turn 3 — one team.** Danny's dev leads at work, on their own repos, their own tenants, their own keys. The multi-tenant semantics get their first real test where "we don't all agree" is the daily condition. Correction-repeat rate on a team is the number that sells it.

**Turn 4 — the public number.** danielbdyer.com publishes the build repo's R(t) live: the product proving itself in public, continuously, from its own log. The marketing is a fold.

**Turn 5 — the product improves the product.** Fifty real retrievals with use signal arm Ax. The reranker that learned from building the fabric is proposed, blessed, and shipped to every tenant. The corpus that measures itself tunes itself.

Each turn feeds the previous: a better product makes building the product faster, which produces more log, which makes the product better.

## 4. Scope — what is in, what is held

**In** (the agentic-coding path, nothing else):

| Capability | Why it's on the path |
|---|---|
| Log, fold, SQLite projection, hybrid retrieval | the spine |
| `note`, `reflect`, `orient`, `recall`, `slice`, `evaluate`, `bless`, `describe` | the verbs a coding session actually uses |
| Claude Code hooks: start → `orient`; PostToolUse → file reads as retrievals; stop → `reflect` | the harvest of behavior into signal |
| `import:git`, `import:transcript` | day-one corpus; conversations as proposals |
| Corrections as author evaluations | the single most valuable event a coding session produces |
| `DECISIONS.md` + generated docs with drift check | the spec layer stops rotting |
| Aliases on miss | retrieval by the developer's own words |
| `compounding()`, the synthetic harness, the regression gate | the instrument, its teeth, its baseline |
| Multi-tenant semantics: DIDs, signing, `import:tenant`, trust policy | turn 3 needs them; build them at turn 2 |
| CLI as the only surface | the honest floor; everything else is later |

**Held, with the North Star's triggers unchanged:**

- Electron surface — after capture, retrieval, and evaluation are measured in a resident process
- Browser verbs / Tesseract — after turn 2; a second product on the same spine
- Plugins beyond the first (the Claude Code integration is the first plugin)
- Cloudflare deployment of any tenant — a tenant that must be reachable from another machine
- Federation, UCAN, Workers AI tiers — their triggers
- Ax — fifty real retrievals with use signal

**Cut for now, on the record:** the metamodel loop beyond frontmatter → type (the coding case needs few types); the markdown round-trip for prose (the site's works are not on this path). Both return with their triggers.

## 5. The loop for a user

1. **Install.** Hooks in, history imported, first `orient` already non-empty.
2. **Work.** Nothing changes about how they use the agent. Behavior is harvested silently.
3. **Correct.** When they correct the agent, the correction is an evaluation event — captured by the stop hook from the session, proposed for blessing.
4. **Bless.** A minute a day: `fabric describe` shows what's waiting; they bless what's right, dismiss what isn't. Dismissal is a miss, recorded.
5. **Read the number.** R(t) per session, correction-repeat rate, time-to-context. Weekly, the curve either bends or it doesn't.

The product asks for one thing: a minute of blessing. Everything else it takes from conduct.

## 6. Metrics — the product's and the customer's are the same fold

| Metric | What it tells a developer | What it tells us |
|---|---|---|
| R(t) | Is the agent using what I taught it? | Is the product working at all? |
| Correction-repeat rate | Am I saying the same thing twice? | The number that sells to teams; should fall toward zero |
| Time-to-context | How many turns before the agent is oriented? | Retrieval quality in the developer's currency |
| Proposal acceptance | Is it proposing things worth blessing? | Induction and alias quality; the 30–90% band |
| Drift failures caught | Did the docs lie and get caught? | The spec layer's value, counted |
| Miss count | What did it fail to surface? | The retrieval backlog, ranked |

Every one of these is a projection of the log. No analytics pipeline. No telemetry that isn't already an event with provenance. A user can verify every number from their own file.

## 7. Build order — the lock's version of section 23

| Step | Work | Finishes when |
|---|---|---|
| 1 | `bless reflect`; one reflection; one citation next session | real R(t) = 1 on tenant zero |
| 2 | Hooks: `PostToolUse` file-read harvest; stop-hook correction capture; model on receipt | use signal and evaluations appear without asking |
| 3 | `import:git` and doc import; `fabric init` | a fresh clone has a non-empty first `orient` |
| 4 | Synthetic harness: firewall, discrimination proof, scaling numbers, committed baseline | the metric has teeth; the fold's breach point is known |
| 5 | SQLite projection; FTS5 + sqlite-vec + graphology; RRF; regression gate armed | retrieval p95 ≤ 100 ms at 10⁴; identity test green |
| 6 | `evaluation.recorded`; corrections blessed through the fabric; correction-repeat rate on the dashboard | the number that sells exists |
| 7 | Generated docs + drift check | a doc that lies fails the commit |
| 8 | Second tenant (cathedrals); DIDs, signing, `import:tenant`, trust policy | first cross-repo citation |
| 9 | `fabric init` on a dev lead's repo | turn 3 begins; correction-repeat rate on a team |
| 10 | Publish R(t) on the site | turn 4 |
| 11 | Ax reranker at fifty retrievals | turn 5 |

Steps 1–3 are days. Step 4 is the honest week. Steps 5–7 are the product. Everything after is the flywheel turning.

## 8. First thirty days, concretely

- **Week 1:** steps 1–3. R(t) = 1 by day two or we learn why. `fabric init` runs on a fresh clone of the website repo and produces a non-empty `orient`.
- **Week 2:** step 4. The discrimination proof and the fold's breach point. Reported in numbers in `DECISIONS.md`.
- **Week 3:** steps 5–6. SQLite lands; correction-repeat rate is a line on `describe`.
- **Week 4:** step 7 and step 8 begun. Cathedrals is a tenant. One dev lead has seen `fabric describe` on their own repo.

At day thirty the question is one number: has R(t) on tenant zero risen for three consecutive weeks? If yes, turn 3. If no, the reconciliation says why, and the why is the product's next feature.

## 9. Risks, named

- **Citation inflation.** An agent told that citing is how it's measured will cite. Guard: the file-read hook logs what it actually opened; a citation of nothing surfaced is a miss; explicit "did not help" is first-class. R(t) is computed from conduct, not from claims.
- **Dogfooding bias.** Building for one developer with sixty spec files is not building for a developer with a README. Guard: `fabric init` is tested on a fresh clone of a stranger's repo before turn 3; the ten-minute path is a real ten minutes, timed.
- **The container ahead of the loop, again.** Multi-tenant semantics are seductive. Guard: step 8 does not start until step 6 has produced a correction-repeat number on tenant zero.
- **Cold start for teams.** A team's first week is R(t) = 0 for everyone. Guard: git import gives day-one corpus; the synthetic demo shows the curve before it's real, labeled as `R_sim`, never merged.
- **The gate as friction.** Some developers will not bless. That is the filter, not a bug: the product is for people with taste who want it to compound. We do not lower the gate to widen the funnel.

## 10. What to call it

Held. The house has a name for the substrate (the fabric) and none for the product. A name is a proposal Danny blesses; it should not come from a session, and it should not come before turn 3 has shown the product to a stranger.

## 11. Definition of done for the lock itself

This document is done when tenant zero's `describe` prints a non-zero R(t) that a stranger's clone could reproduce from the log alone. Until then, it is a plan, and the plan's first line is still one terminal command.
