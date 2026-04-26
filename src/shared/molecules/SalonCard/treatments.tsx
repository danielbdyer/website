import type { ReactNode } from 'react';
import type { Work } from '@/shared/content/schema';
import { ImgSlot } from '@/shared/atoms/ImgSlot/ImgSlot';
import { RoomGlyph } from '@/shared/atoms/RoomGlyph/RoomGlyph';
import { cn } from '@/shared/utils/cn';

// Each treatment is a thumbnail variant. They share the same surface
// (the 132px square in SalonCard) and the same lifecycle: the parent
// passes a `playKey` which increments to (re-)trigger the animation.
// Treatments key their animated subtree on the playKey so a fresh DOM
// element renders and the CSS animation runs from frame zero.
//
// Treatments must reach a settled rest state when the animation
// completes — no perpetual motion. Reduced motion is honored via
// `motion-reduce:` Tailwind variants where appropriate.

export interface TreatmentProps {
  work: Work;
  thumbLabel?: string;
  playKey: number;
}

// The "face" of a card — image when present, labeled stand-in next, room
// glyph as last resort. Shared by all treatments so they describe their
// gesture without duplicating face logic.
function ThumbFace({ work, thumbLabel }: Pick<TreatmentProps, 'work' | 'thumbLabel'>): ReactNode {
  if (work.image) return <ImgSlot kind="filled" image={work.image} />;
  if (thumbLabel) return <ImgSlot kind="standin" label={thumbLabel} />;
  return <RoomGlyph room={work.room} />;
}

function captionText(work: Work, thumbLabel?: string): string {
  return work.image?.caption ?? thumbLabel ?? work.title;
}

// 1 — Quiet caption.
// The most-restraint baseline. At rest, the image is visible and a small
// caption sits below in the meta band. On play, the image fades in over
// 600ms with the site's signature easing; the caption is always visible.
export function QuietCaption({ work, thumbLabel, playKey }: TreatmentProps): ReactNode {
  return (
    <div className="absolute inset-0">
      <div
        key={playKey}
        className="absolute inset-0 motion-safe:[animation:salon-fade_600ms_cubic-bezier(0.23,1,0.32,1)_both]"
      >
        <ThumbFace work={work} thumbLabel={thumbLabel} />
      </div>
      <div className="pointer-events-none absolute right-1 bottom-1 left-1 rounded-[1px] bg-bg-warm/85 px-1.5 py-0.5 font-body text-micro leading-[1.4] tracking-eyebrow text-text-3 italic lowercase backdrop-blur-[2px]">
        {captionText(work, thumbLabel)}
      </div>
    </div>
  );
}

// 2 — Caption rises on play.
// At rest, the image fills the slot and the caption sits below the
// bottom edge, hidden. On play, the caption rises into view from below
// over 700ms, holds for a moment, then settles back beneath the edge.
// On hover/tap, replays.
export function CaptionRise({ work, thumbLabel, playKey }: TreatmentProps): ReactNode {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ThumbFace work={work} thumbLabel={thumbLabel} />
      <div
        key={playKey}
        className={cn(
          'pointer-events-none absolute right-0 bottom-0 left-0 bg-bg-warm/90 px-2 py-1 font-body text-micro leading-[1.4] tracking-eyebrow text-text-3 italic lowercase backdrop-blur-[2px]',
          'translate-y-full',
          'motion-safe:[animation:salon-caption-rise_2200ms_cubic-bezier(0.23,1,0.32,1)_both]',
          'motion-reduce:translate-y-0',
        )}
      >
        {captionText(work, thumbLabel)}
      </div>
    </div>
  );
}

