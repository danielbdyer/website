import type { SpeedRecord } from '@/shared/scale/records';
import { Placard } from '@/shared/molecules/Placard/Placard';
import { useBestiary } from '@/shared/hooks/useBestiary';
import { cn } from '@/shared/utils/cn';

interface BestiaryProps {
  records: readonly SpeedRecord[];
  className?: string;
}

// Objects of Scale: a scrolling bestiary of speed. One fixed canvas
// behind a column of snapping pages, one page per record, so the
// motion is rich and the text stays real text. The page runs while
// you hold still and restarts whenever you arrive; scrolling is the
// one thing that takes it apart. A pause control is always present:
// the motion starts on its own and runs longer than five seconds,
// and WCAG 2.2.2 asks for the pause. Under reduced motion the page
// opens on the resolved character, still, with the counter ticking
// and the same control reading Play. OBJECTS_OF_SCALE.md.

export function Bestiary({ records, className }: BestiaryProps) {
  const { scrollRef, canvasRef, on, count, running, toggle } = useBestiary(records);
  return (
    <div className={cn('bestiary relative h-full w-full overflow-hidden', className)}>
      <canvas ref={canvasRef} aria-hidden="true" className="bestiary__canvas" />
      <div ref={scrollRef} className="bestiary__scroll" data-on={on}>
        {records.map((record, index) => (
          <section
            key={record.id}
            id={record.id}
            aria-labelledby={`${record.id}-line`}
            className="bestiary__page"
            data-active={index === on ? 'true' : undefined}
          >
            <div className="bestiary__stage" aria-hidden="true" />
            <Placard
              record={record}
              count={index === on ? count : 0}
              className="bestiary__placard"
            />
          </section>
        ))}
      </div>
      <button type="button" onClick={toggle} aria-pressed={!running} className="bestiary__pause">
        {running ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
