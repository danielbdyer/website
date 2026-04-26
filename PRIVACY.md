# Privacy

The site's posture toward visitor data is small and declared. A static content site has very little to collect; this file names what it does not collect, what it does collect, and on what terms.

Privacy is a threshold concern — one of the ways the house meets the world. It sits alongside `ACCESSIBILITY.md`, `SECURITY.md` (gap), and `PERFORMANCE_BUDGET.md` as a boundary the site holds deliberately.

---

## What the Site Does Not Collect

- **No personal data.** No forms, no accounts, no logins. Nothing that asks a visitor for information.
- **No third-party trackers.** No Google Analytics, Facebook Pixel, advertising networks, or behavioral profiling tools.
- **No cookies**, with one exception: a single `localStorage` entry (`theme`) holding the visitor's light/dark preference. It is not a cookie in the RFC sense; it does not leave the device.
- **No fingerprinting.** No canvas, audio, or behavioral fingerprinting techniques.
- **No session replay.** No Hotjar, FullStory, or similar observational tools.

This is a commitment, not a current-state description. The absence of these things is a choice.

---

## What the Site Collects

**Hosting access logs.** A request to the static-asset host generates the standard HTTP request line (IP, user-agent, referer, URL). Retention and access live with the host (Cloudflare); see Cloudflare's documented log retention.

**Cloudflare Web Analytics.** A small async beacon (`static.cloudflareinsights.com/beacon.min.js`) ships in the production build when `VITE_CLOUDFLARE_ANALYTICS_TOKEN` is set, and reports Core Web Vitals (CLS, INP, LCP, FCP, TTFB) plus pageviews and referrers to Cloudflare's analytics endpoint. The provider was chosen because it satisfies every commitment named below by design — see [Cloudflare Web Analytics privacy policy](https://www.cloudflare.com/web-analytics/) for the upstream attestations. The dev build (`pnpm dev`, any build without the env var) ships no beacon at all; the dev console logs Web Vitals locally for authoring visibility, and nothing leaves the device.

### Web Vitals + pageview commitments

- **Aggregate only.** Metrics (CLS, INP, LCP, FCP, TTFB) and pageviews arrive as anonymous numeric values. No visitor identifier accompanies them. The provider sees "an LCP reading occurred," not "visitor X's LCP reading occurred."
- **No cookies, no fingerprinting.** Cloudflare Web Analytics does not set cookies, does not use device fingerprinting, and does not correlate visitors across sessions or across sites.
- **No IP retention beyond the request.** Cloudflare receives the IP as part of the HTTP request (necessary to deliver the beacon's response), does not store it associated with the metric, and does not expose it in the analytics dashboard.
- **No cross-site correlation.** The token scopes the data to this site. Cloudflare does not assemble a profile across the other properties they analyze.

### Consent

Because the data collected is aggregate and non-identifying, consent interfaces (cookie banners, Do-Not-Track modals) are not required under GDPR Recital 46 and similar frameworks that exempt strictly-necessary, privacy-respecting measurement. The site does not display a consent banner for Web Analytics.

If a future requirement changes this calculus — e.g., a jurisdiction requires consent even for anonymous measurement — the beacon will gain a consent gate before it loads. Until then, the beacon ships unconditionally in production.

---

## Referer Preservation

External links from works preserve the `Referer` header by default. If a work links to an external site, that site learns the visitor came from a page on this site. This is standard web behavior.

If Danny wants a link to not leak the referer, the authored link can carry `rel="noreferrer"`. The site does not apply this blanket-wise because the referer is often helpful context for the destination.

---

## Fonts

Typography (Literata, Newsreader) is self-hosted via `@fontsource-variable/literata` and `@fontsource-variable/newsreader`. The font files are bundled with the site and served from the same origin as every other asset; there is no third-party font request and no IP or user-agent disclosed to Google or any other font CDN.

The fontsource CSS emits per-subset `@font-face` rules with `unicode-range`, so an English-only page downloads only the latin and (if needed) latin-ext subsets. Cyrillic, Greek, and Vietnamese font files are present in the build output but are never fetched unless a rendered character requires them.

---

## Children

The site does not target children and does not knowingly collect data from anyone under 13. If Danny writes work explicitly for or about children, this file should be revisited.

---

## Changes to This File

Every substantive change to the site's privacy posture lives in git history on this file. The archaeological commitment in `TRANSPARENCY.md` applies: visitors (and future Danny) can see what the site has committed to and when.

---

## What This File Does Not Govern

- **Security.** Threat model, vulnerability posture, CSP headers — held in `SECURITY.md` (gap).
- **Analytics implementation.** Which provider, how wired — `DEPLOYMENT.md` (gap).
- **Content licensing.** Whether works can be copied, attributed, translated — a content concern, not a privacy concern.

---

## Enforced in Code

- `src/shared/seo/web-vitals.ts` — dev-only console logging of Web Vitals. Production telemetry comes from Cloudflare Web Analytics (the beacon shipped by `RootDocument` in `src/app/routes/__root.tsx`), so this file does not double-count.
- `src/app/routes/__root.tsx` — the Cloudflare beacon `<script>` is gated on `VITE_CLOUDFLARE_ANALYTICS_TOKEN`. If the env var is absent, no beacon ships. The token lives in deploy-time environment configuration; it is not committed to the repo.
- `src/app/providers/theme-store.ts` — the sole `localStorage` writer. Writes only `theme: 'light' | 'dark'`.

If any future code adds a third-party script, an analytics beacon, or a storage write of any kind, this file must be updated first.
