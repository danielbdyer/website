// The sphere onto the chart: a unit-sphere point through the camera
// into viewbox coordinates. The image radius is 44% of the viewbox and
// SVG y grows downward. Pure and allocating — the per-frame painter
// (skyProjector) keeps its own scratch-buffer twin of this for the hot
// loops; this one serves the sky's pure core, where a few allocations
// per gesture cost nothing and clarity is worth more.

import type { Camera, CameraBasis } from './camera';
import { project } from './camera';
import type { Vec3 } from './sphere';

export const SKY_RADIUS_RATIO = 0.44;

export interface ViewboxPoint {
  readonly x: number;
  readonly y: number;
  readonly inFront: boolean;
}

export function toViewbox(
  point: Vec3,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): ViewboxPoint {
  const p = project(point, camera, basis, 1);
  const center = viewboxSize / 2;
  const radius = viewboxSize * SKY_RADIUS_RATIO;
  return { x: center + p.screenX * radius, y: center - p.screenY * radius, inFront: p.inFront };
}
