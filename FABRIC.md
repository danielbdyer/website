# The Fabric

*The runtime a local agent session lives in, and the ground the six repositories share. Named 2026-09-06, with Danny, from his own phrase for it: a well-permissioned interaction fabric for a local agent, married to memory and to deterministic action scripts the agent feeds structured data. Downstream of [CLAUDE.md](./CLAUDE.md) (the soul), [CATHEDRALS.md](./CATHEDRALS.md) (the workspace, the slice, the consent loop, git as the vessel), [REACT_NORTH_STAR.md](./REACT_NORTH_STAR.md) (the axioms and the FP rim), and [CONSTELLATION_ARCHITECTURE.md](./CONSTELLATION_ARCHITECTURE.md) (a pure core in a thin shell). It sits on the grounds beside the cathedral, and it is the second thing that needs the root.*

---

## The Image

Six repositories, one person, one pattern. A research vault for a book about staying the author of what you become. A knowledge-graph engine whose whole constitution is *agents propose; the author blesses*. A December seed that named the three operations both grew from. A Next.js root that carried the longing before the architecture. A QA product built for the day job on the same seams, with the personal vocabulary scrubbed out. And this house. Read together, every one of them is a state machine that can do everything except finish. One person finishes.

The fabric is that pattern, made into a runtime. It is not a seventh project. It is the loom the other six are already woven on, named so that a session can stand in it: an append-only log per tenant, a graph as memory, a manifest of verbs that are themselves blessed nodes, a receipt on every call, and consent as the only way across a wall. The session is the only reasoner. The fabric never thinks. It remembers, it acts deterministically when asked, and it waits.

---

## What Is Received

Nothing here is invented. Each part was built once, elsewhere, and is named with the repository that built it.

| Received | From | Where it was written |
|---|---|---|
| The append-only log as the source of truth; the graph as its projection; replay by step | the engine, and the seed before it | `cathedrals` `docs/architecture/GRAPH_PROTOCOL.md`; `living-graph` `CONSTITUTION.md` Article VI |
| Consent as a primitive: pending with `decision = NULL`, blessed or rejected by the sovereign, never by the proposer | the engine | `cathedrals` `AGENTS.md`, `manifesto.md` §"the sacred gap" |
| Spaces as ownership boundaries; a change crosses spaces only as a bridge proposal that lands as pending in the target | the engine | `cathedrals` `SPACE_MODEL.md` |
| Three origins on every edge: declared, discovered, emergent | the engine, the seed | `@dbd/slice` `ORIGINS` |
| The manifest as the contract: a vocabulary generated from code, read once per session, signatures frozen at publication | the product | `agentic-playwright` `AGENTS.md` §"The manifest is the contract" |
| A receipt on every reasoning call; every log append-only; provenance minted at the event, never reconstructed | the product | `agentic-playwright` `AGENTS.md` §"Non-negotiable model" |
| A measurement layer that derives its probes from the manifest and names in advance the boolean at which it stops | the product | `agentic-playwright` `docs/v2-substrate.md` §7 |
| A reference is a receipt, not the content; every claim names where it came from; the direction of flow is recorded | the vault | `book-research` `CLAUDE.md` §"Posture", §"Sources" |
| The session rhythm: orient, work, persist; friction captured as observations; the apparatus retired when it displaces the writing | the vault | `book-research` `CLAUDE.md` §"Session rhythm", §"Known risks" |
| Four actors — author, reader, agent, system — each running pause, sense, respond; structure earned, then blessed | the seed | `living-graph` `CONSTITUTION.md` §"The Four Actors" |
| The golden loop — state, intervention, action, outcome, reflection — as the shape of what a session leaves behind | the root | `dyerverse` `TECHNICAL_MANIFESTO.md` |
| A pure core in a thin shell; time as an argument; events as data; the rim named file by file | the house | `CONSTELLATION_ARCHITECTURE.md` |
| The wall, the door, and who keeps which keys | the house | `CATHEDRALS.md` |

The one thing none of the six wrote is the tenancy rule below, which the record reached on 2026-09-06 in conversation: sovereignty is recursive, and every tenant is sovereign inside its own space.