// 3 — Flip.
// Two-faced card. Front is the image; back holds the caption. On play,
// the card rotates 180° on the Y axis, holds the back face for a beat,
// then rotates back. On hover/tap, replays. The Decode lineage — used
// once with restraint, becomes a small theatre rather than a trick.
export function Flip({ work, thumbLabel, playKey }: TreatmentProps): ReactNode {
  return (
    <div className="absolute inset-0 [perspective:800px]" style={{ perspective: '800px' }}>
      <div
        key={playKey}
        className={cn(
          'relative h-full w-full [transform-style:preserve-3d]',
          'motion-safe:[animation:salon-flip_2400ms_cubic-bezier(0.65,0,0.35,1)_both]',
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <ThumbFace work={work} thumbLabel={thumbLabel} />
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center bg-bg-warm p-3 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="font-body text-micro leading-[1.5] tracking-eyebrow text-text-2 italic lowercase">
            {captionText(work, thumbLabel)}
          </span>
        </div>
      </div>
    </div>
  );
}

// 4 — Record jacket.
// The image is the sleeve. On play, it slides ~28% to the right, exposing
// a hidden inner panel (the "record") with the caption. Then slides back
// home. The lateral motion is what gives the gesture thickness — a flat
// surface couldn't do this. On hover/tap, replays.
export function Jacket({ work, thumbLabel, playKey }: TreatmentProps): ReactNode {
  return (
    <div className="absolute inset-0 overflow-hidden bg-bg-warm">
      {/* Inner panel — sits behind the sleeve, exposed when the sleeve
          slides. Uses the room glyph as a record-like circular mark plus
          the caption. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
        <div className="opacity-50">
          <RoomGlyph room={work.room} />
        </div>
        <span className="font-body text-micro leading-[1.4] tracking-eyebrow text-text-3 italic lowercase">
          {captionText(work, thumbLabel)}
        </span>
      </div>
      {/* The sleeve — slides right and returns. */}
      <div
        key={playKey}
        className={cn(
          'absolute inset-0 shadow-[1px_0_4px_rgba(0,0,0,0.08)]',
          'motion-safe:[animation:salon-jacket_2200ms_cubic-bezier(0.65,0,0.35,1)_both]',
        )}
      >
        <ThumbFace work={work} thumbLabel={thumbLabel} />
      </div>
    </div>
  );
}

// 5 — Book cover.
// The image is a cover hinged at the left spine. On play, the cover
// opens to ~110° (revealing the inner page with the caption), holds,
// then closes. The hinge is what distinguishes this from the flip —
// the cover doesn't rotate around its own center; it pivots from one
// edge, the way a book opens in the hand. On hover/tap, replays.
export function BookCover({ work, thumbLabel, playKey }: TreatmentProps): ReactNode {
  return (
    <div className="absolute inset-0 [perspective:1000px]" style={{ perspective: '1000px' }}>
      {/* Inner page — the surface revealed when the cover opens. */}
      <div className="absolute inset-0 flex items-center justify-center bg-bg-warm p-3 text-center">
        <span className="font-body text-micro leading-[1.5] tracking-eyebrow text-text-2 italic lowercase">
          {captionText(work, thumbLabel)}
        </span>
      </div>
      {/* The cover — pivots open from the left spine. */}
      <div
        key={playKey}
        className={cn(
          'absolute inset-0 origin-left shadow-[2px_0_6px_rgba(0,0,0,0.1)]',
          'motion-safe:[animation:salon-book-cover_2600ms_cubic-bezier(0.65,0,0.35,1)_both]',
        )}
        style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
      >
        <ThumbFace work={work} thumbLabel={thumbLabel} />
      </div>
    </div>
  );
}

// 6 — Hero morph (placeholder).
// Final form is a thumbnail-to-hero View Transition: clicking the
// thumbnail morphs it into the hero image of the work page. The View
// Transition wiring lands in a later phase; for the prototype gallery
// the play state previews the gesture by scaling the image up ~12%
// and easing the slot's border darker — a "lifting toward you" motion
// that hints at what the morph will feel like.
export function HeroMorph({ work, thumbLabel, playKey }: TreatmentProps): ReactNode {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        key={playKey}
        className={cn(
          'absolute inset-0',
          'motion-safe:[animation:salon-hero-morph_1800ms_cubic-bezier(0.23,1,0.32,1)_both]',
        )}
        style={{ viewTransitionName: `salon-thumb-${work.slug}` }}
      >
        <ThumbFace work={work} thumbLabel={thumbLabel} />
      </div>
      <div className="pointer-events-none absolute right-1 bottom-1 left-1 text-right font-body text-micro leading-[1.4] tracking-eyebrow text-text-3 italic lowercase opacity-0 motion-safe:[animation:salon-fade_1800ms_cubic-bezier(0.23,1,0.32,1)_1200ms_forwards]">
        {captionText(work, thumbLabel)}
      </div>
    </div>
  );
}
