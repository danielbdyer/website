// Honest image slot — the preview never fakes art. When a work would carry
// a real attached image on the live site, the design renders a labeled
// gray field naming what would arrive ("Hopper · Cape Cod Morning"). Reads
// as annotation, not attempt. The umber wall holds the slot the way it
// would hold the real thing. See VOICE_AND_COPY.md and the design's
// "no fake art" call (chats/chat1.md).

interface ImgSlotProps {
  /** What would arrive on the live site, in lowercase ("artist · title"). */
  label: string;
}

export function ImgSlot({ label }: ImgSlotProps) {
  return (
    <div className="img-slot">
      <span className="img-slot-label">{label}</span>
    </div>
  );
}
