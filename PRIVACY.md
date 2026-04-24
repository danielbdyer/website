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

**Today: nothing beyond what the hosting provider's access logs capture.** A request to the server generates the standard HTTP request line (IP, user-agent, referer, URL). Retention and access to those logs is `DEPLOYMENT.md`'s concern when it exists.

**Held: Web Vitals.** The `web-vitals` library is wired in `src/shared/seo/web-vitals.ts`. In development, it logs metrics to the console. In production, it would forward metrics to an analytics provider — but no forwarding is wired today. When a provider is chosen (in `DEPLOYMENT.md`), the following commitments apply.

### Web Vitals commitments (when forwarding is enabled)

- **Aggregate only.** Metrics (CLS, INP, LCP, FCP, TTFB) are forwarded as anonymous numeric values. No visitor identifier accompanies them. The provider sees "here is an LCP reading," not "here is visitor X's LCP reading."
- **No IP retention.** The provider (when selected) must either not receive the IP or anonymize it at ingest. Providers that retain identifiable IPs are declined.
- **No cross-site correlation.** The provider is scoped to this site only. No shared pixel, no third-party beacon, no network that correlates this visitor's activity across other properties.
- **Privacy-respecting providers only.** Candidates that fit: Plausible, Fathom, Umami (self-hosted), Cloudflare Web Analytics. Candidates that do not fit: Google Analytics, Meta Pixel, Mixpanel without strict configuration.

### Consent

Because the data collected is aggregate and non-identifying, consent interfaces (cookie banners, Do-Not-Track modals) are not required under GDPR Recital 46 and similar frameworks that exempt strictly-necessary, privacy-respecting measurement. The site does not intend to display a consent banner for Web Vitals.

If a future requirement changes this calculus — e.g., a jurisdiction requires consent even for anonymous measurement — the `web-vitals.ts` reporter will gain a consent check before `reportWebVitals()` fires. Until then, the reporter runs unconditionally in production.

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

- `src/shared/seo/web-vitals.ts` — the reporter. Today: dev-only console logging. When production forwarding wires, this file is where the commitments above get enforced (no identifiers in payload, provider choice gated on spec).
- `src/app/providers/theme-store.ts` — the sole `localStorage` writer. Writes only `theme: 'light' | 'dark'`.

If any future code adds a third-party script, an analytics beacon, or a storage write of any kind, this file must be updated first.
