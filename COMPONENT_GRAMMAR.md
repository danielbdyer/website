# Component Grammar

*The shape of the component library that the site and the harness's outliner will share across their render modes: what a component is made of, what it may do, and how one thing appears in five places. Asked for on 2026-10-04, in Danny's words: "the whole domain modeling of the entire needed component set across our 4-5 render modes seem to decompose nicely with the praxis-intent stripped from the render surface … nouns and verbs kind of thing - what's the ontology of our component library you foresee that we need? … let's do this now." It is downstream of [HYPOTHESIS.md](./HYPOTHESIS.md), where the modes and crossings were first named, of `PATTERN_LANGUAGE.md` pattern 1 and `REFINEMENT_AUDIT.md` §"The primitives, resolved", whose address, anatomy, orientation, gesture, lens and tiers of state it extends, and of the two React specifications it must obey: this repository's [REACT_NORTH_STAR.md](./REACT_NORTH_STAR.md) and the harness's `REACT_NORTH_STAR.md` (D-133). It sits in the house layer beside them.*

*This is a plan for the shape, not a build plan. Every name in it is a candidate (directive 12). Every rule written as an invariant is a candidate until it has a test that fails without it (directive 11).*

---

## The Conclusion First

1. **Three things vary independently: the noun, the verb, and the mode.** The noun is what a thing is. The verb is what can be done to it. The mode is how it is shown. This repository's axiom 13 settles what follows: "when two concerns vary independently, they are separate compositions, not branches in a configuration object." So no component takes a mode, no component decides what a verb does, and no mode changes what a noun is.
2. **The two codebases have each built the same pipeline for verbs, without having said so.** In the outliner, a key chord becomes one of 55 named commands, a pure planner turns the command into steps, and the steps run one of 25 intents that change the record. In the sky, a pointer or key becomes one of 8 walk events, and a reducer turns them into the walk's new state. In both, the render surface owns only the first stage. Danny's "praxis-intent stripped from the render surface" is this pipeline, made general.
3. **There is one noun, the node, and it has an anatomy.** A work, a star, a paragraph, a vault claim and a type are all nodes, of different types, shown in different modes. The house has already decided this for works: `PATTERN_LANGUAGE.md` pattern 1, ONE ANATOMY OF A WORK, defines the parts once (`kicker`, `title`, `meta`, `hero`, `deck`, `body`, `facets`, `referent`, `invitation`), and `REFINEMENT_AUDIT.md` carries it as adjudication A1. The grammar extends that decision from works to every node, and from the site's surfaces to five modes. The evidence that it is needed is in the code: five renderers of a work derive `title`, `meta`, `deck` and `facets` separately, and they disagree.
4. **There are five modes.** The sky, the page, the authored page, the outline, and the relational mode. The type editor is the outline zoomed into a typed node, so it is not a sixth mode. A sky of types for the ontology arena is held.
5. **Four pure functions bind the three axes.** `anatomyOf` gives a node's parts. `offered` gives the verbs a given actor may use on a node in a given mode. `prominenceOf` gives how far forward a node sits. `orientationOf` gives where a crossing lands. A component renders parts at a prominence and dispatches what is offered. That is the whole grammar.
6. **The visitor's page knows nothing about authoring.** Each part the page renders carries the work's address (`room/slug`, `REFINEMENT_AUDIT.md` §"Address") and the part's name. The author layer, served only to Danny's enrolled device, attaches to those. The visitor's bundle does not change.
7. **Shared components are promoted at their second consumer, not before.** Both React specifications say so. Four candidates already have two consumers: the chip, the menu, the decision control, and the way back up.

---

## The Three Axes

### Nouns

The harness has two primitives, the node and the edge (`NORTH_STAR.md` §2). Everything the five modes show is one of those, or a value on one.