---

## The Vendor

The memory runtime is not written here. It is vendored, as a model first and as a package second.

**The model is ActiveGraph's**, Yohei Nakajima's event-sourced graph runtime, whose single design decision is the fabric's: *the append-only log is the source of truth and the working graph a deterministic projection of it.* Behaviors react to events and may live on typed edges. Policies decide which mutations require human approval and what the runtime refuses. Around it sit a memory layer that compiles source turns into claims, entities, events, states, preferences, and conflicts, and keeps event time apart from observation time; a pack library whose core carries `memory_candidate` and `evaluation`; an F# artifact of executable laws for when replay, confluence, and fork safety actually hold; and a federated knowledge system whose rules — *agents cannot authorize themselves*; *disclosure precedes public evaluation* — are this file's tenancy rule, written by someone else. The paper is *The Log is the Agent* (arXiv 2605.21997).

**The package is Python. The fabric is Effect.** So the runtime sits behind a port. ActiveGraph owns the log store, the projection, and the memory compile, running as a local sidecar the fabric starts with a session and stops with it. The fabric owns the seam: the manifest, the verbs, the receipts, the consent loop, and the surface the session sees. The two speak only in the slice and the event schema, which keeps `CATHEDRALS.md`'s law that the contract is TypeScript and zod and nothing else. If the sidecar boundary proves awkward in one afternoon, the engine's own event store — expected-version append, replay by step, three temporal coordinates on every event — is the same design in Effect, and the port swaps without the fabric noticing.

**Declined: reasoning inside the runtime.** ActiveGraph ships LLM-backed behaviors. The fabric does not use them. The session is the only reasoner; every behavior the sidecar runs is deterministic. This is not a constraint the vendor imposes. It is the whole point: the deterministic action scripts Danny named are exactly the behaviors, and the reasoning stays where a human can kick it off and read it back.

---

## The Shape

Five layers, in dependency order. Each is data or a pure function until the last, which is the only place an effect is performed.

**The log.** One append-only log per tenant. Every event carries its step in that log, the time it was recorded, and the space it belongs to. The working state — spaces, verbs, receipts, reflections, bridges, references — is a fold over the log, and folding the same log twice yields the same state. Nothing else is ever written. In this repository the log is markdown and JSON in git, per `CATHEDRALS.md` §"Git Is the Vessel"; the sidecar's SQLite is an index of it, rebuilt from it.

**The tenants.** Two spaces from the first day: an operator space and an agent space, each with a sovereign, and each sovereign over itself. Inside its own space a tenant writes without asking. A node moves between spaces only by a bridge proposal, which materializes as pending in the target space and waits for the target's sovereign. A weak reference is the other way across: a citation written onto the relating node, in its own space, pointing at a node across the wall by text — a historical textual citation, resolvable by the fabric and never an edge. The vault's rule for a reference, that it is a receipt and not the content, holds here at the scale of two graphs.

**The verbs.** A verb is a node. It carries its input schema and output schema as JSON Schema data, a consequence class, an origin, and the moment it was blessed. The four consequence classes:

| Class | What a call may do | Where its result lands |
|---|---|---|
| `observe` | read; pure | the session's context |
| `derive` | write to an index or a cache that is recomputable from the log | the sidecar's index |
| `propose` | write to pending in some space | the target space's gap |
| `world` | act outside the graph — publish, run, send | the world, and a receipt in the log |

The manifest is a projection: the verbs of one space that are blessed and not retired, and nothing else. A session reads it once. The agent's tool list is the manifest, verbatim. A `world` verb exists in the collection the same way anything becomes canonical — proposed, then blessed by the operator — and until it is blessed the session cannot see it, let alone call it. A verb's signature is frozen at blessing; a change is a new verb and a retirement.

**The consent port.** The engine's, unchanged: a proposal is pending with a null decision; the target's sovereign resolves it once; the resolution is an event. `resolve` is never a verb. It is the one operation the fabric refuses to put in the manifest, so that no session, however permitted, can bless.

