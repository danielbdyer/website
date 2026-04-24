# Voice and Copy

This file defines the voice the site speaks *in itself* — in navigation, in room headings, in errors and empty states, in the small phrases that appear around works. It does not define the voice of the works. Danny's prose is Danny's prose; no spec governs what a poem says. This file governs what the *house* says.

The site has a body (`DESIGN_SYSTEM.md`), hallways (`INFORMATION_ARCHITECTURE.md`), and a graph (`GRAPH_AND_LINKING.md`). It also has a speaking voice, audible in every label and line that is not a work. That voice needs to be coherent across surfaces, or the house starts to sound like many houses.

---

## The Register

The site speaks quietly, in the second-voice register — italic secondary tone (`--text-2` in prose, `--text-3` for intentionally quieter placeholders), serif throughout. It never announces, never performs, never invites in the product-marketing sense. It is the voice of a well-kept room speaking about itself when asked.

A useful test for any line: **would this feel right etched into paper on the wall of a room you wanted to stay in?** Product copy almost never does. The register of this site is closer to museum wall-text than to a landing page — oriented to a visitor who is already here, not to one who needs to be convinced to arrive.

The voice is Danny's in a specific sense: he is the person speaking, and the site speaks with the quality of attention he brings to his teams and his poetry. It is not corporate plural ("we believe"). It is not confessional first-person inside the chrome either ("I made this site for…"). The site speaks *as the house*, which is Danny's instrument. First-person appears inside works; the house narrates itself.

---

## Where the Voice Speaks

The voice lives in all the surfaces that surround works:

- The wordmark and nav labels
- Room titles and room descriptions
- Metadata chrome on work pages (kicker, date, facet chips)
- The outward invitation at the bottom of work pages
- The facet page descriptions
- Empty states
- The 404 surface
- Any future microcopy — drawer labels, tooltips, aria-labels that carry visible text

The voice does *not* live in:

