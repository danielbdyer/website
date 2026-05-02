// Synthesizable graph fixtures for the perf harness.
//
// The canonical test fixture (`canonicalSkyGraph`) has three stars
// and two threads — fine for behavior tests, useless for perf
// probing, where the surface only stresses the rasterizer when
// star count + thread count approach realistic densities.
//
// `buildHarnessGraph` deterministically synthesizes a graph with
// the given star count, distributed across the four sky rooms,
// with a realistic facet distribution so threads (shared-facet
// edges) form at production density. Same input → same graph,
// so perf comparisons across runs are honest.

import type { ConstellationGraph, ConstellationNode, ConstellationEdge } from '@dby/sky';

const ROOMS = ['studio', 'garden', 'study', 'salon'] as const;
type HarnessRoom = (typeof ROOMS)[number];

const FACETS = [
  'craft',
  'consciousness',
  'language',
  'leadership',
  'beauty',
  'becoming',
  'relation',
  'body',
] as const;
type HarnessFacet = (typeof FACETS)[number];

const HUES = ['warm', 'rose', 'violet', 'gold'] as const;
type HarnessHue = (typeof HUES)[number];

// Each room occupies a 90° sector centered on its diagonal —
// matches the host's content/constellation.ts layout exactly so
// the harness mirrors production positions, not invents new ones.
const ROOM_SECTOR_DEG: Record<HarnessRoom, number> = {
  studio: 225,
  salon: 315,
  garden: 135,
  study: 45,
};

// Deterministic small hash → in [0, 1). Same slug → same value.
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

const FACET_HUES: Readonly<Record<HarnessFacet, HarnessHue>> = {
  craft: 'warm',
  body: 'warm',
  beauty: 'rose',
  language: 'rose',
  consciousness: 'violet',
  becoming: 'violet',
  leadership: 'gold',
  relation: 'gold',
};

function facetsForStar(slug: string): readonly HarnessFacet[] {
  // Each star carries 2–4 facets, deterministically chosen.
  const seed = hash01(slug);
  const count = 2 + Math.floor(seed * 3);
  const offset = Math.floor(seed * FACETS.length);
  const out: HarnessFacet[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(FACETS[(offset + i) % FACETS.length]!);
  }
  return out;
}

function hueFor(facets: readonly HarnessFacet[]): HarnessHue {
  return FACET_HUES[facets[0]!];
}

/** Build a deterministic synthetic graph with `starCount` stars
 *  evenly distributed across the four sky rooms. Threads form
 *  organically wherever two stars share a facet. */
export function buildHarnessGraph(starCount: number): ConstellationGraph {
  const nodes: ConstellationNode[] = [];
  for (let i = 0; i < starCount; i += 1) {
    const room = ROOMS[i % ROOMS.length]!;
    const slug = `harness-${room}-${String(i).padStart(3, '0')}`;
    const seed = hash01(slug);
    // Sector center ± 40° spread, radius 0.3..0.85 → keeps stars
    // off the very rim and the very pole, where the projection
    // gets visually awkward.
    const angleDeg = ROOM_SECTOR_DEG[room] + (seed - 0.5) * 80;
    const radius = 0.3 + seed * 0.55;
    const angleRad = (angleDeg * Math.PI) / 180;
    const facets = facetsForStar(slug);
    nodes.push({
      room,
      slug,
      title: `Harness star ${String(i + 1)}`,
      date: new Date(2026, 0, 1 + i),
      facets,
      posture: undefined,
      isPreview: false,
      angleDeg,
      radius,
      unitPosition: diskToHemisphere(radius, angleRad),
      hue: hueFor(facets),
      twinklePhase: seed * Math.PI * 2,
    });
  }

  // Edges: every pair of stars sharing a facet becomes a thread.
  // Production caps thread count at the same shape — the data
  // layer derives edges from facet co-occurrence.
  const edges: ConstellationEdge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      for (const facet of a.facets) {
        if (b.facets.includes(facet)) {
          edges.push({
            facet,
            hue: FACET_HUES[facet],
            source: { room: a.room, slug: a.slug },
            target: { room: b.room, slug: b.slug },
          });
          break;
        }
      }
    }
  }

  return {
    facetHues: FACET_HUES,
    nodes,
    edges,
  };
}

/** A "production-realistic" preset. Sized to roughly match the
 *  star/thread density observed on the deployed /sky during the
 *  perf hunt (≈16 stars, ≈70 threads). */
export const productionScaleGraph: ConstellationGraph = buildHarnessGraph(16);

/** A heavier preset — useful for stress-testing future visual
 *  treatments before they ship. */
export const heavyGraph: ConstellationGraph = buildHarnessGraph(40);
