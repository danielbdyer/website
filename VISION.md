# Vision

*Where the composite codebase is going, and how it gets there. The composite is three repositories: this house (`danielbdyer/website`), the harness (`danielbdyer/harness`) and the vault (`danielbdyer/book-research`). The vision is written on 2026-10-04 at Danny's request: "detail out your manifesto for where the site will head … consider this our one-shot-one-opportunity moment to write from the wisdom of him who has already solved the right hints to give our future selves (future agents)." It is the high-water mark of one day's understanding, preserved as it stood so that later sessions iterate from it instead of re-deriving it.*

*It sits on the grounds, downstream of [CLAUDE.md](./CLAUDE.md), [AGENTS.md](./AGENTS.md) (directive 18 above all), [HYPOTHESIS.md](./HYPOTHESIS.md) (the conversation it comes from), [COMPONENT_GRAMMAR.md](./COMPONENT_GRAMMAR.md) (the library it needs) and [DYERVERSE.md](./DYERVERSE.md) (the manifesto of the whole, written before the harness existed as a repository). In the harness it is downstream of `NORTH_STAR.md`, which governs the record and is not changed by anything here. [MANIFESTO.md](./MANIFESTO.md) remains the site's manifesto and `DYERVERSE.md` the reading of six repositories as one. This file says where the three living ones go from here, concretely enough to build from.*