- The body of any work (that is the work's own voice)
- Frontmatter fields as data (those are structural)
- Generated metadata (OG tags, sitemap — those are for machines, governed by `SEO_AND_META.md`)

---

## Surfaces

### The wordmark

The wordmark is `◆ Danny Dyer` — the Diamond atom followed by the name, italic Newsreader, in `--text` (full ink). It is the only piece of copy on the site that is rendered in the primary ink color by default; everything else is secondary voice or quieter. The wordmark is the name of the person who lives here; it earns full weight.

### Nav labels

The four room labels in the nav are bare: `Studio`, `Garden`, `Study`, `Salon`. No "The" prefix in the nav (the label is a pointer, not a full name). No article, no ornamentation, no verb. The labels are set in small `--text-2` with tracking; on hover they brighten toward `--text`.

No label reads "Home" or "Foyer" — the wordmark is home. The visitor is not told where home is; the wordmark's persistent presence is orientation enough.

### Room landings

Each room landing has two pieces of voice: the title and the description.

**The title** uses the full name with the definite article: `The Studio`, `The Garden`, `The Study`, `The Salon`. The "The" is part of the name — the rooms are specific rooms, not generic kinds of spaces. In Newsreader, at the room-heading weight specified in `DESIGN_SYSTEM.md`.

**The description** is one or two short sentences of italic secondary voice. It names what the room holds without selling it. The current placeholder descriptions in the four route files are bracketed (see the draft convention below) and will be replaced when voice settles. Principles for the eventual descriptions:

- Name the content register, not the content itself (*"Poetry. Work that breathes."* not *"Three poems from 2026"*).
- End with a quiet gesture rather than a full stop feeling. A comma-spliced list may serve better than a declarative paragraph.
- Never second-person. Never "Welcome to…". Never promise.

### Work pages

Work pages carry a thin layer of voice above the work itself and a thin layer below.

**The kicker** sits above the title, in secondary voice: `← The Studio`. It is the visitor's "you are here" for deepening surfaces. Always the full room name with "The"; always the arrow. The arrow is not decoration — it carries the direction the visitor can travel.

**The metadata line** is date and facet chips, in secondary voice. Dates are written, not relative: `March 14, 2026`, not `two months ago`. Relative dates imply freshness matters; on this site, a poem from 2019 is not older than a poem from 2026 in any register the site cares about. Facet chips are lowercase (`craft`, `language`) — the names from `DOMAIN_MODEL.md`, unchanged.

**The outward invitation**, per `GRAPH_AND_LINKING.md`, is up to three quiet lines. Voice principles for each element:

- *Facet threads.* A comma-joined list with a short verb opener. Draft pattern: *"More in craft, consciousness."* or *"Also threaded through craft."* Never "Related:". Never "See also:". The phrasing invites, it doesn't label.
- *Backlinks.* A short line naming the works that mention this one. Draft pattern: *"Mentioned in [[work-a]], [[work-b]]."* Never "Linked from:". Never "References:".
- *Return to room.* The guaranteed final line. Draft pattern: *"Keep wandering in The Garden →"* — the arrow back, the full room name, the verb of quiet movement.

### Facet pages

The title is the facet name, capitalized: `Craft`, `Language`, `Becoming`. The description is a short paragraph lifted or adapted from `DOMAIN_MODEL.md`'s facet definitions. The per-room groupings use the full room name with "The".

### Errors and empty states

**404.** Two short lines acknowledging the miss, an Ornament, a link home. The lines never scold (no "Oops!", no "Page not found"), never cute (no winking metaphors the site can't sustain), never explanatory (no "This may be because…"). A quiet acknowledgment and a door.

**Empty rooms.** A room with no published works shows its title and description and nothing where the works list would be. No "No works yet." No placeholder cards. The silence is the state. The outward invitation to an adjacent room, when added, carries the visitor out.

**Empty facet pages.** A facet carried by no current works shows the name and description. A single line may acknowledge that no works currently carry it — draft pattern: *"No works currently carry this thread."* — followed by the guaranteed return to `/`.

---

## Microcopy Conventions

**Capitalization.**

- Room names are capitalized with their article: `The Studio`, `The Garden`. In nav labels (pointers), the article is dropped: `Studio`.
- Facet names are lowercase in body prose and in chips: `craft`, `consciousness`. On facet pages used as headings, they are capitalized: `Craft`, `Consciousness`.
- Work titles are written as the author set them — sentence case, title case, or lowercase are all legitimate; the site does not second-guess.
- Everything else is sentence case. Never title case in microcopy.

**Punctuation.**

- **Em-dashes** (—) are the site's signature punctuation for parenthetical rhythm. They are used deliberately, not frequently. When in doubt, use a period.
- **Commas** do the usual work. Oxford comma on.
- **Exclamation points** never. Not in labels, not in errors, not in invitations. The site does not raise its voice.
- **Question marks** sparingly. The site is not asking the visitor anything most of the time.
- **Ellipses** rarely. Trailing off is a feeling; most microcopy is better finished than fading.
- **Quotation marks** use curly typographic quotes (`"` and `'`), not straight. The Prettier and typography configuration should preserve them.

**Verbs.**

- The site uses present tense: "Mentioned in…", "Keep wandering…", not "Was mentioned" or "Will continue."
- Imperative is permitted for invitations ("Keep wandering in The Garden"); it is not permitted for instruction ("Click here to read more").
- The site never tells the visitor what to do; it tells the visitor what is possible.

**Person and voice.**

- **Never first-person plural.** No "we", no "our site", no "we think". The site is not a team.
- **First-person singular** is reserved for Danny, and almost always appears *inside* works rather than in chrome. The chrome speaks about the site; Danny speaks through works.
- **Second-person** appears only in invitations that are about possibility, not instruction. "Keep wandering" is an invitation; "You should read…" is not.
- **Third-person about Danny** is permitted on surfaces where identity is structural (the Foyer's introduction, if one is written; the site's about-page equivalent). Reads as: *Danny Dyer writes about…* not *He's the founder of…*

**Labels vs. sentences.**

- Labels — nav, chips, kickers — are phrases, not sentences. No trailing period. `Studio`, not `Studio.`.
- Sentences — descriptions, invitations, 404 lines — end in periods. No trailing ellipsis or em-dash.
- The distinction matters: a label is a pointer; a sentence is a voice. Confusing them produces uncanny copy.

---

## Declinations

The site does not use:

- **Welcome messages.** "Welcome to Danny's site" is absent because welcoming is performed, not stated.
- **"Hi, I'm…" greetings.** If an introduction is needed, it lives inside a work.
- **Call-to-action buttons with verb labels.** No "Read More", "Subscribe Now", "Get in Touch". Links are in prose; prose is the voice.
- **Urgency language.** No "new", no "just published", no "latest". Works are dated; a visitor who cares about recency reads the date.
- **Testimonial or quoted endorsement.** The site is not selling anything.
- **Social proof.** No counter of subscribers, no "trusted by", no badges.
- **"Hire me" or "Available for work" phrasing.** If professional availability needs to be surfaced, it earns a deliberate surface in the Studio, written in the site's register, not appended to the nav or footer.
- **Emoji in chrome.** Never. Danny may use emoji inside a specific work if a work calls for it; the house itself does not.

---

## The Draft Pattern

Copy that is known to be placeholder — lines that will be rewritten when a voice decision is made — is marked visually in the source by:

- Wrapping in **square brackets**: `[This door doesn't open.]`
- Setting the text color to `--text-3` (the quietest tone) rather than `--text-2`
- Keeping the italic register so structural typography is unchanged

Both signals together tell a reader (visitor or agent) that this text is not final. The brackets are visible in rendered output — they are a deliberate acknowledgment that the site is under construction in this specific surface, rather than an attempt to hide the incompleteness.

Currently bracketed:

- The 404 lines and link label in `src/app/layout/NotFound.tsx`
- The four room descriptions in `src/app/routes/{studio,garden,study,salon}.tsx`

When voice settles for a surface, the brackets are removed and the color returns to `--text-2`. The removal of brackets is how a draft surface graduates.

The Foyer's two lines (`The door is open. / The rooms are waiting.`) are intentionally *not* bracketed — they have not been flagged as draft. If they come to feel provisional, they earn brackets at that moment.

---

## What This File Does Not Govern

- **The prose inside works.** Danny's voice as a writer is his own. This file governs the site's speech, not his.
- **Content types' rendering specifics** — whether a poem's title renders larger than an essay's, etc. Those are `DESIGN_SYSTEM.md` / component-level decisions.
- **Machine-facing text.** Open Graph descriptions, meta titles, sitemap labels. Governed by `SEO_AND_META.md` when that file exists.
- **Accessibility-only text** that never reaches visual display — screen-reader-only labels for decorative elements. Those follow `ACCESSIBILITY.md` conventions.

---

## Enforced in Code

Currently, the bracketed draft pattern is honored in four room pages and the 404 surface. Nav labels, the wordmark, and room titles already follow the conventions above — they are not bracketed because they are not placeholder.

No lint rule enforces the declinations. A pre-commit hook could, in principle, flag exclamation points or "Click here" patterns in JSX string literals; that is a future concern, not now. The voice is enforced the way taste is enforced — by review, by the felt sense of the register, and by catching regressions in code review.

When a surface's copy graduates from draft, the code change is small: remove the brackets, restore `--text-2`, and commit with a note that the surface's voice has settled. This file grows with each such graduation, naming what the final copy is and why.
