import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { StarMark } from './StarMark';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{node}</svg>;
}

describe('StarMark atom', () => {
  test('renders the five-layer anatomy: tint, halo, body, spikes, hit', () => {
    const { container } = render(withSvg(<StarMark hue="rose" />));
    expect(container.querySelector('.constellation-star__tint')).not.toBeNull();
    expect(container.querySelector('.constellation-star__halo')).not.toBeNull();
    expect(container.querySelector('.constellation-star__body')).not.toBeNull();
    expect(container.querySelector('.constellation-star__spikes')).not.toBeNull();
    expect(container.querySelector('.constellation-star__hit')).not.toBeNull();
  });

  test('the halo paints via the GPU-cheap radial-gradient (no SVG filter)', () => {
    const { container } = render(withSvg(<StarMark hue="warm" />));
    const halo = container.querySelector('.constellation-star__halo');
    expect(halo?.getAttribute('fill')).toBe('url(#cn-star-halo)');
    expect(halo?.getAttribute('filter')).toBeNull();
  });

  test('twinkleDelay flows to the body as data-twinkle-phase for the WebGL halo broadcast', () => {
    const { container } = render(withSvg(<StarMark hue="warm" twinkleDelay={2.7} />));
    const body = container.querySelector<SVGCircleElement>('.constellation-star__body');
    expect(body?.dataset.twinklePhase).toBe('2.7');
  });

  test('preview works render a quieter body', () => {
    const { container } = render(withSvg(<StarMark hue="warm" isPreview />));
    const body = container.querySelector<SVGCircleElement>('.constellation-star__body');
    expect(body?.getAttribute('opacity')).toBe('0.55');
  });

  test('the outer tint carries the facet hue via currentColor on the gradient', () => {
    const { container } = render(withSvg(<StarMark hue="violet" />));
    const tint = container.querySelector<SVGCircleElement>('.constellation-star__tint');
    expect(tint?.getAttribute('fill')).toBe('url(#cn-star-tint)');
    expect(tint?.style.color).toBe('var(--accent-violet)');
  });
});
