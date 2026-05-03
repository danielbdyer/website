import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Polestar } from './Polestar';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 1000 1000">{node}</svg>;
}

describe('Polestar atom', () => {
  test('renders the figure as decorative (aria-hidden)', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} />));
    const group = container.querySelector('.constellation-polestar[aria-hidden="true"]');
    expect(group).not.toBeNull();
  });

  test('the eight ray burst sits inside its own group for theming', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} />));
    const rays = container.querySelector('.constellation-polestar__rays');
    expect(rays).not.toBeNull();
    expect(rays?.querySelectorAll('line').length).toBe(8);
  });

  test('the central body reuses the star halo gradient so the polestar reads as kin to the other stars', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} />));
    const body = container.querySelector('.constellation-polestar__body');
    expect(body).not.toBeNull();
    const haloFills = [...container.querySelectorAll('.constellation-polestar__body circle')].map(
      (c) => c.getAttribute('fill'),
    );
    expect(haloFills).toContain('url(#cn-star-halo)');
  });

  test('the rays radiate from the given center', () => {
    const { container } = render(withSvg(<Polestar cx={500} cy={500} half={60} />));
    const rays = container.querySelectorAll('.constellation-polestar__rays line');
    // Cardinal N spike: x1 == cx, y1 < cy
    const cardinalN = rays[0];
    expect(cardinalN?.getAttribute('x1')).toBe('500');
  });
});