| Noun | What it is | The site today | The outliner today | The vault today |
|---|---|---|---|---|
| **Node** | The unit. Has an id, a type, a standing and a provenance. | A work (`src/content/{room}/{slug}.md`); a star in the sky | A row (`Row`, `Title`) | A note (one claim per file) |
| **Edge** | A typed, directed relation between two nodes. | A thread; a wikilink and its backlink | A mirror; a `[[link]]` and "Linked from" | A wiki link with its one-clause gloss |
| **Field** | A typed value on a node. | Frontmatter: date, room, facets, type, summary | `node.field` (layout, color, starred, and any typed field) | Frontmatter: category, state, topics |
| **Type** | A node whose payload is a schema fragment (§11). | Four types of work, closed | `node.typed`; the harness's approved types | Note categories |
| **Axis** | A named position with no edges. | The eight facets, each at a compass bearing | — | — |
| **Standing** | Whether the record holds a thing as approved or proposed. | A ghost star, author-only (held) | Muted text with an agent's chip | `status: live` on a tension |
| **Actor** | Who acts: the author, an agent, a visitor. | Visitor only | Author and agents | Author and sessions |

Some nouns belong to one mode's chrome and stay there: the hour (sun and moon) and the compass on the site; panes, presence and saved searches in the outliner. They are not domain nouns and are not shared.

### The anatomy of a node

One function computes it; each mode chooses which parts to show and how. A mode never changes what a part means. A node's parts follow its type, the way the harness's types extend the root type's fields (`NORTH_STAR.md` §11, A-24). Every node has the parts below. A work adds pattern 1's `kicker`, `hero`, `referent` and `invitation`.

| Part | The page | The sky | The outline | The relational mode |
|---|---|---|---|---|
| **Title** | The work's heading | The star's label | The row's text | Forward |
| **Meta and deck** (date; summary) | The metadata line and the deck | The whisper | The note under the row | Quiet |
| **Body** (children, with layouts) | Paragraphs and headings | — | Child rows | Quiet |
| **Fields** | Room, facets, type | The star's position, from its facets | Shown only when zoomed in (`HYPOTHESIS.md` reflection 4) | Forward |
| **Relations** | Backlinks and the outward invitation | Threads | Mirrors, links, "Linked from" | Forward |
| **Standing** | Never shown; a visitor sees only what is approved | A ghost, lit only by attention | Muted, with a chip | As in the outline |
| **Provenance** | The date | — | The writer's color and presence | — |

### Verbs

A verb is defined once, in the shape directive 16 set for the fabric's verbs: a name, a sentence saying what it does, a consequence class, an input schema, and only then a program. Consequence classes, as candidates:

| Class | What it does | Examples |
|---|---|---|
| **observe** | Changes nothing in the record. | open, follow a thread, travel, search, zoom |
| **record** | Changes the record. An author's act is approved as he makes it; an agent's is proposed and waits (D-123). | edit, move, type, field, layout, mirror, ask |
| **decide** | The author's answer to a proposal. Only the author has it. | keep, drop, reopen |
| **cross** | Changes the mode and carries orientation across. | look up, look down, open in the page editor, open in the outline, enter the relational mode, sign in |
| **world** | Reaches past the record, to what visitors receive. | publish |

The fabric already keeps a closed set of four classes: `observe`, `derive`, `propose` and `world` (`packages/fabric/src/schema.ts`). This set keeps `observe` and `world` with the same meaning. It does not keep `propose`, because whether a write is proposed depends on who wrote it, not on the verb. It adds `record`, `decide` and `cross`. That is a third name for a thing with two only if `record` and `propose` are the same thing, and they are not. The collision is named so it can be held (directive 12).

The record verbs already exist. The outliner's closed union of 25 intents (`packages/outline/src/core/intents.ts`, D-126) covers creating, content, structure, lifecycle, view and decision. The site adds observe verbs (travel, open), the crossings, and publish. **A mode may add gestures and commands. It may not add intents.** A change to the record is decided in one place, as a new case in one union (harness `CLAUDE.md`: "A new event kind is a new case in one switch").

### Modes

| Mode | Who sees it | What it is for | Exists? |
|---|---|---|---|
| **The sky** | Visitors and Danny | Seeing relations | Yes: `/sky` |
| **The page** | Visitors | Reading | Yes: every room and work |
| **The authored page** | Danny only | The page plus his menu: everything visible can be edited in place | New |
| **The outline** | Danny and his agents | Writing | Yes: `outline.danielbdyer.com` |
| **The relational mode** | Danny | "Relational structuring": typed nodes forward, everything else quieted and still within reach | New |

