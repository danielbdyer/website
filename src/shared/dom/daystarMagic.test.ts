import { render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Daystar } from '@/shared/molecules/Daystar/Daystar';
import { mountDaystarMagic } from './daystarMagic';

// The driver against the molecule's real slots, on GSAP's real ticker
// (happy-dom's animation frames). What is asserted is what the page
// sees: the paths written, moving, brightening under the pointer, and
// still once disposed.

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mountSky() {
  const { container } = render(
    createElement(Daystar, { hour: { current: 'day', turn: () => {} } }),
  );
  const root = container.querySelector<HTMLElement>('[data-daystar]');
  if (!root) throw new Error('no daystar');
  return root;
}

const dOf = (root: HTMLElement, selector: string): string =>
  root.querySelector(selector)?.getAttribute('d') ?? '';

describe('daystarMagic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('refuses a root with no scarf to drive', () => {
    const bare = document.createElement('div');
    expect(mountDaystarMagic(bare)).toBeNull();
  });

  test('without WebGL the body stays drawn: no paint is claimed, and the scarf still moves', async () => {
    const root = mountSky();
    const magic = mountDaystarMagic(root);
    expect(magic).not.toBeNull();
    // happy-dom has no WebGL: the painter declines, the root says nothing.
    expect(root.dataset.paint).toBeUndefined();
    await wait(120);
    expect(dOf(root, '.daystar__scarf--front [data-strand="0"]').startsWith('M ')).toBe(true);
    magic?.dispose();
  });

  test('writes the scarf behind and in front, and keeps it moving', async () => {
    const root = mountSky();
    const magic = mountDaystarMagic(root);
    expect(magic).not.toBeNull();
    await wait(120);
    const front = dOf(root, '.daystar__scarf--front .daystar__scarf-body');
    const behind = dOf(root, '.daystar__scarf--behind .daystar__scarf-body');
    expect(front.startsWith('M ')).toBe(true);
    expect(behind.startsWith('M ')).toBe(true);
    expect(dOf(root, '.daystar__scarf--front .daystar__scarf-sheen').startsWith('M ')).toBe(true);
    // The wisps too — every strand, on both sides.
    for (const strand of [1, 2]) {
      expect(dOf(root, `.daystar__scarf--front [data-strand="${strand}"]`).startsWith('M ')).toBe(
        true,
      );
      expect(dOf(root, `.daystar__scarf--behind [data-strand="${strand}"]`).startsWith('M ')).toBe(
        true,
      );
    }
    // And the echoes — the sun's backlit silk, the moon's cast shadow —
    // carry the main front strand's very path.
    expect(dOf(root, '.daystar__backlit')).toBe(front);
    expect(dOf(root, '.daystar__cast')).toBe(front);
    // The silk's colors are sweeping.
    expect(root.querySelector('#daystar-silk')?.getAttribute('gradientTransform')).toMatch(
      /^rotate\(/,
    );
    await wait(120);
    expect(dOf(root, '.daystar__scarf--front .daystar__scarf-body')).not.toBe(front);
    magic?.dispose();
    await wait(60);
    const rested = dOf(root, '.daystar__scarf--front .daystar__scarf-body');
    await wait(120);
    expect(dOf(root, '.daystar__scarf--front .daystar__scarf-body')).toBe(rested);
  });

  test('the pointer lends the scarf energy: its glow rises, and falls again when it leaves', async () => {
    const root = mountSky();
    const magic = mountDaystarMagic(root);
    await wait(80);
    expect(Number(root.style.getPropertyValue('--scarf-glow'))).toBeLessThan(0.05);
    magic?.hover(true);
    await wait(1100);
    expect(Number(root.style.getPropertyValue('--scarf-glow'))).toBeGreaterThan(0.5);
    magic?.hover(false);
    await wait(2100);
    expect(Number(root.style.getPropertyValue('--scarf-glow'))).toBeLessThan(0.1);
    magic?.dispose();
  }, 8000);

  test('a turn whirls the scarf and lets it go', async () => {
    const root = mountSky();
    const magic = mountDaystarMagic(root);
    await wait(80);
    magic?.turn();
    await wait(450);
    expect(Number(root.style.getPropertyValue('--scarf-glow'))).toBeGreaterThan(0.5);
    await wait(2000);
    expect(Number(root.style.getPropertyValue('--scarf-glow'))).toBeLessThan(0.15);
    magic?.dispose();
  }, 8000);
});
