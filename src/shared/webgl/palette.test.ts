import { describe, expect, test } from 'vitest';
import { blendSkyPalettes, buildSkyPalette, parseCssColor } from './palette';

describe('parseCssColor', () => {
  test('parses #rrggbb', () => {
    const parsed = parseCssColor('#f5f1eb');
    expect(parsed).not.toBeNull();
    expect(parsed!.rgb[0]).toBeCloseTo(245 / 255);
    expect(parsed!.rgb[1]).toBeCloseTo(241 / 255);
    expect(parsed!.rgb[2]).toBeCloseTo(235 / 255);
    expect(parsed!.alpha).toBe(1);
  });

  test('parses #rgb shorthand', () => {
    const parsed = parseCssColor('#fff');
    expect(parsed!.rgb).toEqual([1, 1, 1]);
  });

  test('parses the tokens.css rgb(r, g, b, a) form', () => {
    const parsed = parseCssColor('rgb(200, 118, 77, 0.07)');
    expect(parsed).not.toBeNull();
    expect(parsed!.rgb[0]).toBeCloseTo(200 / 255);
    expect(parsed!.alpha).toBeCloseTo(0.07);
  });

  test('parses the minifier-rewritten alpha-hex forms', () => {
    // The production CSS pipeline rewrites rgb(200, 118, 77, 0.07)
    // to #c8764d12 — the glow alpha must survive that round trip.
    const long = parseCssColor('#c8764d12');
    expect(long).not.toBeNull();
    expect(long!.rgb[0]).toBeCloseTo(200 / 255);
    expect(long!.alpha).toBeCloseTo(0x12 / 255);
    const short = parseCssColor('#f008');
    expect(short!.rgb).toEqual([1, 0, 0]);
    expect(short!.alpha).toBeCloseTo(0x88 / 255);
  });

  test('parses rgba() and space-separated rgb()', () => {
    expect(parseCssColor('rgba(25, 23, 21, 0.5)')!.alpha).toBeCloseTo(0.5);
    expect(parseCssColor('rgb(25 23 21)')!.rgb[0]).toBeCloseTo(25 / 255);
  });

  test('returns null for unsupported syntax', () => {
    expect(parseCssColor('oklch(0.7 0.1 60)')).toBeNull();
    expect(parseCssColor('')).toBeNull();
  });
});

const LIGHT_TOKENS: Record<string, string> = {
  '--sky-zenith': '#fcf8f1',
  '--sky-horizon': '#f5f1eb',
  '--bg': '#f5f1eb',
  '--sky-glow': 'rgb(200, 118, 77, 0.07)',
  '--accent-warm': '#c8764d',
  '--accent-rose': '#b87070',
  '--accent-violet': '#8a6fb0',
  '--accent-gold': '#bfa04d',
  '--sky-grain-opacity': '0.04',
};

describe('buildSkyPalette', () => {
  test('reads the constellation tokens into shader-ready channels', () => {
    const palette = buildSkyPalette((token) => LIGHT_TOKENS[token] ?? '', false);
    expect(palette.zenith[0]).toBeCloseTo(252 / 255);
    expect(palette.glowStrength).toBeCloseTo(0.07);
    expect(palette.accents[3][0]).toBeCloseTo(191 / 255);
    expect(palette.grain).toBeCloseTo(0.04);
    expect(palette.night).toBe(0);
  });

  test('marks the dark hour', () => {
    const palette = buildSkyPalette((token) => LIGHT_TOKENS[token] ?? '', true);
    expect(palette.night).toBe(1);
  });

  test('falls back gracefully when a token is missing', () => {
    const palette = buildSkyPalette(() => '', false);
    expect(palette.zenith).toEqual([0.5, 0.5, 0.5]);
    expect(palette.grain).toBeCloseTo(0.05);
  });
});

describe('blendSkyPalettes', () => {
  const a = buildSkyPalette((token) => LIGHT_TOKENS[token] ?? '', false);
  const b = buildSkyPalette(() => '#000000', true);

  test('returns the endpoints at t=0 and t=1', () => {
    expect(blendSkyPalettes(a, b, 0).zenith).toEqual(a.zenith);
    expect(blendSkyPalettes(a, b, 1).zenith).toEqual(b.zenith);
  });

  test('interpolates night and clamps t', () => {
    expect(blendSkyPalettes(a, b, 0.5).night).toBeCloseTo(0.5);
    expect(blendSkyPalettes(a, b, 2).night).toBe(1);
    expect(blendSkyPalettes(a, b, -1).night).toBe(0);
  });
});
