import type { WorkImage } from '@/shared/content/schema';

// Honest image slot — three states. The site never fakes art.
//
// `standin`: live image hasn't arrived yet. Renders a labeled gray field
//   naming what would arrive ("Hopper · Cape Cod Morning"). Reads as
//   annotation, not attempt. The umber wall holds the slot the way it
//   would hold the real thing. TRANSPARENCY.md commits the site to
//   publishing its own making — a faked stand-in would be the loudest
//   possible violation.
//
// `filled`: a real image is attached to the work. Renders the image,
//   cropped to fit, with caption text exposed only via the `alt` attribute
//   and surrounding chrome (the ImgSlot itself is silent).

type ImgSlotProps = { kind: 'standin'; label: string } | { kind: 'filled'; image: WorkImage };

export function ImgSlot(props: ImgSlotProps) {
  if (props.kind === 'filled') {
    return (
      <img
        src={props.image.src}
        alt={props.image.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center border border-border-lt bg-bg-warm bg-[repeating-linear-gradient(135deg,transparent_0,transparent_8px,var(--slot-stripe)_8px,var(--slot-stripe)_9px)] p-3.5">
      <span className="max-w-full text-center font-body text-micro leading-[1.4] tracking-eyebrow text-text-3 lowercase">
        {props.label}
      </span>
    </div>
  );
}
