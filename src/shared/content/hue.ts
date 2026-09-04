// The four hues the sky speaks in: the site's held accents, spoken
// first by the constellation (DESIGN_SYSTEM.md §"Held accents"). The
// compass takes them in turn around the rim; a source may name one for
// an axis, and the sky assigns the rest.

export const HUES = ['warm', 'rose', 'violet', 'gold'] as const;
export type ConstellationHue = (typeof HUES)[number];

export const isHue = (value: unknown): value is ConstellationHue =>
  typeof value === 'string' && (HUES as readonly string[]).includes(value);