---

## The Praxis Pipeline

A gesture becomes a command, a command becomes a plan, and a plan runs intents. Each stage is data, and only the first and the last touch anything outside a pure function. *Gesture* here is the meaning in `CONSTELLATION_ARCHITECTURE.md`: `gestureOf(event, geometry)` turns a DOM event into a value. `REFINEMENT_AUDIT.md` uses the same word for the kind of movement a navigation makes, which the grammar gives to crossings below. The two senses are named here, and the choice between them is held (directive 12).

```text
gesture  ──▶  command  ──▶  plan  ──▶  intent
(the DOM)     (a name)      (pure)     (the record)
 the rim        data         data       the one union
```

| Stage | The outline today | The sky today | The authored page (new) |
|---|---|---|---|
| **Gesture** | Key chord, pointer, swipe, menu click | Pointer scrub, arrow keys, wheel | Right-click or long press, a selection, the drag to the moon |
| **Command** | 55 named commands (`shared/utils/keymap.ts`) | 8 walk events (`src/shared/sky/walkState.ts`) | The menu's items |
| **Plan** | `plan-key`, `plan-structure`, `plan-menu` and the rest: pure functions returning steps | The walk's reducer | `plan-menu`'s `intentOf`, shared |
| **Effect** | 25 intents run against the record | The walk's new state (view, not record) | The same 25 intents, sent to the outliner's API |

Two distinctions keep the pipeline honest.

- **View state is not record.** Where the author is zoomed, where the sky's eye is traveling, which mode he is in, and how prominent a node is: none of these is an event in the log. They fall into the house's three tiers of state, address, session and ephemeral (`REFINEMENT_AUDIT.md` §"State, in three tiers"). The record is a fourth tier beneath them, the only one that is the log. The one exception is already decided: the outline records a node's collapse, because it travels with the node (D-131).
- **A plan never reaches the DOM.** The outline's planners already obey this. Two of its hooks still hold domain logic: `use-plan-actions.ts` and the empty-note rule in `onBlur` (harness `RECONCILIATION.md` §0a). They are the first cleanup when the library forms.

---

## The Four Binding Functions

Each is pure: no clock, no network, no DOM. As sketches, every name held:

```ts
// The parts of a node, computed once, for every mode.
const anatomyOf = (state: State, node: NodeId): Anatomy => /* … */;

// What this actor may do to this node, here.
const offered = (actor: Actor, mode: Mode, node: Anatomy): readonly Verb[] => /* … */;

// How far forward a node sits: the relational mode, the sky's presence, a proposal's quiet.
const prominenceOf = (node: Anatomy, attention: Attention): Prominence => /* … */;

// Where a crossing lands. Generalizes the sky's focus-for-route.
const orientationOf = (crossing: Crossing): Landing => /* … */;
```

**Prominence is one idea with three uses.** The sky already computes presence: at most 24 stars, chosen by relevance, with the rest dimmed (`src/shared/content/presence.ts`). The relational mode is the same move over the outline: typed nodes forward, the rest quieted. It is not the house's *lens*, which narrows a gathering of works and lives in the address (`REFINEMENT_AUDIT.md` §"Lens"). A lens removes what does not match. The relational mode removes nothing. A proposal's visibility is the same again: muted until Danny points at it, and offered only one level below where he is (`HYPOTHESIS.md`, answer 7). One function family means one place to tune "non-attention seeking."

**A crossing cannot be built without the node it came from.** This is the first check D-142 named for opened-with. `orientationOf` generalizes the orientation contract of `CONSTELLATION_PARALLEL.md` from two views to five. It keeps the precedence law `REFINEMENT_AUDIT.md` §"Orientation" resolved: an explicit focus in the address wins, a remembered place fills in when the address names none, and the pole is the rest. A crossing also has a kind of movement, taken from the house's kind-table through `kindOf(from, to, trigger)` (`REFINEMENT_AUDIT.md` §"Gesture").

