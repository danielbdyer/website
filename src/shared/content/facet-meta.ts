import type { Facet } from '@/shared/types/common';

// Display copy for each facet — the title-cased name a visitor reads,
// and a short description lifted (and lightly smoothed) from
// DOMAIN_MODEL.md §"The eight". The name lives here rather than being
// derived from the facet key so that future facet copy changes (the
// site has a closed-but-evolvable facet set) don't ripple through
// JSX. VOICE_AND_COPY.md §"Facet pages" governs the voice register.
export interface FacetMeta {
  readonly label: string;
  readonly description: string;
}

export const FACET_META: Readonly<Record<Facet, FacetMeta>> = {
  craft: {
    label: 'Craft',
    description:
      'How things are made. The care in the making. Technique, tools, the hand and the material.',
  },
  consciousness: {
    label: 'Consciousness',
    description: 'Awareness, interiority, presence. The inner life examined.',
  },
  language: {
    label: 'Language',
    description: 'Words as medium, as music, as meaning-making. The love of what language can do.',
  },
  leadership: {
    label: 'Leadership',
    description:
      'Building containers for others. Management philosophy, organizational thinking, the craft of leading.',
  },
  beauty: {
    label: 'Beauty',
    description: 'The aesthetic dimension. What moves us and why. Not decoration — encounter.',
  },
  becoming: {
    label: 'Becoming',
    description:
      'The autotelic unfolding of personhood over time. The forward motion of a person revealing themselves to themselves.',
  },
  relation: {
    label: 'Relation',
    description:
      'The space between. Authentic relating, management-as-container, meaning-philosophy. The interpersonal ground where two can become.',
  },
  body: {
    label: 'Body',
    description:
      'Muscle memory before thought. The gymnast, the stutterer who found theater. Consciousness without body floats — this is the ground.',
  },
};
