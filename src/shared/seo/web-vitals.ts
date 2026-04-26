import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Dev-only Web Vitals logger. Production telemetry comes from
// Cloudflare Web Analytics (the beacon shipped by RootDocument when
// VITE_CLOUDFLARE_ANALYTICS_TOKEN is present at build time), which
// captures the same metrics server-side and aggregates them in the
// Cloudflare dashboard. Keeping the in-code reporter for dev gives
// Danny per-metric visibility while authoring without double-counting
// in production.
//
// PERFORMANCE_BUDGET.md names the targets these metrics are measured
// against. PRIVACY.md names the commitments the production telemetry
// must honor (aggregate only, no visitor identifier, no IP retention,
// no cross-site correlation) — Cloudflare Web Analytics complies by
// design (no cookies, no PII, no fingerprinting).

function logMetric(metric: Metric) {
  if (import.meta.env.DEV) {
    console.info(`[web-vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
}

export function reportWebVitals() {
  if (!import.meta.env.DEV) return;
  onCLS(logMetric);
  onFCP(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
}
