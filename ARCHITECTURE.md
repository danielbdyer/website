# Architecture

*The grammar of the whole codebase: what every unit of code is, what it may do, and when. It is `COMPONENT_GRAMMAR.md`'s move made at the scale of the composite, which is this house, the harness (`danielbdyer/harness`) and the vault (`danielbdyer/book-research`). It was asked for on 2026-10-04: "better not to be overtly prescriptive but maybe referring more directly to the invariants of the architecture - what must be true about how we slice and dice how we implement, relative to our current understanding of the domain." Then: "You hinted at it earlier in your COMPONENT model, I'm just asking that to be turned up to 12."*

*Downstream of [VISION.md](./VISION.md), [COMPONENT_GRAMMAR.md](./COMPONENT_GRAMMAR.md), [CATHEDRALS.md](./CATHEDRALS.md) (the dependency direction law), [REFINEMENT_AUDIT.md](./REFINEMENT_AUDIT.md) (the primitives), and this repository's [REACT_NORTH_STAR.md](./REACT_NORTH_STAR.md). In the harness it is downstream of `NORTH_STAR.md` (§§3, 7, 10, 11, 12, 19, 21, 26, and A-13), its `REACT_NORTH_STAR.md`, and its `CLAUDE.md` §"How the code reads". How these invariants change is [EVOLUTION_PROTOCOL.md](./EVOLUTION_PROTOCOL.md).*

*Each invariant names its check, marked **exists** or **to build**. Existing ids are cited. New ones carry the candidate prefix `INV-ARC`, which is held (directive 12). Nothing here prescribes a folder. What is deliberately free is listed at the end.*

---

## The Conclusion First

1. **The whole system is one loop of eight steps.** A gesture becomes an intent, an intent becomes a draft, a draft becomes an event, and the event is appended to the log. The log folds into a state. The state is projected into a view, and the view is rendered as markup. A person perceives the markup and makes the next gesture. **Two values persist, and neither derives from the other.** The log is the record of what happened. The markdown corpus is the record of his prose (harness D-049). Every other value can be recomputed from one or both. This document calls each step an *arrow*, because it carries one kind of value to the next.
2. **Every unit of code has one coordinate on each of five axes, and the axes vary independently.**
   - *Zone:* whose sovereign body of work it belongs to.
   - *Arrow:* which step of the loop it performs.
   - *Capability:* what in the world it may touch.
   - *Moment:* when it runs.
   - *Actor:* whom it serves.

   Units that render something also carry `COMPONENT_GRAMMAR.md`'s noun and mode.
3. **The invariants are the forbidden combinations.** Examples: a pure arrow that reads a clock; a frame-time function that calls the network; a visitor's request that reaches the author's code. Each forbidden combination has a check, and most of the checks already exist.
4. **The six boundaries are where one coordinate changes.**
   - The *zone wall* is a change of zone.
   - The *purity line* is a change from no capability to some.
   - The *port* is a change to an external system.
   - The *record line* is the one arrow that writes.
   - The *surface line* is a change of mode.
   - The *authority line* is a change of actor.
5. **Agents are actors in the same loop, not a second system.** They enter at the intent and read at the view. A model is called only at the rim, by an agent, during a session. No arrow of the core ever calls one.
6. **The loop runs at two scales.** The same arrows carry the record and the codebase's own evolution. A session is an actor, an amendment is an intent, and R(t) is a view.
7. **The layout is free; the coordinates are not.** The join moves directories. It must not move a coordinate.
8. **A real corpus never lives in the repository.** That is A-13, approved: "No note does." So the vault is bound by a pin recorded as data, not by a submodule, and it is read where it lives.

---

## The Loop

