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
  const svg = container.querySelector<SVGSVGElement>('svg.daystar__svg');
  if (!svg) throw new Error('no daystar svg');
  return svg;
}

const dOf = (svg: SVGSVGElement, selector: string): string =>
  svg.querySelector(selector)?.getAttribute('d') ?? '';

describe('daystarMagic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('refuses an svg with no scarf to drive', () => {
    const bare = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(mountDaystarMagic(bare)).toBeNull();
  });

  test('writes the scarf behind and in front, and keeps it moving', async () => {
    const svg = mountSky();
    const magic = mountDaystarMagic(svg);
    expect(magic).not.toBeNull();
    await wait(120);
    const front = dOf(svg, '.daystar__scarf--front .daystar__scarf-body');
    const behind = dOf(svg, '.daystar__scarf--behind .daystar__scarf-body');
    expect(front.startsWith('M ')).toBe(true);
    expect(behind.startsWith('M ')).toBe(true);
    expect(dOf(svg, '.daystar__scarf--front .daystar__scarf-sheen').startsWith('M ')).toBe(true);
    // The wisps too — every strand, on both sides.
    for (const strand of [1, 2]) {
      expect(dOf(svg, `.daystar__scarf--front [data-strand="${strand}"]`).startsWith('M ')).toBe(
        true,
      );
      expect(dOf(svg, `.daystar__scarf--behind [data-strand="${strand}"]`).startsWith('M ')).toBe(
        true,
      );
    }
    // The silk's colors are sweeping.
    expect(svg.querySelector('#daystar-silk')?.getAttribute('gradientTransform')).toMatch(
      /^rotate\(/,
    );
    await wait(120);
    expect(dOf(svg, '.daystar__scarf--front .daystar__scarf-body')).not.toBe(front);
    magic?.dispose();
    await wait(60);
    const rested = dOf(svg, '.daystar__scarf--front .daystar__scarf-body');
    await wait(120);
    expect(dOf(svg, '.daystar__scarf--front .daystar__scarf-body')).toBe(rested);
  });

  test('the pointer lends the scarf energy: its glow rises, and falls again when it leaves', async () => {
    const svg = mountSky();
    const magic = mountDaystarMagic(svg);
    await wait(80);
    expect(Number(svg.style.getPropertyValue('--scarf-glow'))).toBeLessThan(0.05);
    magic?.hover(true);
    await wait(1100);
    expect(Number(svg.style.getPropertyValue('--scarf-glow'))).toBeGreaterThan(0.5);
    magic?.hover(false);
    await wait(2100);
    expect(Number(svg.style.getPropertyValue('--scarf-glow'))).toBeLessThan(0.1);
    magic?.dispose();
  }, 8000);

  test('a turn whirls the scarf and lets it go', async () => {
    const svg = mountSky();
    const magic = mountDaystarMagic(svg);
    await wait(80);
    magic?.turn();
    await wait(450);
    expect(Number(svg.style.getPropertyValue('--scarf-glow'))).toBeGreaterThan(0.5);
    await wait(2000);
    expect(Number(svg.style.getPropertyValue('--scarf-glow'))).toBeLessThan(0.15);
    magic?.dispose();
  }, 8000);
});
