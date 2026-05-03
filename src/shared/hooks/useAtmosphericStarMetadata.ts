import { useEffect } from 'react';
import type { ConstellationHue } from '@/shared/content/constellation';
import { setAtmosphericStarMetadata } from '@/shared/state/atmosphericScene';

// Hue index in the WebGL firmament's `uHuePalette[4]` uniform. The
// projector broadcasts each star's positional data to the same buffer
// the shader reads; this mapping keeps the indexes the broadcast uses
// (here) and the indexes the shader looks up (in the GLSL `hueAt`
// selector) talking the same language.
const HUE_INDEX: Record<ConstellationHue, number> = {
  warm: 0,
  rose: 1,
  violet: 2,
  gold: 3,
};

export interface AtmosphericMetadataNode {
  readonly hue: ConstellationHue;
  readonly twinklePhase: number;
}

/** Broadcast each star's hue + twinkle phase to the WebGL firmament,
 *  in the same order the projector iterates the nodes per RAF tick.
 *  The shader's per-slot uniform lookups stay aligned with the
 *  metadata seeded here. The React Compiler caches the input
 *  `nodes` array against its derivation chain (graph →
 *  buildPositionedMap → buildRenderableNodes), so this effect only
 *  re-fires when the underlying graph changes. */
export function useAtmosphericStarMetadata(
  nodes: readonly { readonly node: AtmosphericMetadataNode }[],
): void {
  useEffect(() => {
    setAtmosphericStarMetadata(
      nodes.map(({ node }) => ({
        hueIndex: HUE_INDEX[node.hue],
        phase: node.twinklePhase,
      })),
    );
  }, [nodes]);
}
