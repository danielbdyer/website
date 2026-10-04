# Hypothesis

*A record of what Danny said on 2026-10-04, in three messages, about joining this repository with the harness, and of the agent's reflections on each, written before anything is built. It sits on the grounds beside [DYERVERSE.md](./DYERVERSE.md), the manifesto of the whole, which was written before the harness existed as a repository and does not know about it. It is downstream of [CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md), and it reads, in the harness (`danielbdyer/harness`), `NORTH_STAR.md` §7, §10, §11 and §12, `DECISIONS.md` D-123 to D-139, and `research/three-systems.md`; and, in the vault (`danielbdyer/book-research`), Danny's reflection on recognition and the notes around it.*

*It is named for the first tag Danny wrote in his outliner that classified his own thinking. The name is a candidate (directive 12). This file is not a specification and not a plan. It is the conversation written down so that the next one starts from it, and the reflections are offered to be corrected.*

---

## What Danny Said

Verbatim, as he wrote it:

> I'm very interested to integrate these two repositories - I see parallels to the content of the site and the editor experience, as well as within the outliner and the /sky constellation - and then also to start to build a dashboard/landing page on the home screen of the "website" repo that represents me as a synthesis of both custom elements for the landing page but also with cards derived from the content of the site. The end user experience I think I want is similar to Workflowy in the backend work surface, but then in certain instances you can publish out to the main page new posts and so forth. there should be editor experiences similar to Contentful and Tana.
>
> However, I was thinking about why I prefer Workflowy so much over everything, and I think it's to do with my inner state as I use it - I'm not distracted, and stay completely embedded in this minimalist text editor surface that glides along and is easy to use, but then becomes powerful as certain moments when you need it to. I want the same for my outliner tool that I'm building in Harness. I asked myself, "how much are you really interested in the interface of Tana per se? Is it that you want to be able to have embeddable resources-as-nodes that then expand into a Tana-like editor when you're in them? And then I had my first experience of the #hypothesis tag, I realized: I wrote to myself, "the over-embedding of fielding into Tana was a distraction from being able to pay attention to the actual work surface of taking notes with it" and tagged it with #hypothesis. My theory would be that that would somehow materialize softly into an interface that helps you to interact with it like Tana would, but would take care of you every step of the way, is what I want.
>
> We can start by just pivoting the "website" repo to make it more plugin focused. I think the eventual goal is that they will become integrated, but I want to take it one step at a time. Then, I'd like to pursue my thinking about where the #hypothesis tag experience can go from first principles and ensure that we stay engaged at every step of the way with design thinking and conversation with me to represent my interests before we start to build. I want to maintain high domain orientation as we build this, and continue the process of using mostly pure functions, higher order and functional programming discipline (but have fun with it - dance with it - don't go too off the deep end with embodying that headspace).
>
> Maybe before all else let's also capture my words and your reflections on them before we get going.

---

## The Conclusion First

1. **The two repositories are one lineage that split, not two systems to join.** The harness is this repository's fabric, renamed and moved into its own repository: the harness's charter lists "harness for Fabric" among its renames (`NORTH_STAR.md`, version note), its charter grew from the one kept here as `CORPUS.md` Part One, and its §10 already says "danielbdyer.com renders approved works." Integration means bringing the two back together through a contract. It does not mean merging them.
2. **What Danny values in Workflowy is a state of attention, and the harness has already written that state down as a requirement.** Its §7 says: "The author's state of mind at the moment of capture cannot be recovered afterward. Capture must not disturb it." That sentence is about capture. His message asks for it to hold across the whole writing surface.
3. **The `#hypothesis` bullet adds one thing the harness did not have: when structure should appear.** The harness already holds that structure is induced from use (§11), and Danny had already said of Tana that "the modelling was the work, and the work was not the point" (`research/three-systems.md`). What the bullet adds is timing. Structure should not appear at writing time. It should appear at the moment it helps.
4. **B-46, "the Tana interface," is the place to change course, and it is not built yet.** It was admitted on 2026-10-02 (D-131), two days before this conversation. As admitted, it builds Tana's interface. The `#hypothesis` bullet is a hypothesis against exactly that.
5. **The fields a hypothesis needs already exist in the harness's vocabulary.** An Amendment "states a hypothesis so it can fail." An Evaluation records a verdict of `confirmed`, `contradicted` or `preferred`. A proposed type names its falsifier (§11). Until now, that vocabulary was used by the system about itself. Danny's tag is the first time the author used it about his own thinking, from inside the writing surface.
6. **"Plugin" already means something in the harness, and the meaning fits.** The harness defines a plugin as "an Effect Layer that provides verbs, plus the skill file that orients toward them, plus the schema fragments those verbs need" (`NORTH_STAR.md` §2). This site already has two of the three: skills (`.claude/skills/`) and a schema (`CONTENT_SCHEMA.md`). The third would be the verbs it needs, starting with publish. Read that way, making the site plugin-focused means preparing it to become the harness's publishing plugin.
7. **A landing page made of cards meets a standing refusal, and that tension is Danny's to decide.** The Foyer has "no featured works, no 'latest from the Garden,' no activity feed" (`INFORMATION_ARCHITECTURE.md`), and "drift toward dashboard" is one of the house's eleven named drift modes. Directive 2 says the feeling is usually ahead of the spec. The agent should not settle this by choosing a side.
8. **Nothing gets built until the questions at the end of this file have been talked through.** Danny asked for that, and both repositories' practices agree: documents before code (directive 10), and asking for the decisions that are his (harness `CLAUDE.md`).

