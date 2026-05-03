// Shared signal for the constellation's atmospheric scene — the per-
// star data the WebGL firmament reads each render frame to paint
// halos, twinkle, and the slow life of the sky around the visitor.
//
// Two clocks meet here. The skyProjector ticks the visitor's surface-
// frame: each RAF it rewrites every star's screen position (the
// orbital camera moves, the heavens rotate). The firmament ticks
// the paint frame: each RAF it reads the latest scene and updates
// shader uniforms. Like `constellationCursor`, this module is the
// seam where the two loops trade values without coupling their
// lifetimes.
//
// Layout: a single `Float32Array` of `vec4` per star —
//   [x, y, hueIndex, phase]
// The first two floats are the per-frame writes; the last two are
// set once at mount (when the graph is known) and never touched on
// the hot path. Packing them together keeps the shader's iteration
// tight (one uniform array, one stride) and lets the writer touch
// only the slots it owns.
//
// CONSTELLATION_HORIZON.md §"Atmospheric layer ← AtmosphericScene"
// names the contract this is the first form of: positions, hues,
// twinkle phases. The polestar's position is implicit — it sits at
// the viewport's center under the orbital camera and the projector
// rotates everything else around it — so the shader paints the
// polestar wash at vUv=(0.5, 0.5) without needing a uniform.

/** Capacity of the per-star buffer. Production today is ~16 stars;
 *  the harness's heavy fixture is ~50; 64 leaves room for the
 *  corpus to grow without forcing a rebuild of the data layout.
 *  Star counts above 64 are silently truncated — extreme density
 *  belongs to a future data-texture path, held until the surface
 *  earns it. */
export const ATMOSPHERIC_STAR_CAPACITY = 64;

/** Floats per star slot in the interleaved buffer:
 *    0: x  — normalized cursor-space [-1, 1]
 *    1: y  — normalized cursor-space [-1, 1] (+y up, shader convention)
 *    2: hueIndex — 0..3, indexes into the hue palette
 *    3: phase   — seconds offset, drives the per-star twinkle */
export const STAR_STRIDE = 4;

const buffer = new Float32Array(ATMOSPHERIC_STAR_CAPACITY * STAR_STRIDE);
let starCount = 0;

export interface AtmosphericScene {
  /** Read-only view of the interleaved buffer. The caller must not
   *  mutate; the writer methods own the slots. */
  readonly buffer: Float32Array;
  /** Number of valid star slots — entries [0, count) hold real
   *  data; the rest are stale. The shader iterates [0, count). */
  readonly count: number;
}

/** Snapshot of the current scene. Returns the live buffer rather
 *  than copying — the consumer (the WebGL render loop) reads on
 *  every frame and a per-frame allocation here would defeat the
 *  whole point of the shared-buffer pattern. */
export function getAtmosphericScene(): AtmosphericScene {
  return { buffer, count: starCount };
}

/** Set the static metadata for each star — the per-star hue and
 *  twinkle phase. Called once at mount when the graph is known.
 *  Positions are zeroed; the projector fills them on the next tick.
 *  Counts beyond capacity are clamped silently. */
export function setAtmosphericStarMetadata(
  metadata: readonly { readonly hueIndex: number; readonly phase: number }[],
): void {
  const next = Math.min(metadata.length, ATMOSPHERIC_STAR_CAPACITY);
  for (let i = 0; i < next; i += 1) {
    const entry = metadata[i];
    if (!entry) continue;
    const slot = i * STAR_STRIDE;
    buffer[slot] = 0;
    buffer[slot + 1] = 0;
    buffer[slot + 2] = entry.hueIndex;
    buffer[slot + 3] = entry.phase;
  }
  // Zero the tail so a shrunken graph doesn't leak old values.
  for (let i = next; i < ATMOSPHERIC_STAR_CAPACITY; i += 1) {
    const slot = i * STAR_STRIDE;
    buffer[slot] = 0;
    buffer[slot + 1] = 0;
    buffer[slot + 2] = 0;
    buffer[slot + 3] = 0;
  }
  starCount = next;
}

/** Per-frame write of one star's normalized screen position. The
 *  projector calls this once per node per RAF tick alongside the
 *  SVG transform write. Out-of-range slots are no-ops. */
export function setAtmosphericStarPosition(index: number, x: number, y: number): void {
  if (index < 0 || index >= ATMOSPHERIC_STAR_CAPACITY) return;
  const slot = index * STAR_STRIDE;
  buffer[slot] = x;
  buffer[slot + 1] = y;
}

/** Test-only helper. Reset the buffer and count between unit tests
 *  so one test's metadata write doesn't leak into the next. */
export function resetAtmosphericScene(): void {
  buffer.fill(0);
  starCount = 0;
}
