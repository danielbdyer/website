import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { axe } from '@/test/axe';
import { Star } from './Star';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{node}</svg>;
}

describe('Star molecule', () => {
  test('renders as an addressable anchor with a meaningful aria-label', () => {
    render(
      withSvg(
        <Star href="/sky/garden/small-weather" label="small weather — The Garden" hue="rose" />,
      ),
    );
    const link = screen.getByRole('link', { name: /small weather/i });
    expect(link).toHaveAttribute('href', '/sky/garden/small-weather');
  });

  test('marks preview works in the accessible name', () => {
    render(withSvg(<Star href="/sky/studio/sample" label="sample" hue="warm" isPreview />));
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toMatch(/preview/i);
  });

  test('exposes the hue as a data attribute the renderer can hook', () => {
    const { container } = render(
      withSvg(<Star href="/sky/study/note" label="note" hue="violet" />),
    );
    expect(container.querySelector('[data-hue="violet"]')).not.toBeNull();
  });

  test('isActive sets data-active on the anchor for CSS to hook', () => {
    const { container } = render(
      withSvg(<Star href="/sky/garden/x" label="x" hue="warm" isActive />),
    );
    expect(container.querySelector('[data-active="true"]')).not.toBeNull();
  });

  test('the visible label defaults to the accessible label when none is provided', () => {
    const { container } = render(
      withSvg(<Star href="/sky/garden/x" label="small weather" hue="warm" />),
    );
    const label = container.querySelector('.constellation-star__label');
    expect(label?.textContent).toBe('small weather');
  });

  test('the visible label can be set independently of the accessible label', () => {
    const { container } = render(
      withSvg(
        <Star
          href="/sky/garden/x"
          label="small weather — The Garden"
          visibleLabel="small weather"
          hue="warm"
        />,
      ),
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toMatch(/the garden/i);
    const label = container.querySelector('.constellation-star__label');
    expect(label?.textContent).toBe('small weather');
  });

  test('has no axe-detectable accessibility violations', async () => {
    const { container } = render(
      withSvg(
        <Star href="/sky/garden/small-weather" label="small weather — The Garden" hue="rose" />,
      ),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