---

## The Parallels, Located

Danny named the parallels he feels. Here is where each one is in the code.

| What | In this repository | In the harness | What they share |
|---|---|---|---|
| **The editor** | None, on purpose: "There is no headless CMS, no admin dashboard, no separate authoring tool" (`CONTENT_AUTHORING.md`). A future authoring surface is held: "always optional," and "it would always produce a markdown file with the schema this site already understands." | `packages/outline-app`: "Workflowy in React" (D-133), keyboard-first, over an append-only log. Frames held under 20 ms at 10,000 nodes (D-128). | The outliner is the authoring surface this site kept a place for. |
| **The graph** | `/sky`: works as stars, placed on a compass by their eight facets; each facet's stars joined into a figure; "no thread that has not been authored" (`CONSTELLATION_WALK.md`). | Nodes and edges. The outline's tree, its `[[links]]`, its mirrors (D-124). | One graph. Through a contract, the sky could draw the outline's nodes the way it draws works. |
| **Waiting for the author** | The ghost star: "a star not yet lit, where it would land if blessed." A ghost is not a node (INV-SLC-004). | An agent's bullet sits in the tree in muted text with a chip, and Alt+A keeps it or Alt+R drops it (D-123). Every decision can be undone (D-138). | One idea, *pending*, drawn two ways. |
| **One thing shown in two places** | Transclusion, `![[garden/small-weather]]` (`PATTERN_LANGUAGE.md` pattern 2, proposed). | Mirrors: "Workflowy's mirrors and Tana's references" (D-124). | A node shown inside another, with one source of truth. |
| **Structure** | Closed sets: five rooms, eight facets, four types of work. They change only by decision. | Types are induced from use and approved (§11). `node.typed` and `node.field` exist, and the editor shows neither yet (D-125). | Both refuse any structure the author did not decide. |
| **The record** | `packages/fabric`: six verbs, none blessed. Its start command printed, today: "No verb is blessed yet… Memory: nothing recorded yet." | The same machinery, grown: a charter at version 5, decisions D-001 to D-141, and an outliner in daily use. | One behavior kept in two places. This is the first thing integration has to resolve. |
| **Where it runs** | Static files on Cloudflare Workers (`wrangler.jsonc`). | `packages/outline-cloud` on Cloudflare Durable Objects (D-140, D-141). | The same host. Wiring them together later is a small step. |

---

## Reflections

### 1. The state is the requirement

Danny named two properties of Workflowy. At rest, nothing comes between him and the sentence. When he needs power, it is close, and it comes when he calls it. Neither is a feature. Both are about where his attention goes.

The harness wrote the first property down for capture: "A capture path that meets every number and still requires a mode switch, a window change, or a decision about where the note goes has failed the requirement." The numbers (16 ms to persist a keystroke, 20 ms frames) stand in for the requirement. They are not the requirement. What his message asks for is the same rule applied to the whole writing surface, not only the moment of capture. A candidate rule, for him to accept or refuse:

> **The writing surface shows nothing the author did not write or summon.**

That rule runs straight into a decision already made. D-123 puts agent proposals in place, in the tree, and rejected a queue to the side because "the author would review agent writing out of place." A proposal is something Danny did not write and did not summon. Muted text and a small chip may keep the glide, or they may break it. Only his attention can say which. That question is held below.

There is a cheap way to find out where the surface fails him, and it uses the same move he just made. When something pulls him out of the writing, he writes one line about it, inside the outliner, and tags it. The tool then learns where it fails him from his own notes, at the cost of one word each time. This is offered as a possibility, not a practice to adopt.

### 2. What the `#hypothesis` bullet did

