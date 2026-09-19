import { Link } from '@tanstack/react-router';
import { PASSAGE_DWELL_MS, type Passage } from '@/shared/content/passage';
import type { Place } from '@/shared/content/skyWalk';
import { useDwell } from '@/shared/hooks/useDwell';
import { cn } from '@/shared/utils/cn';

interface SkyPassageProps {
  /** The passage that leaves from here, if any. */
  passage: Passage | null;
  here: Place;
  /** The sky is under way: the dwell does not count while it moves. */
  traveling: boolean;
  className?: string;
}

// The whisper's fourth line — *off the chart · Objects of Scale* —
// spoken only at the star a passage leaves from, and only once the
// visitor has stood there a while. Until then nothing is rendered:
// a secret is not in the accessibility tree either. The line is a
// real link, and it leaves the sky. CONSTELLATION_WALK.md §"The
// Whisper".

export function SkyPassage({ passage, here, traveling, className }: SkyPassageProps) {
  const dwelled = useDwell(here, !traveling, PASSAGE_DWELL_MS);
  if (!passage || !dwelled) return null;
  return (
    <p className={cn('sky-passage font-body text-list text-text-3 m-0 italic', className)}>
      <span>{passage.line}</span>
      <span aria-hidden="true"> · </span>
      <Link
        to={passage.to}
        aria-label={`Travel to ${passage.title}, off the chart`}
        className="sky-passage__door"
      >
        {passage.title}
      </Link>
    </p>
  );
}
