import type { Work } from './schema';

export const SAMPLE_ROOM_NOTE =
  '[Sample preview entries fill this room until authored works arrive.]';

export const SAMPLE_WORK_NOTE =
  '[Sample preview only. It disappears as soon as this room has authored work.]';

export interface PreviewMeta {
  kind: 'sample';
  roomNote: string;
  workNote: string;
  /**
   * Honest stand-in label for an attached image while the live image
   * isn't on the page yet. Lowercase — reads as annotation, not attempt.
   * Independent of `Work.image` (which is the real image when authored).
   */
  thumbLabel?: string | undefined;
}

export type DisplayWork = Work & {
  preview?: PreviewMeta;
};

export function isPreviewWork(work: DisplayWork): work is DisplayWork & { preview: PreviewMeta } {
  return work.preview?.kind === 'sample';
}