```text
        ┌─────────────────────────── perception ◀──────────────────────────────┐
        ▼                                                                      │
    gesture ──plan──▶ intent ──perform──▶ draft ──stamp──▶ event ──append──▶  LOG
   (a DOM event      (one closed        (what would     (actor, because,       │
    as a value)       union)             change)         id = hash, standing)  │
                                                                             fold
                                                                               │
    markup ◀──render── view ◀──project── STATE ◀───────────────────────────────┘
   (what is seen)    (anatomy, slice,   (approved | proposed;
                      search, R(t),      disposable)
                      markdown, HTML)
```

| Arrow | From → to | What it does | Home today |
|---|---|---|---|
| **gesture** | DOM event → gesture | Turns a key, pointer, wheel or drag into a value. | The outline's row handlers; the sky's interactions. `gestureOf` is held in `CONSTELLATION_ARCHITECTURE.md`. |
| **plan** | gesture → command → plan → intent, or → a view change | Decides what the gesture asks for, given where the author is. Pure. | The outline's 55 commands and its planners; the sky's walk reducer. |
| **perform** | (state, intent) → drafts | What would change in the record. Pure. | `packages/outline/src/core/intents.ts`, 25 intents (D-126); the harness's verbs. |
| **stamp** | (draft, credential) → event | Gives the draft its actor, taken from the credential (D-135). Adds the agent's because, the id as a hash of the content (D-027), and the standing the actor earns. | The outline server's identity; the harness's log and `HARNESS_ACTOR`. |
| **append** | event → log | The only write. One file per writer. | The outline's stores (memory, disk, SQL, D1); the harness's file log. |
| **fold** | log → state | A reduce over `apply`. Total, so a bad line becomes a defect and the fold goes on. | The harness's fold; the outline's fold. |
| **project** | state → view | Every read: the anatomy, the slice at the wall, rows, search, `orient`, R(t), the markdown export, a page's HTML. Pure. | Many, and each one is named. |
| **render** | view → markup | A pure function of the view and its prominence, with DOM effects at the rim. | Each mode's renderer. |

Beside the log sits the second record, the markdown corpus of his prose (D-049). The markdown adapter reads it in as `import.markdown` events, each carrying the file's path and the content hash it saw. §10's round trip writes an edit back to the file. Neither record is a view of the other. Losing the corpus must not cost the state, and losing the log must not cost the writing.

Two things the diagram makes plain:

- **A plan may end in a view change instead of an intent.** The sky's walk events, a zoom, a lens, a mode crossing: these change what is shown, not what is recorded. They never reach `stamp` (INV-ARC-031).
- **Perception is not code.** The loop is closed by a person, and the site's practice is to leave that step alone. The system offers. It does not pull.

---

## The Five Axes

Each axis is a closed set, extended only by decision (`EVOLUTION_PROTOCOL.md`).

| Axis | Values | What it decides |
|---|---|---|
| **Zone** | house · harness · vault | Whose words, history and log the unit belongs to (directive 4). |
| **Arrow** | gesture · plan · perform · stamp · append · fold · project · render | What the unit transforms. |
| **Capability** | none (pure) · DOM · storage · network · credential · clock · random · model | What in the world the unit may touch. |
| **Moment** | build · arrival · request · interaction · frame · never | When the unit runs, and so its budget. |
| **Actor** | author · agent · visitor · runtime | Whom the unit serves, and so what standing its writes earn. |

**The moments and their budgets:**

| Moment | When | Budget |
|---|---|---|
| **frame** | While something is on screen | No frame over 20 ms at 10,000 nodes (D-128). |
| **interaction** | From keystroke to persisted event | At most 16 ms at the 99th percentile (§7). |
| **request** | A server or the Worker answering | The Lighthouse floors; time to first byte held. |
| **arrival** | When a person or a session begins: `orient`, induction (§11), the chief of staff | Deterministic and bounded. Measured on the scaling test. |
| **build** | Prerendering, generation, drift checks | Minutes. Measured in CI. |
| **never** | Between sessions | Nothing runs (directive 5). |

---

## What May Combine

Each arrow admits some capabilities, some moments and some actors. Anything outside its row is forbidden.