**The session shell.** A Claude Code or Copilot session, started by a human message or a reply, is the only way the fabric runs. The session starts the fabric as a Model Context Protocol server and ends it. The start hook loads a slice by aperture from both spaces, filtered by tenancy and disclosure. The stop hook collects the reflection. Between sessions nothing runs, nothing polls, and nothing wakes on its own. Every verb call appends a receipt: the verb, the space, the session, a fingerprint of the input, a fingerprint of the output. The payloads stay in the events that carried them.

```
packages/
├── slice/     @dbd/slice    the contract: what crosses any wall
├── fabric/    @dbd/fabric   the schema, the fold, the manifest, the invariants, the ports
├── sky/       @dbd/sky      the surface
└── hg/        @dbd/hg       the engine (Phase 2 of CATHEDRALS.md)
```

```mermaid
flowchart LR
  session["a session — the only reasoner"] -- reads the manifest, calls verbs --> fabric["@dbd/fabric — the seam"]
  fabric --> slice["@dbd/slice — the contract"]
  fabric -. EventLog, GraphSource ports .-> sidecar["ActiveGraph sidecar — the log, the projection, the memory compile"]
  fabric -. Consent port .-> git["git — the vessel; hg bless in the terminal"]
  sidecar -. an index of .-> git
```

The fabric depends on the slice and on Effect. The slice depends on nothing but TypeScript and zod. Nothing imports the fabric except an adapter at an edge and the server the session starts.

---

## The First Slice: Reflection

The first thing blessed through the fabric is a reflection from the agent, persisted for retrieval. Everything else is one of many ports; this one runs end to end first.

1. The session ends. The stop hook calls `reflect` with structured data, never prose: what was attempted, what was observed, what was inferred, what should change, and citations to the nodes touched.
2. The reflection lands in the agent space. The agent is sovereign there; no blessing.
3. A deterministic behavior compiles it: claims, entities, events with event time kept apart from observation time, conflicts raised against existing claims. This is the vendor's memory compile, unchanged.
4. A bridge proposal offers the compiled claims to the operator space. Pending, with the gap held.
5. Danny blesses in the terminal. One event, one commit.
6. The next session's start hook retrieves blessed claims into its context by structure and resonance.

**The loop pointed at itself.** A reflection's *what should change* names nodes: a prompt, a skill, a verb, a policy threshold. Each is a node in the operator space, so a change to any of them is a proposal like any other, evaluated against a held-out set before promotion. The memory substrate is the self-improvement pipeline, not a second system beside it. The product's hypothesis receipts and graduation boolean already run this loop in Danny's own code; the vendor's improvement loop runs it under the same gate. ActiveGraph's research agent states the boundary: tuning a threshold *is self-modification through the gate*, and *the inbox is the one place only the human operator exists.*

---

## Invariants

Each carries an id in the engine's ledger style and a test in `packages/fabric/src/fabric.test.ts`.

- **INV-FAB-001 — a call is to a verb in the manifest.** A receipt names a verb that is blessed and not retired. The manifest projection enforces the first half; the invariant check reports the second.
- **INV-FAB-002 — a verb is blessed by the sovereign of its space.** A bless or retire event whose `by` is not the space's sovereign is reported. A bless for a verb never proposed is reported and ignored by the fold.
- **INV-FAB-003 — a bridge crosses a wall and is closed once, by the target's sovereign.** `from` and `to` differ; the first resolution wins; a resolution by anyone but the target's sovereign is reported.
- **INV-FAB-004 — a weak reference crosses a wall as text.** It lives on the citing node, in the citing space, and points to another space. Inside one space a relation is an edge, not a reference.
- **INV-FAB-005 — the fold is a function.** Projecting the same log yields the same state, and the state survives the round trip through JSON. The only write is an append.
- **INV-FAB-006 — a tenant sees its own space whole and the other space through blessing.** Inside its own space a session retrieves everything it recorded. Across the wall it retrieves only what a bridge carried over and the sovereign blessed. Private evidence never leaks through retrieval.

Two declinations are properties rather than checks, and they are stated so a later file cannot quietly reverse them: **the fabric does not reason**, and **`resolve` is not a verb.**

---

## The Workspace

