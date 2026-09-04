import { describe, expect, test } from 'vitest';
import { figure, sky, star } from '@/test/sky-graph';
import { geodesicDistance } from '@/shared/geometry/sphere';
import { toViewbox } from '@/shared/geometry/viewbox';
import { advance, cameraOf, initialMotion, type Motion } from './motion';
import { grab, handOf, moveHand, releaseHand, tracksFrom, type Viewport } from './hand';

// Here at the center; a neighbor east along a craft thread, and a third
// star beyond it on the same line; a stranger north-west with no thread
// to here.
const GRAPH = sky(
  [
    star('studio/here', ['craft'], 0, 0.2),
    star('studio/east', ['craft'], 0, 0.6),
    star('garden/stranger', ['beauty'], 135, 0.5),
    star('studio/beyond', ['craft'], 0, 0.85),
  ],
  [figure('studio/here', 'studio/east', 'craft')],
);
const HERE = GRAPH.nodes[0]!.unitPosition;
const VIEWPORT: Viewport = { size: 1000, scale: 1 };

const resting = (): Motion => advance(initialMotion('studio/here', HERE, 3.85), 16).motion;
const pointer = (x: number, y: number, id = 1) => ({ id, x, y });

function screenOf(motion: Motion, key: string) {
  const node = GRAPH.nodes.find((n) => n.key === key)!;
  const { camera, basis } = cameraOf(motion);
  return toViewbox(node.unitPosition, camera, basis, VIEWPORT.size);
}

describe('hand — taking hold', () => {
  test('a press holds the sky but does not engage; a tap lets go with nothing changed', () => {
    const held = grab(resting(), pointer(500, 500), 0);
    expect(handOf(held)?.engaged).toBe(false);
    const small = moveHand(held, pointer(503, 502), GRAPH, VIEWPORT, 10).motion;
    expect(handOf(small)?.engaged).toBe(false);
    const { motion, events } = releaseHand(small, 1, GRAPH, false, 20);
    expect(motion.phase.kind).toBe('rest');
    expect(events).toEqual([]);
  });

  test('the tracks from here lead to the neighbor and the bearing ends, laid out on screen', () => {
    const tracks = tracksFrom(resting(), GRAPH, VIEWPORT.size);
    const east = tracks.find((t) => t.toPlace === 'studio/east');
    expect(east?.alongEdgeId).toBe('studio/here|studio/east|craft');
    expect(east!.dirX).toBeGreaterThan(0.9);
    expect(east!.length).toBeGreaterThan(50);
  });
});

describe('hand — following', () => {
  test('pulling against the neighbor’s direction takes its track and brings it toward the center', () => {
    const motion = resting();
    const east = screenOf(motion, 'studio/east');
    const distance = east.x - 500;
    const held = grab(motion, pointer(500, 500), 0);
    // The sky follows the finger: the finger moves left to bring the east star in.
    const moved = moveHand(held, pointer(500 - distance * 0.6, 500), GRAPH, VIEWPORT, 50).motion;
    const hand = handOf(moved)!;
    expect(hand.engaged).toBe(true);
    expect(hand.track?.toPlace).toBe('studio/east');
    expect(hand.t).toBeCloseTo(0.6, 1);
    expect(screenOf(moved, 'studio/east').x - 500).toBeLessThan(distance * 0.5);
  });

  test('off every track the sky follows at the play, not one to one', () => {
    const motion = resting();
    const held = grab(motion, pointer(500, 500), 0);
    // Straight down: no thread leaves here that way.
    const moved = moveHand(held, pointer(500, 640), GRAPH, VIEWPORT, 50).motion;
    const hand = handOf(moved)!;
    expect(hand.track).toBeNull();
    const shift = screenOf(moved, 'studio/here').y - 500;
    expect(shift).toBeGreaterThan(140 * 0.4);
    expect(shift).toBeLessThan(140 * 0.9);
  });

  test('the star nearest the center becomes the intent, and the walk hears when it changes', () => {
    const motion = resting();
    const stranger = screenOf(motion, 'garden/stranger');
    const held = grab(motion, pointer(500, 500), 0);
    // Off every track the sky follows at the play, so the hand goes a
    // little further than the star's own offset to bring it in.
    const toward = moveHand(
      held,
      pointer(500 + (500 - stranger.x) * 1.35, 500 + (500 - stranger.y) * 1.35),
      GRAPH,
      VIEWPORT,
      50,
    );
    expect(toward.events).toEqual([{ kind: 'aimed', place: 'garden/stranger' }]);
    const again = moveHand(
      toward.motion,
      pointer(500 + (500 - stranger.x) * 1.37, 500 + (500 - stranger.y) * 1.37),
      GRAPH,
      VIEWPORT,
      66,
    );
    expect(again.events).toEqual([]);
  });
});

describe('hand — letting go', () => {
  test('a hand carried past the neighbor to the third star on the line settles on the third', () => {
    const motion = resting();
    const beyond = screenOf(motion, 'studio/beyond').x - 500;
    const moved = moveHand(
      grab(motion, pointer(500, 500), 0),
      pointer(500 - beyond, 500),
      GRAPH,
      VIEWPORT,
      50,
    ).motion;
    const hand = handOf(moved)!;
    expect(hand.track?.toPlace).toBe('studio/east');
    expect(hand.t).toBeGreaterThan(1);
    expect(hand.intent).toBe('studio/beyond');
    const { motion: released } = releaseHand(moved, 1, GRAPH, false, 60);
    expect(released.phase.kind === 'settle' && released.phase.settle.place).toBe('studio/beyond');
  });

  test('release past the midpoint of a track settles onto its star, walking the thread', () => {
    const motion = resting();
    const distance = screenOf(motion, 'studio/east').x - 500;
    const moved = moveHand(
      grab(motion, pointer(500, 500), 0),
      pointer(500 - distance * 0.8, 500),
      GRAPH,
      VIEWPORT,
      50,
    ).motion;
    const { motion: released } = releaseHand(moved, 1, GRAPH, false, 60);
    expect(released.phase.kind).toBe('settle');
    if (released.phase.kind !== 'settle') return;
    expect(released.phase.settle.place).toBe('studio/east');
    expect(released.phase.settle.alongEdgeId).toBe('studio/here|studio/east|craft');
    expect(released.releasedAt).toBe(60);
  });

  test('release with nothing in reach springs home; cancelled always does', () => {
    const motion = resting();
    const moved = moveHand(
      grab(motion, pointer(500, 500), 0),
      pointer(500, 560),
      GRAPH,
      VIEWPORT,
      50,
    );
    const home = releaseHand(moved.motion, 1, GRAPH, false, 60).motion;
    expect(home.phase.kind).toBe('settle');
    if (home.phase.kind === 'settle') {
      expect(home.phase.settle.place).toBeNull();
      expect(geodesicDistance(home.phase.settle.to, HERE)).toBe(0);
    }
    const aimed = moveHand(
      grab(motion, pointer(500, 500), 0),
      pointer(500 - (screenOf(motion, 'studio/east').x - 500) * 0.8, 500),
      GRAPH,
      VIEWPORT,
      50,
    ).motion;
    const cancelled = releaseHand(aimed, 1, GRAPH, true, 60).motion;
    expect(cancelled.phase.kind === 'settle' && cancelled.phase.settle.place).toBeNull();
  });
});
