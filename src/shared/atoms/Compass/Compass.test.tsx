import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Compass, type CompassPoint } from './Compass';

const POINTS: readonly CompassPoint[] = [
  { facet: 'craft', hue: 'warm', x: 900, y: 500 },
  { facet: 'beauty', hue: 'rose', x: 500, y: 100 },
  { facet: 'consciousness', hue: 'violet', x: 100, y: 500 },
];

describe('Compass atom', () => {
  test('letters each facet at its point, carrying its hue', () => {
    const { container } = render(
      <svg>
        <Compass points={POINTS} attended={new Set()} />
      </svg>,
    );
    const craft = container.querySelector<SVGTextElement>('[data-compass="craft"]');
    expect(craft?.textContent).toBe('craft');
    expect(craft?.getAttribute('x')).toBe('900');
    expect(craft?.dataset.hue).toBe('warm');
    expect(container.querySelectorAll('[data-compass]')).toHaveLength(3);
  });

  test('marks the attended facets and hides itself from assistive output', () => {
    const { container } = render(
      <svg>
        <Compass points={POINTS} attended={new Set(['beauty'])} />
      </svg>,
    );
    expect(
      container.querySelector<SVGTextElement>('[data-compass="beauty"]')?.dataset.attended,
    ).toBe('true');
    expect(
      container.querySelector<SVGTextElement>('[data-compass="craft"]')?.dataset.attended,
    ).toBeUndefined();
    expect(container.querySelector('.constellation-compass')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
