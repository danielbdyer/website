import { Crown } from '@/shared/atoms/DaystarFace/DaystarFace';
import { CENTER, DISC_PATH, MOON_BACK } from '@/shared/atoms/DaystarFace/faceGeometry';
import { cn } from '@/shared/utils/cn';

interface DaystarGlyphProps {
  variant: 'sun' | 'moon';
  size?: number;
  className?: string;
}

// The daystar as the room sees it, in the nav's corner: the same
// being as the sky's character, at glyph size, in the page's ink.
// The sun is the crown in splendour on the same wall clock as the
// sky's, with its disc, so the look-up's morph carries the rays
// themselves into the sky's crown. The moon is the back of the
// character's head — a plain crescent lit on the left — which the
// ascent turns half round to show the face. Drawn in the daystar's
// own 240-unit square so the morph is between like and like.
// CONSTELLATION.md §"The Sun and the Moon".
export function DaystarGlyph({ variant, size = 16, className }: DaystarGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      aria-hidden="true"
      className={cn('daystar-glyph', `daystar-glyph--${variant}`, className)}
    >
      {variant === 'sun' ? (
        <>
          <Crown />
          <path d={DISC_PATH} className="daystar-glyph__disc" />
        </>
      ) : (
        <path d={MOON_BACK} className="daystar-glyph__back" />
      )}
      {variant === 'sun' && (
        <circle cx={CENTER} cy={CENTER} r={44} className="daystar-glyph__core" />
      )}
    </svg>
  );
}
