---
name: writing-prose
description: Use when supporting Danny in authoring a work on his site — a poem, essay, case study, or note. Orients to the content model (rooms, facets, types), the smallest-valid-work practice, wikilink conventions, the draft lifecycle, and — most importantly — the distinction between the site's voice and Danny's voice. Danny is the author; the site is the room his authorship inhabits. Your job is to protect that distinction.
---

# Writing Prose on This Site

The site's voice and Danny's voice are two different voices.

- The **site** speaks about itself — in nav, headings, metadata, errors, invitations. It is quiet, italic, secondary-toned, never performative. See `VOICE_AND_COPY.md`.
- **Danny** speaks through works. Each work has Danny's own voice: whatever the poem, essay, or case study calls for. The site does not govern this voice.

When supporting Danny in writing a work, your job is almost never to compose his voice. Your job is to hold the container — the model, the schema, the craft conventions — so he can write without friction. When a question is about how to *express* something, defer to Danny. When it is about *where the expression lives* or *how it's encoded*, walk the conventions below.

## The smallest valid work

Two frontmatter fields and a body.

```md
---
title: A Working Title
date: 2026-04-22
---

The first paragraph.
```

Saved at `src/content/{room}/{slug}.md`, this is a published work. The URL is `/{room}/{slug}`. `pnpm dev` shows it; `pnpm build` ships it.

Everything else — `summary`, `facets`, `type`, `draft` — is optional.

## Pick the room with care

Rooms are atmospheres, not categories. A work lives in the room whose *register* it most belongs to, not the first room that fits.

| Room | Atmosphere |
|---|---|
| Studio | Professional, technical, craft-as-devotion. Legible but not corporate. |
| Garden | Poetry. Living, growing, seasonal-as-metaphor (not lifecycle). |
| Study | Personal essays, philosophy, the quiet room with good light. |
| Salon | Music, aesthetics, art, beauty circulating. |

If a work could fit two rooms, pick by atmosphere and use facets to reach into the other room. A poem about leadership lives in the Garden and carries the `leadership` facet — not in the Studio.

## Slug conventions

- Lowercase kebab-case.
- Short and stable — a slug change after publication breaks every existing link to the work.
- Descriptive enough to recognize in a file list, not so descriptive it restates the title.
- Not a date. Frontmatter carries the date.

Sit with a proposed slug before committing. A slug is an address; renaming is a real cost.

## Facets, zero-or-many

Facets are cross-room threads. A work carries the facets it genuinely *feels*, not the facets that would categorize it well. Zero is legitimate. The eight: `craft`, `consciousness`, `language`, `leadership`, `beauty`, `becoming`, `relation`, `body`.

Adding a new facet is a domain change, not a content decision. If Danny wants a thread that doesn't exist, walk `evolve-domain` rather than inventing it inline.

## Content types

Optional. The four: `poem`, `essay`, `case-study`, `note`. The type influences rendering (line-break handling for poems, looser rhythm for essays); it does not determine routing, and it does not determine room. Omit when Danny doesn't care; add when the work wants a specific treatment.

## Drafts

`draft: true` in frontmatter. Visible in `pnpm dev`, absent in `pnpm build`. To publish: remove the flag.

Drafts are the right tool for a work that's composting. They're also the right tool for a published work that needs to temporarily disappear — mark draft, the work is invisible to visitors but present in the repo.

Deletion is rare. Prefer drafting to deletion unless the work should never have been written.

## Linking between works

Within the body, use wikilinks:

- `[[slug]]` — same-room link
- `[[room/slug]]` — cross-room link
- `[[slug|display text]]` — override the default anchor text (which is the target work's title)

External links use standard markdown: `[text](https://...)`.

Unresolved wikilinks fail the build loudly. If Danny wants to link to a work that doesn't exist yet, either write the target first (as a draft) or leave a plain-text reference that will become a link later.

## Authoring friction the agent can absorb

When Danny asks "should I add a summary?" — answer from the practice: *if the work is going into a listing next to other works and the title alone doesn't carry enough, yes.* Not from rules.

When Danny asks "what type is this?" — answer from the work's *reading rhythm*, not from categorization. A short reflection that reads like a paragraph and a half is a `note`. A long argumentative piece with structured sections is an `essay`. If it doesn't want a type, don't pick one.

When Danny is unsure about a facet — invite him to sit with the work. Facets are about what the work *is* in his life, not about tagging completeness.

When Danny pastes a draft that mixes frontmatter and body awkwardly — re-format it, but preserve every word of his voice. The chrome is yours to adjust; the prose isn't.

## What the site already commits to around works

- Every work has an address. URLs are stable identity.
- Every work has a room. Exactly one.
- Facets stay in frontmatter; links stay in the body.
- The `isPublished` predicate (`!draft && date <= now`) governs visibility.
- Future-dated works are scheduled (appear when their date passes).

## Spec references

- `CONTENT_AUTHORING.md` — the workflow in full.
- `CONTENT_SCHEMA.md` — frontmatter shape, validation, Zod schema.
- `DOMAIN_MODEL.md` — rooms, facets, types, modes.
- `GRAPH_AND_LINKING.md` — wikilink syntax, backlinks, graph etiquette.
- `CLAUDE.md` — Danny's voice, the practice of enough.
- `VOICE_AND_COPY.md` — distinguishes the site's voice (this is not Danny's voice).
