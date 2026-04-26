export type Room = 'foyer' | 'studio' | 'garden' | 'study' | 'salon';

export type Facet =
  | 'craft'
  | 'consciousness'
  | 'language'
  | 'leadership'
  | 'beauty'
  | 'becoming'
  | 'relation'
  | 'body';

// Posture is Salon-room-specific: the stance of attention from which a
// salon work was made. Listening is for music; looking is for visual art;
// reading is reading-about-listening-and-looking. See DOMAIN_MODEL.md
// §"Postures (Salon)" for why this is its own axis rather than a facet.
export type Posture = 'listening' | 'looking' | 'reading';

// The kind of external creative work a salon entry refers to. This
// composes with `posture` on the authoring side and with Schema.org
// `about` on the structured-data side: a `looking` work usually points
// at a `visual-artwork`, a `listening` work at a music form, a `reading`
// work at a book or article. The mapping is editorial, not enforced.
export type ReferentType =
  | 'visual-artwork'
  | 'music-composition'
  | 'music-album'
  | 'music-recording'
  | 'book'
  | 'article'
  | 'movie';
