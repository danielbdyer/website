// Test fixtures for the canonical surface inventory of /sky.
//
// CONSTELLATION_DESIGN.md §"Surface Inventory" names twenty surface
// states (S0–S19) the constellation can be in. This module is the
// single place phase tests share rendering helpers, surface
// metadata (with implementation status), and canonical graph data
// — so each phase doesn't re-derive the setup it needs to assert
// against a known state.
//
// First form (P0): the inventory typed with implementation status;
// canonical graphs (populated + empty); a render helper that mounts
// the Constellation inside a TanStack Router test context.
// Subsequent phases extend with their own surface-state injectors
// (e.g., `renderS6BasinSettled`) as they ship.

import type { ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createMemoryHistory,
} from '@tanstack/react-router';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import { Constellation } from '@/shared/organisms/Constellation/Constellation';

/** A single canonical surface state, named per
 *  CONSTELLATION_DESIGN.md §"Surface Inventory". The set is closed —
 *  new states enter the design doc first, then this list. */
export type SurfaceId =
  | 'S0'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'S5'
  | 'S6'
  | 'S7'
  | 'S8'
  | 'S9'
  | 'S10'
  | 'S11'
  | 'S12'
  | 'S13'
  | 'S14'
  | 'S15'
  | 'S16'
  | 'S17'
  | 'S18'
  | 'S19';

/** Implementation status against the current head. Mirrors
 *  CONSTELLATION_IMPLEMENTATION_AUDIT.md §"Surface inventory audit"
 *  markers. Updated as phases ship; out of date here means the
 *  audit and this file have drifted and one needs a touch. */
export type SurfaceStatus = 'shipped' | 'partial' | 'absent';

interface SurfaceMeta {
  /** Designer's name from the surface inventory. */
  readonly name: string;
  readonly status: SurfaceStatus;
}

/** The canonical surface inventory with current implementation
 *  status. P0 baseline; entries flip to `shipped` as their phases
 *  land. */
export const SURFACE_INVENTORY: Readonly<Record<SurfaceId, SurfaceMeta>> = {
  S0: { name: 'Arrival', status: 'shipped' },
  S1: { name: 'Demonstration', status: 'absent' },
  S2: { name: 'Idle', status: 'shipped' },
  S3: { name: 'Hover', status: 'partial' },
  S4: { name: 'Dragging', status: 'shipped' },
  S5: { name: 'Coasting', status: 'shipped' },
  S6: { name: 'BasinSettled', status: 'partial' },
  S7: { name: 'RadialEcho', status: 'absent' },
  S8: { name: 'SearchActive', status: 'absent' },
  S9: { name: 'FilterActive', status: 'absent' },
  S10: { name: 'TimeScrubbed', status: 'absent' },
  S11: { name: 'PinPanelOpen', status: 'absent' },
  S12: { name: 'WorkOpening', status: 'partial' },
  S13: { name: 'WorkOpen', status: 'partial' },
  S14: { name: 'WorkClosing', status: 'partial' },
  S15: { name: 'Contemplative', status: 'absent' },
  S16: { name: 'Filtered+Searched', status: 'absent' },
  S17: { name: 'EmptySky', status: 'partial' },
  S18: { name: 'LoadingSky', status: 'absent' },
  S19: { name: 'OfflineSky', status: 'absent' },
};

const projectToSphere = (angleDeg: number, radius: number) =>
  diskToHemisphere(radius, (angleDeg * Math.PI) / 180);

/** A small canonical graph — three stars across three rooms with
 *  shared facets so threads render. Subsequent phases extend with
 *  phase-specific shapes (filtered set, time-scrubbed history,
 *  etc.) as their tests need them. */
export const canonicalSkyGraph: ConstellationGraph = {
  facetHues: {
    craft: 'warm',
    body: 'warm',
    beauty: 'rose',
    language: 'rose',
    consciousness: 'violet',
    becoming: 'violet',
    leadership: 'gold',
    relation: 'gold',
  },
  nodes: [
    {
      room: 'garden',
      slug: 'small-weather',
      title: 'small weather',
      date: new Date('2026-04-24'),
      facets: ['body', 'becoming', 'language', 'relation'],
      posture: undefined,
      isPreview: false,
      angleDeg: 135,
      radius: 0.6,
      unitPosition: projectToSphere(135, 0.6),
      hue: 'gold',
      twinklePhase: 1.2,
    },
    {
      room: 'studio',
      slug: 'a-second-work',
      title: 'a second work',
      date: new Date('2026-05-01'),
      facets: ['language', 'craft'],
      posture: undefined,
      isPreview: false,
      angleDeg: 225,
      radius: 0.7,
      unitPosition: projectToSphere(225, 0.7),
      hue: 'rose',
      twinklePhase: 3.4,
    },
    {
      room: 'study',
      slug: 'a-third-work',
      title: 'a third work',
      date: new Date('2026-05-15'),
      facets: ['consciousness', 'becoming'],
      posture: undefined,
      isPreview: false,
      angleDeg: 45,
      radius: 0.5,
      unitPosition: projectToSphere(45, 0.5),
      hue: 'violet',
      twinklePhase: 0.7,
    },
  ],
  edges: [
    {
      facet: 'language',
      hue: 'rose',
      source: { room: 'garden', slug: 'small-weather' },
      target: { room: 'studio', slug: 'a-second-work' },
    },
    {
      facet: 'becoming',
      hue: 'violet',
      source: { room: 'garden', slug: 'small-weather' },
      target: { room: 'study', slug: 'a-third-work' },
    },
  ],
};

/** Empty-corpus graph fixture for `S17 EmptySky`. The
 *  facet/hue map is preserved so the renderer's color path runs
 *  identically to the populated case — only the data is empty. */
export const emptySkyGraph: ConstellationGraph = {
  facetHues: canonicalSkyGraph.facetHues,
  nodes: [],
  edges: [],
};

/** Mount the Constellation organism inside a minimal in-memory
 *  TanStack Router context. Returns the @testing-library/react
 *  result; tests destructure container/getByRole/etc. as usual.
 *  Defaults to the canonical populated graph; pass `emptySkyGraph`
 *  or a phase-specific graph as needed. */
export function renderSky(graph: ConstellationGraph = canonicalSkyGraph): RenderResult {
  const rootRoute = createRootRoute({
    component: (): ReactNode => <Constellation graph={graph} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}
