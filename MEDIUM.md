# The Medium

A webpage is not a document. It is not a screen. It is not an application. It is a specific kind of encounter between content and person, mediated by an interface that is itself part of the content. This file exists to name what that encounter *is* — not for this site specifically, but for the medium itself — so that every specification downstream inherits the right assumptions about what it is specifying.

---

## Epistemography of the Webpage

A webpage is an inscription in a living medium. Unlike paper, it is not fixed. Unlike speech, it is not ephemeral. Unlike film, it is not linear. It occupies a category of its own: **an addressable, responsive, hypertextual surface that exists only in the act of being rendered**.

This matters. A poem printed on paper exists whether or not anyone is reading it. A poem on a webpage exists only when a browser constructs it — parses the markup, resolves the styles, composites the layers, paints the pixels. The content is *performed* every time it is encountered. The rendering is not delivery; it is constitution. The medium doesn't carry the content — it *enacts* it.

This means the interface is not a frame around the content. The interface is the outermost layer of the content itself. Typography is not how the words are displayed — it is part of what the words say. Whitespace is not absence of content — it is content that has chosen silence. A transition is not decoration applied to a state change — it is the felt experience of meaning moving from one form to another. To build a webpage is to make decisions about what the content *is*, not just how it appears.

---

## The Dimensions of the Medium

A webpage exists simultaneously in multiple dimensions. Each dimension is a real property of the medium, not a feature to be added. Every specification in this codebase is an exploration of one or more of these dimensions.

### Hypertextuality

The webpage's native grammar is the link. Content on a webpage does not merely sit — it *points*. Every piece of content exists in relation to what it links to, what links to it, and what it could link to but doesn't. The link is not navigation; it is meaning. To connect a poem to a case study is to say something about both of them that neither says alone. The graph of links is not metadata — it is a dimension of the content itself.

This is the dimension that `GRAPH_AND_LINKING.md` inhabits. But it also informs the domain model (works carry relational potential), the information architecture (navigation is a subset of linking), and the content schema (every work must know what it can reach).

### Temporality

A webpage unfolds in time. It loads, it renders, it scrolls, it animates, it responds. Unlike a printed page, which presents itself whole, a webpage reveals itself through duration. Scrolling is reading is moving through a space. A transition between states is an experience with a beginning, middle, and end. Loading is not a deficiency to be hidden — it is the first temporal act of the encounter.

This site uses time deliberately: scroll reveals that feel like rooms opening, a geometric figure that takes a full minute to rotate, a dark mode transition slow enough to feel like a room dimming. These are not embellishments. They are the content using the temporal dimension of its medium.

This is the dimension that `INTERACTION_DESIGN.md` primarily inhabits. But it also shapes `PERFORMANCE_BUDGET.md` (the tension between intentional slowness and unintentional delay), `DESIGN_SYSTEM.md` (duration as a design token alongside color and space), and `ACCESSIBILITY.md` (reduced-motion is a different temporal contract, not an absence of one).

### Responsiveness

A webpage does not have a fixed size. It exists at every viewport simultaneously — not as degraded versions of an ideal, but as the same content expressing itself through different spatial constraints. A poem in a narrow viewport is not a compromised poem. It is the poem meeting a different body.

This dimension extends beyond screen size. A webpage responds to user preference (color scheme, font size, reduced motion), to capability (screen reader, keyboard, touch), to context (network speed, device memory). Responsiveness is not adaptation — it is the medium's native capacity for meeting each person where they are.

This is the dimension that `RESPONSIVE_STRATEGY.md` and `ACCESSIBILITY.md` primarily inhabit. But it is also the philosophical ground for `PERFORMANCE_BUDGET.md` (responding to network conditions) and `DESIGN_SYSTEM.md` (tokens that flex rather than break).

### Addressability

Every meaningful state of a webpage can have a URL. This is extraordinary and underappreciated. A URL is a promise: this content exists, it can be found, it can be shared, it can be returned to. To give something a URL is to say it deserves to persist. To withhold a URL is to say something is transient, contextual, not its own thing.

For a site where every piece of content is a *work* — a word chosen because it carries weight — addressability is not a technical detail. It is an ontological commitment. Every work that deserves a room deserves an address.

This is the dimension that `INFORMATION_ARCHITECTURE.md` primarily inhabits (URL design). But it also informs `SEO_AND_META.md` (how addresses present themselves to the outside), `CONTENT_SCHEMA.md` (slugs as identity), and `GRAPH_AND_LINKING.md` (links are only possible between addressed things).

