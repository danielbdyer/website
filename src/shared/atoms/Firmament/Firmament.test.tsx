import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Firmament } from './Firmament';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 1000 1000">{node}</svg>;
}

describe('Firmament atom', () => {
  test('renders a radial gradient and a filling rect', () => {
    const { container } = render(withSvg(<Firmament size={1000} />));
    expect(container.querySelector('radialGradient')).not.toBeNull();
    const rect = container.querySelector('rect');
    expect(rect).not.toBeNull();
    expect(rect?.getAttribute('width')).toBe('1000');
    expect(rect?.getAttribute('height')).toBe('1000');
  });

  test('honors a custom gradient id so multiple firmaments can coexist', () => {
    const { container } = render(withSvg(<Firmament size={500} gradientId="alt" />));
    expect(container.querySelector('radialGradient')?.id).toBe('alt');
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe('url(#alt)');
  });
});
