import type { Room } from '@/shared/types/common';
import { roomSchema } from './schema';

// Wikilink shapes:
//   [[slug]]              — same-room target
//   [[room/slug]]         — cross-room target
//   [[slug|display]]      — same-room with override display text
//   [[room/slug|display]] — cross-room with override display text
//
// The grammar lives in `GRAPH_AND_LINKING.md` §"Link Syntax". This file
// is the implementation; spec is the source of truth for what counts as
// a wikilink.

export interface WikilinkToken {
  /** The room segment if the wikilink was qualified, else undefined. */
  room: Room | undefined;
  /** The slug segment of the target work. */
  slug: string;
  /** Optional override display text from the `|display` segment. */
  display: string | undefined;
}

export interface WikilinkTarget {
  room: Room;
  slug: string;
  title: string;
}

export interface ResolvedWikilink {
  target: WikilinkTarget;
  display: string;
}

const WIKILINK_RE = /\[\[([^\]\n]+?)\]\]/g;

// Parse one wikilink's inner contents. Returns null if the form is
// malformed (more than one slash, empty fields, etc.). Pure: input
// string → token or null.
export function parseWikilinkInner(inner: string): WikilinkToken | null {
  const trimmed = inner.trim();
  if (trimmed.length === 0) return null;
  const [path, display] = trimmed.split('|', 2).map((s) => s.trim());
  if (!path || path.length === 0) return null;
  const parts = path.split('/');
  if (parts.length === 1) {
    return { room: undefined, slug: parts[0]!, display: display || undefined };
  }
  if (parts.length === 2) {
    const roomCandidate = roomSchema.safeParse(parts[0]);
    if (!roomCandidate.success) return null;
    const slug = parts[1]!.trim();
    if (slug.length === 0) return null;
    return { room: roomCandidate.data, slug, display: display || undefined };
  }
  return null;
}

// Find every wikilink in a body. Pure scanner; returns the parsed token
// for each `[[...]]` occurrence. Does NOT resolve against a slug index;
// see `resolveWikilink` for that.
export function scanWikilinks(body: string): WikilinkToken[] {
  const out: WikilinkToken[] = [];
  for (const match of body.matchAll(WIKILINK_RE)) {
    const token = parseWikilinkInner(match[1]!);
    if (token) out.push(token);
  }
  return out;
}

// The slug index used to resolve wikilinks at build time. Keys are
// `${room}/${slug}` strings; values carry the title (used as default
// display text when a wikilink doesn't carry an override).
export type SlugIndex = ReadonlyMap<string, WikilinkTarget>;

export function slugIndexKey(room: Room, slug: string): string {
  return `${room}/${slug}`;
}

// Resolve a wikilink token against a slug index. The `currentRoom` is
// the room of the work whose body the token came from; bare `[[slug]]`
// resolves against currentRoom. Cross-room `[[room/slug]]` resolves to
// the named room. Returns null when the target doesn't exist.
export function resolveWikilink(
  token: WikilinkToken,
  currentRoom: Room,
  slugIndex: SlugIndex,
): ResolvedWikilink | null {
  const room = token.room ?? currentRoom;
  const target = slugIndex.get(slugIndexKey(room, token.slug));
  if (!target) return null;
  return { target, display: token.display ?? target.title };
}

// Inversion: given an outbound graph (source key → target keys), produce
// the backlink graph (target key → source refs). The source ref carries
// the source work's room/slug/title so the receiving page can render
// "Mentioned in [[work-a]]" by display name. Sorted newest-first by
// `dateLookup(key)` per `GRAPH_AND_LINKING.md` §"Backlinks > Ordering".
export function invertOutboundGraph(
  outbound: ReadonlyMap<string, readonly WikilinkTarget[]>,
  sources: ReadonlyMap<string, WikilinkTarget>,
  dateLookup: (key: string) => Date,
): ReadonlyMap<string, readonly WikilinkTarget[]> {
  const acc = new Map<string, WikilinkTarget[]>();
  for (const [sourceKey, targets] of outbound) {
    const sourceRef = sources.get(sourceKey);
    if (!sourceRef) continue;
    for (const t of targets) {
      const targetKey = slugIndexKey(t.room, t.slug);
      const list = acc.get(targetKey) ?? [];
      list.push(sourceRef);
      acc.set(targetKey, list);
    }
  }
  // Sort each list newest-first.
  for (const [key, list] of acc) {
    const sorted = [...list].sort((a, b) => {
      const da = dateLookup(slugIndexKey(a.room, a.slug)).getTime();
      const db = dateLookup(slugIndexKey(b.room, b.slug)).getTime();
      return db - da;
    });
    acc.set(key, sorted);
  }
  return acc;
}