### Semantic Structure

Beneath the visual surface, a webpage has a semantic skeleton. HTML is not a layout language — it is a meaning language. A heading is not big text; it is a declaration of hierarchy. A list is not formatted lines; it is a set of related items. A `<blockquote>` is not indented text; it is attributed speech.

This semantic layer is what makes a webpage accessible to machines and to people who don't encounter it visually. Screen readers navigate the semantic structure, not the visual one. Search engines index meaning, not appearance. The semantic and the visual must agree — when they diverge, someone is being lied to.

This is the dimension that `ACCESSIBILITY.md` and `COMPONENT_ARCHITECTURE.md` jointly inhabit. Every component is both a visual and semantic decision.

### Social Existence

A webpage does not exist in isolation. It is fetched, cached, indexed, shared, embedded, bookmarked, archived. When someone shares a link, the webpage presents itself through a proxy: an Open Graph card, a title and description, a thumbnail. This proxy is not a summary — it is the webpage's *social body*, its way of existing in contexts it doesn't control.

A webpage is also findable. Search engines encounter it, interpret it, rank it. RSS readers subscribe to it. Archival services preserve it. The webpage has a life beyond the browser tab where it was authored — a distributed, asynchronous, partially autonomous existence.

This is the dimension that `SEO_AND_META.md` primarily inhabits. But it also informs `CONTENT_SCHEMA.md` (content must produce its own social representation) and the domain model (if a work exists, it should be able to exist *outside* the site too).

### Materiality

Despite being "digital," a webpage has material qualities. It has weight (bytes, load time, rendering cost). It has texture (typography, color, whitespace, grain). It has temperature (warm palettes, cool minimalism). It has density (information per viewport, rhythm of content and space). These are not metaphors applied after the fact — they are properties of the medium that users perceive bodily, the way you feel a room's acoustics before you think about them.

This site names its materiality explicitly: paper grain, umber palette, serif typography, structural warmth. These are material choices in a material medium. The medium is capable of materiality, and this site intends to use that capacity.

This is the dimension that `DESIGN_SYSTEM.md` primarily inhabits. But it is also the ground beneath `CLAUDE.md`'s insistence that the site "should feel like it has a body."

---

## What This Means for Specification

Each specification in the `SPECIFICATION_MAP.md` is an exploration of one or more of these dimensions. The specifications don't create these dimensions — the medium has them already. The specifications *attend* to them, making explicit what the codebase's relationship to each dimension will be.

Some implications:

**The content layer is not a data pipeline.** It is the system by which Danny's voice enters a medium that will enact it. `CONTENT_SCHEMA.md` isn't about frontmatter fields — it's about what a work needs to carry in order to fully inhabit the medium's dimensions: to be linked (hypertextuality), to unfold in time (temporality), to adapt to its viewer (responsiveness), to have an address (addressability), to carry semantic meaning (structure), to exist beyond the site (social existence), and to feel like something (materiality).

**Design tokens are not abstractions.** They are the material vocabulary of this specific webpage's materiality. `DESIGN_SYSTEM.md` isn't a style guide — it is the specification of how this site's body is made.

**Accessibility is not compliance.** It is the medium's responsiveness taken seriously. `ACCESSIBILITY.md` isn't about meeting WCAG checkboxes — it is about honoring the medium's native capacity to meet each person where they are.

**Performance is not speed.** It is the relationship between the site's temporality and the viewer's patience. `PERFORMANCE_BUDGET.md` must hold the tension between a site that uses duration intentionally and a site that doesn't waste its visitor's time.

**The graph is not a feature.** It is the medium's hypertextuality given architectural form. `GRAPH_AND_LINKING.md` isn't about backlinks as a UI pattern — it is about what it means for content to exist in a medium where everything can point to everything.

---

## The Medium and This Site

Danny's site uses the medium's dimensions with unusual intentionality. Most websites treat temporality as something to minimize (fast loads, instant transitions). This one treats it as a material to shape. Most websites treat responsiveness as a layout problem. This one treats it as a way of meeting people. Most websites treat the interface as separate from the content. This one insists they are the same thing.

This is what makes the site's specifications more than a checklist. Each one is a decision about how to inhabit a specific dimension of the medium — and those decisions must be coherent with each other because the dimensions are not independent. The materiality affects the temporality (heavier assets, more rendering). The hypertextuality affects the information architecture (if everything is one graph, navigation is just a default path through it). The addressability affects the content schema (every work needs a slug because it needs a home).

The specifications share walls, the way the rooms do. This document is the ground they all stand on.
