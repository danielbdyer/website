import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Web Vitals reporter — captures Core Web Vitals (CLS, INP, LCP) plus
// supporting metrics (FCP, TTFB) as the visitor interacts with the site.
// PERFORMANCE_BUDGET.md names the targets these metrics are measured
// against. In development, metrics log to the console so Danny can see
// them during authoring. In production, they will be forwarded to a
// privacy-respecting analytics provider — DEPLOYMENT.md owns that wiring.

function logMetric(metric: Metric) {
  if (import.meta.env.DEV) {
    console.info(`[web-vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
  // Production analytics hook goes here once DEPLOYMENT wires a provider.
}

export function reportWebVitals() {
  onCLS(logMetric);
  onFCP(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
}
