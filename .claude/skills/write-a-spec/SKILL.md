---
name: write-a-spec
description: Use when adding a new specification file to the repo, or when meaningfully updating an existing one. Walks the site's conventions for spec-as-agentic-interface and spec-as-published-content, the reading-order graph, and the voice of the site speaking about itself.
---

# Write or Update a Specification

The `.md` files in this repository are not documentation. They are the site's definition — the deterministic interfaces through which intent enters the system. Specs live two lives simultaneously: **as agentic interface** (instructing agents that build) and **as published content** (a visible stratum of the site itself). See `TRANSPARENCY.md` for the full commitment.

This skill walks the conventions for writing or updating a spec well.

## Before you write — read the entry sequence

Every agent session begins with the reading order. For spec work specifically, the entry sequence is essential:

1. `CLAUDE.md` — how to *be* here. The practice of spanda, the philosophy of enough, Danny's voice.
2. `MEDIUM.md` — what a webpage is, what the agentic surface is.
3. `TRANSPARENCY.md` — the site publishes its own making. Your spec will be read by visitors too.
4. `SPECIFICATION_MAP.md` — the map. Where your spec fits in the six-layer structure.

Do not skip these. A spec written without the felt sense is a spec the site will eventually reject.

## Choose the layer

`SPECIFICATION_MAP.md` organizes specs into six layers (extending the house metaphor):

| Layer | What lives here |
|---|---|
| **Entry sequence** | `CLAUDE.md`, `MEDIUM.md`, `TRANSPARENCY.md`, `SPECIFICATION_MAP.md` — fixed, rarely touched. |
| **Inside** | What the rooms hold: `DOMAIN_MODEL`, `CONTENT_SCHEMA`, `GRAPH_AND_LINKING`, `CONTENT_AUTHORING`. |
| **Outside** | The rooms themselves: `DESIGN_SYSTEM`, `INTERACTION_DESIGN`, `VOICE_AND_COPY`, `INFORMATION_ARCHITECTURE`. |
| **The house** | Where inside and outside converge: `REACT_NORTH_STAR`. |
| **The threshold** | The house meeting the world: `PERFORMANCE_BUDGET`, `ACCESSIBILITY`, `RESPONSIVE_STRATEGY`, `SEO_AND_META`, `SECURITY` (gap). |
| **The grounds** | What supports the house: `DEPLOYMENT` (gap), `DEPENDENCY_POLICY` (gap), `TESTING_STRATEGY` (gap), `MEDIA_STRATEGY` (gap), `EVOLUTION_PROTOCOL` (gap). |

Place the new spec by concern, not by fit. If a spec straddles layers, pick the one where its dependencies point, and cross-reference.

## Voice and tone

Specs read as the site's voice speaking about itself — quiet, unhurried, definitive on commitments, open about what is held. Register guidance (mostly from `VOICE_AND_COPY.md`'s conventions, which also govern chrome but apply here with more rigor):

- **Declarative, not hedging.** "The site commits to X." not "The site probably should X."
- **Name what is held** rather than pretending it's decided. "Held in backlog" and "held until" are the site's patterns.
- **Em-dashes for parenthetical rhythm** (rare, deliberate).
- **No exclamation points, no marketing voice, no first-person plural** ("we think"), no second-person instruction.
- **Prose over bullets** for rationale; bullets for enumerable lists.
- **Short, specific opening paragraph** that names what the file does and — importantly — what it does *not* govern.

## Structure

Most specs in this repo share a structure:

1. **Opening paragraph** — what this file defines, what it is downstream of, what it does not govern.
2. **Core content** — the substance, organized by concern. Use `##` headings; never skip levels.
3. **Sections for commitments, invariants, declinations, held concerns.** The site's language distinguishes these:
   - *Commitments*: what the site will do.
   - *Invariants*: what the site must hold true always.
   - *Declinations*: what the site deliberately refuses.
   - *Held concerns*: what is named but not yet committed.
4. **"What This File Does Not Govern"** — a boundary section listing adjacent specs that own related concerns. This is how files stay honest about scope.
5. **"Enforced in Code"** — what is actually wired today, and what remains in `BACKLOG.md`. Keeps the spec honest about reality.

## Cross-referencing

- Always link to adjacent specs in backtick-wrapped names: `DESIGN_SYSTEM.md`.
- When a decision lives in another spec, link rather than duplicate. Duplication drifts; references don't.
- When a spec defers to another, say so explicitly: "Deferred to `GRAPH_AND_LINKING.md`."

## Updating the spec map

Every new spec gets two entries in `SPECIFICATION_MAP.md`:

1. **A prose entry** in the appropriate layer section, following the pattern of existing entries: name | layer | state | depends-on, then a short paragraph.
2. **A row in the "Current State" table** at the bottom, with a short note on what's done and what's held.

Existing specs that change meaningfully should have their map entries updated too.

## Held questions, not dropped questions

If the spec raises a concern that it doesn't resolve, *name it as held* rather than hoping the reader infers. Use phrasings like:

- "Held in `BACKLOG.md` with trigger X."
- "Deferred to `Y.md` (gap)."
- "Named so future work knows where to aim."

Silent gaps rot. Named gaps age well.

## After writing

- Update `SPECIFICATION_MAP.md` (prose + table).
- Run `pnpm exec tsc -b` and `pnpm test --run` if the spec names code that should exist (nothing should have broken, but verify).
- Consider whether the new spec changes any existing spec's scope — if so, update those too.
- Commit with a message that names the spec's purpose and the layer it sits in.

## Spec references

- `CLAUDE.md` — the site's soul and voice.
- `MEDIUM.md` — the medium (including the agentic surface).
- `TRANSPARENCY.md` — specs as dual-life content.
- `SPECIFICATION_MAP.md` — the map, the six layers, the reading order.
- `VOICE_AND_COPY.md` — microcopy conventions that inform the register.