```ts
// A crossing carries where it came from; there is no way to make one without it.
type Crossing = {
  readonly from: { readonly mode: Mode; readonly node: NodeId };
  readonly to: Mode;
};
```

**A crossing asks for readiness.** The house already has the state machine, in `useThresholdReveal`: "release early and it breathes back to nothing; push past the threshold and the gesture commits." Generalized:

```text
at rest ──▶ offered ──▶ gathered ──▶ taken
   ▲            │            │
   └────────────┴── released ┘
```

The look-up is this machine on a scroll. The sign-in is this machine on a drag, with a second consent, the passkey, at *taken*. The words *offered*, *gathered* and *taken* are candidates for the gentler names Danny asked for in place of "armed, then fire."

---

## Hooks and Compound Components

Both React specifications name four kinds of hook (query, mutation, computation, orchestration) and allow compound components for implicit shared state. The grammar fits them:

| Kind | Hook | What it provides |
|---|---|---|
| Query | `useNode(id)` | The node from the record |
| Computation | `useAnatomy(id)`, `useOffered(id)`, `useProminence(id)` | The binding functions, as a membrane over the record |
| Mutation | `useIntent()` | One dispatcher for every record verb, the D-126 principle carried to every mode |
| Orchestration | `use{Mode}Workflow`, `useCrossing(from)` | A mode's whole interface; a crossing's readiness machine |

`useOutlineWorkflow` already exists. `useCrossing` generalizes `useThresholdReveal`.

**Each mode has its own compound for a node's parts, and they share the anatomy, not components.** That is axiom 13 applied. Pattern 1's parts become a compound, `Work.*`, and each of the five work renderers declares which parts it shows:

```tsx
<Work.Scope work={work}>
  <Work.Title />
  <Work.Meta />     {/* the date and the draft badge, derived once */}
  <Work.Deck />     {/* the summary, by one policy */}
  <Work.Facets />
</Work.Scope>
```

The outline already groups its parts by folder (`Row/Bullet`, `Row/Editable`, `Row/Chips`). The sky already bundles its props by noun (`Star` takes `{work, walk}`). Neither needs a new pattern. They need the same anatomy underneath.

**Every page part carries its address.** Each part the page renders includes `data-address` and `data-part` attributes: the work's address in its string form, `room/slug`, and the part's name from the anatomy. The page uses them for nothing. The author layer uses them for everything. The noun's grammar shows up in the DOM, and the page does not need to know who reads it. The site addresses a work by `room/slug` and the outliner addresses a node by id. That mapping is a seam to draw once, in one function (directive 8), not a second identity.

---

## The Author Layer

The authored page is the page plus one layer. This repository's axiom 13 rules out a mode prop, and the requirement that "users who don't match … don't ever get" the author's version (`HYPOTHESIS.md`, answer 8) rules out shipping the layer to everyone.

- **Served only to his enrolled device.** A Worker runs first for page requests and adds one script tag at the edge (`HYPOTHESIS.md`, the fourth message).
- **Attached by address.** The layer finds `data-address` and `data-part` and attaches a menu to each part. It imports no page component and reads no page module.
- **Its components.** The part menu (edit, add a facet, publish, open in the outline, make this a type). The in-place editor (select a paragraph, write, click off to save). The moon's receiver. The passkey confirmation.
- **Its verbs are the outliner's.** Edit in place dispatches `edit`. "+ facet" dispatches `field`. "Make this a type" dispatches `type`. All of them go to the outliner's existing API (`POST /api/documents/<name>/intents`).
- **A boundary the lint can hold.** No page module imports the author layer. The site already enforces its dependency direction with `eslint-plugin-boundaries`.

---

## Shared Components, Promoted at the Second Consumer

"Don't build `GenericDataTable<T>` before the second table exists … the shared surface … is always smaller than expected" (both React specifications). These already have two consumers.

