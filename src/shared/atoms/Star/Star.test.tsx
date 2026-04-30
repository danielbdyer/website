import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { axe } from '@/test/axe';
import { Star } from './Star';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{node}</svg>;
}

describe('Star atom', () => {
  test('renders as an addressable anchor with a meaningful aria-label', () => {
    render(
      withSvg(
        <Star
          href="/garden/small-weather"
          label="small weather — The Garden"
          cx={50}
          cy={50}
          hue="rose"
        />,
      ),
    );
    const link = screen.getByRole('link', { name: /small weather/i });
    expect(link).toHaveAttribute('href', '/garden/small-weather');
  });

  test('marks preview works in the accessible name', () => {
    render(
      withSvg(<Star href="/studio/sample" label="sample" cx={10} cy={10} hue="warm" isPreview />),
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toMatch(/preview/i);
  });

  test('exposes the hue as a data attribute the renderer can hook', () => {
    const { container } = render(
      withSvg(<Star href="/study/note" label="note" cx={30} cy={30} hue="violet" />),
    );
    expect(container.querySelector('[data-hue="violet"]')).not.toBeNull();
  });

  test('the halo passes through the watercolor filter for soft pigment edges', () => {
    const { container } = render(
      withSvg(<Star href="/garden/x" label="x" cx={30} cy={30} hue="warm" />),
    );
    const halo = container.querySelector('.constellation-star__halo');
    expect(halo?.getAttribute('filter')).toBe('url(#cn-watercolor-halo)');
  });

  test('twinkleDelay applies as the halo animation-delay so adjacent stars desync', () => {
    const { container } = render(
      withSvg(<Star href="/garden/x" label="x" cx={30} cy={30} hue="warm" twinkleDelay={2.7} />),
    );
    const halo = container.querySelector<SVGCircleElement>('.constellation-star__halo');
    expect(halo?.style.animationDelay).toBe('2.7s');
  });

  test('has no axe-detectable accessibility violations', async () => {
    const { container } = render(
      withSvg(
        <Star
          href="/garden/small-weather"
          label="small weather — The Garden"
          cx={50}
          cy={50}
          hue="rose"
        />,
      ),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
