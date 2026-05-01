import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { ConstellationFilters } from './ConstellationFilters';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{node}</svg>;
}

describe('ConstellationFilters atom', () => {
  test('exposes the watercolor halo filter under the constellation namespace', () => {
    const { container } = render(withSvg(<ConstellationFilters />));
    expect(container.querySelector('#cn-watercolor-halo')).not.toBeNull();
  });

  test('exposes the vespers bloom filter under the constellation namespace', () => {
    const { container } = render(withSvg(<ConstellationFilters />));
    expect(container.querySelector('#cn-vespers-bloom')).not.toBeNull();
  });

  test('the watercolor filter composes blur with displacement', () => {
    const { container } = render(withSvg(<ConstellationFilters />));
    const filter = container.querySelector('#cn-watercolor-halo');
    expect(filter?.querySelector('feGaussianBlur')).not.toBeNull();
    expect(filter?.querySelector('feDisplacementMap')).not.toBeNull();
    expect(filter?.querySelector('feTurbulence')).not.toBeNull();
  });

  test('the vespers filter composes blur with brightness', () => {
    const { container } = render(withSvg(<ConstellationFilters />));
    const filter = container.querySelector('#cn-vespers-bloom');
    expect(filter?.querySelector('feGaussianBlur')).not.toBeNull();
    expect(filter?.querySelector('feColorMatrix')).not.toBeNull();
    expect(filter?.querySelector('feMerge')).not.toBeNull();
  });
});
