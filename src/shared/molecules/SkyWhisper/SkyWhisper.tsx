import type { Bearing } from '@/shared/content/skyWalk';
import { cn } from '@/shared/utils/cn';

/** Where the visitor stands: a star's title and, when it has one, the
 *  group it comes home to; or the pole. */
export interface WhisperPlace {
  readonly title: string;
  readonly group: string | null;
  /** What the node says of itself, for a node with no page to open. */
  readonly summary?: string | null;
}

/** A node whose words echo the one you stand at, though no thread
 *  joins them (presence.ts, concordantFrom). */
export interface WhisperConcordant {
  readonly key: string;
  readonly title: string;
}

interface SkyWhisperProps {
  /** Null at the pole. */
  place: WhisperPlace | null;
  bearings: readonly Bearing[];
  concordant?: WhisperConcordant | null;
  /** Take a bearing: travel toward the star it leads to, along the
   *  thread if one carries it. */
  onBearing: (to: string, alongEdgeId?: string) => void;
  /** Attend a bearing (hover / focus) or release it (null). */
  onAttend: (axis: string | null) => void;
  className?: string;
}

// The sky speaks once, in second voice, beneath the star the visitor
// stands at: where you are, then what leads away, then — when the
// words say so — the one node in concordance with this one that no
// thread joins to it: the edge you would not have thought to look for.
// Each bearing is a real control — a button, because taking a bearing
// changes the sky's state rather than navigating the site. A bearing
// with nowhere to go yet reads dim and is disabled: *nothing yet
// points that way*. CONSTELLATION_WALK.md §"The Whisper". Italic,
// quiet, never a sentence; the only persistent words on the surface
// besides the return link and the compass.

const BEARING_CLASS =
  'sky-whisper__bearing cursor-pointer border-none bg-transparent p-0 italic disabled:cursor-default';

export function SkyWhisper({
  place,
  bearings,
  concordant = null,
  onBearing,
  onAttend,
  className,
}: SkyWhisperProps) {
  return (
    <div className={cn('sky-whisper font-body text-list text-text-3 italic', className)}>
      <p className="sky-whisper__here m-0" aria-live="polite">
        {place ? (
          <>
            <span className="text-text-2">{place.title}</span>
            {place.group ? (
              <>
                <span aria-hidden="true"> · </span>
                <span>{place.group}</span>
              </>
            ) : null}
          </>
        ) : (
          <span className="text-text-2">the polestar</span>
        )}
      </p>
      {place?.summary ? (
        <p className="sky-whisper__summary text-text-2 m-0">{place.summary}</p>
      ) : null}
      <p className="sky-whisper__bearings m-0 flex flex-wrap gap-x-3 gap-y-1">
        {bearings.map((bearing) => (
          <button
            key={bearing.axis}
            type="button"
            disabled={bearing.to === null}
            data-axis={bearing.axis}
            data-hue={bearing.hue}
            aria-label={
              bearing.to
                ? `Travel along ${bearing.name}`
                : `${bearing.name}: nothing yet points that way`
            }
            className={BEARING_CLASS}
            onClick={() => bearing.to && onBearing(bearing.to, bearing.edgeId ?? undefined)}
            onMouseEnter={() => onAttend(bearing.axis)}
            onMouseLeave={() => onAttend(null)}
            onFocus={() => onAttend(bearing.axis)}
            onBlur={() => onAttend(null)}
          >
            {bearing.name}
          </button>
        ))}
      </p>
      {concordant ? (
        <p className="sky-whisper__concordance m-0">
          <span>in concordance</span>
          <span aria-hidden="true"> · </span>
          <button
            type="button"
            aria-label={`Travel to ${concordant.title}, in concordance with this one`}
            className={cn(BEARING_CLASS, 'sky-whisper__concordant')}
            onClick={() => onBearing(concordant.key)}
          >
            {concordant.title}
          </button>
        </p>
      ) : null}
    </div>
  );
}
