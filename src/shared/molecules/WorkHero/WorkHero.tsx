import type { Work, WorkImage } from '@/shared/content/schema';
import { ImgSlot } from '@/shared/atoms/ImgSlot/ImgSlot';
import { workHeroTransitionName } from '@/shared/utils/view-transition-names';

interface WorkHeroProps {
  work: Work;
  image: WorkImage | undefined;
  thumbLabel: string | undefined;
}

// The hero figure at the top of a work page. Three states, mirroring
// ImgSlot's contract:
// - **filled**: a real authored image. Renders the photo full-width
//   with a caption + credit beneath.
// - **standin**: the work has no authored image but the preview is
//   naming what would arrive (e.g., "hopper · cape cod morning"). The
//   labeled gray field gives the morph from a FacetCard thumbnail a
//   destination — without this, clicking a card on the facet page
//   would flash to a hero-less work page and the View Transition would
//   have nothing to morph into.
// - **absent**: the work neither has an image nor names one. The hero
//   slot is omitted entirely; the work begins with its title.
//
// Every visible state carries the canonical view-transition name so
// FacetCard / WorkRow thumbnails morph into this element on click.
export function WorkHero({ work, image, thumbLabel }: WorkHeroProps) {
  if (!image && !thumbLabel) return null;
  return (
    <figure
      className="mb-8 overflow-hidden rounded-[2px] bg-bg-warm shadow-sm"
      style={{ viewTransitionName: workHeroTransitionName(work.room, work.slug) }}
    >
      {image ? (
        <>
          <img
            src={image.src}
            alt={image.alt}
            className="block h-auto w-full"
            loading="eager"
            decoding="async"
          />
          {(image.caption || image.credit) && (
            <figcaption className="px-4 py-3 font-body text-meta italic tracking-meta text-text-3">
              {image.caption}
              {image.caption && image.credit ? ' · ' : ''}
              {image.credit && <span className="not-italic text-text-3">{image.credit}</span>}
            </figcaption>
          )}
        </>
      ) : (
        <div className="relative aspect-[16/10]">
          <ImgSlot kind="standin" label={thumbLabel ?? ''} />
        </div>
      )}
    </figure>
  );
}