Danny's direction is a modern monorepo. `CATHEDRALS.md` already decided the shape — a pnpm workspace that grows by packages, the site moving under `apps/` when something else needs the root — and this file is the something else. Two adjustments follow from the fabric's own rule.

**Sovereignty is recursive at the scale of repositories.** Each of the six repositories has its own agents, its own hooks, its own commit rhythm, and its own sovereign session. The vault auto-commits on a session hook; the product merges through a human gate; the engine's history is its provenance. Folding them into one history by subtree would make one sovereign of six. So the siblings that stay alive stay in their own repositories, and the workspace holds them as **git submodules**: a pinned commit, which is exactly a weak reference — a citation by hash to a node in another space, written on the relating node. Subtree remains the right verb for the engine alone, as `CATHEDRALS.md` Phase 2 decided, because the engine is meant to become a package of this workspace rather than a sibling of it; that decision stands.

**Playing nice from afar** is one verb. `sync` is an `observe` verb that fetches each submodule's remote, reports the drift between the pinned commit and the sibling's default branch, and lists what changed in the files the fabric reads. Advancing a pin is a `propose` verb: it opens a pull request against the workspace, which is a bridge proposal in the sense above, and Danny blesses it by merging. No pin moves on its own. The vault's cache-marker discipline applies: a pin is re-stamped by a reread of what moved, never by a bare bump.

The submodule arrangement also answers the held question of the workspace's visibility. A submodule pointer publishes a URL and a hash; the content stays in the private repository. The public house can hold the private siblings by reference without publishing a line of them, and the intimate documents `CATHEDRALS.md` names never leave home.

| Sibling | Role in the fabric | Enters as |
|---|---|---|
| `cathedrals` | the engine; the consent loop; the vault of claims about itself | subtree, `packages/hg` (`CATHEDRALS.md` Phase 2) |
| `book-research` | the operator's deepest memory; the reading queue; the poems beneath everything | submodule, read through a `GraphSource` adapter |
| `living-graph` | the seed; lineage; the canvas editor as the source of authoring verbs | submodule under `lineage/` |
| `dyerverse` | the root; lineage; the golden loop the reflection descends from | submodule under `lineage/` |
| `agentic-playwright` | the product; the manifest and receipt patterns; the workshop's graduation loop | submodule, cited; its patterns ported by hand, never imported |
| `website` | the house; the workspace root until Phase 4 | the root |

Which of these enter, and when, waits on Danny's word about visibility, exactly as `CATHEDRALS.md` holds it.

---

## The Sequence

Phases in pull order. Each names its pull, its scope, its exit, and what stays held.

### Phase 0 — The seam (now)

- **Pull:** Danny said lock it in, 2026-09-06.
- **Scope:** This document. `@dbd/fabric`: the vocabularies, the schema of record, the fold, the manifest projection, the invariants and their tests, the three ports with an in-memory adapter and consent over any log. The workspace aliases and the FP rim extended over the package.
- **Exit:** Typecheck, lint, and tests green. Nothing visible changes.
- **Held:** The package name, `@dbd/fabric`, until Danny blesses it. Every name in this file is a candidate.

### Phase 1 — The session shell

- **Pull:** Danny opens a session that should remember the last one.
- **Scope:** A Model Context Protocol server in `packages/fabric` that lists the manifest as tools and appends a receipt per call. A start hook that loads a slice; a stop hook that calls `reflect`. The log as JSON lines in git under a path Danny names. The first four verbs: `slice`, `reflect`, `pending`, `sync`.
- **Exit:** A reflection recorded in one session is retrieved in the next, from the log alone.
- **Held:** The sidecar. The fold runs in process until the boundary is spiked.

### Phase 2 — The vendor behind the port

- **Pull:** The in-process fold is asked a question only the memory compile answers: a conflict between two sessions' claims, or a retrieval by resonance.
- **Scope:** One afternoon. ActiveGraph as a sidecar behind `EventLog` and `GraphSource`, speaking the event schema and the slice. If the afternoon fails, the engine's event store behind the same ports.
- **Exit:** The same six-step slice runs with the sidecar owning the log, and `fabricIssues` is empty over the replayed log.

### Phase 3 — The second tenant

