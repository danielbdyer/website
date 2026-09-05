// Synthesizable graph fixtures for the perf harness.
//
// The canonical test fixture (`canonicalSkyGraph`) has three stars
// and two threads — fine for behavior tests, useless for perf
// probing, where the surface only stresses the rasterizer when
// star count + thread count approach realistic densities.
//
// `buildHarnessGraph` deterministically synthesizes a graph with
// the given star count, distributed across the four sky rooms,
// with a realistic axis distribution so threads (shared-axis
// strokes) form at production density. Same input → same graph,
// so perf comparisons across runs are honest.

import type { Axis, ConstellationGraph, ConstellationNode, ConstellationEdge } from '@dbd/sky';

const ROOMS = ['studio', 'garden', 'study', 'salon'] as const;
type HarnessRoom = (typeof ROOMS)[number];

const HUES = ['warm', 'rose', 'violet', 'gold'] as const;
type HarnessHue = (typeof HUES)[number];

// The site's compass: the eight facets in bearing order, adjacent
// pairs sharing a hue, the second of each pair dotted — matches the
// host's facet-compass.ts and constellation.ts assignment exactly so
// the harness mirrors production, not invents new positions.
const FACET_AZIMUTH: readonly (readonly [string, number, HarnessHue, boolean])[] = [
  ['craft', 0, 'warm', false],
  ['body', 45, 'warm', true],
  ['beauty', 90, 'rose', false],
  ['language', 135, 'rose', true],
  ['consciousness', 180, 'violet', false],
  ['becoming', 225, 'violet', true],
  ['leadership', 270, 'gold', false],
  ['relation', 315, 'gold', true],
];

const RIM_THETA = 1.152;

const AXES: readonly Axis[] = FACET_AZIMUTH.map(([id, azimuthDeg, hue, dotted]) => {
  const phi = (azimuthDeg * Math.PI) / 180;
  return {
    id,
    name: id,
    azimuthDeg,
    hue,
    dotted,
    rim: {
      x: Math.sin(RIM_THETA) * Math.cos(phi),
      y: Math.sin(RIM_THETA) * Math.sin(phi),
      z: Math.cos(RIM_THETA),
    },
  };
});

const AXIS_IDS = AXES.map((axis) => axis.id);
const HUE_OF = new Map(AXES.map((axis) => [axis.id, axis.hue]));

// Each room occupies a 90° sector centered on its diagonal —
// matches the host's layout so the harness mirrors production
// positions, not invents new ones.
const ROOM_SECTOR_DEG: Record<HarnessRoom, number> = {
  studio: 225,
  salon: 315,
  garden: 135,
  study: 45,
};

// Deterministic small hash → in [0, 1). Same key → same value.
function hash01(input: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

// 2-D disk → unit hemisphere (matches sphere.ts diskToHemisphere
// but inlined here so the harness fixture stays self-contained).
function diskToHemisphere(
  radius: number,
  angleRad: number,
): { readonly x: number; readonly y: number; readonly z: number } {
  const x = radius * Math.cos(angleRad);
  const y = radius * Math.sin(angleRad);
  const zSq = 1 - x * x - y * y;
  const z = Math.sqrt(Math.max(0, zSq));
  return { x, y, z };
}

function axesForStar(key: string): readonly string[] {
  // Each star carries 2–4 axes, deterministically chosen.
  const seed = hash01(key);
  const count = 2 + Math.floor(seed * 3);
  const offset = Math.floor(seed * AXIS_IDS.length);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(AXIS_IDS[(offset + i) % AXIS_IDS.length]!);
  }
  return out;
}

/** Build a deterministic synthetic graph with `starCount` stars
 *  evenly distributed across the four sky rooms. Threads form
 *  organically wherever two stars share an axis. */
export function buildHarnessGraph(starCount: number): ConstellationGraph {
  const nodes: ConstellationNode[] = [];
  for (let i = 0; i < starCount; i += 1) {
    const room = ROOMS[i % ROOMS.length]!;
    const slug = `harness-${room}-${String(i).padStart(3, '0')}`;
    const key = `${room}/${slug}`;
    const seed = hash01(slug);
    // Sector center ± 40° spread, radius 0.3..0.85 → keeps stars
    // off the very rim and the very pole, where the projection
    // gets visually awkward.
    const angleDeg = ROOM_SECTOR_DEG[room] + (seed - 0.5) * 80;
    const radius = 0.3 + seed * 0.55;
    const angleRad = (angleDeg * Math.PI) / 180;
    const axes = axesForStar(slug);
    nodes.push({
      key,
      title: `Harness star ${String(i + 1)}`,
      kind: 'work',
      group: room,
      href: `/sky/${key}`,
      summary: null,
      date: new Date(2026, 0, 1 + i),
      axes,
      status: null,
      isPreview: false,
      angleDeg,
      radius,
      unitPosition: diskToHemisphere(radius, angleRad),
      hue: HUE_OF.get(axes[0]!) ?? 'gold',
      twinklePhase: seed * Math.PI * 2,
    });
  }

  // Edges: every pair of stars sharing an axis becomes a stroke of
  // that axis's figure. Production derives a spanning tree instead;
  // the harness keeps the denser mesh so it stresses the rasterizer.
  const edges: ConstellationEdge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      for (const axis of a.axes) {
        if (b.axes.includes(axis)) {
          edges.push({
            source: a.key,
            target: b.key,
            axis,
            hue: HUE_OF.get(axis) ?? 'gold',
            origin: 'emergent',
            predicate: null,
          });
          break;
        }
      }
    }
  }

  return { axes: AXES, nodes, edges };
}

/** A "production-realistic" preset. Sized to roughly match the
 *  star/thread density observed on the deployed /sky during the
 *  perf hunt (≈16 stars, ≈70 threads). */
export const productionScaleGraph: ConstellationGraph = buildHarnessGraph(16);

/** A heavier preset — useful for stress-testing future visual
 *  treatments before they ship. */
export const heavyGraph: ConstellationGraph = buildHarnessGraph(40);
