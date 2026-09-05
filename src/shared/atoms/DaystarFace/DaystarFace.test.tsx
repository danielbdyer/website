import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { DaystarFace } from './DaystarFace';
import {
  CENTER,
  DISC_RADIUS,
  MOON_HORN_FOOT,
  MOON_HORN_TOP,
  MOON_PROFILE,
  RAYS,
  fourPointStar,
  straightRay,
  wavyRay,
  wobblyDisc,
} from './faceGeometry';

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
    expect(Math.max(...xs)).toBeLessThanOrEqual(CENTER + DISC_RADIUS * 1.02 + 0.01);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(CENTER - DISC_RADIUS * 1.02 - 0.01);
  });

  test('a four-point sparkle is drawn in toward its center and closed', () => {
    expect(fourPointStar(10, 20, 5)).toBe(
      'M 10 15 Q 10 20 15 20 Q 10 20 10 25 Q 10 20 5 20 Q 10 20 10 15 Z',
    );
  });

  test('the crown is in splendour: sixteen rays, straight and wavy by turns, each its own cut', () => {
    expect(RAYS).toHaveLength(16);
    expect(RAYS.filter((r) => r.kind === 'straight')).toHaveLength(8);
    expect(RAYS.filter((r) => r.kind === 'wavy')).toHaveLength(8);
    expect(RAYS.map((r) => r.angle)).toEqual(RAYS.map((_, k) => k * 22.5));
    expect(new Set(RAYS.map((r) => r.d)).size).toBe(16);
    expect(straightRay(50, 4)).toMatch(/^M 116 64 L 120 14\.0 L 124 64 Z$/);
    expect(wavyRay(40, 5)).toMatch(/^M 115 64 C .* Z$/);
  });

  test('the moon’s profile runs from horn to horn and closes on the disc’s own rim', () => {
    expect(MOON_PROFILE.startsWith(`M ${MOON_HORN_TOP.x} ${MOON_HORN_TOP.y}`)).toBe(true);
    expect(MOON_PROFILE).toContain(
      `${MOON_HORN_FOOT.x} ${MOON_HORN_FOOT.y} A ${DISC_RADIUS} ${DISC_RADIUS} 0 1 0 ${MOON_HORN_TOP.x} ${MOON_HORN_TOP.y}`,
    );
    expect(MOON_PROFILE.trim().endsWith('Z')).toBe(true);
    // Both horns sit on the rim, so the crescent's outer edge is the disc's own.
    for (const horn of [MOON_HORN_TOP, MOON_HORN_FOOT]) {
      expect(Math.hypot(horn.x - CENTER, horn.y - CENTER)).toBeCloseTo(DISC_RADIUS, 0);
    }
  });
});

describe('DaystarFace atom — the two faces', () => {
  test('the sun: a crown, the dial’s rings, two almond eyes with lid and lash, a line of a nose, a closed smile', () => {
    const { container } = render(withSvg(<DaystarFace variant="sun" />));
    expect(container.querySelector('.daystar__sun')).not.toBeNull();
    expect(container.querySelectorAll('.daystar__ray--straight')).toHaveLength(8);
    expect(container.querySelectorAll('.daystar__ray--wavy')).toHaveLength(8);
    expect(container.querySelectorAll('.daystar__ring')).toHaveLength(2);
    expect(container.querySelectorAll('.daystar__eye')).toHaveLength(2);
    expect(container.querySelectorAll('.daystar__gaze')).toHaveLength(2);
    expect(container.querySelectorAll('.daystar__lash')).toHaveLength(2);
    expect(container.querySelector('.daystar__nose')).not.toBeNull();
    expect(container.querySelectorAll('.daystar__lip')).toHaveLength(2);
    expect(container.querySelector('.daystar__grain')).not.toBeNull();
    // No card's laugh, no crescent.
    expect(container.querySelector('.daystar__mouth')).toBeNull();
    expect(container.querySelector('.daystar__crescent')).toBeNull();
  });

  test('the moon: the crescent asleep in profile, one closed eye, its freckles, three stars, one ring', () => {
    const { container } = render(withSvg(<DaystarFace variant="moon" />));
    expect(container.querySelector('.daystar__moon')).not.toBeNull();
    expect(container.querySelector('.daystar__crescent')?.getAttribute('d')).toBe(MOON_PROFILE);
    expect(container.querySelectorAll('.daystar__lid')).toHaveLength(1);
    expect(container.querySelectorAll('.daystar__eye')).toHaveLength(0);
    expect(container.querySelectorAll('.daystar__crater')).toHaveLength(4);
    expect(container.querySelectorAll('.daystar__star')).toHaveLength(3);
    expect(container.querySelectorAll('.daystar__ring')).toHaveLength(1);
    expect(container.querySelector('.daystar__rays')).toBeNull();
    expect(container.querySelector('.daystar__grain')).not.toBeNull();
  });

  test('both faces keep the halo behind and the disc beneath the features', () => {
    for (const variant of ['sun', 'moon'] as const) {
      const { container } = render(withSvg(<DaystarFace variant={variant} />));
      const hour = container.querySelector('.daystar__hour')!;
      expect(hour.firstElementChild?.classList.contains('daystar__halo')).toBe(true);
      expect(container.querySelector('.daystar__body > .daystar__disc')).not.toBeNull();
      expect(container.querySelector('.daystar__body .daystar__face')).not.toBeNull();
      expect(container.querySelectorAll('.daystar__cheek').length).toBeGreaterThan(0);
    }
  });
});
