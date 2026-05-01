import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { WebGLFirmament } from './WebGLFirmament';

describe('WebGLFirmament atom', () => {
  test('mounts a positioned container the hook can fill', () => {
    const { container } = render(<WebGLFirmament />);
    const node = container.querySelector('.webgl-firmament');
    expect(node).not.toBeNull();
  });

  test('is aria-hidden — decorative paint, never navigation', () => {
    const { container } = render(<WebGLFirmament />);
    expect(container.querySelector('.webgl-firmament')?.getAttribute('aria-hidden')).toBe('true');
  });

  test('uses pointer-events:none and mix-blend-mode for additive composition', () => {
    const { container } = render(<WebGLFirmament />);
    const node = container.querySelector('.webgl-firmament');
    const cls = node?.getAttribute('class') ?? '';
    expect(cls).toMatch(/pointer-events-none/);
    expect(cls).toMatch(/mix-blend-soft-light/);
    expect(cls).toMatch(/absolute/);
    expect(cls).toMatch(/inset-0/);
  });

  test('honors a custom className passed by the consumer', () => {
    const { container } = render(<WebGLFirmament className="extra-class" />);
    expect(container.querySelector('.webgl-firmament')?.classList.contains('extra-class')).toBe(
      true,
    );
  });
});
