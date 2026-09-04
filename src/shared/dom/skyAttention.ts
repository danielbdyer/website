// The pointer's attention, written to the page directly. Hovering a
// star lights it and the threads that meet it; hovering a thread or a
// name at the rim lights its axis's whole figure and its name. None of
// it passes through React: a hover is a change of attention, not a
// change of the sky, and at a vault's density re-rendering every star
// and thread to light one of them was the whole frame budget
// (CONSTELLATION_ARCHITECTURE.md §"The shell"). React still writes the
// same attributes for what it owns — here, the intent, the whisper's
// attended axis — so a mark remembers what it found and puts it back.

const remembered = new WeakMap<Element, string | null>();

function light(el: Element, attribute: string): void {
  if (!remembered.has(el)) remembered.set(el, el.getAttribute(attribute));
  el.setAttribute(attribute, 'true');
}

function dim(el: Element, attribute: string): void {
  const before = remembered.get(el);
  remembered.delete(el);
  if (before === undefined || before === null) el.removeAttribute(attribute);
  else el.setAttribute(attribute, before);
}

function starOf(cameraGroup: Element, key: string): Element | null {
  return cameraGroup.querySelector(`[data-node-key="${key}"] .constellation-star`);
}

function threadsOf(cameraGroup: Element, ids: readonly string[]): readonly Element[] {
  return ids.flatMap((id) => {
    const el = cameraGroup.querySelector(`[data-thread="${id}"]`);
    return el ? [el] : [];
  });
}

/** Move the star hover from `previous` to `next`: the star itself and
 *  the threads that meet it (`adjacency`, by node key) carry
 *  data-hover, which CSS lights as it lights data-active. */
export function hoverStar(
  cameraGroup: Element,
  adjacency: ReadonlyMap<string, readonly string[]>,
  previous: string | null,
  next: string | null,
): void {
  if (previous === next) return;
  if (previous !== null) {
    const star = starOf(cameraGroup, previous);
    if (star) dim(star, 'data-hover');
    for (const el of threadsOf(cameraGroup, adjacency.get(previous) ?? [])) {
      dim(el, 'data-hover');
    }
  }
  if (next !== null) {
    const star = starOf(cameraGroup, next);
    if (star) light(star, 'data-hover');
    for (const el of threadsOf(cameraGroup, adjacency.get(next) ?? [])) {
      light(el, 'data-hover');
    }
  }
}

/** Move the thread hover from one thread group to another: the group
 *  under the pointer carries data-hover, as a hovered star's threads
 *  do. Under the atmosphere this is what shows its SVG hairline. */
export function hoverThread(previous: Element | null, next: Element | null): void {
  if (previous === next) return;
  if (previous) dim(previous, 'data-hover');
  if (next) light(next, 'data-hover');
}

/** Move the axis hover from `previous` to `next`: the figure's threads
 *  carry data-lit and the name at the rim data-attended — the same
 *  marks the whisper's attention sets through React. */
export function hoverAxis(
  cameraGroup: Element,
  previous: string | null,
  next: string | null,
): void {
  if (previous === next) return;
  if (previous !== null) {
    for (const el of cameraGroup.querySelectorAll(`[data-thread][data-axis="${previous}"]`)) {
      dim(el, 'data-lit');
    }
    for (const el of cameraGroup.querySelectorAll(`[data-compass="${previous}"]`)) {
      dim(el, 'data-attended');
    }
  }
  if (next !== null) {
    for (const el of cameraGroup.querySelectorAll(`[data-thread][data-axis="${next}"]`)) {
      light(el, 'data-lit');
    }
    for (const el of cameraGroup.querySelectorAll(`[data-compass="${next}"]`)) {
      light(el, 'data-attended');
    }
  }
}
