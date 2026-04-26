import { QuietCaption, CaptionRise, Flip, Jacket, BookCover, HeroMorph } from './treatments';

// The prototype gallery's roster. Order matters — the Salon route maps
// works to treatments by index. Once a treatment is chosen, this file
// collapses to that single export and the gallery wiring goes away.
export const TREATMENTS = [
  { name: 'quiet caption', component: QuietCaption },
  { name: 'caption rise', component: CaptionRise },
  { name: 'flip', component: Flip },
  { name: 'record jacket', component: Jacket },
  { name: 'book cover', component: BookCover },
  { name: 'hero morph', component: HeroMorph },
] as const;
