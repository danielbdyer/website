// Shared signal for the constellation's live camera. The navigation
// hook writes the camera + basis each tick (alongside the cursor
// signal); the WebGL atmosphere reads it each render frame to cast
// per-pixel view rays through the same pinhole the structural layer
// projects through. One camera, two renderers — the seam that keeps
// the painted sky and the addressable sky in the same world.
//
// Module-level mutable state for the same reason constellationCursor
// is: exactly one sky camera at a time, both writers and readers on
// the main thread, read every frame. The subscriber list exists for
// the reduced-motion path only — there the atmosphere has no render
// loop and repaints a single still frame when the camera snaps.

import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { cameraBasis } from '@/shared/geometry/camera';

// Mirrors the navigation hook's initial orbital camera (cursor at
// the north pole, ORBIT_DISTANCE 2.5) and layout.ts's STAGE_CAMERA,
// so the atmosphere's first frame agrees with the prerendered SVG
// before the navigation loop wakes.
const DEFAULT_CAMERA: Camera = {
  position: { x: 0, y: 0, z: -2.5 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fovY: Math.PI / 4,
  near: 0.1,
  far: 10,
};

export interface SkyCameraState {
  readonly camera: Camera;
  readonly basis: CameraBasis;
}

let current: SkyCameraState = { camera: DEFAULT_CAMERA, basis: cameraBasis(DEFAULT_CAMERA) };
let version = 0;
const listeners = new Set<() => void>();

export function setSkyCamera(camera: Camera, basis: CameraBasis): void {
  current = { camera, basis };
  version += 1;
  for (const listener of listeners) listener();
}

export function getSkyCamera(): SkyCameraState {
  return current;
}

/** Monotonic write counter. The atmosphere's render loop compares
 *  versions across frames to know the world is still — when it is,
 *  the loop halves its cadence and the GPU rests with it. */
export function getSkyCameraVersion(): number {
  return version;
}

/** Subscribe to camera writes. Returns the unsubscribe. Used by the
 *  reduced-motion atmosphere to repaint stills; the full-motion
 *  render loop polls getSkyCamera instead. */
export function subscribeSkyCamera(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test-only helper — restore the default camera between tests. */
export function resetSkyCamera(): void {
  current = { camera: DEFAULT_CAMERA, basis: cameraBasis(DEFAULT_CAMERA) };
  version = 0;
  listeners.clear();
}
