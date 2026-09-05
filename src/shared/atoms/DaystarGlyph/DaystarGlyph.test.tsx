import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { MOON_BACK } from '@/shared/atoms/DaystarFace/faceGeometry';
import { DaystarGlyph } from './DaystarGlyph';

describe('DaystarGlyph atom — the daystar as the room sees it', () => {
  test('the sun is the crown itself, in the same square as the sky’s, with its disc', () => {
    const { container } = render(<DaystarGlyph variant="sun" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 240 240');
    expect(svg.querySelectorAll('.daystar__ray')).toHaveLength(16);
    expect(svg.querySelector('.daystar-glyph__disc')).not.toBeNull();
    expect(svg.querySelector('.daystar-glyph__back')).toBeNull();
  });

  test('the moon is the back of the head: a plain crescent lit on the left, no face', () => {
    const { container } = render(<DaystarGlyph variant="moon" />);
    const svg = container.querySelector('svg')!;
    expect(svg.querySelector('.daystar-glyph__back')?.getAttribute('d')).toBe(MOON_BACK);
    expect(svg.querySelector('.daystar__ray')).toBeNull();
    expect(svg.querySelector('.daystar__crescent')).toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  test('the moon’s back is the disc’s left rim and an arc bulging left, horn to horn', () => {
    expect(MOON_BACK).toBe('M 120 60 A 60 60 0 0 0 120 180 A 80 80 0 0 1 120 60 Z');
  });
});
