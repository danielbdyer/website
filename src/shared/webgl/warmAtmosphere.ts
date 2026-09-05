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
import type { AtmosphereHandles } from './atmosphereRenderer';
import type { AtmosphericScene } from './atmosphereScene';
import type { SkyPalette } from './palette';

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

// ── Prepared atmospheres ──────────────────────────────────────────
//
// Beyond the module: the context created and the programs compiled
// ahead, on a canvas that is not yet on the page, so that when the
// sky mounts the atmosphere is adopted rather than made — no context
// creation, no compile, no first-frame wait under the visitor's eye.
// Keyed by the scene's stars, so a prepared atmosphere is adopted
// only by the sky it was prepared for. One at a time: a second
// preparation for a different scene replaces the first.

export function sceneKeyOf(scene: AtmosphericScene): string {
  return scene.stars.map((star) => star.key).join('|');
}

interface Prepared {
  readonly key: string;
  readonly handles: Promise<AtmosphereHandles | null>;
}

const prepared = new Map<'atmosphere', Prepared>();

/** Create the atmosphere for a scene ahead of its mount. Idempotent
 *  for the same scene; a new scene replaces the old preparation. */
export function prepareAtmosphere(
  scene: AtmosphericScene,
  palette: SkyPalette,
  dpr: number,
): Promise<AtmosphereHandles | null> {
  const key = sceneKeyOf(scene);
  const existing = prepared.get('atmosphere');
  if (existing?.key === key) return existing.handles;
  const handles = loadAtmosphereRenderer().then(({ createAtmosphere }) =>
    createAtmosphere(scene, palette, dpr),
  );
  prepared.set('atmosphere', { key, handles });
  return handles;
}

/** Take the atmosphere prepared for this scene, if there is one — it
 *  is the mount's now, and no longer held here. Null otherwise. */
export function adoptAtmosphere(scene: AtmosphericScene): Promise<AtmosphereHandles | null> | null {
  const existing = prepared.get('atmosphere');
  if (existing?.key !== sceneKeyOf(scene)) return null;
  prepared.delete('atmosphere');
  return existing.handles;
}

export function warmAtmosphere(): void {
  if (!shouldRenderWebGL()) return;
  void loadAtmosphereRenderer();
}