*Every item is marked with its standing: **exists** (built and running), **decided** (Danny's word is recorded), **proposed** (waiting for his word), or **held** (named, with a trigger). Every name not marked settled is a candidate (directive 12).*

---

## The Conclusion First

1. **One person's practice, two records, many views of them.** Danny writes, decides, publishes and sees relations in one place. Visitors see what he chose to show. Underneath sit two records at different grain, neither derived from the other (harness D-049, his decision of 2026-09-14). The first is the append-only logs, the record of what happened. Today that is the outline's log (one per document, D-130) and the harness's log (one per tenant), to be joined by B-47. The second is the markdown corpus, the record of his prose, readable in git with none of this software. Everything else is a view of one or the other.
2. **The writing surface stays Workflowy-calm, and power arrives at the moment it helps.** Structure is induced from use and approved by him. A field is a question with a right moment, never a form in front of the sentence. This is his `#hypothesis`: "the over-embedding of fielding into Tana was a distraction from being able to pay attention to the actual work surface."
3. **Every crossing is opened-with** (directive 18, D-142). The move is his, made in the place he already is, and the system follows. A change of mode asks for readiness, not only consent.
4. **The site is the published face.** For a visitor it is static, and it stays byte-identical whether or not Danny is editing it. The author's layer exists only on his enrolled devices, only at night, and only after his name has been carried to the moon.
5. **Agents propose, and he recognizes.** In the vault's words, the unit of authorship is recognition, not the sentence. Proposals are few, local and quiet. They are scored when he arrives, not while he is away, and they fold away when he ignores them.
6. **The component library is a grammar.** It has nouns (one, the node), verbs (defined once) and modes (five). No component takes a mode.
7. **Each repository is a sovereign zone, and every binding between zones is a name plus a hash.** The vault is pulled in without being polluted. The long direction is the AT Protocol's: portable, addressable, eventually signed.
8. **The instrument comes first** (directive 17). Every claim in this file has a measure, and every apparatus names the condition under which it retires.
9. **The writing is the work.** Nothing here may grow at the writing's expense. The vault learned this first and retired its own apparatus to keep it. Every phase below is checked against it.

---

## What This Is For

The composite exists so that one person can stay in contact with his own thinking while it becomes public. Everything else serves that.

Danny named what that contact feels like, and his words are the specification. Directive 2 says the feeling is the spec, and it is usually ahead of the written one.

| His words | What they require | How it is checked |
|---|---|---|
| "I'm not distracted, and stay completely embedded in this minimalist text editor surface that glides along" | Nothing on the writing surface that he did not write or summon. | The harness's §7 numbers: at most 16 ms from keystroke to persisted event at the 99th percentile. D-128's frame budget: no frame over 20 ms at 10,000 nodes. *(exists)* |
| "but then becomes powerful as certain moments when you need it to" | Power one gesture away, never on screen uninvited: the palette, zoom, the menu. | The bullet menu and palette are built in the outliner. *(exists)* |
| "would somehow materialize softly into an interface … but would take care of you every step of the way" | Fields are questions asked at their moment, and twenty meanings of care (`HYPOTHESIS.md`, answers 5 and 7). | Each candidate meaning becomes a behavior with a test once it is chosen. *(proposed)* |
| "opened-with - not an opened-by, or opened-into" | Every surface, verb, crossing and contract passes the three review questions. | Directive 18 and D-142. The first mechanical check is the type `Crossing`. *(decided)* |
| "commensurate to its occasion rather than some kind of peacocking" | Motion the size of its cause. A type's arrival does not perform. | The house's motion tokens. The type-arrival table in `HYPOTHESIS.md`. *(proposed)* |
| "It's gotta be non-attention seeking basically" | Proposals appear only one level below his focus, muted until he points at them. | Prominence as one function family (`COMPONENT_GRAMMAR.md`), with a property test. *(proposed)* |
| "the user is never blocked from accomplishing their goals" | A menu on every node: publish, open in its type's editor, make this a type now. | The bullet menu exists; these three commands are new. *(proposed)* |
| "solicits not only consent but readiness to shift into a different mode of thinking" | Crossings that can be begun, felt and abandoned. | The readiness state machine, generalized from `useThresholdReveal`. *(proposed)* |
| "the editor and the actual render of the content itself were basically identical" | The authored page is the page plus one layer. | Invariant: the author layer imports no page module. *(proposed)* |
| "a door they cannot open - they'd have to know it's there, first of all" | A visitor never receives the author's version of any page. | A byte-identity test on the Worker's responses. *(proposed)* |
| "Yep, only the night." | The moon is the only receiver for the sign-in gesture, and it appears only at night. | The theme toggle already shows the moon by night (`ThemeToggle.tsx`). *(exists, as the threshold)* |
| "safely and efficaciously pulled in but not polluted" | The vault enters by pinned reference and is read-only from outside. | A pin recorded as data, with the vault read where it lives (amended below). *(proposed)* |
| "a consensual binding … tracked as a dependency and induces some friction to be able to break that linkage" | Every binding across zones is explicit, pinned, and removed only deliberately. | A name plus a hash: a submodule pin, an AT Protocol strong reference, a content-hashed event id. *(proposed)* |
| "as little dynamism and client side bundle in the frontend as possible" | Static HTML for visitors, with no author code in their bundle. | `PERFORMANCE_BUDGET.md`: initial JavaScript at most 100 KB target and 150 KB limit, gzipped. Today: 118 KB. *(exists)* |
| "non-disruptive to the soma or psyche, and keeps you feeling very connected to yourself" | All of the above, judged by him. | His own Evaluation, recorded in the harness, after a month of use. *(proposed)* |

---

## The Composite, Today

A map of what exists on 2026-10-04, so a later session can tell what changed.

| Zone | Repository | Visibility | What it holds | Commit |
|---|---|---|---|---|
| **The house** | `danielbdyer/website` | Public | The site: five rooms, eight facets, the sky at `/sky`, one authored work (`src/content/garden/small-weather.md`). React 19, TanStack Start prerendering every route, Cloudflare Workers serving static assets only. Forty-odd specifications, published as the site's strata (`TRANSPARENCY.md`). An earlier record runtime, `packages/fabric`, never blessed. The contract package `@dbd/slice`. | `c6ea9b1` and later |
| **The harness** | `danielbdyer/harness` | Private | The record: an append-only log per tenant, one file per writer, event ids that are content hashes, a fold into approved and proposed state, verbs, approval and revocation, retrieval and R(t). The outline: a Workflowy-shaped editor over its own log (`packages/outline`, `packages/outline-app`), with 25 intents, 55 commands and agents writing as proposals. It is deployed to `outline.danielbdyer.com` through `packages/outline-cloud`: a Durable Object per document, D1 and R2. `NORTH_STAR.md` v5 is the charter, with decisions D-001 to D-142. | `ecfbce7` |
| **The vault** | `danielbdyer/book-research` | Public | The research for the book: 516 notes, each one claim with a sentence for a title and typed frontmatter, joined by wiki links. Twelve topic maps. Danny's reflections, including "On recognition." An apparatus it retired on 2026-08-09 when it began to displace the writing. | `1a3142f` |

Tests at this mark: the site's 567. The harness's unit project ran 816 in this session. Its last session record (2026-10-03) counted 849 unit and app tests together, and 168 browser tests.

---

## The End State, Concretely

A target, described as a sequence of moments, so that each requirement can be traced to the experience it serves. Nothing in this section exists yet unless marked.

**A morning in the outline.** He opens `outline.danielbdyer.com`. The opening is a session start. The chief of staff reads the queue as he arrives, scores it deterministically with no model call, and leaves two proposals visible, each under a node he created yesterday and left empty. Both are muted. The rest wait in Review. He writes. A line gets the tag `#hypothesis`, and nothing asks him anything.

**A week later.** He writes a note that bears on that hypothesis. Under the note, quietly, a mirror of the hypothesis appears as a proposal: "this may bear on it." He points at it, and it comes forward. He zooms into the hypothesis. Its page shows its questions as quiet empty places: "what would show this wrong?" One keystroke records *confirmed*, with a short because. Nothing else changes on screen.

**A tag becomes a type.** The tag has recurred a dozen times. On arrival, one proposal waits: make `#hypothesis` a type. It has the four parts every proposed type must have (§11): the distinction, the instances by id, the because, and a falsifier. He approves it. The tag's ink settles once, at the house's shortest duration. From then on, a hypothesis zoomed into shows its fields, and from its parent it is still just a line with a tag. Later, a proposal to add a field arrives as one change listing every instance, with an offer to leave them unfilled.

**An evening on the site.** He dims the room. The sun becomes the moon. He carries his name from the nav to the moon, the moon draws it the last distance, and his fingerprint confirms. Nothing visible changes except that the page is now his to touch. He right-clicks the Study's deck and edits it in place. He selects a paragraph of an essay, writes, and clicks off; it saves. The page is the same page a visitor sees.

**Publishing.** In the outline he right-clicks a node and chooses Publish. The site's fields (title, room, facets) are asked for at that moment, already filled in where they can be guessed. He accepts. The work's markdown file is written and committed to main, and the site deploys from it as static HTML. His prose is now in git, readable with no software at all (D-049).

**The relational mode.** Before a session of structuring, he crosses deliberately: the readiness gesture, begun, felt, completed. Typed nodes come forward and everything else is quieted, still within reach. Vault claims appear in their own zone, read-only. He binds a claim into an essay as a quoted claim. The binding is a name plus a hash, so if the claim later changes in the vault, the essay keeps the version he chose until he moves the pin.

**A visitor.** Someone reads an essay in the Study, looks up, and sees its star among its threads. Nothing in what they received knows that anyone edits this site.

**A session.** A coding agent opens the monorepo. The harness's hook prints R(t) and the last session's record. The agent works through the verbs, proposes an amendment with a hypothesis, and records a Reflection. The next session reports whether the hypothesis held.

---

## The Architecture of the End State

```text
                         ┌──────────────────────────────────────────────┐
                         │  THE RECORD — append-only, one discipline    │
                         │  the outline's log (per document) ──B-47──▶  │
                         │  the harness's log (per tenant)              │
                         │  one file per writer · fold → approved |     │
                         │  proposed                                    │
                         └──────┬──────────┬──────────┬──────────┬──────┘
                                │          │          │          │
                        the outline   the page    the sky    the markdown
                        (writing)     (reading)  (relations)  (prose's record)
                                │          │          │
                                └── author layer (his devices, at night) ──┘

       the vault (pinned, read-only)  ──name + hash──▶  read through the markdown adapter
```

| Part | What it is | Standing |
|---|---|---|
| **The record** | Two append-only logs under one discipline. The outline's own log, one per document (D-130), holds everything written in the outline. The harness's log, one per tenant, holds the author's record. Approved bullets reach the harness's log as Notes through B-47's adapter (D-131). Whether the two logs ever become one is held. | Both logs *exist*; B-47 is *admitted* and not built. |
| **The schema of record** | One zod schema per boundary, with the portable JSON Schema generated and drift-checked. At the wall between zones, `@dbd/slice` carries a bounded view. | *Exists* on both sides. The slice/view naming collision is *held*. |
| **The outline** | `packages/outline` (pure core, intents, server, sync, MCP) and `packages/outline-app` (the renderer). | *Exists.* |
| **The page** | The site's routes, prerendered from the markdown corpus. Rendering at the edge is held, for the day the time from Publish to visible grows too long. | Prerendering *exists*; edge rendering is *held* behind the publish trigger. |
| **The sky** | The site's `/sky`, drawing a slice. | *Exists* for works; drawing outline nodes is *proposed*. |
| **The authored page** | The page plus the author layer, attached to parts by address (`data-address`, `data-part`) and dispatching the outline's intents to its API. | *Proposed* (`COMPONENT_GRAMMAR.md`). |
| **The Worker** | It runs first for page requests (`run_worker_first`, present in the installed wrangler schema). It recognizes his enrolled device and adds the author layer with HTMLRewriter. Everyone else gets the static file unchanged. | *Proposed.* |
| **Identity** | Passkeys (WebAuthn) added to the outliner's identity (D-135), one per enrolled device, with a second device as the recovery path. Cloudflare Access with a device check is an optional outer gate. An `httpOnly` cookie scoped to `.danielbdyer.com`. | *Proposed.* D-135's identity *exists*. |
| **The markdown corpus** | The second record (D-049): his prose as files in git, readable without this software, and searchable by any agent with `grep`. The outline reads a work through the markdown adapter (`import.markdown`, carrying the file's path and content hash). An edit made in the outline is written back to the file by the round trip of §10. | The record *exists* (`src/content/`). Writing back from the outline is *proposed*. Whether a materialized tree round-trips is the harness's open Q-50. |
| **The vault zone** | `book-research` bound by a pin recorded as data (a name plus a commit hash), checked out beside the repository, and read by the harness's markdown adapter into its own namespace. It is never inside the repository (A-13). | *Proposed* (amended below). |
| **Namespaces and bindings** | Type names qualified by zone, in the manner of AT Protocol lexicon ids. Bindings across zones are a name plus a hash. Signed events come with federation. | Namespacing is *proposed*; signing is *held* (D-135). |
| **Agents** | Harness hooks for every session. The fabric's MCP server, ported to serve the harness's verbs. The chief of staff, scoring when he arrives. "Discuss with AI" (D-139). The patch loop, ported from the fabric, so an amendment can be applied to a file. | Hooks and Discuss *exist*; the rest is *proposed*. |

---

## The Principles

Each has a statement, the reason, the check that would catch its violation, and its source.

### 1. Two records; everything else is a view

**Statement.** Only two things cannot be regenerated. The logs are the record of what happened. The markdown corpus is the record of his prose. Neither derives from the other (D-049). The outline view, the article, the sky, the static HTML and every index are views of them.
**Because.** D-049, decided by him and recorded with his provenance: "losing the corpus must not cost the state, and losing the log must not cost the writing." Making markdown a projection of the log was rejected, because "it makes the author's own prose a derived artifact of a system he wants to outlive." His "these are the same thing!" (`HYPOTHESIS.md`, answer 12) is honored as one work held in two records at different grain, with a rule for how they meet.
**Check.** The site builds from markdown alone, with no log present (*to build*). The state rebuilds from the log alone (INV-NS-001, INV-NS-002). An import names the file and the version it saw (`source.path`, `source.contentHash`).

### 2. Structure is induced from use, and the author approves it

**Statement.** Types and fields arrive by induction or by his menu, never by design ahead of use.
**Because.** The harness's §11: "Schema accretes from use. It is never designed ahead of use." His experience of Tana: "the modelling was the work, and the work was not the point."
**Check.** Nothing is built for an unapproved type (§11).

### 3. A field is a question, and it has a right moment

**Statement.** A question is asked when its answer exists or would help: on return, on relevance, at a decision. It is never asked at writing time.
**Because.** The `#hypothesis` bullet. The vault's own answer to "how much ontology": "Enough constraint to support fluency. Not enough constraint to determine emergence."
**Check.** A typed node shows its fields only when zoomed into. A property test enforces it.

### 4. Opened-with

**Statement.** The move is his, in the place he already is, and the system follows.
**Because.** Directive 18; D-142; his reflection on recognition.
**Check.** The three review questions. The type `Crossing`, which cannot be built without the node it came from.

### 5. Readiness, not confirmation

**Statement.** A change of mode can be begun, felt and abandoned. Its last step is his act, never an "are you sure?" dialog.
**Because.** "Not, are you sure, but click twice to confirm kind of thing" (answer 13). The look-up already works this way: "Release early and the room settles back."
**Check.** Every crossing runs through one state machine (at rest, offered, gathered, taken), and a test releases each crossing early.

### 6. Commensurate motion

**Statement.** A thing changes on screen in proportion to its cause, and only with a motion token.
**Because.** "Commensurate to its occasion rather than some kind of peacocking."
**Check.** The house's existing rule that no motion appears without a token. "Speed-as-virtue" and "drift toward dashboard" are already on its list of drift modes.

### 7. Quiet agents

**Statement.** Proposals are few, local, muted, scored when he arrives, and folded away when ignored. The target is 70 to 80 percent welcome among those shown.
**Because.** The first-use tour read as "a lot of to-do list items." Directive 5: nothing wakes on its own.
**Check.** The acceptance rate of shown proposals is measured against the band. Proposals are offered only one level below his focus.

### 8. Recognition is authorship

**Statement.** Nothing becomes his because an agent wrote it. It becomes his when he recognizes it: by keeping it, by writing in it (D-123), or by giving it a verdict.
**Because.** The vault: "fluent language a person did not recognize is not yet theirs to have authored."
**Check.** INV-OL-003: an agent's events change nothing approved without an author's event. An agent may prepare a field; only his act fills it.

### 9. The visitor's page never changes because he is editing

**Statement.** Without his device's credential, every response is the static file, byte for byte.
**Because.** "They'd have to know it's there, first of all."
**Check.** A byte-identity test on the Worker, written before the Worker.

### 10. Each mode is a composition

**Statement.** No component takes a mode, and no mode adds an intent.
**Because.** This repository's axiom 13, and the shape of the praxis pipeline (`COMPONENT_GRAMMAR.md`).
**Check.** The component-shape lint bans a `mode` prop. There is one intent union.

### 11. Sovereign zones, pinned bindings

**Statement.** Each repository keeps its own words, history and hooks. A binding across zones is a name plus a hash, moved only by a commit he approves.
**Because.** Directive 4. "book-research absolutely kind of deserves its own zone."
**Check.** Nothing outside the vault writes to it. The pin moves only through a reviewed change.

### 12. The instrument first, and every apparatus retires

**Statement.** A feature ships with the measure of its effect. Every measuring thing names the condition under which it stops.
**Because.** Directive 17. The vault's retirement on 2026-08-09. `DYERVERSE.md` §"The apparatus that names the day it deletes itself."
**Check.** Each phase below lists its measure and its falsifier.

### 13. Documents, then invariants, then tests, then code

**Statement.** Intent is written where intent lives before the code moves. An invariant has an id and a failing test before it has an implementation.
**Because.** Directives 10 and 11, and the harness's "Make a rule a check."
**Check.** A pull request that changes behavior also changes a document.

### 14. The writing is the work

**Statement.** No phase may cost Danny his writing.
**Because.** The vault's first rule, and his own diagnosis there: the apparatus "unmoored me from the practice of experience around what it's like to write this book."
**Check.** His Evaluation, recorded after each phase that changes his surfaces: did this cost the writing?

---

## The Path

The phases are ordered by what each one unblocks, and each starts only on its pull (directive 1). Each lists its pull, its scope, its exit, its measure and its falsifier.

### Phase 0 — The decisions (now)

**Pull.** This file.
**Scope.** Danny's word on each item in "The Open Decisions" below. Visibility comes first, because it decides the shape of the repositories.
**Exit.** Each decision is recorded: in the website's `DECISIONS.md` for the house, and in the harness's `DECISIONS.md` for the record.
**Falsifier.** A decision that later turns out to need a decision underneath it, made first. If that happens, this file's ordering was wrong.

### Phase 1 — One anatomy of a work

**Pull.** Adjudication A1 (`REFINEMENT_AUDIT.md`), already proposed.
**Scope.** Pattern 1's parts are derived once. The five work renderers become declared projections, and each part carries `data-address` and `data-part`. No behavior changes.
**Exit.** Five renderers, one anatomy function, and a table of which parts each surface shows.
**Measure.** The site's tests stay green, and the number of places a work's parts are derived drops from five to one.
**Falsifier.** A surface that cannot be expressed as a projection without a special case.

### Phase 2 — The storyboard

**Pull.** Phase 1's anatomy, which the storyboard draws.
**Scope.** The five modes and every crossing between them, drawn scene by scene in the manner of `CONSTELLATION_STORYBOARD.md`, with the seams where one gesture lands while another is still unfolding. Includes the moon and the relational mode.
**Exit.** A storyboard Danny has read and corrected.
**Falsifier.** A scene he cannot feel his way through on paper.

### Phase 3 — The join

**Pull.** The visibility and root decisions.
**Scope.** If one visibility is acceptable, the harness becomes the root and the site enters by `git subtree add` under `apps/site`, with its history. The fabric's five ideas become harness backlog stories. Then the fabric is retired in one change, the vault is bound by a recorded pin, and the harness's hooks run every session. If one visibility is not acceptable, the two stay separate repositories with one contract.
**Exit.** One install, one `pnpm check`, and both deploys working: the site to Cloudflare Workers and the outline to `outline-cloud`.
**Measure.** Time to a green check on a clean clone.
**Falsifier.** A change that touches the outline and the site needing two pull requests after the join. If so, the join did not do its job.

### Phase 4 — The Worker that changes nothing

**Pull.** Phase 3.
**Scope.** A Worker that runs first for page requests and returns the static file. Its byte-identity test is written first.
**Exit.** Production served through the Worker with no visible difference. Lighthouse floors held.
**Falsifier.** A measurable change in time to first byte that the budget cannot absorb.

### Phase 5 — The moon

**Pull.** Phase 4, plus the storyboard's sign-in scenes.
**Scope.** Passkey enrollment on the outliner's identity, at least two devices, and a recovery path written down before the first device is enrolled. The Worker adds the author layer only for an enrolled device. At night the name is draggable, the moon receives it, and the passkey confirms.
**Exit.** Signing in on two of his devices. A visitor's response still byte-identical.
**Falsifier.** A lockout. If one happens, recovery was not designed first.

### Phase 6 — Works as nodes

**Pull.** Phase 3, plus the answer to the harness's Q-50: whether, and how, the materialized tree round-trips.
**Scope.** The site's works become nodes the outline can edit, while their files under `src/content/` stay the record of his prose (D-049). The outline reads each work through the markdown adapter, with its path and content hash. An edit in the outline is written back to the file by §10's round trip. The site keeps building from markdown exactly as it does today.
**Exit.** A change made to a work in the outline lands in its markdown file. The site still builds with no log present.
**Falsifier.** A work's markdown and its node disagree, and no rule says which wins.

### Phase 7 — One part, authored

**Pull.** Phases 5 and 6.
**Scope.** The author layer on one part only, the title: edited in place, dispatching `edit` to the outliner's API.
**Exit.** He edits a title on the live page, and the record shows the event with his provenance.
**Falsifier.** Editing in place that needs the page to know about editing.

### Phase 8 — Publishing is a commit

**Pull.** Phase 7, plus the decision on content previews.
**Scope.**

- The Publish command in the outline's menu. The site's fields are asked for at that moment.
- Publishing writes the work's markdown file and commits it to main. "A blessing is a commit" (`CATHEDRALS.md` §"Git Is the Vessel").
- The site deploys from main as it does now. This matches answer 12: publishing from anywhere, a localhost session included, "but only on the main branch."
- B-47's adapter, so outline nodes reach the harness's record as Notes.

**Exit.** A node published from the outline is visible to visitors as static HTML, and its prose is in git.
**Measure.** The time from Publish to visible, which is build plus deploy, measured first and then budgeted. Rendering at the edge is held for the day that time is too long.
**Falsifier.** He waits on a deploy often enough to mind. If so, the held edge rendering is pulled.

### Phase 9 — B-46, reshaped

**Pull.** Danny's word on reshaping B-46.
**Scope.**

- Tags stay text.
- A typed node shows its fields when zoomed into.
- The menu offers "make this a type."
- Recurring tags are proposed as types through §11's four-part form, with a smaller trigger than twenty reflections if he chooses.
- Field additions arrive as one proposal over all instances, with an option to leave them unfilled.

**Exit.** `#hypothesis` approved as a type through this path.
**Falsifier.** He finds himself zooming in only to fill fields.

### Phase 10 — The chief of staff

**Pull.** Enough proposals that choosing among them matters, and the directive 5 decision.
**Scope.** A deterministic score at arrival, so proposals are shown or held. The first-use tour is no longer a pile of proposals.
**Exit.** An acceptance rate measured on what was shown.
**Measure.** Shown-and-welcome inside 70 to 80 percent.
**Falsifier.** The rate stays outside the band after two rounds of tuning.

### Phase 11 — The relational mode

**Pull.** Several approved types, so there is something to bring forward.
**Scope.** The prominence function over the outline, typed nodes forward. A crossing into it with readiness. Possibly the same prominence over the sky.
**Exit.** A structuring session he chose to enter and leave.
**Falsifier.** The mode gets used to avoid writing rather than to structure it. Only he can call that, and it should be asked.

### Phase 12 — The vault zone

**Pull.** Phase 3's pin, and a work that wants to quote a claim.
**Scope.** Vault notes read into their own namespace. Quoted claims and transclusions with pinned bindings. Vault claims as a second region of the sky.
**Exit.** One essay quoting one claim by binding.
**Falsifier.** Anything written into the vault from outside it.

### Phase 13 — The arena

**Pull.** Several prior ontologies dropped in as parcels.
**Scope.** Rival types from the lineage tested under D-005 and §11, where survival is by instances in his writing. Perhaps drawn as a sky of types.
**Exit.** One type changed or confirmed because of the arena.
**Falsifier.** Five sessions with no type changed. If so, the arena is decoration.

### Phase 14 — Federation

**Pull.** A second author, or a reason to publish the record itself.
**Scope.** Signed events, portable tenant logs, and namespaces as addresses, in the AT Protocol's direction.
**Held.**

---

## What This Refuses

- **A login form, an admin area, a dashboard of his own content.** These are opened-by and opened-into.
- **Thinking done for him that he does not take up.** Fields filled for him without his recognition.
- **Transformations that perform.** Motion without a token.
- **Proposals that pile up into a to-do list.** Badges, counts, streaks, or any metric on a person.
- **Anything that wakes on its own,** unless directive 5 is amended by him.
- **A component with a mode switch, or a second union of intents.**
- **Writing into the vault from outside it.**
- **A third name for a thing that has two.**
- **A feature without a measure of its effect.** That is shipping guesses as progress (directive 17).
- **Growth that displaces the writing.**

---

## Names

| Name | Means | Standing | Collisions to hold |
|---|---|---|---|
| **opened-with** | The move is his, in place, and the system follows | Settled (directive 18, D-142) | — |
| **gate** | The author's approval | Held for replacement | Opened-by in its connotation |
| **bless / approve** | The author's decision on a proposal | Both in use | The site says *bless*; the harness renamed it *approve* (D-018) |
| **slice / view** | A bounded read across a wall | Both in use | The harness renamed *slice* to *view* (D-018) |
| **lens** | A narrowing of a gathering, in the address | Settled in the house | Not the relational mode |
| **relational mode** | Typed nodes forward, nothing removed | Candidate (his phrase) | — |
| **gesture** | Input as a value (`gestureOf`); also a kind of movement (`kindOf`) | Two senses in the house | Hold the choice |
| **consequence class** | What a verb touches | The fabric has four; the grammar proposes five | `record` vs `propose` |
| **offered, gathered, taken** | The readiness states | Candidates | Replace "armed, fire" |
| **authored page, author layer** | The page plus his layer | Candidates | — |
| **chief of staff** | The arrival-time scorer of proposals | Candidate (his phrase) | — |
| **address, anatomy, orientation** | `REFINEMENT_AUDIT.md`'s primitives | Settled in the house | — |
| **Dyerverse** | The workspace | Held until he renames a repository | — |
| **work, Note, node** | A published unit; a record unit; the outline's unit | All in use | A work is a node with a type |

---

## Measures

| Claim | Measure | Today |
|---|---|---|
| The glide | Keystroke to persisted event, 99th percentile, at most 16 ms; no frame over 20 ms at 10,000 nodes | The frame budget is held (D-128). |
| Visitors stay static | Worker responses without the credential are byte-identical to the static files | Not yet: there is no Worker. |
| A small client | Initial JavaScript at most 100 KB target, 150 KB limit, gzipped | 118 KB |
| Quiet agents | Acceptance of shown proposals between 70 and 80 percent; all proposals between 30 and 90 percent (§11) | Not measured. |
| Compounding | R(t): retrieval hit rate and mean reciprocal rank (`compounding()`) | 0 of 0 at this session's start |
| Publishing | Time from Publish to visible: build plus deploy | Not built. |
| The writing | His Evaluation after each surface-changing phase | — |

---

## What This Will Probably Get Wrong

- **The apparatus again.** His own words in the vault name the hazard: "already over engineering the system again." This file is itself apparatus. The defense is principle 14 and the falsifier at every phase.
- **The join costs more than expected.** Two toolchains, two deploys, two sets of hooks, and a visibility question that may not resolve cleanly.
- **Edge rendering erodes the static guarantee.** Prerendering may remain right for a long time. Phase 7's falsifier is there to say so.
- **Passkeys can lock him out.** Recovery comes before enrollment. One enrolled device is not enough.
- **The moon is invisible by day and on a new device.** The outliner's own sign-in link stays as the plain path.
- **Agents write too much.** The band is the guard, and so is his attention.
- **Names settle too early,** before they have been held. The table above exists so they don't.
- **The relational mode and the arena become the work.** They are instruments. Principle 14 governs them too.
- **Content without previews means a mistake goes live.** Every act can be undone (D-138), and publish is a crossing with readiness.

---

## Hints for the Next Session

These are what this session learned, so they do not have to be learned again.

**The repositories.**

- The harness is private; the site and the vault are public. Everything pushed to the site, including pull-request branches, is public.
- The vault can be cloned anonymously (`GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/danielbdyer/book-research`). This session could read it and not push to it. Read it and cite it; never write to it.
- D-numbers are per repository. Before taking the next one, check every remote branch: `git grep "^## D-NNN" origin/<branch> -- DECISIONS.md`.

**Session hooks.**

- Hooks run from the project directory. A session started above both repositories (at `/home/user`) runs neither repository's hooks, so run them by hand.
  - **Harness:** `echo '{"session_id":"…","hook_event_name":"SessionStart"}' | CLAUDE_PROJECT_DIR=/home/user/harness .claude/hooks/harness.sh start`.
  - **Site:** `pnpm --silent fabric orient`.
- The harness's `record` is not approved. A session's record goes at the top of its `RECONCILIATION.md` as a new section, and the pull request body carries it. The session's retrieval events (`.harness/log/harness/agent-<session>.jsonl`) are committed separately: "This session's retrieval events in the harness log."
- The site's directive 7 asks every session to `reflect`, but `reflect` was never blessed. Say so; do not pretend. Until it is blessed, the site's session record goes at the end of `CORPUS.md`'s reconciliation (directive 17). This session nearly forgot.

**The site's checks.**

- The pre-push hook runs `pnpm run doctor`: typecheck, the whole lint chain, and 567 tests, in two to three minutes. It is the gate. Expect it.
- `fabric orient` appends to `fabric/spaces/agent.jsonl`. That makes `lint:fabric` fail until `pnpm fabric describe` runs. Format its output afterward with `pnpm exec prettier --write fabric/manifest.json fabric/events.schema.json`, or the schema shows a large spurious diff. This lasts until the fabric retires.
- Spelling:
  - New words go into `cspell.config.yaml` deliberately.
  - Danny's verbatim words, typos included, sit between `<!-- cspell:disable -->` and `<!-- cspell:enable -->`.
  - Never correct his quotes.
- Markdown:
  - Every new top-level markdown file is placed in `SPECIFICATION_MAP.md` three times: in its layer's tree, in the prose entry, and in the current-state table.
  - `scripts/check-spec-wikilinks.mjs` checks the links.
  - markdownlint wants ordered lists to start at 1.

**Writing.**

- Before proposing anything about the record, read the harness's `DECISIONS.md` for Danny's earlier answers. This file's first draft contradicted D-049, his decision about markdown, and A-13, his clean-room rule, and both were caught only on a second reading.
- Before naming anything, read `REFINEMENT_AUDIT.md` §"The primitives, resolved" and `PATTERN_LANGUAGE.md`. Address, anatomy, orientation, gesture, lens and the tiers of state are already named. This session nearly introduced "lede" for pattern 1's `meta` and `deck`, and "lens" for a mode that is not one.
- The harness writes plainly (its `CLAUDE.md`, "The one directive"): no metaphor, lines wrapped near 100 characters, and decisions in the form Statement, Because, Rejected alternatives, Consequences, Falsifiers, Provenance. The site has three voices, and the agent writes to Danny in plain words (directive 14).

**Working with Danny.**

- Never subscribe to a pull request or schedule a check-in. Push, open the pull request, say so in one line, and stop. Both `CLAUDE.md` files hold this.
- He answers well in conversation and in documents. The harness's practice is to put open asks on a surface he answers with a keystroke (`surfaces/reconciliation.html`). Offer both.

**Facts to build on.**

- **The outliner:**
  - The intents are in `packages/outline/src/core/intents.ts`, 25 kinds in one union (D-126).
  - The keymap has 55 commands.
  - Layouts include `p`, `h1` to `h3`, `quote` and `code`, so an outline can already be an article.
  - The API: `GET /api` describes it, and `POST /api/documents/<name>/intents` writes as the caller.
  - It has an MCP server: `outline mcp`.
- **The site's deploy** is static assets only (`wrangler.jsonc`). `assets.run_worker_first` exists in the installed wrangler's schema.
- **The two React specifications** agree on thresholds and tiers, and differ on four points (`COMPONENT_GRAMMAR.md`). The harness's is changed only by amendment.
- **Explore subagents** are good at inventories. Verify every quote they bring back before citing it.

---

## The Open Decisions, in Order

| Decision | Options | Lean | Unblocks |
|---|---|---|---|
| **Visibility** | Make the harness public; make the site's repository private; or keep them separate | His; nothing here leans | The join |
| **The root** | The harness; the site; a new repository | The harness, with the site under `apps/site` | Phase 3 |
| **The fabric** | Retire it into the harness after its five ideas become backlog stories; keep it | Retire it | Phase 3 |
| **B-46** | Reshape it as in `HYPOTHESIS.md`; keep it as admitted | Reshape it | Phase 9 |
| **Directive 5** | Score on arrival; amend the directive to allow a clock | Score on arrival | Phase 10 |
| **Content previews** | None for content, one per pull request for code; previews for both | None for content | Phase 8 |
| **The markdown round trip** (harness Q-50) | Write back through a pull request (§10); write back by a direct commit to main | His; answer 12 leans toward a direct commit | Phase 6 |
| **Words** | Replacements for *gate* and for "armed, fire" | Candidates in "Names" | — |
| **Adjudication A1** | Adopt pattern 1 | Adopt | Phase 1 |

---

## How This File Changes

It is a hypothesis about where the work is going, and it is amended the way the harness amends its charter. Each change is dated, and it cites what caused it: a decision, a falsifier that fired, or something Danny felt. The conclusion is updated in place. Earlier text lives in git, which the site's archaeological layer will one day show (`TRANSPARENCY.md`).

Its own falsifiers:

- **The writing.** After the first three phases, Danny says the work cost him writing.
- **The order.** A phase is built out of order because the order was wrong, not because a pull arrived early.
- **The instrument.** Six months pass and no measure in "Measures" has moved, because none was ever taken.

---

## Amendments

**2026-10-04, the vault's binding.** The vault is bound by a pin recorded as data, not by a git submodule. The harness's approved amendment A-13 says a real vault "is never a dependency of the build and it never lives in the repository," and of profiling a corpus, "About a dozen numbers enter the repository. No note does." A submodule would put the vault's notes in every checkout. A recorded pin keeps everything Danny asked for in answer 14 ("a consensual binding … tracked as a dependency," with friction to break it) without that. *Caused by:* reading A-13 while writing `ARCHITECTURE.md`. *Changed:* the felt-specification table, the architecture table, and Phases 3 and 12.

**2026-10-04, two records (D-049).** The first draft made the markdown files a projection of the log. That contradicts D-049, Danny's own decision of 2026-09-14: the log and the markdown corpus are "two records at different grain," and projecting markdown from the log was rejected because "it makes the author's own prose a derived artifact of a system he wants to outlive." The vision now follows D-049. One work is held in two records, and the round trip between them is the harness's open Q-50. Publishing became simpler for it: a publish is a commit to main, and rendering at the edge is held. *Caused by:* reading D-049 while writing `EVOLUTION_PROTOCOL.md`. *Changed:* conclusion 1, the publishing moment, the architecture table, principle 1, Phases 6 and 8, the measures, and the open decisions. *Open:* his answer 12 ("these are the same thing!", "materialized … or synced down") leans toward a sync between the two records. D-049 permits that as a round trip. If he means something closer to a projection, D-049 would need amending, and the decision is his.

---

## A Closing

This began with one line in an outliner: a sentence about attention, tagged `#hypothesis`. Everything above unfolds from it. Structure that waits. A surface that stays quiet until asked. A door that exists only for the one who was walking toward it anyway. A record that remembers so the writer does not have to.

Danny's reflection on recognition describes the feeling this composite should leave: "a deep essential moment of courage without needing to recognize it as courage - the simpleness, the sheer availability of possibility, the shapeless form of being guided." If the moon, the outline, the page and the sky ever feel like that, the vision has worked. If they feel like a system, it has not, however much of this file was built.

The site's first instruction still holds over all of it: every piece placed here says *this is enough, this can exist now*. This file is enough for today. It can be wrong tomorrow, and the record will keep both.

*Written 2026-10-04 from the site at `c6ea9b1`, the harness at `ecfbce7` and the vault at `1a3142f`, at the end of the conversation recorded in `HYPOTHESIS.md`.*
