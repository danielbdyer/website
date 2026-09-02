import type { Facet } from '@/shared/types/common';
import type { Bearing } from '@/shared/content/skyWalk';
import { cn } from '@/shared/utils/cn';

/** Where the visitor stands: a star's title and room, or the pole. */
export interface WhisperPlace {
  readonly title: string;
  readonly room: string;
}

interface SkyWhisperProps {
  /** Null at the pole. */
  place: WhisperPlace | null;
  bearings: readonly Bearing[];
  /** Take a bearing: travel toward the star it leads to. */
  onBearing: (to: string, alongEdgeId?: string) => void;
  /** Attend a bearing (hover / focus) or release it (null). */
  onAttend: (facet: Facet | null) => void;
  className?: string;
}

// The sky speaks once, in second voice, beneath the star the visitor
// stands at: where you are, then what leads away. Each bearing is a
// real control — a button, because taking a bearing changes the
// sky's state rather than navigating the site. A bearing with nowhere
// to go yet reads dim and is disabled: *nothing yet points that way*.
// CONSTELLATION_WALK.md §"The Whisper". Italic, quiet, never a
// sentence; the only persistent words on the surface besides the
// return link.

export function SkyWhisper({ place, bearings, onBearing, onAttend, className }: SkyWhisperProps) {
  return (
    <div
      className={cn('sky-whisper font-body text-list text-text-3 italic', className)}
      aria-live="polite"
    >
      <p className="sky-whisper__here m-0">
        {place ? (
          <>
            <span className="text-text-2">{place.title}</span>
            <span aria-hidden="true"> · </span>
            <span>{place.room}</span>
          </>
        ) : (
          <span className="text-text-2">the polestar</span>
        )}
      </p>
      <p className="sky-whisper__bearings m-0 flex flex-wrap gap-x-3 gap-y-1">
        {bearings.map((bearing) => (
          <button
            key={bearing.facet}
            type="button"
            disabled={bearing.to === null}
            data-facet={bearing.facet}
            data-hue={bearing.hue}
            aria-label={
              bearing.to
                ? `Travel along ${bearing.facet}`
                : `${bearing.facet}: nothing yet points that way`
            }
            className="sky-whisper__bearing cursor-pointer border-none bg-transparent p-0 italic disabled:cursor-default"
            onClick={() => bearing.to && onBearing(bearing.to, bearing.edgeId ?? undefined)}
            onMouseEnter={() => onAttend(bearing.facet)}
            onMouseLeave={() => onAttend(null)}
            onFocus={() => onAttend(bearing.facet)}
            onBlur={() => onAttend(null)}
          >
            {bearing.facet}
          </button>
        ))}
      </p>
    </div>
  );
}
