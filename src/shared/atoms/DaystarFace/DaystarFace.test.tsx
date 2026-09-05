import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { DaystarFace } from './DaystarFace';
import { CENTER, DISC_RADIUS, fourPointStar, wobblyDisc } from './faceGeometry';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 240 240">{node}</svg>;
}

describe('DaystarFace atom — the drawing', () => {
  test('the disc is a hand’s circle: closed, smooth, and a breath off the true radius', () => {
    const d = wobblyDisc(CENTER, CENTER, DISC_RADIUS, [0.02, -0.02, 0.01, -0.01]);
    expect(d.startsWith('M ')).toBe(true);
    expect(d.trim().endsWith('Z')).toBe(true);
    expect((d.match(/Q /g) ?? []).length).toBe(4);
    const numbers = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    // Every coordinate stays within the jitter of the radius.
    expect(Math.max(...xs)).toBeLessThanOrEqual(CENTER + DISC_RADIUS * 1.02 + 0.01);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(CENTER - DISC_RADIUS * 1.02 - 0.01);
  });

  test('a four-point sparkle is drawn in toward its center and closed', () => {
    const d = fourPointStar(10, 20, 5);
    expect(d).toBe('M 10 15 Q 10 20 15 20 Q 10 20 10 25 Q 10 20 5 20 Q 10 20 10 15 Z');
  });
});

describe('DaystarFace atom — the two faces', () => {
  test('the sun wears a crown of sixteen flames and laughs with an open mouth', () => {
    const { container } = render(withSvg(<DaystarFace variant="sun" />));
    expect(container.querySelector('.daystar__sun')).not.toBeNull();
    expect(container.querySelectorAll('.daystar__ray')).toHaveLength(16);
    expect(container.querySelector('.daystar__mouth')).not.toBeNull();
    expect(container.querySelector('.daystar__lid')).toBeNull();
    expect(container.querySelector('.daystar__limb')).toBeNull();
  });

  test('the moon keeps its lit limb, its freckles, three stars, and heavier lids', () => {
    const { container } = render(withSvg(<DaystarFace variant="moon" />));
    expect(container.querySelector('.daystar__moon')).not.toBeNull();
    expect(container.querySelector('.daystar__limb')).not.toBeNull();
    expect(container.querySelectorAll('.daystar__crater')).toHaveLength(4);
    expect(container.querySelectorAll('.daystar__star')).toHaveLength(3);
    expect(container.querySelectorAll('.daystar__lid')).toHaveLength(2);
    expect(container.querySelector('.daystar__rays')).toBeNull();
    expect(container.querySelector('.daystar__mouth')).toBeNull();
  });

  test('both faces share the plump construction: two eyes with a gaze, two cheeks, brows, a nose', () => {
    for (const variant of ['sun', 'moon'] as const) {
      const { container } = render(withSvg(<DaystarFace variant={variant} />));
      expect(container.querySelectorAll('.daystar__eye')).toHaveLength(2);
      expect(container.querySelectorAll('.daystar__gaze')).toHaveLength(2);
      expect(container.querySelectorAll('.daystar__cheek')).toHaveLength(2);
      expect(container.querySelectorAll('.daystar__brow')).toHaveLength(2);
      expect(container.querySelector('.daystar__nose')).not.toBeNull();
      expect(container.querySelector('.daystar__halo')).not.toBeNull();
      expect(container.querySelector('.daystar__body .daystar__face')).not.toBeNull();
    }
  });
});
