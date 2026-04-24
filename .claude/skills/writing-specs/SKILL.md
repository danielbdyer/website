---
name: writing-specs
description: Use when adding a new specification file or meaningfully updating an existing one. Orients to the entry sequence, the six-layer placement in the house metaphor, the site's self-speaking voice (distinct from Danny's voice and from the house's visitor-facing voice), the dual-life commitment (specs are both agentic interface and published content), and the discipline of naming held concerns rather than silently leaving gaps.
---

# Writing Specs

A specification file in this repository is not documentation. It is part of what the site *is*. `TRANSPARENCY.md` commits to specs living two lives simultaneously — as agentic interface (instructing the builder) and as published content (a visible stratum of the site itself). Both lives are present when you write.

The agent reads the spec to build. The visitor reads the spec to understand. Honor both without compromising either.

## Before you write, read

Even when updating a single spec, the entry sequence is mandatory:

1. `CLAUDE.md` — how to *be* here. The practice of spanda, the philosophy of enough, the felt sense.
2. `MEDIUM.md` — what the webpage is, what the agentic surface is. The eight dimensions the site inherits.
3. `TRANSPARENCY.md` — why specs are part of the site. The dual life. The strata.
4. `SPECIFICATION_MAP.md` — the map. The six layers. Where your spec fits.

You will feel the temptation to skip these when you're making a "small" edit. Skipping is how specs drift. The entry sequence takes five minutes to walk; spec drift takes days to repair.

## Place the spec in a layer

`SPECIFICATION_MAP.md` organizes specs into six layers:

| Layer | What lives here |
|---|---|
| **Entry sequence** | `CLAUDE`, `MEDIUM`, `TRANSPARENCY`, `SPECIFICATION_MAP` — fixed. |
| **Inside** | What the rooms hold: domain model, content schema, graph, authoring. |
| **Outside** | The rooms themselves: design, motion, voice, information architecture. |
| **The house** | Where inside and outside converge: `REACT_NORTH_STAR`. |
| **The threshold** | Meeting the world: performance, accessibility, responsive, SEO, security. |
| **The grounds** | What supports the house: deployment, dependencies, testing, media, evolution. |

Pick by concern, not by convenience. If a spec straddles layers, pick the layer where its dependencies point — and cross-reference the other.

## The voice a spec uses

This is the *house speaking about itself* — a different voice than Danny's inside a work, and a different voice than the visitor-facing chrome (`VOICE_AND_COPY.md`). Spec voice is:

- **Declarative, not hedging.** "The site commits to X." "A work lives in exactly one room." Not "We probably should..." or "You might consider..."
- **Unhurried but specific.** Sentences can breathe; ideas earn their space. But every paragraph pulls its weight.
- **Definitive on commitments, open about what's held.** "This is held until X" is a strong sentence. So is "This is decided." "This is maybe" is not.
- **Em-dashes for parenthetical rhythm** — rare, deliberate.
- **No exclamation points. No marketing voice. No first-person plural ("we think"). No second-person instruction.**
- **Prose for reasoning. Tables for enumeration. Lists where prose would be artificial.**

## Structure most specs share

1. **Opening paragraph** — what this file defines, what it sits downstream of, what it does *not* govern.
2. **Core content** — organized with `##` headings. Never skip levels.
3. **Commitments, invariants, declinations, held concerns** — the site's language distinguishes these:
   - *Commitments:* what the site will do.
   - *Invariants:* what must be true always.
   - *Declinations:* what the site deliberately refuses.
   - *Held:* what is named but not committed.
4. **"What This File Does Not Govern"** — boundary section listing adjacent specs that own related concerns. This is how scope stays honest.
5. **"Enforced in Code"** — what is wired today, what remains in `BACKLOG.md`. Keeps the spec honest about reality.

## Cross-referencing discipline

- Use backtick-wrapped names: `DESIGN_SYSTEM.md`.
- When a decision lives in another spec, link rather than duplicate. Duplication drifts; references don't.
- When a spec defers to another, say so explicitly: "Deferred to `GRAPH_AND_LINKING.md`."
- Don't invent new files casually. Check `SPECIFICATION_MAP.md` — the file may already exist, or it may be named there as a gap with defined dependencies.

## Held is better than hidden

If the spec raises a concern it doesn't resolve, name it as held:

- "Held in `BACKLOG.md` with trigger X."
- "Deferred to `Y.md` (gap)."
- "Named so future work knows where to aim."

A silent gap rots. A named gap ages well.

When a decision genuinely isn't yet made — "sit with it" is a legitimate answer. Write the spec around the undecided part; name the undecided part in the `What This File Does Not Yet Decide` section. Force-resolving because the file feels incomplete produces bad commitments.

## After writing

1. **Update `SPECIFICATION_MAP.md`** — both the prose entry in the layer section and the row in the Current State table.
2. **Verify nothing else broke.** `pnpm exec tsc -b`, `pnpm test --run`, `pnpm exec eslint src/`. A spec can't break the code, but the spec may name a code pattern — if so, verify the pattern is accurate.
3. **Check the draft bracket convention.** If your spec describes a surface that currently renders `[bracketed]` placeholder copy, make sure the spec accommodates that state rather than describing only the eventual copy.
4. **Commit with a message that names the spec's purpose and layer.**

## Writing about code the spec describes

When a spec describes code (e.g., `CONTENT_SCHEMA.md` describes the Zod schema in `src/shared/content/schema.ts`), the spec's *Enforced in Code* section names the file paths. If the spec changes, check that the code matches. If the code changes, check that the spec matches. When the two disagree, the spec is authoritative unless the code reveals a flaw — in which case the spec catches up.

## Spec references

- `CLAUDE.md` — the site's soul.
- `MEDIUM.md` — the medium and the agentic surface.
- `TRANSPARENCY.md` — the dual life of specs.
- `SPECIFICATION_MAP.md` — the map and the reading order.
- `VOICE_AND_COPY.md` — informs register (but its conventions govern visitor-facing chrome, not specs — spec voice is firmer).
