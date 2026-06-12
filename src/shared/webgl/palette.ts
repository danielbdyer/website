// The atmosphere's color vocabulary, read from the live design
// tokens rather than mirrored as hex constants. tokens.css stays
// the single source of truth: when the palette tunes, the shader
// follows without a paired edit. The reader runs at init and on
// each theme toggle — never per frame.

export type Rgb = readonly [number, number, number];

export interface SkyPalette {
  /** --sky-zenith — the firmament's top tone. */
  readonly zenith: Rgb;
  /** --sky-horizon (= --bg) — where the sky meets the ground. */
  readonly horizon: Rgb;
  /** --bg — the page ground the frame edges recede toward. */
  readonly ground: Rgb;
  /** --sky-glow color (alpha-stripped) and its token alpha. */
  readonly glow: Rgb;
  readonly glowStrength: number;
  /** The four held accents in hue-index order:
   *  0 warm · 1 rose · 2 violet · 3 gold. */
  readonly accents: readonly [Rgb, Rgb, Rgb, Rgb];
  /** --sky-grain-opacity — the paper-water grain strength. */
  readonly grain: number;
  /** 1 in the dark hour, 0 in the light. Drives the day↔night
   *  ontology blend (pigment bleeds ↔ luminous halos). */
  readonly night: number;
}

const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i;
const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;
const RGB_FUNC = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i;

function parseAlpha(raw: string | undefined): number {
  if (raw === undefined) return 1;
  const value = raw.endsWith('%') ? Number.parseFloat(raw) / 100 : Number.parseFloat(raw);
  return Number.isNaN(value) ? 1 : Math.min(Math.max(value, 0), 1);
}

/** Parse a CSS color into [0,1] RGB + alpha. Handles every form the
 *  tokens survive the build pipeline in: `#rgb` / `#rgba` /
 *  `#rrggbb` / `#rrggbbaa` (the CSS minifier rewrites `rgb(r, g, b,
 *  a)` tokens to alpha-hex) and `rgb()` / `rgba()` with comma or
 *  space separators. Returns null for anything else so callers can
 *  fall back deliberately. */
export function parseCssColor(value: string): { rgb: Rgb; alpha: number } | null {
  const v = value.trim();
  const short = HEX_SHORT.exec(v);
  if (short) {
    const [r, g, b, a] = short
      .slice(1)
      .map((ch) => (ch === undefined ? undefined : Number.parseInt(ch + ch, 16) / 255));
    return { rgb: [r!, g!, b!], alpha: a ?? 1 };
  }
  const long = HEX_LONG.exec(v);
  if (long) {
    const [r, g, b, a] = long
      .slice(1)
      .map((ch) => (ch === undefined ? undefined : Number.parseInt(ch, 16) / 255));
    return { rgb: [r!, g!, b!], alpha: a ?? 1 };
  }
  const func = RGB_FUNC.exec(v);
  if (func) {
    const [r, g, b] = func.slice(1, 4).map((ch) => Math.min(Number.parseFloat(ch ?? '0') / 255, 1));
    return { rgb: [r!, g!, b!], alpha: parseAlpha(func[4]) };
  }
  return null;
}

const FALLBACK: { rgb: Rgb; alpha: number } = { rgb: [0.5, 0.5, 0.5], alpha: 1 };

type TokenReader = (token: string) => string;

function colorOf(read: TokenReader, token: string): { rgb: Rgb; alpha: number } {
  return parseCssColor(read(token)) ?? FALLBACK;
}

/** Assemble the palette from a token reader (computed style in the
 *  browser; a stub in tests). `night` comes from the theme class on
 *  the root element, passed by the caller that owns that read. */
export function buildSkyPalette(read: TokenReader, night: boolean): SkyPalette {
  const glow = colorOf(read, '--sky-glow');
  const grainRaw = Number.parseFloat(read('--sky-grain-opacity'));
  return {
    zenith: colorOf(read, '--sky-zenith').rgb,
    horizon: colorOf(read, '--sky-horizon').rgb,
    ground: colorOf(read, '--bg').rgb,
    glow: glow.rgb,
    glowStrength: glow.alpha,
    accents: [
      colorOf(read, '--accent-warm').rgb,
      colorOf(read, '--accent-rose').rgb,
      colorOf(read, '--accent-violet').rgb,
      colorOf(read, '--accent-gold').rgb,
    ],
    grain: Number.isNaN(grainRaw) ? 0.05 : grainRaw,
    night: night ? 1 : 0,
  };
}

/** Linear blend between two palettes — the 500ms theme crossfade,
 *  computed CPU-side once per frame and handed to the shader as a
 *  single resolved palette. */
export function blendSkyPalettes(from: SkyPalette, to: SkyPalette, t: number): SkyPalette {
  const k = Math.min(Math.max(t, 0), 1);
  const mixRgb = (a: Rgb, b: Rgb): Rgb => [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
  const mix = (a: number, b: number) => a + (b - a) * k;
  return {
    zenith: mixRgb(from.zenith, to.zenith),
    horizon: mixRgb(from.horizon, to.horizon),
    ground: mixRgb(from.ground, to.ground),
    glow: mixRgb(from.glow, to.glow),
    glowStrength: mix(from.glowStrength, to.glowStrength),
    accents: [
      mixRgb(from.accents[0], to.accents[0]),
      mixRgb(from.accents[1], to.accents[1]),
      mixRgb(from.accents[2], to.accents[2]),
      mixRgb(from.accents[3], to.accents[3]),
    ],
    grain: mix(from.grain, to.grain),
    night: mix(from.night, to.night),
  };
}
