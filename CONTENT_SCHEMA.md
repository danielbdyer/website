# The Content Schema

Works are files. A work is a markdown file with frontmatter, living in a directory named for its room, with a filename that doubles as its slug and its URL segment. The filesystem is the schema — there is no CMS, no database, no headless service. If you can see the file, you can see the work.

This file turns the domain model's *what a work is* into *what a work contains on disk*. It defines the frontmatter shape, the directory layout, the loading strategy at build time, and the validation boundary. It is the bridge between `DOMAIN_MODEL.md` (concepts) and the component architecture in `REACT_NORTH_STAR.md` (code that renders).

What this file does *not* govern: how links are syntactically encoded in the body (deferred to `GRAPH_AND_LINKING.md`), Danny's authoring workflow (deferred to `CONTENT_AUTHORING.md`), or how works are navigated (deferred to `INFORMATION_ARCHITECTURE.md`). This file defines the shape; those files define the surrounding practice.

---

## Filesystem Convention

Content lives under `src/content/`, one directory per room:

```
src/content/
├── studio/
│   ├── some-case-study.md
│   └── another-essay.md
├── garden/
│   └── a-poem.md
├── study/
└── salon/
```

The Foyer has no content directory. This matches the domain model's soft invariant: the Foyer may one day hold a work, but it does not today, and code should not scaffold around its absence. If a Foyer work ever arrives, `src/content/foyer/` appears; until then, the directory does not exist.

**The directory is the room.** A work's room is derived from the directory it lives in, not from a frontmatter field. This removes a source of drift (the frontmatter and the path disagreeing) and makes the filesystem the single source of room assignment. Moving a file between room directories is moving the work between rooms — a real domain change, visible in version control.

**The filename is the slug.** `src/content/garden/a-poem.md` produces a work with slug `a-poem` whose URL is `/garden/a-poem`. The filename:
- Uses lowercase kebab-case. No spaces, no underscores, no capitals.
- Is stable — renaming a file renames its URL, which breaks any link to it. This is a real cost; rename with care.
- Is not transformed. What you see on disk is what appears in the URL.

**Extension is `.md` for now.** `.mdx` is held as an option for when embedded components become necessary (audio embeds in the Salon, interactive figures in case studies). The loader is designed to accept both; until a work earns MDX, markdown is the default.

---

## Frontmatter Shape

Every work begins with YAML frontmatter. The shape is deliberately small — the goal is that a writer returning to voice can produce a valid work with two lines of metadata and a body. Depth is optional; presence is sufficient.

```yaml
---
title: The Morning the Garden Spoke Back
date: 2026-03-14
summary: A short poem about listening until the listening becomes the thing.
facets: [language, consciousness]
type: poem
draft: false
---
```

A Salon entry adds posture and (optionally) a structured referent and image:

```yaml
---
title: Klimt, the gold ground, what it knows
date: 2026-01-12
summary: Color that does not represent light, but holds it.
facets: [beauty]
type: note
posture: looking
image:
  src: /images/salon/klimt-gold-ground.jpg
  alt: Detail of Gustav Klimt's Stoclet Frieze in gold leaf
  caption: Klimt — Stoclet Frieze (detail)
  credit: Gustav Klimt, 1911
referent:
  type: visual-artwork
  name: Stoclet Frieze (gold ground, detail)
  creator:
    name: Gustav Klimt
  year: 1911
---
```

### The Zod schema

Zod is the validation boundary. The schema is the contract every work on disk must satisfy; works that don't parse fail the build with a loud, specific error. This schema will live as code in `src/shared/content/schema.ts` (or similar) when the content loader is built.

```ts
import { z } from 'zod';

export const workFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  summary: z.string().optional(),
  facets: z.array(facetSchema).default([]),
  type: z.enum(['poem', 'essay', 'case-study', 'note']).optional(),
  posture: z.enum(['listening', 'looking', 'reading']).optional(),
  image: imageSchema.optional(),
  referent: referentSchema.optional(),
  feature: z.boolean().default(false),
  draft: z.boolean().default(false),
});

export type WorkFrontmatter = z.infer<typeof workFrontmatterSchema>;
```

`facetSchema`, `postureSchema`, and `referentTypeSchema` derive from the corresponding TypeScript unions in `src/shared/types/common.ts` — the Zod schemas and the unions stay in sync, with the schemas as the runtime guardians.

### Posture, image, referent, feature

