---
name: evolve-domain
description: Use when changing the site's ontology — proposing a new facet, adding a room, making modes concrete, changing content types, or altering invariants in DOMAIN_MODEL.md. A domain change is a real change and cascades through types, the content schema, and possibly the design system.
---

# Evolve the Domain

The site has strong commitments about what a room is, what a work is, what a facet is, what modes are. These are named in `DOMAIN_MODEL.md`. Changing them is legitimate but costly — the change cascades. This skill walks the cascade so nothing gets left behind.

## First principle — sit with it for a season

The heuristic in `DOMAIN_MODEL.md`: *"if something wants to be a facet, sit with it for a season before promoting it."* Domain changes should be rare and considered. If the change still feels right after time has passed, it earns the cascade. If the felt sense fades, the change was a passing want, not a structural need.

**Do not rush a domain change to unblock a single work or component.** Find a way to ship the work with the existing domain; revisit when a pattern emerges.

## Types of domain change

### Adding a facet (the most common case)

1. Update `DOMAIN_MODEL.md`'s facet table with the new name, lowercase, and one-line description.
2. Update `src/shared/types/common.ts` — add the facet to the `Facet` union.
3. Update `src/shared/content/schema.ts` — add to the `FACETS` tuple (Zod's `z.enum` reads from it).
4. If the new facet warrants an accent assignment, consider whether one of the held `--accent-warm/rose/violet/gold` evocations fits — but the default per `DESIGN_SYSTEM.md` is that accents stay vocabulary, not semantics. Don't assign unless the need is felt.
5. No existing works need updating — the new facet is optional on every work.

### Adding a room

Rare and big. Not a content decision — an expansion of what the site *is*.

1. Update `CLAUDE.md`'s house-metaphor prose with the new room's atmosphere.
2. Update `DOMAIN_MODEL.md`'s room table with purpose.
3. Update `src/shared/types/common.ts` — add to `Room` union.
4. Update `src/shared/content/schema.ts` — add to `ROOMS` tuple.
5. Create `src/content/{room}/` (or leave it absent until the first work arrives — the loader handles missing directories).
6. Create `src/app/routes/{room}.tsx` — landing page following the same shape as existing rooms.
7. Update `src/app/layout/Nav.tsx` `ROOMS` array — decide the order carefully (`INFORMATION_ARCHITECTURE.md` notes the current order is professional → poetic → reflective → aesthetic).
8. Update `ROOM_LABELS` and `ROOM_TO` maps in `src/shared/organisms/WorkView/WorkView.tsx` and `src/shared/seo/schema-org.ts`.
9. Update `INFORMATION_ARCHITECTURE.md` with the new room's landing intent.

### Making modes concrete

`DOMAIN_MODEL.md` holds modes (`devotion`, `play`) as architecturally absent. The trigger: *"can a mode be felt in existing works without being declared?"* If yes across enough works, a mode graduates. Steps:

1. Update `DOMAIN_MODEL.md` to change the mode's status from "held" to "modeled."
2. Add a `Mode` type to `src/shared/types/common.ts`.
3. Add an optional `mode` field to `workFrontmatterSchema` in `src/shared/content/schema.ts`.
4. Decide how modes appear in rendering — presentation-level, not content-level. Likely a small surface on `WorkView` or a lens on the facet page.

### Changing content types

The four are `poem`, `essay`, `case-study`, `note`. Adding a fifth (e.g., `dialogue`, `letter`) is the same shape as adding a facet:

1. Update `DOMAIN_MODEL.md` and `CONTENT_SCHEMA.md` descriptions.
2. Update `TYPES` tuple in `src/shared/content/schema.ts`.
3. Update `WORK_TYPE_TO_SCHEMA` in `src/shared/seo/schema-org.ts` to map the new type to a Schema.org type.
4. Consider per-type prose rendering — held in the backlog as a general concern; new types sharpen that need.

## After any domain change

- `pnpm exec tsc -b` — types must compile.
- `pnpm test --run` — existing tests must pass.
- `pnpm exec eslint src/` — no boundary regressions.
- Update `SPECIFICATION_MAP.md` if the change affects how specs relate.

## Spec references

- `DOMAIN_MODEL.md` — the ontology and its invariants.
- `CONTENT_SCHEMA.md` — how the ontology is encoded as data.
- `CLAUDE.md` — the soul of what rooms and facets mean.
- `GRAPH_AND_LINKING.md` — if the change affects linking semantics.
- `DESIGN_SYSTEM.md` — if the change affects visual vocabulary (accent assignments).
