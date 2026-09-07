# Vocabulary — the concordance across versions and the code

*Written 2026-09-07. Directive 12 forbids a third name for a thing that has two, and v3 §2 says "use them exactly." This file is where the names are checked against each other: what the v2 charter called a thing, what v3 and the §28 addendum and THE LOCK call it, what v4 calls it, and what the code calls it today. Where they agree the row is short. Where they collide the row says so, because a verb's name freezes at blessing (INV-FAB-007) and a wrong name then lives forever as a new verb. Collisions are Danny's to settle; a session records them and never coins around them.*

*Sources: `CORPUS.md` Part one (v2), `NORTH_STAR_v3.md`, `NORTH_STAR_v3.2.md`, `THE_LOCK.md`, `NORTH_STAR.md` (v4), and `packages/fabric/src/`.*

## Collisions to settle before a name freezes

| Term | The collision | Where | What is at stake |
|---|---|---|---|
| **bridge** | The fabric: a proposal to carry a node across a wall into another space (`bridge.proposed`, INV-FAB-003). v3/v4 §2: "a proposed relation between nodes, with evidence." | `schema.ts` `bridgeProposalSchema` vs v4 §2, §6 (`fabric bridge`) | v4 step 2 names a `bridge` verb. If it is blessed under the fabric's meaning, the relation-with-evidence needs another name; if under v4's, the carry-across does. → `CORPUS.md` Part four §C |
| **tenant** | v3 §2: "one log's scope — a person, a space, or a `sim:<run>`." v3.2 §28.2 and v4 §2: "one log's scope *and one identity*" — a keypair, a DID; each specialized agent a tenant. | v3 vs §28 vs code | The code has one log directory with two *spaces* (`danny`, `agent`) and no identity. Under v3.2 the agent becomes a tenant of its own, not a space; that is a data-model move (NS-28.15), not a rename. |
| **space** | v3 §2: "the operator's, a session's own, the author's." v4 §2: "a tenant's named partition." | code: `OPERATOR_SPACE = 'danny'`, `AGENT_SPACE = 'agent'` | Consistent, provided the agent's space becomes the agent tenant's space when NS-28.15 lands. |
| **receipt** | v3 §2: inputs, outputs, provenance, `because`. v3 §6: + duration. v4 §2: + model. | code: `verb.called` payload has fingerprints and `because`; no `model`, no `duration` | Two fields to add at v4 step 2. The event kind is named `verb.called` in the code and `receipt` in every North Star; a kind rename is a migration. |
| **bless** | The fabric: an operator act, "never a verb," run from the terminal. v4 §6, §19: a lock verb, `fabric bless`, with review mode, batch, and `--dry`. | `cli.ts` `bless` vs v4 §19.5 | The sovereignty is unchanged (only `author:` provenance blesses); what changes is that the act becomes a verb with a receipt (INV-NS-011). Held: whether an author-only verb belongs in the *operator's* manifest an agent can list. |
| **capture / note** vs **reflect** | v2 §2 required capture with no structure; v3 §7 (accepted amendment): `note` is capture, `reflect` is reflection, two verbs. | code: `reflect` exists; `note` does not | No collision; a missing verb (D-005 reopened). |
| **canonical / shadow** vs **blessed / proposed** | v3 §2 names two projections; the code has one state with `decision: null` for the unanswered. | `log.ts` | Same distinction, one data structure. A collision only if someone builds a second projection *and* keeps the flag. |
| **haecceity** | v2 used it for the node; v3 §2 (accepted amendment): "what it *is*, not what it is *called* in code"; `Haecceity` never enters the code unless Danny blesses the rename. | slice `node`, engine `entity` | Settled: three names in three places, none new. |

## The actor grammar

| Version | Grammar | Code |
|---|---|---|
| v2 §1 | `author \| agent:<id> \| import:<source>`; `because` required on agent events at the schema | — |
| v3 §4 | `runtime · author:<space> · agent:<session> · import:<source>` | `actorSchema` regex `^(runtime\|author:\S+\|agent:\S+\|import:\S+)$` — this |
| §28.2, v4 §4 | `author:<space>@did:…`, `agent:<session>@did:…`; the DID alongside the grammar; every event signed | already parses (`\S+`); no signing (INV-NS-006 not built) |
| v4 §4 | `agent:<session>` carries the session id *and the model that ran it* | no model field (step 2) |
| sim | `import:synthetic`, the existing import kind with source `synthetic` (D-007) | `sim/quarantine.ts` |

## Event kinds: the North Star's name and the code's

