import { describe, expect, it } from 'vitest';
import { daystarViewboxPoint } from '@/shared/content/skyWalk';
import { VIEWBOX } from '@/shared/organisms/Constellation/layout';
import { fitViewboxToCanvas } from '@/shared/webgl/atmosphereProjection';
import { daystarRect } from './daystarSeat';

// The seat's mirror of the sky's own seating: the same center the
// projector writes, the same size the token clamps, at every shape
// of viewport.
describe('daystarRect', () => {
  it.each([
    [1280, 900],
    [390, 844],
    [1920, 1080],
    [800, 1200],
    [2560, 1440],
  ])('mirrors the sky at %i×%i', (width, height) => {
    const point = daystarViewboxPoint(width, height, VIEWBOX, 'cover');
    const fit = fitViewboxToCanvas(width, height, VIEWBOX, 'cover');
    const centerX = fit.offsetX + point.x * fit.scale;
    const centerY = fit.offsetY + point.y * fit.scale;
    const size = Math.min(Math.max(96, 0.12 * Math.min(width, height)), 150);
    const rect = daystarRect(width, height);
    expect(rect.x + rect.w / 2).toBeCloseTo(centerX, 6);
    expect(rect.y + rect.h / 2).toBeCloseTo(centerY, 6);
    expect(rect.w).toBeCloseTo(size, 6);
    expect(rect.h).toBeCloseTo(size, 6);
  });
});
