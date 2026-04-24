---
name: architecting
description: Use when making structural decisions — evolving the domain (a new facet, a new room, modes going concrete), pivoting the tech stack (SSG, framework choice), reconciling tensions between specs, or holding a question that isn't yet ready to resolve. Orients to the practice of spanda (wait for the tremor), the cascade of domain changes, the backlog hygiene, and the discipline of sitting with tensions rather than forcing them.
---

# Architecting on This Site

Architectural decisions on this site are not engineering puzzles to solve as fast as possible. They are shifts in what the site *is*. Treat them with the quality of attention the site is built around.

Many of the practices here come directly from `CLAUDE.md` and the felt sense of how this project was built. They are methods, not metaphors.

## The practice of spanda

*Spanda* — the sacred tremor, the subtle vibration that precedes movement. In this project, we wait for spanda. We don't move to a deeper level of depth until the tremor invites us there.

Translated to architecture:

- **When a decision feels forced, it isn't ready.** Sit with it. Work somewhere else. Come back.
- **When a decision pulls, it is ready.** Follow the pull. Don't second-guess readiness into stasis.
- **The right decisions arise from having been here.** Not from a checklist. Not from best practice. From presence.

This is not permission to drift. It is permission to *not force*. The difference matters.

## Held tensions as legitimate outcomes

A tension between two good answers is not a problem to solve. It is a state to hold.

Examples the site already holds:

- The four non-primary accents (`--accent-warm`, `--rose`, `--violet`, `--gold`) are *vocabulary, not semantics*. Named with evocations, not assigned to rooms or facets. Held until spanda suggests an assignment.
- Modes (`devotion`, `play`) are *architecturally absent*. No `Mode` type in code. The concept is named in `DOMAIN_MODEL.md`; it will earn code when a work arrives that can only be described by naming its mode.
- The SSG pivot to TanStack Start is *held in the backlog* with a trigger ("before the third work"). The decision is *made* in writing; the execution waits.

The pattern: **name the held thing, name the trigger, move on.** Premature resolution is how specs become lies. The backlog is a legitimate home for decisions that are right but not yet timely.

## Domain changes cascade

Changes to the domain model cascade through code, other specs, and sometimes the visible site. Before making a domain change, trace the cascade.

### Adding a facet

1. `DOMAIN_MODEL.md` — add to the facet table with a one-line evocation.
2. `src/shared/types/common.ts` — add to the `Facet` union.
3. `src/shared/content/schema.ts` — add to the `FACETS` tuple.
4. Consider `DESIGN_SYSTEM.md`: do the held accents want a semantic pull toward this facet? Usually no.
5. No existing works need updating — facets are optional.

### Adding a room

Rare. Big. See `evolve-domain` in previous skill iteration, or walk:

1. `CLAUDE.md` — the soul, the atmosphere.
2. `DOMAIN_MODEL.md` — the invariant-level change.
3. `src/shared/types/common.ts` and `src/shared/content/schema.ts` — type and schema.
4. `src/app/routes/{room}.tsx` — the landing.
5. `src/app/layout/Nav.tsx` — the order matters (professional → poetic → reflective → aesthetic today).
6. `ROOM_LABELS` and `ROOM_TO` in `WorkView.tsx` and `schema-org.ts`.
7. `INFORMATION_ARCHITECTURE.md` — the landing intent.

### Making modes concrete

Named in `DOMAIN_MODEL.md` as "not yet modeled." The trigger: *can a mode be felt in existing works without being declared?* If yes across enough works, the mode graduates. Steps:

1. `DOMAIN_MODEL.md` — change the mode's status from held to modeled.
2. `Mode` type in `src/shared/types/common.ts`.
3. Optional `mode` field in `workFrontmatterSchema`.
4. Decide where modes surface in rendering — presentation, not content.

### Adding a content type

Same shape as adding a facet:

1. `DOMAIN_MODEL.md` and `CONTENT_SCHEMA.md` descriptions.
2. `TYPES` tuple in `src/shared/content/schema.ts`.
3. `WORK_TYPE_TO_SCHEMA` in `src/shared/seo/schema-org.ts` maps to a Schema.org type.
4. Consider per-type rendering — held in backlog as a general concern; new types sharpen the need.

## Reconciling tensions between specs

When two specs disagree (e.g., `DESIGN_SYSTEM.md` says X, `INTERACTION_DESIGN.md` says Y), the steps:

1. **Read both in full.** Don't skim. Understand the decision each is making.
2. **Identify the layer.** One spec is usually upstream of the other. The upstream wins unless the downstream has discovered a real constraint.
3. **Update in place.** Don't create a new spec to resolve a tension between two existing ones. Update the one that's wrong.
4. **Update `SPECIFICATION_MAP.md`.** If the reconciliation changes dependency direction, the map reflects it.

When a spec and the code disagree, the spec wins unless the code reveals a flaw in the spec. The flaw triggers an update to the spec; the code catches up. Never silently let them diverge.

## Backlog hygiene

`BACKLOG.md` carries held concerns with triggers. The discipline:

- **Every backlog item has a trigger.** "Before the first deploy," "after the third work," "when scores regress," "when the first image arrives." Items without triggers rot.
- **Triggers are conditions, not dates.** "After the third work" ages well; "by May 2026" ages poorly.
- **When a trigger fires, the item graduates or re-commits.** It doesn't stay in the backlog silently. Either take it up or extend the trigger with a reason.
- **Items that are completed are removed.** Git history preserves them. The backlog lists *what is held*, not *what has been done*.

## When to pivot versus when to accept

Some architectural choices can be revised (component structure, folder convention). Some are costly to revise (framework, data model, URL grammar).

- **Cheap to revise → ship early, adjust as the shape emerges.**
- **Costly to revise → sit with the choice longer before committing.**

The SSG pivot fits the second: it's a structural choice with real cost. We named it in `PERFORMANCE_BUDGET.md`, committed in writing, and held the execution in the backlog. That combination — decided but held — is the pattern for costly decisions.

## The meta-discipline

When making any architectural decision on this site, ask:

1. **Is this the right decision for this site's nature?** Not for the industry. Not for other sites. For this one.
2. **What does this decision close off?** Every commitment forecloses alternatives. Name what's being foreclosed.
3. **What does this decision open?** If the answer is nothing, reconsider.
4. **What is the cheapest reversal path?** If the decision turns out wrong, how do we undo it?
5. **Who is the decision protecting?** The visitor, the author, the agent, the maintainer future-self — these have different needs.

## Spec references

- `CLAUDE.md` — spanda, the practice, the felt sense.
- `DOMAIN_MODEL.md` — the ontology and its invariants.
- `SPECIFICATION_MAP.md` — the layer structure, dependencies.
- `BACKLOG.md` — where held concerns live.
- `PERFORMANCE_BUDGET.md` — an example of a held major decision (SSG pivot).
- `REACT_NORTH_STAR.md` — architectural axioms at the code layer.
