---
name: write-a-work
description: Use when Danny wants to publish a new piece of content — a poem, an essay, a case study, or a short note. Walks the authoring workflow from blank file to published work.
---

# Write a Work

The authoring workflow is small. This skill walks it. Every decision below has a spec file behind it; follow the link when the felt sense is unclear.

## The workflow

1. **Pick the room.** Works live in exactly one room — the room whose atmosphere the work most belongs to, not the first room that fits. See `DOMAIN_MODEL.md` for room definitions. The room is decided by directory, not by frontmatter.
2. **Name the file.** `src/content/{room}/{slug}.md`. Slug is lowercase kebab-case, short, stable — it becomes the URL segment. A slug change after publication breaks any link to the work. See `CONTENT_SCHEMA.md`.
3. **Write the minimum frontmatter.** Only `title` and `date` are required. Everything else is optional:

   ```yaml
   ---
   title: A Working Title
   date: 2026-04-22
   ---
   ```

4. **Write the body in GitHub-flavored markdown.** No need to restate the title as an `<h1>` — the view component renders it from frontmatter. Start at the first real paragraph.
5. **Add facets only if they are felt, not prudent.** Facets are cross-room threads (`craft`, `consciousness`, `language`, `leadership`, `beauty`, `becoming`, `relation`, `body`). Add when one or more is genuinely present in the work. Zero is legitimate.
6. **Mark as draft if not ready.** Add `draft: true` to frontmatter. Drafts are visible in `pnpm dev`, excluded from production builds. To publish, remove the flag.
7. **Link to other works with wikilinks.** `[[some-slug]]` for same-room, `[[room/some-slug]]` for cross-room. Unresolved wikilinks fail the build loudly. See `GRAPH_AND_LINKING.md`.
8. **Save and preview.** `pnpm dev` hot-reloads. Visit the work's URL at `/{room}/{slug}`.

## Optional fields

| Field | When to add |
|---|---|
| `summary` | When the work is going into a listing next to other works and the title alone doesn't carry enough. |
| `type` | When type-specific rendering matters (`poem`, `essay`, `case-study`, `note`). Omitting defaults to essay-like rendering. |
| `draft: true` | When the work isn't ready for visitors. |

## Principles

- **Every optional field is a commitment.** If the field doesn't change how the work reads, leave it out.
- **The smallest valid work is two frontmatter fields and a body.** That is enough. `this is enough, this can exist now` is the practice.
- **The filesystem is the schema.** Room = directory. Slug = filename. No conflicting frontmatter needed.
- **Deletion is rare.** Mark `draft: true` instead — keeps the file and history, removes the visitor-facing surface.

## Spec references

- `CONTENT_AUTHORING.md` — the full authoring workflow.
- `CONTENT_SCHEMA.md` — frontmatter shape, validation, Zod schema.
- `DOMAIN_MODEL.md` — what rooms, facets, modes, and works are.
- `GRAPH_AND_LINKING.md` — wikilink syntax, backlinks, graph noise resistance.
- `VOICE_AND_COPY.md` — the site's voice vs. Danny's voice inside works.
