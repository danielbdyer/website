import type { ConstellationHue } from '@/shared/content/constellation';
import type { Facet } from '@/shared/types/common';

/** One facet's name at its bearing on the rim, prerendered at the
 *  resting camera's projection; the projector moves it each tick. */
export interface CompassPoint {
  readonly facet: Facet;
  readonly hue: ConstellationHue;
  readonly x: number;
  readonly y: number;
}

interface CompassProps {
  points: readonly CompassPoint[];
  /** Facets under attention — those of the star the visitor stands
   *  at, and the one a hovered bearing or thread lights. */
  attended: ReadonlySet<Facet>;
}

// The compass lettered at the rim. Eight words, one per facet, at the
// bearing each facet owns on the dome — so the sky says why a star is
// where it is (CONSTELLATION_WALK.md §"The Compass"). Small caps in the
// facet's hue over the quiet ink; the attended ones brighten. They turn
// with the heavens because the bearings are of the sky. aria-hidden:
// the whisper carries the facets for assistive output.

export function Compass({ points, attended }: CompassProps) {
  return (
    <g aria-hidden="true" className="constellation-compass">
      {points.map((point) => (
        <text
          key={point.facet}
          x={point.x}
          y={point.y}
          textAnchor="middle"
          dominantBaseline="middle"
          data-compass={point.facet}
          data-hue={point.hue}
          data-attended={attended.has(point.facet) ? 'true' : undefined}
          className="constellation-compass__name pointer-events-none"
        >
          {point.facet}
        </text>
      ))}
    </g>
  );
}