- **`posture`** — `listening | looking | reading`. The Salon's stance-of-attention axis. Optional; only meaningful on Salon works. See `DOMAIN_MODEL.md` §"Postures (Salon)".
- **`image`** — single optional attached image: `{ src, alt, caption?, credit? }`. The `alt` is required (accessibility); `caption` carries human-visible attribution (rendered in the UI); `credit` carries machine-visible attribution (Schema.org `creditText`). One image per work — multi-attachment is held until a work demands it.
- **`referent`** — the external creative work this work is *about*: `{ type, name, creator?, year?, url? }` where `type` is one of `visual-artwork | music-composition | music-album | music-recording | book | article | movie`. Feeds Schema.org `about` with role-aware creator properties (`composer` for compositions, `author` for books, etc.).
- **`feature: true`** — a curatorial flag. The facet-page masonry treats featured works as hero interjections that break the descending-by-timestamp rhythm. Default `false`. Curate, don't infer.

### Required vs. optional

- **Required: `title`, `date`.** A work that cannot be named or dated is not yet ready to be a work.
- **Optional: everything else.** A work with only a title, a date, and a body is a valid work. The schema welcomes depth without demanding it.
- **Defaulted: `facets` (empty array), `draft` (false).** Absence is legitimate — not every work carries cross-room threads, and the default for a completed work is published.

### The `Work` type

The full `Work` type — what components consume — combines parsed frontmatter with the room (from the path), the slug (from the filename), and the body (the markdown string):

```ts
export interface Work extends WorkFrontmatter {
  room: Room;   // from the directory
  slug: string; // from the filename
  body: string; // raw markdown
}
```

`Room` and `Facet` come from `src/shared/types/common.ts`. When the loader exists, it will produce `Work[]` — fully typed, fully validated, with no implicit coercion beyond what Zod performs explicitly.

---

## Content Types

Four optional types are defined: `poem`, `essay`, `case-study`, `note`. They are a hint about *how the work wants to read*, not a hint about *where the work lives*.

| Type | What it suggests |
|---|---|
| `poem` | Preserve line breaks. Render in a narrower measure. Italic or serif-forward treatment. |
| `essay` | Running prose. Standard paragraph rhythm. Sectioned by headings. |
| `case-study` | Structured. May include figures, pull-quotes, subheaded sections. |
| `note` | Short. Single-page. No pagination chrome. |

**Type does not determine room.** A poem can live in the Studio (a poem about craft is still a poem). An essay can live in the Garden. The type influences rendering; the room is a different dimension, decided by the directory.

**Type does not determine routing.** URL structure is `/{room}/{slug}` regardless of type. There is no `/poems/...` surface; the site is organized by room, not by form.

**Type is optional.** A work without a `type` field renders in a default essay-like style. Type exists for sharpening the rendering, not for categorization — a writer who doesn't want to choose doesn't have to. As new content forms arrive (a dialogue, a collection, a series), the enum grows; until the fifth form is authored, the four above are sufficient.

The type enum lives in the schema; the per-type rendering decisions live in the components that display works (gap — no `WorkView` or `Work{Type}View` components exist yet). This file does not decide what poem rendering *looks* like; `DESIGN_SYSTEM.md` and future components do.

---

## Drafts

A `draft: true` frontmatter field marks a work as not-yet-public.

**Draft behavior:**
- Development builds (`pnpm dev`) include drafts. Danny sees his own unfinished work.
- Production builds (`pnpm build`) exclude drafts. The deployed site never renders them.
- Drafts do not get URLs in production — not `noindex` pages, not 404s, just genuinely absent.

**The definition of "published":**

```ts
export function isPublished(work: Work, now = new Date()): boolean {
  return !work.draft && work.date <= now;
}
```

A work is published when it has finished being a draft *and* its date has arrived. Future-dated works are scheduled — they exist in the content tree but don't appear on the site until their date passes. This matters when a build happens on day X and the site is re-rendered on day Y; the same content tree produces different sites at different moments, and the date is the only mechanism that respects Danny's intent about when a work becomes visible.

**No draft UI in production.** There is no "this is a draft" badge, no preview URL, no magic query parameter. If it's a draft, the public site doesn't know about it.

---

## Body and Markdown

The body of a work is the content beneath the frontmatter — the prose itself. It is markdown today. The body is parsed to HTML at build time and rendered inside the appropriate `Work{Type}View` component (to be built).

**Markdown dialect:** GitHub-Flavored Markdown. Tables, fenced code blocks, strikethrough, task lists all supported. Footnotes and definition lists may be added via plugins as need arises.

**What the body carries:**
- Running prose, poetry, structural headings within a work
- Inline emphasis, links, and images
- Block-level elements: paragraphs, lists, code blocks, blockquotes, horizontal rules
- Footnotes (when needed)

**What the body does not carry:**
- Frontmatter fields repeated as body text. The title in frontmatter is the title; do not restate it as an `<h1>` in the body. The view component renders the title from the frontmatter field; the body starts at the first real paragraph.
- Metadata. The date, summary, facets, and type belong in frontmatter. Repeating them in prose creates drift.