He wrote one sentence about the tool, inside the tool, and added one word that classified it. The word cost nothing. He typed it inline, without leaving the sentence. That is classification at the speed of writing. Tana classifies differently: choose a supertag, and fields appear and ask to be filled. The bullet shows the other way, where the classification is a word and the fields wait.

It was also a note about the outliner, written in the outliner. The harness has a loop for improving itself: an amendment states a hypothesis, and a later outcome confirms or contradicts it. Danny closed that loop by hand, with a tag. The system's way of improving itself and the author's way of thinking now share one form, and neither had to be designed to fit the other.

And this is not the first time the finding has been made in this lineage. The vault in `book-research` retired its apparatus on 2026-08-09 "when it began to displace the writing," and its first rule is that nothing may grow at the writing's expense (`DYERVERSE.md` §"What We Refuse"). The engine's Phase 0 said: do not chase embeddings, agents, or UI until the loop is clean. Tana's fields are apparatus too, and the bullet says they displaced the writing. What is new is how he found it. He noticed it in his own attention, quickly, while writing, and he wrote it down instead of designing around it. That is the practice working.

### 3. A field is a question, and a question has a right moment

A field is a question the system asks about a node: what is its status, what would show it wrong, what does it depend on. Tana asks its questions when the node is made. That is when the author knows least, and when he most wants to keep writing. The bullet implies a different rule: ask each question at the moment its answer exists, or at the moment the answer would help.

For a hypothesis, those moments might be:

| Moment | What the surface does |
|---|---|
| **Writing it** | Nothing. The tag is enough. |
| **Coming back to it** | The questions are visible as quiet, empty places ("what would show this wrong?"). None is required. |
| **Something later bears on it** | A later bullet links to it or mirrors it, or an agent notices a relation. The connection arrives as a proposal, waiting like any other. |
| **Deciding** | One keystroke records a verdict with its because: *confirmed* or *contradicted*, which are an Evaluation's own verdicts, or *set down*, which the harness has no word for yet. |

So "materialize softly" could mean this. The fields exist from the start: D-125 already lets a node carry field values that no interface shows. Each field appears only at its moment, and most are filled by what he does rather than by what he types into a form. The status comes from his verdict, the dates come from the log, and the evidence comes from his links. The form is the node's history, not a gate in front of it.

"Take care of you every step of the way" could mean any of these, and which of them he meant is his to say:

- It never asks for structure before he has it.
- It remembers for him. A hypothesis comes back when something he writes later bears on it.
- It holds what is unresolved without nagging: no counts, no badges, no "twelve hypotheses need review."
- It keeps the records from his actions, not from forms.

### 4. Zoom is "when you're in them"

His phrase was "embeddable resources-as-nodes that then expand into a Tana-like editor when you're in them." Workflowy already has a gesture that means *in*: zoom. Clicking a bullet's dot makes that bullet the page.

A candidate rule, then: **a typed node shows its fields only when the author has zoomed into it.** From its parent, it is a bullet with a tag, like any other. From inside, it is its own page, with its questions, its evidence and its history. Mirrors carry this further. A mirror of a hypothesis inside today's notes reads as one line, and zooming into it opens the hypothesis's own page. That gives one rule for where power appears: at the zoom level of the node itself. It needs no new events. `node.typed` and `node.field` carry it, and D-131 already stores view settings as fields. It is interface work only.

The falsifier: if he finds himself zooming in only to fill in fields, the fields have become the work again.

### 5. D-125 was right; B-46 swings to the other side

D-125 refused to read `#tags` as types: "A tag in Workflowy is text the author wrote; reading it as a type would decide a type the author never decided." His experience agrees. But B-46, as admitted, builds the other extreme: "a bullet's type shown and set as a supertag; its fields shown under it and edited in place." That is Tana's interface, and the bullet is a hypothesis against it.

The middle path uses what §11 already describes:

1. A tag stays text, always.
2. When a tag recurs, induction proposes that it become a type. A proposal has four parts or it is not a proposal: the distinction, the instances by id, the because, and a falsifier.
3. Danny approves the proposal once, or he doesn't. From then on the tag is the type's handle. He keeps typing `#hypothesis`, and the type is attached because he decided it once, not inferred again each time.
4. The type's fields are proposed the same way, from what his hypotheses actually turn out to contain.

That would reshape B-46 before any of it is built. Whether to reshape it is his decision. One detail for the harness to settle if he does: §11's induction waits for twenty approved reflections, and a recurring tag may want its own, smaller trigger.

### 6. Integration: one lineage, rejoined through a contract