| Arrow | Capabilities it may hold | Moments | Serves |
|---|---|---|---|
| gesture | DOM | frame | author, visitor |
| plan | none | frame | — |
| perform | none | interaction | author, agent |
| stamp | credential (the hash is pure) | interaction, request | runtime, on behalf of the caller |
| append | storage | interaction, request | runtime |
| fold | none | any moment it is asked | — |
| project | none | build, request, arrival, frame | author and agent over both sides; a visitor over the approved side only |
| render | DOM, at the rim only | frame, build | author, visitor |
| *an agent's adapter* | network, model | arrival (inside a session) | agent |

The forbidden combinations are the invariants:

| Id | Forbidden | Check |
|---|---|---|
| **INV-NS-006**, **INV-OL-005** | A pure arrow (plan, perform, fold, project, the render function) holding any capability. | *Exists:* both tests read every module the core reaches. |
| **INV-ARC-001** | Anything at frame or interaction time touching the network or a model. | *Exists in part:* the React specifications forbid components from importing infrastructure. *To build:* a lint rule on planner and render modules. |
| **INV-ARC-002** | A model called anywhere but an agent's adapter, or at any moment but arrival. | *Exists for the fold* (INV-NS-006). *To build:* a test that no scheduled entry point reaches a model (directive 5). |
| **INV-ARC-003** | Any write to a log except by `append`, and any `append` of an event that was not stamped. | *Exists in the outline:* "there is no second way to change the outline" (D-126). *To build:* the site's author layer must use the outliner's intents API and nothing else. |
| **D-135** | `stamp` taking the actor from the request rather than the credential. | *Exists for the outline server.* The harness's CLI takes its actor from `HARNESS_ACTOR`. That is acceptable on the author's own machine, and it is where this invariant is weakest. |
| **INV-NS-005**, **INV-OL-003** | An agent's draft reaching the approved side without an author's event. | *Exists.* |
| **INV-ARC-004** | A visitor served anything but `project` and `render` over the approved side, or any of the author layer. | *To build:* the byte-identity test, written before the Worker, and a bundle check. |
| **INV-ARC-031** | A plan that ends in a view change reaching `stamp`. | *To build:* every event kind is either a record change or is named in the decision that admits it, such as the collapse in D-131. |
| **INV-ARC-005** | One zone's arrow reading another zone's values, except through a projection published at the wall: the slice, or the markdown adapter. | *Exists inside each repository* (eslint-plugin-boundaries; A-07). *To build:* across zones. |
| **INV-ARC-006** | An arrow defined twice: a second `perform`, a second fold over one log, a second anatomy. | *Exists for intents* (D-126). *To build:* anatomy (adjudication A1), and a lint rule against a second union over record changes. |
| **INV-ARC-010**, **INV-NS-008** | A fold that throws on any input, the empty log included. | *Exists* in the harness. *To build:* the same test for the outline's fold. |
| **INV-NS-002** | A view whose deletion loses anything. | *Exists* in the harness. The markdown corpus is not a view: it is the second record (D-049). *To build:* a test that the site builds from markdown alone, with no log present. |

---

## The Six Boundaries

Each boundary is the place where one coordinate changes. The invariants above are grouped below by the boundary they guard, with what each boundary leaves free.

### The zone wall: a change of zone

A zone is sovereign over its words, history, log and practice. Directive 4: "Sovereignty is recursive."

| Id | Invariant | Check |
|---|---|---|
| **INV-ARC-020** | **A zone writes only to itself.** | *To build:* a check that no file of the vault appears in any other zone's repository, and that the harness's log is written only through `append`. |
| **INV-ARC-005** | **What crosses is a projection with a schema of record, never an import of internals.** | See above. |
| **INV-ARC-021** | **A binding across zones is a name plus a hash, moved only by a reviewed change.** Examples: a pin recorded as data, a content-hashed id, an AT Protocol strong reference. | *Exists* for event ids (D-027). *To build:* the pin file, and a check that it changes only in a commit that changes nothing else. |
| **A-13** | **A real corpus never lives in the harness's repository, and no constant derives from one.** "Shape crosses the boundary; content does not." | *Exists* as charter, with the generator as the default substrate (§15). |
| **INV-ARC-022** | **Each zone keeps its own words, and the wall keeps one.** | *To build:* a glossary per zone, linted for a term defined twice. |

