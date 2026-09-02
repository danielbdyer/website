import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Polestar } from './Polestar';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 1000 1000">{node}</svg>;
}

describe('Polestar atom', () => {
  test('renders the figure as decorative (aria-hidden)', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} />));
    const group = container.querySelector('g[aria-hidden="true"]');
    expect(group).not.toBeNull();
  });

  test('composes the five geometric primitives — two rects, four diagonal lines, central circle', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} />));
    expect(container.querySelectorAll('rect').length).toBe(2);
    expect(container.querySelectorAll('line').length).toBe(4);
    expect(container.querySelectorAll('circle.constellation-polestar__ornament').length).toBe(1);
  });

  test("circles the figure with the chart's two rings, drawn after the figure", () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} half={60} />));
    const rings = container.querySelectorAll('circle.constellation-polestar__ring');
    expect(rings.length).toBe(2);
    expect(rings[0]?.getAttribute('fill')).toBe('none');
    expect(Number(rings[1]?.getAttribute('r'))).toBeGreaterThan(
      Number(rings[0]?.getAttribute('r')),
    );
    // The figure's own circle stays first in document order.
    expect(
      container.querySelector('circle')?.classList.contains('constellation-polestar__ornament'),
    ).toBe(true);
  });

  test('positions the outer rect symmetrically around the center', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} half={60} />));
    const outerRect = container.querySelector('rect');
    expect(outerRect?.getAttribute('x')).toBe('440');
    expect(outerRect?.getAttribute('y')).toBe('440');
    expect(outerRect?.getAttribute('width')).toBe('120');
  });

  test('the central circle is the geometric figure’s ornament', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} half={60} />));
    const circle = container.querySelector('circle');
    expect(circle?.getAttribute('cx')).toBe('500');
    expect(circle?.getAttribute('cy')).toBe('500');
  });
});