The harness began here. The fabric in `packages/fabric` is its earlier form, and nothing in it has been blessed. Two implementations of one behavior drift apart (harness `CLAUDE.md`, "One behavior lives in one place"). A direction to discuss: the harness becomes the record and the writing surface, this site becomes the published face, and the site's fabric is retired into the harness or kept only as long as sessions here still need it.

Publishing already has a shape on both sides, and the two agree. The harness's §10: agent-proposed edits are "rendered back to markdown … into a branch the author reviews in git. The PR is the approval surface for prose," and "the published site is rendered from the approved state." This site's held authoring surface "would always produce a markdown file with the schema this site already understands." Put together: a node, or a subtree, becomes a work file at `src/content/{room}/{slug}.md`, through a pull request Danny merges. The outliner already exports Markdown.

This is where the soft materialization from reflection 3 meets Contentful. To become a work, a bullet needs the site's fields: a title, a date, a room, facets. Those questions belong at the moment he says *publish this*, not before. They can arrive already filled in, as proposals he accepts or corrects. That gives him Contentful's structured types and its boundary between draft and published, without Contentful's forms in the writing flow.

Dependencies point at the contract and nowhere else (`DYERVERSE.md` §"The Shape"). The site would never import the harness. It would read a contract: a slice, or markdown in git.

### 7. What "plugin focused" could mean

There are three readings. They are not exclusive.

