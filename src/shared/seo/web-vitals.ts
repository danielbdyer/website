import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Web Vitals reporter — captures Core Web Vitals (CLS, INP, LCP) plus
// supporting metrics (FCP, TTFB) as the visitor interacts with the site.
// PERFORMANCE_BUDGET.md names the targets these metrics are measured
// against.
//
// In development, metrics log to the console so Danny can see them
// during authoring. In production, they will be forwarded to a
// privacy-respecting analytics provider — DEPLOYMENT.md owns that
// wiring, and PRIVACY.md names the commitments the forwarding must
// honor (aggregate only, no visitor identifier, no IP retention,
// no cross-site correlation).

function logMetric(metric: Metric) {
  if (import.meta.env.DEV) {
    console.info(`[web-vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
  // Production forwarding hook goes here when DEPLOYMENT wires a provider.
  // Before adding one, re-read PRIVACY.md's Web Vitals commitments.
}

export function reportWebVitals() {
  onCLS(logMetric);
  onFCP(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
}
