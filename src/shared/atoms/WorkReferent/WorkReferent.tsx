import type { WorkReferent as WorkReferentType } from '@/shared/content/schema';

interface WorkReferentProps {
  referent: WorkReferentType;
}

// The "what this work is about" line. A Salon work that documents an
// encounter with a Klimt painting carries a structured referent —
// `{ type: 'visual-artwork', name: 'Stoclet Frieze', creator: { name:
// 'Gustav Klimt' }, year: 1911 }` — which is published to JSON-LD via
// `Schema.org about`. This atom is the visible counterpart: a small
// italic museum-wall-text line on the work page, near the title.
//
// Format: *Creator — Name, year*. Creator becomes a real link when
// the referent carries a `creator.url`; otherwise plain italic text.
// The dash is an em-dash (—), the site's signature separator. The
// year is parenthetical-feeling without a parenthesis, separated by a
// comma — the rhythm a museum label uses.
//
// Voice belongs to VOICE_AND_COPY.md's secondary register: italic,
// `--text-3` (the quietest tone), Literata body. Doesn't compete with
// the work's title or its body; sits as quiet attribution.
export function WorkReferent({ referent }: WorkReferentProps) {
  const { name, creator, year } = referent;
  const creatorNode = creator?.url ? (
    <a
      href={creator.url}
      target="_blank"
      rel="noreferrer noopener"
      className="border-b border-transparent text-text-3 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text-2"
    >
      {creator.name}
    </a>
  ) : (
    creator?.name
  );

  return (
    <p className="mb-6 font-body text-meta leading-meta italic text-text-3">
      {creatorNode && (
        <>
          {creatorNode} <span aria-hidden="true">—</span>{' '}
        </>
      )}
      <span className="not-italic">{name}</span>
      {year !== undefined && <>, {year}</>}
    </p>
  );
}
