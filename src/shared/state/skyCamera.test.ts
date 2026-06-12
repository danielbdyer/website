import { afterEach, describe, expect, test, vi } from 'vitest';
import { cameraBasis } from '@/shared/geometry/camera';
import type { Camera } from '@/shared/geometry/camera';
import { getSkyCamera, resetSkyCamera, setSkyCamera, subscribeSkyCamera } from './skyCamera';

afterEach(() => {
  resetSkyCamera();
});

describe('skyCamera signal', () => {
  test('defaults to the polestar orbit the prerendered SVG uses', () => {
    const { camera } = getSkyCamera();
    expect(camera.position).toEqual({ x: 0, y: 0, z: -2.5 });
    expect(camera.fovY).toBeCloseTo(Math.PI / 4);
  });

  test('set then get round-trips the live camera', () => {
    const moved: Camera = {
      position: { x: 0.5, y: 0.2, z: -2.4 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fovY: Math.PI / 4,
      near: 0.1,
      far: 10,
    };
    const basis = cameraBasis(moved);
    setSkyCamera(moved, basis);
    expect(getSkyCamera().camera).toBe(moved);
    expect(getSkyCamera().basis).toBe(basis);
  });

  test('notifies subscribers on every write, until unsubscribed', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSkyCamera(listener);
    const { camera, basis } = getSkyCamera();
    setSkyCamera(camera, basis);
    setSkyCamera(camera, basis);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setSkyCamera(camera, basis);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