- **Pull:** The first reflection that should cross into the operator space.
- **Scope:** The agent space opened; the bridge proposal on `reflect`; `hg bless` resolving it; the retrieval filter live. Weak references written on reflections that cite the vault.
- **Exit:** A blessed reflection appears in an operator session; an unblessed one does not.

### Phase 4 — The workspace

- **Pull:** Danny's word on visibility and on which siblings enter.
- **Scope:** Submodules under `lineage/` and beside `packages/`; the `sync` verb over them; the site moves under `apps/` per `CATHEDRALS.md` Phase 4.
- **Exit:** `sync` reports drift for every sibling, and no pin has moved without a pull request.

### Phase 5 — The loop pointed at itself

- **Pull:** A reflection whose *what should change* names a skill or a verb, and Danny wants to bless the change rather than make it by hand.
- **Scope:** Change requests as bridge proposals against prompt, skill, verb, and policy nodes; a held-out evaluation before promotion; the graduation boolean stated in advance.
- **Exit:** One change to a skill lands through the gate, with its receipt and its evaluation in the log.

---

## Held

- **The names.** `@dbd/fabric`; the verb names; the path of the log in git. Trigger: Danny's word.
- **Where the log lives.** JSON lines in this repository, or in the engine's repository once it enters. Trigger: Phase 1.
- **The reflection's compile.** Whether the vendor's claim compiler runs on every reflection or only on crossing. Trigger: Phase 2.
- **World verbs.** None are proposed here. The first will name itself when a session wants to do something the graph cannot hold. Trigger: the first ask.
- **Copilot as the session.** The hooks are written for Claude Code first. Copilot's equivalent surface is held until a session runs there. Trigger: Danny opens one.
- **The submodule set.** Which siblings enter, under which visibility. Trigger: Danny's word, before Phase 4.

---

## What This File Does Not Govern

- The slice and its invariants: `CATHEDRALS.md` §"The Contract: The Slice".
- The engine's constitution, decisions, and protocol: its own `docs/`, cited and never rewritten.
- The vault's methodology: its own `CLAUDE.md`.
- How the sky draws what the fabric holds: `CONSTELLATION_WALK.md`, `CONSTELLATION_ARCHITECTURE.md`.
- How HTML reaches the browser and when that stance flips: `RENDERING_STRATEGY.md`. The fabric never runs in the page.

---

## Enforced in Code

Today:

- `@dbd/fabric` at [packages/fabric/src/index.ts](./packages/fabric/src/index.ts): the closed vocabularies (consequence classes, space kinds, decisions, change targets), the schema of record for spaces, verbs, receipts, reflections, bridges, weak references, and the nine event kinds; `project` and `apply` as the fold; `manifestFor` and `toolsFrom` as the projection; `fabricIssues` as the invariant check; `EventLog`, `GraphSource`, and `Consent` as Effect tags with an in-memory log and consent over any log.
- The tests at [packages/fabric/src/fabric.test.ts](./packages/fabric/src/fabric.test.ts) hold INV-FAB-001 through INV-FAB-006 and the six-step slice over the in-memory adapter.
- The workspace: the `@dbd/fabric` alias in `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`; the FP rim extended over `packages/fabric/src` in `eslint.config.js`.

Not yet: everything from Phase 1 on. No server exists. No hook calls `reflect`. No sidecar runs. No submodule is pinned.

---

## Dependencies

**This spec depends on:** `CLAUDE.md`, `CATHEDRALS.md`, `REACT_NORTH_STAR.md`, `CONSTELLATION_ARCHITECTURE.md`, `RENDERING_STRATEGY.md`; in the engine's repository, `AGENTS.md`, `docs/architecture/GRAPH_PROTOCOL.md`, `docs/architecture/SPACE_MODEL.md`; in the product's repository, `AGENTS.md`, `docs/v2-substrate.md`; in the vault, `CLAUDE.md`; in the seed, `CONSTITUTION.md`; in the root, `TECHNICAL_MANIFESTO.md`.

**This spec is depended on by:** `BACKLOG.md`, which holds the phases with their triggers; `CATHEDRALS.md` §"The Shape", which names the package.
