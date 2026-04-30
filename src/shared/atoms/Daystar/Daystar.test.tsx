import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Daystar } from './Daystar';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 1000 1000">{node}</svg>;
}

describe('Daystar atom', () => {
  test('renders both sun and moon bodies in the DOM (CSS handles theme switch)', () => {
    const { container } = render(withSvg(<Daystar cx={500} cy={240} />));
    expect(container.querySelector('.constellation-daystar__sun')).not.toBeNull();
    expect(container.querySelector('.constellation-daystar__moon')).not.toBeNull();
  });

  test('is aria-hidden — decorative, not addressable', () => {
    const { container } = render(withSvg(<Daystar cx={500} cy={240} />));
    expect(container.querySelector('.constellation-daystar')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  test('the sun composes a halo, body, and core for layered glow', () => {
    const { container } = render(withSvg(<Daystar cx={500} cy={240} />));
    expect(container.querySelectorAll('.constellation-daystar__sun circle').length).toBe(3);
  });

  test('the moon uses a mask to carve the crescent', () => {
    const { container } = render(withSvg(<Daystar cx={500} cy={240} />));
    expect(container.querySelector('mask#cn-moon-mask')).not.toBeNull();
  });

  test('honors a custom radius for the celestial body', () => {
    const { container } = render(withSvg(<Daystar cx={500} cy={240} radius={20} />));
    const bodyCircle = container.querySelectorAll('.constellation-daystar__sun circle')[1];
    expect(bodyCircle?.getAttribute('r')).toBe('20');
  });
});
