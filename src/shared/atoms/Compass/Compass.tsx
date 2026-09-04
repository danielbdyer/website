import type { ConstellationHue } from '@/shared/content/constellation';

/** One axis's name at its bearing on the rim, prerendered at the
 *  resting camera's projection; the projector moves it each tick. */
export interface CompassPoint {
  readonly axis: string;
  readonly name: string;
  readonly hue: ConstellationHue;
  readonly x: number;
  readonly y: number;
}

interface CompassProps {
  points: readonly CompassPoint[];
  /** Axes under attention — those of the star the visitor stands at,
   *  and the one a hovered bearing, thread, or name lights. */
  attended: ReadonlySet<string>;
}

// The compass lettered at the rim of the oculus. One word per axis, at
// the bearing each axis owns on the dome — so the sky says why a star
// is where it is (CONSTELLATION_WALK.md §"The Compass"). Small caps in
// the axis's hue over the quiet ink; the attended ones brighten. The
// chart holds still, so a name can be learned: beauty is up. Each name
// is also a bearing to take — hovering lights the figure, and the
// organism travels along the axis on click (the words carry
// `data-axis` like a thread does). aria-hidden: the whisper carries the
// same bearings for assistive output, as real buttons.

export function Compass({ points, attended }: CompassProps) {
  return (
    <g aria-hidden="true" className="constellation-compass">
      {points.map((point) => (
        <text
          key={point.axis}
          x={point.x}
          y={point.y}
          textAnchor="middle"
          dominantBaseline="middle"
          data-compass={point.axis}
          data-axis={point.axis}
          data-hue={point.hue}
          data-attended={attended.has(point.axis) ? 'true' : undefined}
          className="constellation-compass__name cursor-pointer"
        >
          {point.name}
        </text>
      ))}
    </g>
  );
}
