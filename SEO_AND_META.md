# SEO and Meta

The site presents itself to machines the way a house presents itself from the street: legibly, honestly, without performing. This file specifies the metadata the site emits for search engines, social cards, and semantic crawlers — title and description per page, Open Graph and Twitter cards for shared links, and Schema.org JSON-LD for structured understanding.

The commitment: **every page carries an accurate self-description for machines to consume.** Not tuned for ranking; tuned for truth. When a work appears in a search result or a social preview, what a reader sees should be what the work actually is.

---

## Site-Level Meta

These are declared in `index.html` and apply to every page:

- **Favicon:** `/favicon.svg` — a single SVG that adapts via `@media (prefers-color-scheme: dark)` so the Diamond mark reads correctly in both light and dark browser chrome.
- **Apple touch icon:** `/apple-touch-icon.svg` — 180×180 with the umber ground as background (iOS ignores transparency). The Diamond sits centered on the paper tone.
- **Theme color:** two `<meta name="theme-color">` tags with `media` attributes for light and dark. Mobile browser chrome (Safari's URL bar, Android's status bar) picks up the matching tone — the chrome becomes paper on light mode, the deep umber on dark.
- **Site-level description:** a single `<meta name="description">` in `index.html`. Per-page descriptions will override once the SSG pivot makes per-page `<title>` and meta straightforward.
- **Language:** `<html lang="en">`. Remains static until the site carries non-English content.

## Per-Page Meta

Every route emits at minimum:

- `<title>` — the page title
- `<meta name="description">` — a one-sentence summary
- `<link rel="canonical">` — the absolute URL for this page
- Open Graph tags: `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`
- Twitter card tags: `twitter:card` (summary or summary_large_image), `twitter:title`, `twitter:description`

### Per-surface patterns

| Surface | Title | Description |
|---|---|---|
| Foyer (`/`) | `Danny Dyer` | A single line naming who Danny is and what the site holds. |
| Room landing (`/{room}`) | `{Room} — Danny Dyer` | The room's own description, adapted for brevity. |
| Work (`/{room}/{slug}`) | `{Work Title} — Danny Dyer` | The work's `summary` field, or a truncated excerpt of its body if no summary. |
| Facet (`/facet/{facet}`) | `{Facet} — Danny Dyer` | The facet's description from `DOMAIN_MODEL.md`. |
| 404 | `Not Found — Danny Dyer` | A short, non-specific fallback. |

The site's name (`Danny Dyer`) always appears as the suffix. This is how the browser tab communicates "you're on Danny's site" even when the title's leading text is a specific work.

---

## Schema.org JSON-LD

Every page emits one or more structured-data blocks as `<script type="application/ld+json">`. Each block is a valid Schema.org graph.

### WebSite (every page)

A single `WebSite` block identifies the site itself:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Danny Dyer",
  "url": "https://danielbdyer.com",
  "author": { "@type": "Person", "name": "Danny Dyer" }
}
```

### Person (every page)

Danny is the author of the site; the `Person` schema anchors that identity:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Danny Dyer",
  "url": "https://danielbdyer.com"
}
```

`sameAs`, `jobTitle`, `image`, and similar fields are left blank until real values exist; a stubbed placeholder is worse than an omission.

### CreativeWork (per work page)

Each work emits a schema matching its content type. The mapping:

| `work.type` | Schema.org `@type` |
|---|---|
| `poem` | `Poem` |
| `essay` | `Article` |
| `case-study` | `Article` |
| `note` | `Article` |
| (unset) | `CreativeWork` |

Every work schema carries `headline`, `name`, `datePublished`, `author` (a nested `Person`), `url`, and — when present — `description` (from `summary`) and `keywords` (from `facets`, joined as a comma-separated list).

### BreadcrumbList (per work page)

Work pages emit a breadcrumb trail from home → room → work:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://danielbdyer.com" },
    { "@type": "ListItem", "position": 2, "name": "The Garden", "item": "https://danielbdyer.com/garden" },
    { "@type": "ListItem", "position": 3, "name": "A Poem", "item": "https://danielbdyer.com/garden/a-poem" }
  ]
}
```

The visitor-facing "Foyer" is represented as "Home" in structured data — the breadcrumb is machine-facing and uses the more legible noun. This mirrors the site's own convention (`VOICE_AND_COPY.md`) that "Foyer" is internal vocabulary.

---

## Open Graph Images

OG images are not yet generated. When they arrive:

- Each work gets a default OG image generated at build time from the title, date, and facets rendered over the umber ground with the signature Diamond mark.
- Generation happens via a build-time Canvas/Satori-style pipeline that produces a 1200×630 PNG per work.
- The image URL is absolute and stable once generated.

Held in the backlog. Until then, a single static fallback image (the geometric figure over the paper ground) is referenced for every page.

---

## Sitemap

A `sitemap.xml` is generated at build time listing every published work, every room, every facet page, and the Foyer. Draft and future-dated works are excluded (the same filter `CONTENT_SCHEMA.md`'s loader applies to production).

The sitemap is served at `/sitemap.xml` and declared in `robots.txt`. Both are generated at build time from the same `Graph` object the site uses for rendering.

Held in the backlog until the first work exists.

---

## RSS / Atom Feeds

A poet-essayist's readers want to subscribe. Each room emits a feed at `/{room}/feed.xml` with the room's published works in reverse chronological order. A site-wide feed at `/feed.xml` aggregates all rooms.

The feeds carry full work content, not just summaries. A subscriber reading in their feed reader should see the full work without needing to click through.

Held in the backlog until the first work exists.

---

## `robots.txt`

Minimal:

```
User-agent: *
Allow: /
Sitemap: https://danielbdyer.com/sitemap.xml
```

No disallowed paths. The site has nothing to hide from crawlers; the published site is the whole site.

---

## What This File Does Not Govern

- **Analytics.** Real User Monitoring (Web Vitals collection) and privacy-respecting analytics belong in `DEPLOYMENT.md` (gap) or their own concern. This file governs only machine-readable metadata.
- **Internal search.** Not yet a concern. If built, a Schema.org `SearchAction` could be added to the `WebSite` schema at that time.
- **Performance of meta delivery.** The cost of generating and emitting meta tags is a `PERFORMANCE_BUDGET.md` concern — minimal today, more significant when the SSG pivot lands.

---

## Enforced in Code

Today:

- `src/shared/seo/schema-org.ts` — type-safe JSON-LD builders for `WebSite`, `Person`, work schemas, and `BreadcrumbList`.
- `src/shared/seo/JsonLd.tsx` — a component that renders a `<script type="application/ld+json">` tag.
- `__root.tsx` emits `WebSite` and `Person` schemas on every page.
- Work pages emit a work-specific `CreativeWork`-family schema and a `BreadcrumbList`.

Held in backlog:

- Per-page title and meta descriptions
- Open Graph image generation
- Sitemap generation
- RSS/Atom feeds
- `robots.txt`

The above will mostly arrive with the SSG pivot, because build-time generation of meta-per-route is what the pivot enables. Running them on the current SPA is possible but awkward; doing them correctly is cheaper on the other side of the pivot.
