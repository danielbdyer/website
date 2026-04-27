import type { Tokens, MarkedExtension } from 'marked';
import type { Room } from '@/shared/types/common';
import { parseWikilinkInner, type ResolvedWikilink, type WikilinkToken } from './wikilinks';

interface WikilinkMarkedToken extends Tokens.Generic {
  type: 'wikilink';
  raw: string;
  parsed: WikilinkToken;
}

// A `marked` inline extension for `[[...]]` wikilinks. Pure-by-shape:
// the resolver is passed in, so the extension itself doesn't reach
// for any module-level state. Each loader (real content via
// `loader.ts`, preview via `preview-data.ts`) instantiates an
// extension with its own slug-index-aware resolver.
//
// Resolver returns `{ target, display }` when the wikilink resolves
// to a real work, or `null` when it doesn't. On null, the extension
// throws — `GRAPH_AND_LINKING.md` §"Link Resolution" commits to
// loud-fail at build time. The error message names the source work,
// the unresolved target, and the wikilink's display text if any.
export function wikilinkExtension(opts: {
  currentRoom: Room;
  resolve: (token: WikilinkToken) => ResolvedWikilink | null;
  /** Used in error messages to identify the source work in the build log. */
  sourceLabel?: string;
}): MarkedExtension {
  return {
    extensions: [
      {
        name: 'wikilink',
        level: 'inline',
        start(src: string) {
          return src.indexOf('[[');
        },
        tokenizer(src: string): WikilinkMarkedToken | undefined {
          const match = /^\[\[([^\]\n]+?)\]\]/.exec(src);
          if (!match) return undefined;
          const parsed = parseWikilinkInner(match[1]!);
          if (!parsed) return undefined;
          return {
            type: 'wikilink',
            raw: match[0],
            parsed,
          };
        },
        renderer(token) {
          const t = token as WikilinkMarkedToken;
          const resolved = opts.resolve(t.parsed);
          if (!resolved) {
            const where = opts.sourceLabel ? ` in ${opts.sourceLabel}` : '';
            const targetStr = t.parsed.room ? `${t.parsed.room}/${t.parsed.slug}` : t.parsed.slug;
            throw new Error(
              `Unresolved wikilink${where}: [[${targetStr}]] does not name a published work.`,
            );
          }
          const url = `/${resolved.target.room}/${resolved.target.slug}`;
          return `<a href="${url}">${escapeHtml(resolved.display)}</a>`;
        },
      },
    ],
  };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
