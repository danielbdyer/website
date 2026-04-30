import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Firmament } from './Firmament';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 1000 1000">{node}</svg>;
}

describe('Firmament atom', () => {
  test('renders a layered radial gradient with sky-glow → zenith → horizon stops', () => {
    const { container } = render(withSvg(<Firmament size={1000} />));
    const gradient = container.querySelector('radialGradient');
    expect(gradient).not.toBeNull();
    const stops = gradient?.querySelectorAll('stop') ?? [];
    expect(stops.length).toBe(3);
    expect(stops[0]?.getAttribute('stop-color')).toContain('--sky-glow');
    expect(stops[1]?.getAttribute('stop-color')).toContain('--sky-zenith');
    expect(stops[2]?.getAttribute('stop-color')).toContain('--sky-horizon');
  });

  test('renders the gradient-filled rect at the full size', () => {
    const { container } = render(withSvg(<Firmament size={1000} />));
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2); // gradient base + grain overlay
    expect(rects[0]?.getAttribute('width')).toBe('1000');
    expect(rects[0]?.getAttribute('height')).toBe('1000');
  });

  test('renders a feTurbulence-driven grain overlay with theme-aware opacity', () => {
    const { container } = render(withSvg(<Firmament size={1000} />));
    const turbulence = container.querySelector('feTurbulence');
    expect(turbulence).not.toBeNull();
    expect(turbulence?.getAttribute('type')).toBe('fractalNoise');
    // The grain rect references the filter and uses soft-light blend
    // so the same noise reads as paper-water in light and stardust
    // at night, with opacity gated by --sky-grain-opacity.
    const grainRect = container.querySelectorAll('rect')[1];
    expect(grainRect?.getAttribute('filter')).toMatch(/grain/);
  });

  test('honors a custom id prefix so multiple firmaments can coexist', () => {
    const { container } = render(withSvg(<Firmament size={500} idPrefix="alt" />));
    expect(container.querySelector('radialGradient')?.id).toBe('alt-bg');
    expect(container.querySelector('filter')?.id).toBe('alt-grain');
  });
});
