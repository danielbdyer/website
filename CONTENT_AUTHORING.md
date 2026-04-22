# Content Authoring

Danny is the only author. This file specifies the workflow he uses to bring a work into the site — from the moment an idea is named to the moment a visitor can encounter it. It is the practical companion to `CONTENT_SCHEMA.md`: that file defines what a work *is on disk*; this file defines what a writer *does to put one there*.

The workflow is small on purpose. This site exists in part to honor *"this is enough, this can exist now"* — the practice of letting a work be published without earning its way through gates. The authoring pipeline reflects that: there is no editorial workflow, no review queue, no staging environment. Danny commits a file; the next deploy publishes the work. That bluntness is the practice.

---

## The Writing Surface

Danny writes in the repository, in markdown, in his editor of choice.

There is no headless CMS, no admin dashboard, no separate authoring tool. This is a deliberate choice for the same reason the rest of the site is one repository: the file is the source of truth, and the site is the file rendered. Adding a CMS layer would introduce a second model of what a work is, and the two would inevitably drift.

**The editing loop:**

1. Open the repository in any editor.
2. Create or open a markdown file under `src/content/{room}/`.
3. Write.
4. Save.
5. View the change in the local dev server (`pnpm dev`), which hot-reloads.

**Local preview includes drafts.** `pnpm dev` shows every work, including those marked `draft: true` and those with future dates. This is Danny seeing his own house from the inside. The production build, by contrast, excludes drafts and future-dated works (per `CONTENT_SCHEMA.md`'s `isPublished` rule).

**No special tooling is required.** Markdown is plain text; the schema is documented; the build catches errors loudly. A new work is always reachable via the same five-step loop above, regardless of how the rest of the site evolves.

---

## Starting a New Work

The smallest valid work is two frontmatter fields and a body.

```md
---
title: A Working Title That Will Probably Change
date: 2026-04-22
---

The first draft of something I am not sure about yet.
```

That file, saved as `src/content/garden/a-working-title.md`, is a published work — it appears at `/garden/a-working-title` on the next dev refresh and on the next production build. *Published* is the default state; if the work is not yet ready, mark it draft:

```md
---
title: A Working Title That Will Probably Change
date: 2026-04-22
draft: true
---
```

A work begins published or begins draft. The lifecycle is binary at any moment: a work either is or is not a draft. There is no in-between state, no "in review," no "scheduled" (future dates handle scheduling without a separate state).

### Choosing the slug

The filename is the slug. Conventions:

- Lowercase kebab-case.
- Short and stable. A slug is an address; once a visitor links to it, renaming costs them.
- Descriptive enough to recognize in a list of files, not so descriptive that it duplicates the title.
- Not a date. The frontmatter carries the date; the slug carries the work.

When in doubt, sit with the slug for a moment before committing. A slug change after publication is a real edit to the site's graph, not a rename.

### Choosing the room

The directory is the room. Move a file to change a work's room. Rooms are atmospheres (per `DOMAIN_MODEL.md`); the room a work goes in is the room whose register the work most belongs to. When unsure, write first and decide later — the file can move before any URL has been shared.

---

## Adding Detail When Detail Arrives

The schema's optional fields earn their place per work, not per template. None of the following are required; all are welcome.

**`summary`** — a short line that helps the work read in lists. Add when a work is going into a room with other works and the title alone doesn't carry enough.

**`facets`** — the cross-room threads the work belongs to. Add when one or more facets are *felt* in the work, not when categorization seems prudent. Facets are a set, not a checklist.

**`type`** — `poem`, `essay`, `case-study`, or `note`. Add when type-specific rendering matters. A short prose piece without a type defaults to essay-like rendering, which is rarely wrong.

**`draft: true`** — when the work is not yet ready for visitors. Default is omitted (i.e., published).

**Future-dated `date`** — a date in the future schedules the work to appear when the date passes. This is a soft schedule: the site only respects it on the next build after the date passes. There is no ticking clock.

The principle: every optional field added is a small commitment. If the field doesn't change anything about how the work reads, leave it out.

---

## Editing Existing Works

A published work is editable forever. Open the file, edit, save, commit. The next deploy reflects the change.

**What edits cost:**

- **Title and body** — free. The graph and the URL are unaffected.
- **Slug (filename)** — costly. The URL changes; any external link to the old slug breaks. Avoid unless the slug genuinely became wrong.
- **Room (directory)** — costly. Both the URL and the work's room assignment change. Move only when the work has genuinely settled into a different atmosphere.
- **Facets** — free. The graph re-derives at build time.
- **Date** — sensitive. Changing a work's date affects ordering and visibility. Avoid unless the original date was wrong; do not back-date a fresh edit to surface it again.
- **Draft flag** — the explicit lifecycle move. Toggling from `draft: true` to omitted is *publishing*; toggling back is *unpublishing*. Both are legitimate. Unpublishing in production hides the work from visitors but keeps the file (and its history).

**Git history is the temporal record.** Every commit to a content file is dated, attributed, and viewable. `TRANSPARENCY.md`'s archaeological commitment names this as content; the future time-slider would surface it. For now, git is the record, and that is sufficient.

---

## Removing a Work

Deleting a content file removes the work from the site (and from the graph) on the next build. The git history retains it.

**Deletion is rare.** Works that no longer feel right are usually better marked `draft: true` than deleted. A draft is invisible to visitors but visible to Danny in dev; the work persists as something to return to. Outright deletion is for works that should never have been written, not works that are no longer on display.

If a deleted work was linked to from elsewhere, those wikilinks now fail to resolve, and the build will fail loudly. Either remove the linking references (in the linking work's body) or restore the deleted work. The build's loudness is the safety net here — there is no silent broken-link state.

---

## What Authoring Does *Not* Require

- **A publish button.** Saving a non-draft file is publishing.
- **A review step.** Danny is the only author and the only reviewer; the review happens in his head before the commit.
- **A staging environment.** `pnpm dev` is the preview; the deployed site is the public surface. There is no in-between.
- **A scheduling system.** Future dates schedule. There is no calendar UI.
- **A media uploader.** Images and audio, when they arrive, live in the repository alongside the works that reference them. `MEDIA_STRATEGY.md` (gap) will name the directory and processing approach.

This list is the absence of features that other content systems usually provide. Each absence is deliberate. The site is small enough that the workflow can be small.

---

## What This File Does Not Govern

- **The shape of a work as data.** That is `CONTENT_SCHEMA.md`.
- **What rooms and facets are.** That is `DOMAIN_MODEL.md`.
- **What links can be in a body.** That is `GRAPH_AND_LINKING.md`.
- **What the site says around a work.** That is `VOICE_AND_COPY.md`.
- **The deployment that turns a commit into a public site.** That is `DEPLOYMENT.md` (gap).

This file governs Danny's hands on the keyboard.

---

## Held: A Future Authoring Surface

If the practice of writing-in-the-repo eventually wears thin — if Danny wants to write on a phone, or in a system that doesn't put him in the editor — a future authoring surface could be added. It would always be optional (the file is still the source of truth) and it would always produce a markdown file with the schema this site already understands.

This is not a design today. It is named so that, if it earns its place, it knows where it sits: alongside the existing pipeline, not replacing it.

---

## Enforced in Code

Today, none of this requires any tooling beyond what is already in the repository.

- `pnpm dev` shows the in-progress site, drafts included.
- `pnpm build` produces the public site, drafts and future-dated works excluded.
- `pnpm test` runs the test suite (which does not yet include content tests, because no content yet exists).
- The content loader (per `CONTENT_SCHEMA.md`) validates frontmatter and halts the build on parse or validation errors.

When the first work is written, the dev loop above is the entire workflow. No new commands, no new files, no new directories beyond `src/content/` itself. The simplicity of authoring is the practice, not the byproduct.
