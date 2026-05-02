import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { StarMark } from './StarMark';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{node}</svg>;
}

describe('StarMark atom', () => {
  test('renders the four-layer anatomy: halo, gold, body, hit', () => {
    const { container } = render(withSvg(<StarMark hue="rose" />));
    expect(container.querySelector('.constellation-star__halo')).not.toBeNull();
    expect(container.querySelector('.constellation-star__gold')).not.toBeNull();
    expect(container.querySelector('.constellation-star__body')).not.toBeNull();
    expect(container.querySelector('.constellation-star__hit')).not.toBeNull();
  });

  test('the halo passes through the watercolor filter for soft pigment edges', () => {
    const { container } = render(withSvg(<StarMark hue="warm" />));
    const halo = container.querySelector('.constellation-star__halo');
    expect(halo?.getAttribute('filter')).toBe('url(#cn-watercolor-halo)');
  });

  test('twinkleDelay applies as the halo animation-delay so adjacent stars desync', () => {
    const { container } = render(withSvg(<StarMark hue="warm" twinkleDelay={2.7} />));
    const halo = container.querySelector<SVGCircleElement>('.constellation-star__halo');
    expect(halo?.style.animationDelay).toBe('2.7s');
  });

  test('preview works render a quieter body', () => {
    const { container } = render(withSvg(<StarMark hue="warm" isPreview />));
    const body = container.querySelector<SVGCircleElement>('.constellation-star__body');
    expect(body?.getAttribute('opacity')).toBe('0.55');
  });

  test('hue maps to the right facet token (data-fill carries the var)', () => {
    const { container } = render(withSvg(<StarMark hue="violet" />));
    const halo = container.querySelector<SVGCircleElement>('.constellation-star__halo');
    expect(halo?.getAttribute('fill')).toBe('var(--accent-violet)');
  });
});
