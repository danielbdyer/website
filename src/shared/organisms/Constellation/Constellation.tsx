import type { ConstellationGraph } from '@/shared/content/constellation';
import { bearingsOf } from '@/shared/content/skyWalk';
import { ConstellationFilters } from '@/shared/atoms/ConstellationFilters/ConstellationFilters';
import { Firmament } from '@/shared/atoms/Firmament/Firmament';
import { Daystar, type SkyHour } from '@/shared/molecules/Daystar/Daystar';
import { WebGLFirmament } from '@/shared/molecules/WebGLFirmament/WebGLFirmament';
import { SkyWhisper } from '@/shared/molecules/SkyWhisper/SkyWhisper';
import { cn } from '@/shared/utils/cn';
import { useDusk } from './useDusk';
import { Stage } from './Stage';
import { VIEWBOX, skyTitle } from './layout';
import { useSkyScene } from './useSkyScene';
import { attentionKeyOf, whisperConcordantOf, whisperPlaceOf } from './walk';

interface ConstellationProps {
  graph: ConstellationGraph;
  /** When true, the SVG fills the frame via `xMidYMid slice` (cover-
   *  fit) so the constellation occupies every available pixel rather
   *  than being letterboxed inside a column. */
  fullViewport?: boolean;
  /** A node key (`{room}/{slug}`) to open standing at — the look-up
   *  jump from a work lands on its star. Null/absent opens at the pole
   *  (or the session's remembered place).
   *  CONSTELLATION_PARALLEL.md §"The Orientation Contract." */
  focusKey?: string | undefined;
  /** The hour the sky keeps and the way to turn it; with it the
   *  daystar is the hour's toggle, without it a decoration. */
  hour?: SkyHour | undefined;
  className?: string;
}

// The sky as a walk (CONSTELLATION_WALK.md): the visitor is always
// somewhere; the camera rests there; a named destination — a star, a
// bearing, a thread, an arrow, a drag along a thread — is the only
// thing that moves it. While it moves, the frame says so
// (data-traveling), and the destination is framed ahead. The frame
// carries the pointer's parallax, so the chart, the daystar's gaze,
// and the atmosphere all lean from one pair of variables; and it
// carries the dusk (data-dusk) for the 1.8s after the hour turns, so
// the sunset gathers at the sun in whichever substrate is painting.

export function Constellation({
  graph,
  fullViewport = false,
  focusKey,
  hour,
  className,
}: ConstellationProps) {
  const { parallaxRef, cameraRef, glyphRef, walk, travel, interactions, world } = useSkyScene({
    graph,
    fullViewport,
    focusKey,
  });
  const titleId = 'constellation-title';
  const traveling = walk.heading !== null;
  const dusk = useDusk(hour?.current);

  return (
    <nav
      ref={parallaxRef}
      aria-labelledby={titleId}
      data-dusk={dusk ? 'true' : undefined}
      className={cn('constellation-frame relative isolate overflow-hidden', className)}
    >
      <h2 id={titleId} className="sr-only">
        {skyTitle(graph.nodes.length)}
      </h2>
      <WebGLFirmament
        graph={graph}
        activeKey={attentionKeyOf(walk)}
        present={world.present}
        fullViewport={fullViewport}
      />
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio={fullViewport ? 'xMidYMid slice' : 'xMidYMid meet'}
        data-traveling={traveling ? 'true' : undefined}
        onClick={interactions.onSkyClick}
        onKeyDown={travel.onKeyDown}
        onPointerDown={interactions.onPointerDown}
        {...travel.pointerHandlers}
        className={cn('constellation relative block w-full', fullViewport && 'h-full')}
      >
        <ConstellationFilters />
        <g className="constellation-parallax--firmament">
          <Firmament size={VIEWBOX} />
        </g>
        <g className="constellation-parallax--sky">
          <g ref={cameraRef} className="constellation-camera">
            <Stage world={world} interactions={interactions.stage} glyphRef={glyphRef} />
          </g>
        </g>
      </svg>
      {/* The sunset, gathered at the daystar's seat, for the dusk's 1.8s
          (tokens.css §"The dusk"). */}
      <div aria-hidden="true" className="constellation-dusk" />
      <Daystar hour={hour} />
      <SkyWhisper
        place={whisperPlaceOf(graph, walk.here)}
        bearings={bearingsOf(graph, walk.here)}
        concordant={whisperConcordantOf(graph, walk.here)}
        onBearing={travel.travelTo}
        onAttend={walk.attendFacet}
        traveling={traveling}
        className="absolute right-6 bottom-16 left-6 z-10 sm:right-auto sm:bottom-6"
      />
    </nav>
  );
}
