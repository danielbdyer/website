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
    expect(container.querySelectorAll('circle').length).toBe(1);
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
