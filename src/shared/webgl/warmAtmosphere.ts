// The atmosphere's renderer, fetched ahead of the sky when the visitor
// reaches for it — the Foyer's look-up pull, the "Look up" link under
// the pointer — so a committed look-up arrives already lit, in one
// substrate, rather than the chart first and the weather a breath
// later. The firmament hook (hooks/useWebGLFirmament.ts) loads through
// the same door, and mounts at once when the door was opened ahead.
// Never warmed by arrival itself, and never where the atmosphere would
// not render at all (PERFORMANCE_BUDGET.md §"The Sky's Lazy Layers").
// Small on purpose: the Foyer imports this, not the sky.

import type * as Renderer from './atmosphereRenderer';

type RendererModule = typeof Renderer;

// A Map rather than a reassigned binding, so the memo needs no
// mutation the FP rules refuse.
const warmed = new Map<'renderer', Promise<RendererModule>>();

/** Whether the WebGL atmosphere should render at all: the perf probe's
 *  `?atmosphere=off`, Save-Data, and no document at all each say no. */
export function shouldRenderWebGL(): boolean {
  if (globalThis.window === undefined || typeof document === 'undefined') return false;
  // The perf probe's deterministic knob — CI measures the SVG
  // surface against calibrated thresholds; SwiftShader WebGL would
  // skew them. Visitors never carry this param.
  if (new URLSearchParams(globalThis.location.search).get('atmosphere') === 'off') return false;
  // Save-Data: the painted weather is exactly the weight to shed.
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return conn?.saveData !== true;
}

/** The renderer's module — fetched once, shared by every caller. */
export function loadAtmosphereRenderer(): Promise<RendererModule> {
  const loading = warmed.get('renderer') ?? import('./atmosphereRenderer');
  warmed.set('renderer', loading);
  return loading;
}

/** True once the renderer has been asked for ahead of a mount. */
export function atmosphereWarmed(): boolean {
  return warmed.has('renderer');
}

export function warmAtmosphere(): void {
  if (!shouldRenderWebGL()) return;
  void loadAtmosphereRenderer();
}