**Free:** how many zones there are. How many git repositories hold them. Where each zone's directory sits.

### The purity line: from no capability to some

The record must give the same answer on any machine, in any order, forever (§3). Purity is about capabilities, not dependencies (D-041).

**Holds:** INV-NS-006 and INV-OL-005; INV-NS-001 and INV-OL-001 (the same events give the same state, in any order); INV-ARC-010 (the fold is total); every failure is a value with a name; render is a pure function (this repository's axiom 14).

**Free:** libraries (Effect inside the record, zod at contracts, React at surfaces), algorithms, data structures, and where the rim's files live.

### The port: to an external system

The record outlives every vendor (harness `CLAUDE.md`).

**Holds:**

- A-07: no third-party import outside an adapter module, with its own lint test.
- Every port has an in-memory twin that passes the same contract tests. The log's two layers and the outline's stores already do.
- A port is extracted at its second implementation.
- INV-OL-006: the portable core runs in Node, a browser and a Worker unchanged.
- §21: no dependency without a justification and its removal cost.

**Free:** the vendor, the store, the transport.

### The record line: the one arrow that writes

**Holds:**

- INV-ARC-003: one write path.
- INV-FAB-011, INV-OL-004 and D-027: provenance, the because, and content-hashed ids.
- INV-NS-002: every view is disposable.
- INV-NS-004: one schema of record per boundary. Every other representation is generated and drift-checked.
- INV-ARC-031: view state stays out of the record.
- INV-ARC-032: kinds are closed unions, matched exhaustively.
- §11: nothing is built for an unapproved type.

**Free:** whether the outline's log and the harness's log become one. That is held after D-130 and B-47. Also how the two records meet: the round trip, which is the harness's open Q-50. Also storage layout and snapshots.

### The surface line: a change of mode

**Holds:**

- INV-ARC-040: no component takes a mode.
- INV-ARC-041: a mode adds gestures and commands, never intents.
- INV-ARC-042: the anatomy is computed in one function.
- INV-ARC-043: a crossing cannot be built without the node it came from.
- INV-ARC-044: each mode keeps its own renderer, chosen by its frame budget (A-37).
- INV-ARC-045: budgets are invariants: 16 ms per keystroke, 20 ms per frame, and a visitor's initial JavaScript at most 150 KB gzipped.

These are detailed in `COMPONENT_GRAMMAR.md`.

**Free:** the framework within the budget, each mode's design, the folder layout within the two React specifications, and when shared components become a package.

### The authority line: a change of actor

**Holds:**

- INV-NS-005 and INV-OL-003: agents propose.
- D-135: identity comes from a credential.
- INV-ARC-004: a visitor's response is byte-identical without the author, and the visitor's bundle never contains the author layer.
- D-138: every act can be undone.
- Directive 5: nothing reasons while he is away.
- INV-ARC-052: a world verb such as Publish is the author's act and crosses with readiness.

**Free:** the sign-in gesture, the identity provider, device enrollment, and the words for the readiness states.

---

## Agents in the Loop

An agent is an actor. It uses the same arrows, entering and leaving at fixed places.

| Arrow | For an agent |
|---|---|
| gesture | A tool call: the outline's MCP tools (`outline_read`, `outline_insert`, `outline_edit`, `outline_act` and the rest), its HTTP intents API, or the harness's CLI. |
| plan | The model's reasoning. It happens outside the codebase, which is why no arrow of the core calls a model. |
| perform | The same 25 intents as the keyboard (D-126). |
| stamp | An agent token gives the actor `agent:<name>`. Every draft it writes is stamped proposed. |
| project | `orient`, `search`, `view`, `outline_read`. Every retrieval is itself an event (INV-FAB-010). |
| moment | Arrival, inside a session a person started (directive 5). `outline_wait` waits inside such a session. It does not start one. |

**The chief of staff is a projection, not an agent.** Scoring the queue of proposals is a pure `project` at arrival: the queue goes in, and a few shown proposals come out. It needs no model and no actor. That placement is what lets it honor directive 5 without amendment. It also means its rule for what to show can be tested like any other projection, against the 70 to 80 percent band.

---

## The Loop at Two Scales

The codebase changes through the same arrows that carry the record.

| Arrow | In the record | In the codebase's own evolution |
|---|---|---|
| actor | Danny, an agent, a visitor | Danny; a session |
| intent | edit, type, publish | `record Amendment`: a change to a skill, a document or the charter, with a hypothesis |
| stamp | the actor's standing | A session's amendment is proposed, and Danny's approval moves it |
| view | a page, the sky, R(t) | R(t), acceptance rates, the session record that `orient` prints |
| perception | reading | the next session reading what the last one recorded |

`EVOLUTION_PROTOCOL.md` describes this second loop as practice.

---

## How the Coordinates Sort the Code

Not a prescription. Each existing unit is placed by its coordinates, so a later session can see that the layout follows from them.

| Unit | Zone | Arrows | Capability | Moment | Today |
|---|---|---|---|---|---|
| Harness schema and fold | harness | fold | none | any | `packages/harness/src/{schema,fold}` |
| Harness verbs and retrieval | harness | perform, project | none, with effects at its Layers | arrival, interaction | `packages/harness/src/{verbs,retrieval}` |
| Harness log, CLI, hooks | harness | stamp, append | storage | interaction, arrival | `packages/harness/src/…`, `.claude/hooks/` |
| Outline core | harness | perform, fold, project | none | interaction, frame | `packages/outline/src/{schema,core}` |
| Outline server, sync, agents | harness | stamp, append | credential, storage, network | request | `packages/outline/src/{server,agent}` |
| Outline on Cloudflare | harness | append (an adapter) | storage, network | request | `packages/outline-cloud` |
| The outline mode | harness | gesture, plan, render | DOM | frame | `packages/outline-app` |
| The contract at the wall | shared | project | none | build | `packages/slice` |
| The site's content loader and slice adapter | house | project | none at the core, files at the rim | build | `src/shared/content` |
| The sky | house | gesture, plan, render | DOM | frame | `src/shared/{sky,organisms/Constellation}`, `packages/sky` |
| The pages | house | render | DOM | build, frame | `src/app` |
| The fabric | house | all, in an earlier form | storage | arrival | `packages/fabric`, retiring |
| The anatomy, prominence and orientation functions | shared | project | none | frame, build | Not yet |
| The author layer | house | gesture, plan, render | DOM, network (to the intents API) | frame | Not yet; a separate entry |
| The Worker | house | stamp-like (it reads a credential), render | credential | request | Not yet; byte identity first |
| The vault | vault | — (read by the markdown adapter, a `project` at the wall) | — | arrival | Its own repository, beside the others |

A candidate tree after the join, if the harness becomes the root (`VISION.md`'s lean; the decision is Danny's):

```text
/                         the harness's root: its charter, decisions, session records
├── packages/
│   ├── harness/          the record
│   ├── outline/          the outline's core and server
│   ├── outline-cloud/    the outline's Cloudflare adapter
│   ├── outline-app/      the outline mode
│   ├── slice/            the contract at the wall             (from the site)
│   └── sky/              the sky surface, a shim for now      (from the site)
├── apps/
│   └── site/             the house, whole: specifications, src, deploy, voice
└── zones.json            pins: { "vault": { "repo": "danielbdyer/book-research", "commit": "…" } }
                          (the vault itself is checked out beside the repository, never inside)
```

---

## What Changes at the Join

The join moves directories. It must not move a coordinate. These are the places where the two repositories meet and a decision is needed, so that nothing breaks silently.

| Meeting point | The conflict | Candidate |
|---|---|---|
| **The vault** | `HYPOTHESIS.md` and `VISION.md` proposed a submodule. A-13 says a real corpus "never lives in the repository." | A pin recorded as data (`zones.json` or similar), with the vault checked out beside the repository and read by the adapter where it lives. The same consent and the same friction, with no notes in the tree. Both files are amended. |
| **The site's own corpus** | The site's works are a real corpus. After the join they live in the harness's repository, under `apps/site`. They stay a record of his prose even once the outline can edit them (D-049). | A-13's rules 1 and 3 hold by the zone wall: no harness code path, constant or test may read `apps/site`. Danny decides whether a real corpus inside the same repository, behind that wall, satisfies A-13 or needs an amendment. |
| **Decision ids** | Both repositories have a `D-001`. | References across zones are qualified (`site D-005`). Each zone's log keeps its own numbering. |
| **Invariant ids** | The site's fabric has `INV-FAB-001` to `009`. The harness kept `001`, `010` and `011` from the same lineage. | The harness's ledger continues. The site's `INV-FAB` ids retire with the fabric. |
| **"One decision log"** | §21 says `DECISIONS.md` is the one decision log. The site publishes its own. | One log per zone, and decisions that span zones go in the root's log, tagged. This amends §21's sentence, so it needs Danny's word. |
| **Session hooks** | `fabric orient` and `harness.sh start`. | The harness's hooks, at the root. The fabric's are removed when it retires. |
| **Checks** | Two eslint configurations, two check scripts, two sets of git hooks. | One root check that runs each zone's own. No zone's rules are weakened to fit another's. |
| **The two React specifications** | Four disagreements (`COMPONENT_GRAMMAR.md`). | One amendment, proposed to Danny. Until then, each app keeps its own. |
| **Composite documents** | `HYPOTHESIS.md`, `COMPONENT_GRAMMAR.md`, `VISION.md`, this file and `EVOLUTION_PROTOCOL.md` describe the whole, but live in the site. | They move to the root, or stay in `apps/site` as the site's published strata. Danny decides. The site's transparency commitment bears on it. |
| **Visibility** | The harness is private. The site and the vault are public. | Decided before the join. |

---

## The Checks to Build, in Order

1. **INV-ARC-004:** the byte-identity test. Before the Worker exists. It is the visitor's whole guarantee.
2. **INV-ARC-021:** the pin file and its check. Before any code reads the vault.
3. **INV-ARC-040 and INV-ARC-041:** no mode prop, and one intent union. Before a second mode shares a component.
4. **INV-ARC-042 and INV-ARC-006:** one anatomy. With adjudication A1.
5. **INV-ARC-043:** the crossing type. Before the first crossing beyond the look-up.
6. **INV-ARC-001:** no network or model at frame or interaction time. Before the author layer's first line.
7. **INV-ARC-031:** view state outside the record. Before the next outline event kind.
8. **INV-ARC-002:** the directive 5 test. Before the chief of staff.

Each check is shown to fail without the thing it guards before it is trusted (harness `CLAUDE.md`, "Make a rule a check").

---

## What Is Free

Everything not fixed above can change without asking this file:

- folder and file names, and package boundaries;
- how many repositories hold the zones;
- libraries, frameworks and vendors, within the port rules and the budgets;
- storage, transport and rendering technique;
- each mode's visual design;
- the order of work within a phase.

A change that moves a coordinate is not free. It goes through `EVOLUTION_PROTOCOL.md`.

*Drafted 2026-10-04 from the site at `05b6933`, the harness at `ecfbce7`, and the invariant ledgers of both as they stood that day.*