| Reading | What it means here | The seam that exists |
|---|---|---|
| **The site hosts contributions** | Rooms, the sky, the Foyer's elements and cards are each one registered entry with one shape. | `PATTERN_LANGUAGE.md` pattern 2, a registry "that is the verb registry's twin." Each entry has a name, a sentence in the site's voice, a consequence class (`inert`, `live`, `third-party`), a zod schema, and a renderer. |
| **The site reads sources** | Works come from markdown, nodes from the harness, claims from the vault, each through an adapter. | `CATHEDRALS.md`'s `GraphSource` port and `@dbd/slice`. |
| **The site is a harness plugin** | The site becomes verbs (publish), a skill (the site's voice and schema), and schema fragments (the work, its room, its facets), as the harness defines a plugin. | Harness `NORTH_STAR.md` §2 and §18. |

The agent's lean, offered for discussion: the third reading is where the integration he described ends up, and the first is where the landing page starts. They fit together. The site keeps a registry of what it can show, and the site as a whole becomes the harness's publishing plugin. The smallest real version of the first reading is one card kind, registered and rendered from the registry. That waits on the next section.

### 8. The landing page: showing a person, not a status

What he asked for is to be met whole on the first page: "a synthesis of both custom elements for the landing page but also with cards derived from the content of the site." That is the integration he lives, made visible. The house's refusals are aimed at something else: feeds, recency, metrics, a call to action. Those are things that report activity or ask for attention. A page that shows who he is differs from a dashboard that shows what is new.

One distinction might reconcile the two: **the cards are placed by Danny, not computed.** Not the latest work, not the most-read one, but the ones he puts there. That keeps the house's rule that every edge is authored (`MANIFESTO_NOTES.md`, Arrow 3), and `DOMAIN_MODEL.md` has already softened so that the Foyer can one day hold a work. If so, the word *dashboard* may not be the right name, since the house lists it as a drift mode. The name is held.

One possibility that joins the two repositories on the first page: a hypothesis he chooses to publish, shown as what he is currently holding. It would be authored, it would be alive, and it would come from the outliner. This is a possibility, not a proposal.

### 9. Contentful and Tana, read through the hypothesis

| | What he may want from it | What the hypothesis says to leave out |
|---|---|---|
| **Contentful** | Structured content types, references between entries, a clear boundary between draft and published. This site's zod schema is already its content model. | A form-based editor as the place where writing happens. |
| **Tana** | References (mirrors already give them), types the author approves, and live searches. B-46's "a saved search as a bullet whose children are its results" is pure power-on-demand, and it is still just a bullet. | Fields at writing time, and supertags as the first thing a node asks about. |

### 10. On the code

Both repositories already hold the bar he asked for: the harness's "How the code reads" and this site's directives 9 and 16. The design above is naturally pure. Which questions a node shows is a function of the node's history and of which node the author has zoomed into, with no clock, no store and no effect. Soft materialization is a projection of the log, the same kind of code as the fold. As a sketch only, with every name held:

```ts
// Which of a node's questions to show, given the node the author has zoomed into.
const questionsAt = (node: Node, zoom: Zoom): readonly Question[] =>
  zoom.into === node.id ? unansweredQuestions(node) : [];
```

That reads as its sentence, which is the standard. The dance he asked for is in finding the few functions like this one that make the whole design legible, and stopping there.

---

## Names to Hold

The two repositories now use some of the same words for different things, and some different words for the same thing. `DYERVERSE.md`'s rule is that each repository keeps its own word inside its walls, and the wall keeps one word. These words need that treatment before any code crosses.

| Word | In this repository | In the harness |
|---|---|---|
| **slice / view** | `@dbd/slice`, the contract that crosses the wall. | Renamed to *view* (D-018). The word at the wall now differs between the two sides. |
| **bless / approve** | *Bless*, throughout the charter and the fabric. | Renamed to *approve* (D-018). |
| **work / Note / node** | A *work*, the published unit, living in one room. | A *Note* in the record; a *node* in the outline. |
| **tag / type / facet / supertag** | *Facet*, one of eight closed dimensions of Danny. | A *tag* is text (D-127); a *type* is approved structure (§11); *supertag* is Tana's word, used in B-46. |
| **plugin** | Not used yet. | Verbs, a skill and schema fragments, provided by a Layer (§2). |
| **surface** | `@dbd/sky` is "the surface" in `DYERVERSE.md`. | `surfaces/`, the pages where the author answers questions. |
| **hypothesis** | The fabric's patch carries one; refinements "land as hypotheses." | An Amendment's field: "a hypothesis stated so it can fail." And now Danny's tag. |

Which side's word governs at the wall, now that the harness has renamed *slice*, is Danny's to say.

---

## Questions for the Next Conversation

Each one can be answered in a sentence. They are ordered so that the earlier answers shape the later questions.

1. **Plugin.** Which reading did you mean: the site hosting contributions, the site reading sources, the site as a harness plugin, or something else?
2. **The fabric here.** Should `packages/fabric` retire into the harness, stay, or be left alone for now?
3. **The Foyer.** Should it become a composition of cards? If so, do you place them, or are some derived? Does looking up into the sky stay the Foyer's gesture?
4. **The moment after the tag.** When you tagged that bullet `#hypothesis`, what did you want to happen next, if anything? The design starts from that moment.
5. **Care.** Which of the four meanings in reflection 3 is what you meant, and what is missing?
6. **B-46.** Reshape it into a tag that becomes a type softly, or keep it as admitted?
7. **Proposals in place.** Does seeing agents' bullets inline keep the glide, or break it?
8. **Publishing.** What is the unit: a bullet, a subtree, a zoomed page? What gesture says *publish*?
9. **Where Workflowy failed.** Is there a moment when you wanted power and it was not there? The pull toward Tana came from somewhere real, and that moment is worth describing.

---

## The Second Message

Later the same day, after the first version of this file was pushed and before Danny had read it. Verbatim:

> - I dreamed about having my name in the title being able to be draggable to the moon glyph (and only the moon glyph) to initiate the sign-in flow for the editor experience of the backend
> - And then I was visiting the study's index page as myself and thinking, what kind of editor experience would I like to have, and I thought, it would be nice if the editor and the actual render of the content itself were basically identical, and then I started to see everything in a little bit more squared-as-a-node kind of thing, where it feels like the editor experience would basically be identical to the render surface we have right now, except for example the tags would now have a plus sign next to them to add a tag, you could highlight a paragraph in the admin view of the site, right click it, and turn it into editor mode, which would then open up a Workflowy node based view of the system that's embedded there - that both the outliner surface and this sort of modal experience would allow you to see that you're on the site/in the site, but the editor experience as a whole would be close by and never far away - and then you could escape out from the admin surface of the site to the outliner view when you wanted to do so - and that would have you visit outline.danielbdyer.com instead (where the outliner is currently deployed to)
> - But basically the big idea is that we're starting to blur the lines of (1) the website and its render right now (2) the nodes of the website being in the constellation is the same as their render in the main page is the same as the in-main-page-admin-editor Workflowy node editing experience is the same as the full Workflowy editor experience, and you can move seamlessly between them.
> - The whole experience is non-disruptive to the soma or psyche, and keeps you feeling very connected to yourself as you're in it - as little jank as possible to make it easy for me to move from notetaking to publishing to editing my site to viewing interconnections between nodes to interacting with AI and so on and so forth.
> - I'm feeling like all of the stuff we've done for the Outliner so far (Workflowy clone) has a lot of potential to maintain across the site - that level of discrete/concrete clarity gives me such delight to use, and we should never seek to overwhelm me by making me overtly get into a context-/mode-switch inline during a session. I should specifically be in that mindset to move over into the Tana view of the nodes, which would then turn all non-Tana/non-supertagged nodes a bit more into the background - still there for interacting with, but at that moment you're more in the relational structuring mode and are thinking critically about connections between things. There should be little delightful ways to make this interactable with - the Tana or relational functionality could pop out in interesting ways somehow and make it eligible to be taken advantage of elsewhere - but we would never seek to make this overwhelming for the user, and would always keep a discrete sense of clarity about what editor surface or viewing surface we are in and allow that to be storyboarded as its own first class citizen experience, but have exit points to move between things in a way that kind of solicits not only consent but readiness to shift into a different mode of thinking - some way to prepare oneself for the mode-transform required in the change.
> - The dragging my name behind the moon is related to a book I got read. It's the same image and sensation I got when my dad read to me about David walking across the glimmering moonlit sea path to The Garden Behind the Moon (by Howard Pyle) - a deep essential moment of courage without needing to recognize it as courage - the simpleness, the sheer availability of possibility, the shapeless form of being guided. That is what my heart says about Recognition. (go to the danielbdyer/book-research repository and look up the "on recognition" markdown file - and read some related ones to your heart's content - this is another repository that is feeling like some convergence might be possible
> - OK, reading yours now while you read mine 🙂 I haven't looked yet but now that you're reading my message just know that i'm reading your markdown finally

### The conclusion first, again

1. **The big idea is one node rendered four ways, and the house already has the rule for two of them.** A work is a star in the sky, a page in a room, the same page made editable, and a node in the outliner. `CONSTELLATION_PARALLEL.md` already holds the first two to one contract: "Each surface declares what its sky-parallel centers on," and crossing from one to the other lands the visitor on whatever they were attending to. The ask extends that orientation contract from two views to four, with the relational lens below as a fifth.
2. **Seamless and discrete can both hold, because they apply to different things.** The place stays continuous: what he was attending to carries across every crossing. The mode stays discrete: he always knows which surface he is on, and a change of mode is never disguised. The house already states the second half for rooms. A Cross transition is "Instant. The rooms aren't continuous; pretending they are is dishonest" (`INTERACTION_DESIGN.md`).
3. **The house already has a gesture that asks for readiness and not only consent: the look-up.** In the Foyer the pull is "spring-held"; "past the threshold the look-up commits"; and "Release early and the room settles back" (`src/app/routes/index.tsx`). A gesture he can begin, feel, and abandon is how a crossing asks whether he is ready. Every change of mode can be built on that grammar. `CLAUDE.md` names what such a gesture waits for: spanda, "the subtle vibration that precedes movement," and "a readiness in the material."
4. **The moon is already the house's threshold, and it is only there at night.** The theme toggle shows "the sun by day, the moon by night," and that glyph is the same element that rises into the daystar when the visitor looks up into the sky (`src/app/layout/ThemeToggle.tsx`). Dragging his name to the moon brings himself to the thing that carries the house upward. It can happen only when the room keeps the night hour, which is when David walked the path.
5. **An editor identical to the render is possible, because the outliner can already render a document.** An outline node's layout can be `h1`, `h2`, `h3`, `p`, `quote` or `code` (harness `packages/outline/src/core/state.ts`). A work could be an outline whose nodes are its paragraphs. That would make "highlight a paragraph … and turn it into editor mode" literal: the paragraph is a node, and editing it is zooming into it. It is also a domain change for this site, where a work is a markdown file, and the decision is his.
6. **The vault already holds his Tana question, with his own answer and his own test.** `book-research` records, from 2026-08-13: "How much ontology is enough to preserve the ecology without killing the pulse?", which the conversation called "the Tana version of the same philosophical question," and answered: "Enough constraint to support fluency. Not enough constraint to determine emergence." His test for when the balance tips is the moment the model draws attention to itself instead of quietly helping him notice. The `#hypothesis` bullet, seven weeks later, is evidence toward that open question, gathered inside a tool.
7. **Recognition is what the three repositories have in common.** The vault's book is about recognition. The harness's gate is an act of recognition: "fluent language a person did not recognize is not yet theirs to have authored" (`book-research`, `notes/the fundamental unit of authorship is recognition, not the sentence.md`), and Alt+A is the keystroke where it happens. The site is where recognized work is shown.

### What the moon asks of the sign-in

His reflection of 2026-08-24 (`book-research`, `reflections/on recognition (2026-08-24).md`) holds the same Pyle passage he repeated here, and one more distinction that bears directly on the gesture: recognition is "opened-with — not an opened-by, or opened-into." Read as design:

| | What it would be | What it means for signing in |
|---|---|---|
| **Opened-by** | A gate that opens him. | A login form, a password field, a button labeled "Sign in." Refused. |
| **Opened-into** | A place he is let into. | An admin area behind a door, separate from the site. Refused. |
| **Opened-with** | A move he makes, and the house moves with him. | His name, carried to the moon and received. The same site, now his to touch. |

His three phrases about the passage become three constraints:

- **"Courage without needing to recognize it as courage."** The gesture is not marked as a feat. No instruction, no hint, no animation that congratulates him.
- **"The sheer availability of possibility."** At night the gesture is available from every page, with nothing to unlock first.
- **"The shapeless form of being guided."** As the name nears the moon, the moon can draw it the last distance. A guide without a shape pulls gently; it does not snap the name into a target.

Three constraints named now so they do not surprise later:

- **Accessibility.** A drag with no alternative fails WCAG 2.2's success criterion 2.5.7, Dragging Movements. The house's baseline is WCAG 2.1 AA (`ACCESSIBILITY.md`), which predates that criterion, but its intent applies. For a sign-in only he uses, the alternative can be the outliner's own sign-in link.
- **Privacy.** `PRIVACY.md` declines cookies. A session cookie would be set only after his gesture and his sign-in, so a visitor never receives one. `danielbdyer.com` and `outline.danielbdyer.com` share a parent domain, so one sign-in can cover both.
- **The site stays static.** The editable page would run in the browser after sign-in and talk to the outliner's existing API (`/api`, the intents, the stream). Visitors get the same prerendered pages as today. This is the trigger `CATHEDRALS.md` held for Phase 5, "until Danny wants to bless from a phone or a second author appears," arriving in a form that needs no server on the site.

### The surfaces, and where each crossing lands

The orientation contract, extended. Each row is where he stands; each column is where crossing from it lands. The two cells marked *exists* are built; every other cell is a candidate.

| From | The sky | The page, editable | The outliner |
|---|---|---|---|
| **A work** | Its star, centered (*exists*) | The same page, with title, summary and facet chips editable in place, and a `+` beside the chips | The work's node, zoomed, at `outline.danielbdyer.com` |
| **A paragraph** | The work's star | The paragraph opens as an outline in place, its node and its children, framed so the page stays visible around it | That paragraph's node, zoomed |
| **A room** | Its region, lit (*exists*) | The room's list, each entry a node he can move or retitle | The room's node |

Two notes on the table. The tags on the Study's index page are facet chips (`src/shared/molecules/WorkEntry/WorkEntry.tsx`), and facets are a closed set of eight. A `+` beside them offers eight choices, not a free field, which is the "discrete/concrete clarity" he named. And only one surface in the table is new. The sky, the page and the outliner exist. What is new is one mode of the page, and the crossings between all four.

The house's precedent for the next step is `CONSTELLATION_STORYBOARD.md`, where the sky was drawn scene by scene, with "a discipline for the seams, where one gesture lands while another is still unfolding," before the pass that built it. He asked for each surface to be "storyboarded as its own first class citizen experience." So the next document is a storyboard of these surfaces and their crossings. Not code.

### The relational lens

"Turn all non-Tana/non-supertagged nodes a bit more into the background … at that moment you're more in the relational structuring mode." The sky already does this to works. Its facet view shows "its member stars and threads emphasized, others dimmed" (`CONSTELLATION_PARALLEL.md`). The relational lens on the outline is the same move: typed nodes forward, the rest quieted and still within reach.

That leaves a possibility worth holding. The sky is the house's relational view, where connections are seen rather than read. The outline's relational mode and the sky may turn out to be one surface seen from two sides. This is a possibility, not a proposal.

### The second way structure fails, from the vault

The first half of this file names one way structure displaces writing: fields asked at writing time, as in Tana. The vault records a second, in his words. The vault-and-AI architecture "has fundamentally kind of... unmoored me from the practice of experience around what it's like to write this book. It's sort of been a delegated practice that doesn't really scratch the itch" (`book-research`, `notes/the vault-and-AI architecture had unmoored the author from the practice of experiencing the book — a delegated practice that doesn't scratch the itch.md`). The collaborator's reply, recorded there, names the mechanism: "the thinking gets done but the body doesn't get to recognize."

So soft materialization can fail in two ways: fields he must fill while writing, and fields filled for him by agents. Reflection 3 survives both only in a narrower form: **the fields are filled by his own acts of recognition** — a verdict, a link, a keep. An agent can prepare a field, and only his recognition fills it. The vault's phrase for the stance is that the scaffolding "must keep disappearing," useful but "invisible when the music starts."

### The vault as a third participant

`book-research` holds 516 notes in markdown. Each is a claim titled by a lowercase sentence, with typed fields in its frontmatter (`category`, `state`, `topics`) and wiki links to other notes. That is the kind of corpus the harness's markdown adapter was designed to read: "Any real vault is one instance of the adapter … run where the vault lives" (harness `NORTH_STAR.md` §10). `DYERVERSE.md` already planned for it to stay a separate repository, entering by reference. Through the adapter, a vault note could be a node in the outliner, a star in a second region of the sky, and a claim an essay quotes (`PATTERN_LANGUAGE.md` pattern 8, the quoted claim).

The vault is also the repository that learned earliest, and at the most cost, what the `#hypothesis` bullet says. Its apparatus retired itself on 2026-08-09 when it began to displace the writing. If it joins the other two, it brings that lesson as a working rule, not as a quotation.

### Questions the second message adds

- **10. A visitor at the moon.** If a visitor drags your name to the moon, what happens: nothing, or a door they cannot open?
- **11. Daytime.** The moon is there only at night. Is signing in a night act, or should the sun also receive your name?
- **12. The body of a work.** Should a work's source be an outline whose nodes are its paragraphs, or a markdown file the outline reads?
- **13. The readiness gesture.** What should a change of mode feel like in the body: a held pull like the look-up, a pause, something else?
- **14. The vault.** Does `book-research` join this conversation now, or after the site and the harness have met?

---

## The Third Exchange: Opened-With

After reading the second message's reflections, Danny wrote:

> I love that you recognize opened-with - I think that has broad implications for everything we do here in this composite codebase that is starting to come together

The agent named where the codebase already works that way: approval by writing in a proposal (harness D-123), the sky as "the Foyer's ceiling opening, not a separate room," repositories meeting at a contract, and "Discuss with AI" answering under his own question (harness D-139). It also named the one word the principle asks to change, *gate*. Then it asked whether the principle should be a standing directive. He answered:

> Yes, absolutely, this deserves the christening of a new day, in my mind. this little David over here has returned from the moon and the moon was good, I love what you see for this codebase after reflecting on my input with me, and I'd be delighted to go there with you.

It is recorded as directive 18 in [AGENTS.md](./AGENTS.md), dated 2026-10-04. It is recorded in the harness as well, as a section of its `CLAUDE.md` and as decision D-142, so sessions there hold it too. The replacement for *gate* is held.

---

## What This File Decides

It decides one thing: opened-with is a standing directive (directive 18 in `AGENTS.md`; D-142 in the harness). Everything else in it is a candidate. No code was changed in any repository. The harness was only read, at `c226cef`, and the vault was only read, at its default branch on 2026-10-04. Every rule written in bold above is a candidate. The proposed order of work is:

1. Danny reads and corrects this file.
2. Questions 1 to 3 are answered, and the smallest real change to this site is named from the answers.
3. The surfaces and their crossings are storyboarded, each as its own experience, before any of them is built.
4. The `#hypothesis` design is worked out from first principles, in conversation, in the harness, starting from question 4.
5. Then code, with the invariants first (directive 11).

*Drafted 2026-10-04 from this repository at `beefe13` and the harness at `c226cef`. Cited in this repository: `AGENTS.md`, `CATHEDRALS.md`, `CONTENT_AUTHORING.md`, `CONSTELLATION_WALK.md`, `DOMAIN_MODEL.md`, `DYERVERSE.md`, `INFORMATION_ARCHITECTURE.md`, `MANIFESTO_NOTES.md`, `PATTERN_LANGUAGE.md`. In the harness: `CLAUDE.md`, `NORTH_STAR.md` §2, §7, §10, §11, §12, §18, `DECISIONS.md` D-123 to D-141, `research/three-systems.md`, `surfaces/round-09.html`, `packages/outline/README.md`, `packages/outline/src/core/state.ts`. Added for the second message, in this repository: `ACCESSIBILITY.md`, `CLAUDE.md`, `CONSTELLATION_PARALLEL.md`, `CONSTELLATION_STORYBOARD.md`, `INTERACTION_DESIGN.md`, `PRIVACY.md`, `src/app/routes/index.tsx`, `src/app/layout/ThemeToggle.tsx`, `src/shared/molecules/WorkEntry/WorkEntry.tsx`. In the vault: `CLAUDE.md`, `reflections/on recognition (2026-08-24).md`, `drafts/recognition — a surface to write from.md`, and the notes on the unit of authorship, on how much structure and how much ontology, on recognition being cultivated, on the felt fit, and on the vault-and-AI architecture.*