**MDX as a held option.** When a work needs an embedded component — an audio player in a Salon piece, a diagram in a case study — the extension becomes `.mdx` and the loader switches to an MDX compiler for that file. The schema does not change; only the rendering pipeline differs. MDX is declined by default because plain markdown keeps authoring frictionless; it is adopted per-file when the work demands it.

### The trust stance

The markdown parser (`marked`) renders HTML directly. Inline HTML within a work's body is rendered as HTML, not escaped. The site does *not* sanitize parser output at render time.

This is deliberate. The content source is the repository — every markdown file is authored by Danny and committed through git. There is no user-generated input to defend against. Introducing a sanitizer (DOMPurify or similar) would add ~40KB to the bundle to guard against a threat that does not exist.

If the content source ever changes — e.g., works accepting submissions, comments, or any untrusted input — the trust stance must be revisited at that moment. For now: **trusted source, no sanitization, inline HTML allowed in markdown bodies.**

---

## Links

The one-graph commitment in `CLAUDE.md` says any work may link to any other work. The content schema's narrow job: decide *where* links live. The richer questions — syntax, backlink rendering, how the graph resists noise — belong to `GRAPH_AND_LINKING.md` when it exists.

**Links live in the body, not in frontmatter.** Frontmatter describes the work itself; the body is the work reaching out. A `links` array in frontmatter would make the graph a layer of metadata; putting links in prose makes them part of the writing.

**Facets are not links.** Facets belong in frontmatter because they describe the work; links belong in the body because they are the work pointing elsewhere. Two works sharing a facet are adjacent via the facet lens; they are only linked if one of them explicitly points to the other in prose.

Link *syntax* — standard markdown `[text](url)`, wikilinks `[[slug]]`, or a mix — is deferred. The schema does not preclude either.

---

## Loading Strategy

Content is loaded at build time, not at runtime. The loader:

1. Uses Vite's `import.meta.glob('/src/content/**/*.{md,mdx}', { eager: true, as: 'raw' })` to read every content file into the bundle.
2. For each file path, derives the `room` (directory name) and `slug` (filename stem).
3. Parses frontmatter + body (via a small parser — likely `gray-matter` or equivalent; the specific library is a `DEPENDENCY_POLICY.md` concern when that file exists).
4. Validates frontmatter against `workFrontmatterSchema`. A parse failure or validation failure halts the build with a clear error naming the offending file.
5. Produces a `Work[]` indexable by `{room, slug}` and filterable by facet, type, draft state, and date.

**No runtime fetching.** The site never fetches content from a CDN, never hydrates from a JSON endpoint, never lazy-loads a markdown file at runtime. All content is baked into the production bundle. This is a performance choice (no network waits), a resilience choice (the site works offline after first load), and a medium choice (the content is the bundle, not a database behind it).

**No runtime editing.** Danny edits files in the repository. A git commit is a content change. There is no admin UI.

---

## Validation Errors Are Loud

If a work fails to parse or fails schema validation, the build fails. Silent dropping of invalid content is not an option — a broken work should be visibly broken, not quietly absent.

The error message names the file path, the field that failed, and what the schema expected. This is the load-time equivalent of the site's transparency commitment: the site is honest about what it can and cannot do, and it refuses to pretend a broken work is fine.

---

## What This File Does Not Yet Decide

- **The specific frontmatter parser.** `gray-matter` is the conventional choice and would be the default if no argument emerged against it. The decision is held for `DEPENDENCY_POLICY.md` or for whenever the first work arrives and forces the choice.
- **Image handling.** Covers, inline figures, responsive sources. Deferred to `MEDIA_STRATEGY.md` (gap).
- **Audio and other non-text media.** The Salon's future. Deferred to `MEDIA_STRATEGY.md`.
- **Link syntax in markdown.** Whether wikilinks are supported, whether bare slugs are rewritten — deferred to `GRAPH_AND_LINKING.md` (gap).
- **Excerpts and reading time.** Whether the schema should carry a computed excerpt for lists, or compute one from the body at build time. Deferred — the first time a list view needs it, we decide.
- **Series, collections, sub-grouping within a room.** The schema does not model these today. If a body of works develops that wants to be grouped, the schema grows a `series` field or a `collection` field. Not yet.

---

## Enforced in Code

At the moment, `src/shared/types/common.ts` defines `Room` and `Facet` but does not yet define `Work` or `WorkFrontmatter`. No content directory exists. No loader exists. The schema above is the commitment; the code is the fulfillment. The next time this file changes, it will either be because an implementation revealed a flaw in the schema (and the schema catches up), or because a new concern has earned its way in.

The `src/content/` directory appears on the first day Danny writes a work. The `src/shared/content/` (or equivalent) directory appears on the same day, holding the schema, the loader, and the types. Neither exists today, and that absence is correct — the code for loading content should not exist before there is content to load.
