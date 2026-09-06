import { createHash } from 'node:crypto';
import { canonicalJson } from '../canonical';

// ─── Fingerprints ─────────────────────────────────────────────────
//
// Content-addressed identity for what a call carried: the canonical
// form, hashed. The only thing here that the core cannot do is hash.

export const fingerprint = (value: unknown): string =>
  createHash('sha256').update(canonicalJson(value)).digest('hex');