| Candidate | First consumer | Second consumer |
|---|---|---|
| **Chip** | The site's `FacetChip` (a closed set of eight; opens a facet) | The outliner's tag span and `toggle-tag` (open text; filters) |
| **Menu**, built from `offered` | The outliner's `BulletMenu` | The author layer's part menu |
| **Decide**, keep or drop | The outliner's chips, Review panel, bullet menu and mobile bar: four surfaces in one app | The sky's ghosts, when blessing from the sky arrives (`CATHEDRALS.md` Phase 5) |
| **The way back up** | The site's `WorkKickerBar` | The outliner's `Crumbs` |

Near these are the backlinks line (the site's `BacklinksLine`, the outliner's "Linked from") and the overlay (the site's `WorkOverlay`, the outliner's `Panel` and dialogs). They wait until the two are seen to want the same behavior.

**What stays in its mode.** Each mode keeps its renderer. The sky's painters are the site's exempt hot path. The outline's hand-written renderer exists because the frame budget required it (D-127, D-128). Sharing a renderer across modes would trade the glide for tidiness, and the glide is the requirement.

---

## Where the Two React Specifications Disagree

A shared library needs one rule where the two documents differ. The harness's document is the author's text, stored verbatim and changed only by amendment (D-133), so the differences go to Danny as one proposed amendment:

| Point | The harness's document | This repository's | The proposal |
|---|---|---|---|
| Memoizing | `useMemo` is its computation-hook example | React Compiler; `useMemo` warns | The compiler, and no memoizing by hand |
| Refs | Atoms use `forwardRef` | `forwardRef` flagged as legacy in React 19 | Refs as props |
| Prop names | An organism takes `data` | `data`, `config`, `options` are banned; props are named for the domain | Domain names, which is directive 16's "one name, every surface" |
| Functional style in examples | `push`, `class ApiError` | Both banned by lint | This repository's lint |

---

## Invariants, as Candidates

Each has a way to fail before it is trusted (harness `CLAUDE.md`, "A guard that cannot fail is decoration"). The id prefix is held.

1. **No component takes a mode.** *Check:* extend `scripts/check-component-shapes.mjs`, which already bans generic prop names, to ban a prop named `mode`.
2. **One union of intents across every mode.** A mode adds gestures and commands, never intents. *Check:* the site imports the intent union from the outline's schema, and a lint rule refuses a second discriminated union over record changes.
3. **The anatomy is computed in one function.** *Check:* a property test renders a generated node in each mode and finds the same title, fields and relations in each.
4. **The visitor's response contains no author code.** *Check:* a test that sends a request without the device credential through the Worker and compares the response to the static file, byte for byte.
5. **A crossing cannot be built without the node it came from.** *Check:* the type. A test that tries to construct one without `from` fails to compile.
6. **A proposal is offered only one level below the author's focus.** *Check:* a property over `prominenceOf`.
7. **Nothing is hidden by a mode, only quieted.** *Check:* a property that every node in view has a prominence above zero in the relational mode.

---

## The Order of Work, Smallest First

1. **One anatomy of a work.** Adjudication A1 in `REFINEMENT_AUDIT.md`, already proposed and waiting for Danny: pattern 1's parts derived once, each of the five renderers a declared projection, with `data-address` and `data-part` on each part. No behavior changes, and it proves the anatomy against real code.
2. **The anatomy function for any node**, generalizing step 1 from works, with the property test of invariant 3.
3. **A storyboard** of the five modes and the crossings between them, before any crossing is built (`HYPOTHESIS.md`).
4. **The Worker that runs first**, with invariant 4's test written before it. Its first version serves every request unchanged.
5. **The author layer on one part:** the title, edited in place, dispatching `edit` to the outliner's API.

Each step is a pull request of its own, and each waits for Danny's word.

---

## What This File Does Not Decide

- Where the library lives. That depends on the shape of the repositories, which is open (`HYPOTHESIS.md`, answer 1).
- Any name in it.
- The storyboard. The modes and crossings are named here and drawn there.
- Whether the relational mode also applies to the sky. That is held as a possibility in `HYPOTHESIS.md`.

*Drafted 2026-10-04 from this repository at `00157a6` and the harness at `ecfbce7`, from a reading of both React specifications and an inventory of every component and hook in both codebases.*
