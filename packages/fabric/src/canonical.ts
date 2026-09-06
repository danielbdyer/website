// ─── One canonical form ───────────────────────────────────────────
//
// Content addressing and the frozen-signature check both need to ask
// whether two values are the same value, whatever order their keys
// were built in and whatever a library hung on them along the way.
// `canonical` answers once, purely: keys sorted, meta keys dropped,
// anything JSON cannot carry gone. A fingerprint hashes this; the
// manifest compares this.

const isMeta = (key: string): boolean => key.startsWith('~') || key.startsWith('$');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** The value with sorted keys and no meta keys, recursively. */
export const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => !isMeta(key) && entry !== undefined)
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  }
  return value;
};

/** The one string a value canonicalizes to. */
export const canonicalJson = (value: unknown): string => JSON.stringify(canonical(value));

/** Whether two values are the same value. */
export const same = (a: unknown, b: unknown): boolean => canonicalJson(a) === canonicalJson(b);