| North Star | Code today | Note |
|---|---|---|
| `receipt` | `verb.called` (and `verb.refused` beside it) | a rename is a migration; v3.2 §28.3 namespaces all kinds as `dyer.fabric.*`, which is the same migration once |
| `bridge.proposed` / `bridge.decided` | `bridge.proposed` / `bridge.resolved` | `decided` vs `resolved` |
| `patch.proposed` / `.decided` / `.outcome` | `patch.proposed` / `.evaluated` / `.resolved` / `.outcome` | the code has one more kind, the fabric's own evaluation of a patch |
| `verb.proposed` / `.decided` / `.deprecated` | `verb.proposed` / `.blessed` / `.retired` | `retired` has no successor or `because`; v3 §6 `deprecated` does |
| `blessing` / `unblessing` | `verb.blessed`, `source.blessed`, `bridge.resolved`, `patch.resolved` | blessing is per-kind in the code, one kind in the North Star; no unblessing |
| `retrieval.surfaced` | `retrieval.surfaced` | agree; `retrieval.used` / `.missed` are v4 additions not yet built |
| `reflection.recorded` | `reflection.recorded` | agree |
| `space.*`, `verb.*`, `source.*` | `space.opened`, `verb.*`, `source.proposed` / `.blessed` | agree |
| — | `reference.cited` | the code's weak reference across a wall (INV-FAB-004); no North Star name |
| `note.captured`, `alias.*`, `type.*`, `evaluation.recorded`, `browser.action`, `optimizer.artifact.*`, `import.*`, `key.rotated`, `capability.*`, `trust.policy`, `subscription.*`, `checkpoint`, `tier.decided` | — | proposed kinds; enter the schema of record by decision record and blessing (v3 App A) |

## Verbs: every list, side by side

| v3 §6 memory verbs | THE LOCK §4 | v4 §6 the lock's verbs | Code today | Standing |
|---|---|---|---|---|
| `note` | `note` | `note` | — | step 3 |
| `reflect` | `reflect` | `reflect` | `reflect` | **blessed** |
| `orient` | `orient` | `orient` | `orient` (a CLI command, runtime actor) | a command, not a verb |
| `recall` | `recall` | `recall` | `recall` | proposed |
| `slice` | `slice` | `slice` | `slice` | proposed |
| `bridge` | — | `bridge` | — (`bridge.proposed` is written by `reflect`) | collision above |
| `patch` | — | `patch` | `propose` | **two names**: the verb that proposes a patch is `propose` in the code and `patch` in every North Star |
| `evaluate` | `evaluate` | `evaluate` | — | step 6 |
| `bless` | `bless` | `bless`, `unbless` | `bless`, `reject` (CLI commands) | `reject` ≈ dismiss; `unbless` absent |
| — | `describe` | `describe`, `why`, `trust`, `init`, `doctor`, `log` | `describe`, `init`, `log`, `pending`, `sync`, `index`, `stop-check`, `sim-baseline` (CLI) | `pending` and `sync` are verbs the North Star does not name; `why`, `trust`, `doctor` absent |

Two verb-name facts to settle before blessing beyond `reflect`: **`propose` vs `patch`** for the verb that proposes a patch (the code's name was chosen before v3 named it; both are blessed nowhere yet, so either can win without a migration), and **`bridge`** (above).

## Terms v4 introduced

| Term | v4 §2 | Code today |
|---|---|---|
| **Inbox** | the set of proposals awaiting the operator's decision, as `describe` and `bless` present it | `pending` verb; `fabric pending` command |
| **Correction** | an operator's instruction that an agent's output was wrong, recorded as an author evaluation | — |
| **Daemon** | the resident process that owns the tenant actor; the CLI its thin client | — (`tsx` cold start per command) |
| **Use** (widened) | for an agent: a citation, a patch, *or a file it actually opened* | citation and patch only |

## Terms the code has that no North Star names

| Code | What it is | Whether it needs a North Star name |
|---|---|---|
| `consequence` (`observe` · `derive` · `propose` · `world`) | what calling a verb can do to the world; on every receipt | yes, eventually: v4's verb `kind` (`memory` · `plugin` · `cli`) is orthogonal to it, and both will sit on the manifest entry |
| `source` (`vault` · `works` · `skills`) | where a space reads from besides the log; blessed like a verb | v4 §10's "existing docs as nodes" is the same idea from the other side |
| `canon` | the nodes a patch may change, on disk | v4 §11's metamodel and §20's skill-as-node are its successors |
| `weak reference` (`reference.cited`) | a citation across a wall, as text, never an edge | v4 §14's cross-boundary `contradicts` edge (§28.4) is the stronger cousin |
| `graduation` `{ floor, window }` | the loop's own floor over outcomes | v4 §13 "patch.outcome is the fabric's own evaluation of itself" |
