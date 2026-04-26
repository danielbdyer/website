import { marked } from 'marked';
import type { Room, Facet, Posture } from '@/shared/types/common';
import type { WorkImage, WorkReferent, WorkType } from '@/shared/content/schema';
import {
  SAMPLE_ROOM_NOTE,
  SAMPLE_WORK_NOTE,
  type DisplayWork,
  type PreviewMeta,
} from '@/shared/content/preview';

type PreviewRoom = Exclude<Room, 'foyer'>;

interface PreviewSeed {
  room: PreviewRoom;
  slug: string;
  title: string;
  date: string;
  summary?: string;
  facets?: Facet[];
  type?: WorkType;
  posture?: Posture;
  image?: WorkImage;
  referent?: WorkReferent;
  feature?: boolean;
  body: string;
  thumbLabel?: string;
}

function makePreviewMeta(seed: PreviewSeed): PreviewMeta {
  return {
    kind: 'sample',
    roomNote: SAMPLE_ROOM_NOTE,
    workNote: SAMPLE_WORK_NOTE,
    thumbLabel: seed.thumbLabel,
  };
}

function makePreviewWork(seed: PreviewSeed): DisplayWork {
  const breaks = seed.type === 'poem';
  return {
    title: seed.title,
    date: new Date(seed.date),
    summary: seed.summary,
    facets: seed.facets ?? [],
    type: seed.type,
    posture: seed.posture,
    image: seed.image,
    referent: seed.referent,
    feature: seed.feature ?? false,
    draft: false,
    room: seed.room,
    slug: seed.slug,
    body: seed.body,
    html: marked.parse(seed.body, { async: false, breaks }),
    preview: makePreviewMeta(seed),
  };
}

const previewWorksByRoom: Record<PreviewRoom, DisplayWork[]> = {
  studio: [
    makePreviewWork({
      room: 'studio',
      slug: 'containers-not-pipelines',
      title: 'Containers, not pipelines',
      date: '2026-02-04',
      summary:
        "A platform team is a place where other people's work lands. The metaphor matters: pipelines push, containers hold.",
      facets: ['craft', 'leadership', 'relation'],
      type: 'essay',
      feature: true,
      body: `A platform team becomes legible when it stops mistaking motion for care. Pipelines optimize for throughput; containers optimize for arrival. One tells work where to go next. The other makes a place where work can settle long enough to become coherent.

The distinction changes how a team writes documentation, reviews interfaces, and responds when another team arrives with half-shaped needs. A container is not passive. It has edges, expectations, and a held temperature. But its first gesture is hospitality rather than acceleration.

When I say "container," I do not mean softness without structure. I mean a structure strong enough to receive what is not finished yet without shaming it for being unfinished.`,
    }),
    makePreviewWork({
      room: 'studio',
      slug: 'smallest-version-that-can-be-real',
      title: 'The smallest version that can be real',
      date: '2025-11-12',
      summary:
        'Notes on shipping, on enough, on the practice of choosing a thing small enough to actually finish.',
      facets: ['craft', 'becoming'],
      type: 'note',
      body: `The smallest real version of a thing is not the tiniest version you can describe. It is the smallest version that still teaches you something true.

That usually means trimming ceremony rather than substance. Fewer screens. Fewer conditions. Fewer promises about what will happen later. If the thing cannot withstand being small, it was probably scaffolding around an unchosen center.

Finishing that version is not a consolation prize. It is how the work reveals its next honest size.`,
    }),
    makePreviewWork({
      room: 'studio',
      slug: 'one-on-ones-as-listening-surfaces',
      title: 'One-on-ones as listening surfaces',
      date: '2025-08-28',
      summary:
        "The meeting's job is not to extract status. Its job is to be a room someone can finally say what is actually wrong in.",
      facets: ['leadership', 'relation', 'consciousness'],
      type: 'essay',
      body: `Most one-on-ones fail because they are secretly status meetings wearing kinder clothes. They ask for updates, reassure a little, and end before anything risky has entered the room.

Listening changes the geometry. If the other person believes they have to arrive organized, the meeting will only ever receive what is already safe to say. A listening surface lowers the cost of emergence. It invites half-language, hesitation, and the sentence that only appears once someone feels accompanied.

That is managerial work too. Not instead of clarity, but before clarity has become available.`,
    }),
    makePreviewWork({
      room: 'studio',
      slug: 'the-shape-of-a-good-morning',
      title: 'The shape of a good morning',
      date: '2025-05-16',
      summary:
        'A diagram of the first hour: what gets attention, what gets refused, and what is already in the desk before anyone else arrives.',
      facets: ['craft', 'body'],
      type: 'note',
      body: `A good morning is not a productivity ritual. It is a threshold with enough form that your mind does not have to invent one while still half asleep.

Mine usually begins with one page of rereading: the thread I am already in, the unanswered question that still has heat, the one thing I promised myself I would touch before messages begin arranging my attention for me.

The shape matters because the day inherits it. If the first hour is porous in the wrong places, the rest of the work arrives already negotiated away.`,
    }),
  ],
  garden: [
    makePreviewWork({
      room: 'garden',
      slug: 'inheritance-in-three-movements',
      title: 'Inheritance, in three movements',
      date: '2026-03-14',
      facets: ['language', 'becoming', 'body'],
      type: 'poem',
      feature: true,
      body: `I.

My mother's left hand,
before it knew the cello's neck,
knew the shape of a bow held in waiting.

The wood remembers her
the way I remember the kitchen at six in the morning,
not the room, the warmth.

II.

What I inherited was not music.
It was the daily returning.
The willingness
to begin again at a thing already begun.

III.

The cello knew their hands
before their minds caught up.
I am still waiting for my hands to know.

And in the meantime, this:
the willingness, the kitchen, the warmth,
the long instrument of paying attention.`,
    }),
    makePreviewWork({
      room: 'garden',
      slug: 'what-the-cello-knew-before-the-hands',
      title: 'What the cello knew before the hands',
      date: '2026-01-09',
      facets: ['beauty', 'body', 'language'],
      type: 'poem',
      body: `The instrument knew first.

Not my name,
not whether I was ready,
only the pressure
of wood against shoulder
and the small correction
that turned strain into tone.

Sometimes I think learning
is only this:
the body receiving
what the mind will later
call understanding.`,
    }),
    makePreviewWork({
      room: 'garden',
      slug: 'enough-a-small-psalm',
      title: 'Enough — a small psalm',
      date: '2025-10-21',
      facets: ['becoming', 'consciousness'],
      type: 'poem',
      body: `Enough is not abundance.
It is the soft edge
where hunger stops pretending
it is holiness.

Enough is a table
cleared with time enough to sit.
Enough is finishing
before the soul sours.

Enough is small
and therefore hard to worship.
Still, I am learning its name.`,
    }),
    makePreviewWork({
      room: 'garden',
      slug: 'the-room-you-almost-made',
      title: 'The room you almost made',
      date: '2025-06-03',
      facets: ['craft', 'beauty'],
      type: 'poem',
      body: `You left the wall unpainted
long enough for afternoon
to teach it a color.

I have loved rooms like that:
nearly finished,
still porous to weather,
still willing to be altered
by the hour entering.

What you almost made
was a chapel for revision.
What remained
was mercy.`,
    }),
    makePreviewWork({
      room: 'garden',
      slug: 'a-morning-in-which-nothing-arrived',
      title: 'A morning in which nothing arrived',
      date: '2025-04-17',
      facets: ['consciousness', 'language'],
      type: 'poem',
      body: `No insight.
No opening sentence.
No bright visitation.

Only the chair,
the page,
the mild weather
touching the window.

I stayed.

By noon
that had become
its own kind of poem.`,
    }),
  ],
  study: [
    makePreviewWork({
      room: 'study',
      slug: 'devotion-without-a-visible-floor',
      title: 'Devotion without a visible floor',
      date: '2026-03-01',
      summary:
        'My parents practiced cello daily. The instrument knew their hands before their minds caught up.',
      facets: ['becoming', 'body', 'consciousness'],
      type: 'essay',
      body: `My parents practiced every day. I do not mean they cherished music in the abstract. I mean they returned to a room, opened cases, tuned strings, and gave an hour to something that would not always reward them in proportion to the giving.

As a child, I mistook that consistency for personality. Only later did I understand it as devotion: not dramatic, not announced, not even especially expressive. Just the willingness to make the same faithful gesture again before mood had granted permission.

I keep circling the question of what a devotion rests on when no visible floor appears beneath it. Sometimes the answer is belief. Sometimes it is lineage. Sometimes it is only that the hands have learned more quickly than the mind and are already kneeling where the mind still stands.`,
    }),
    makePreviewWork({
      room: 'study',
      slug: 'spanda-waiting-for-the-tremor',
      title: 'Spanda — waiting for the tremor',
      date: '2025-12-07',
      summary:
        'A small idea from Kashmir Shaivism: the sacred vibration that precedes movement. A practice of not deciding until the material is ready to be decided.',
      facets: ['consciousness', 'craft'],
      type: 'essay',
      body: `Spanda names a subtle vibration before action resolves into form. I return to it whenever I am tempted to force a decision for the relief of having decided.

There is a kind of builder's panic that mistakes readiness for speed. If the next move has not cohered, we lunge anyway and call the lunge discipline. Spanda offers another picture. Not passivity. Not delay as posture. A tuned waiting in which sensation, intuition, and material all get to become intelligible to one another.

This matters in writing, in leadership, in intimacy. The thing is often trying to say what it wants to be before we name it on its behalf.`,
    }),
    makePreviewWork({
      room: 'study',
      slug: 'the-stutter-the-stage-and-being-inhabited',
      title: 'The stutter, the stage, and being inhabited',
      date: '2025-07-18',
      summary:
        'Fluency is not the absence of impediment. It is the willingness to be moved through.',
      facets: ['language', 'body', 'becoming'],
      type: 'essay',
      body: `A stutter teaches you that speech is bodily before it is semantic. The mouth does not merely deliver thought. It reveals whether thought has arrived accompanied.

Theatre changed the equation for me because the body was finally allowed to mean before it was required to report. Rhythm, gesture, breath, cue, relation: the sentence no longer had to leave me alone to make its crossing.

I still think about fluency as inhabitation rather than control. What if the goal is not to eliminate obstruction but to become roomy enough that language can pass through without turning every threshold into a test of worth?`,
    }),
    makePreviewWork({
      room: 'study',
      slug: 'the-quiet-room-with-good-light',
      title: 'The quiet room with good light',
      date: '2025-05-03',
      summary:
        'On why some thinking only becomes available after the room has proved it is not in a hurry.',
      facets: ['consciousness', 'relation'],
      type: 'note',
      body: `Some thoughts are social climbers. They appear quickly, dress well, and know how to survive being overheard. Others need a quieter architecture.

The quiet room with good light is my name for any environment that lets a slower intelligence come forward. A notebook before breakfast. A long walk without an audio track. A conversation that leaves enough silence between sentences for the hidden thing to risk showing its face.

I trust what arrives there differently. Not because it is always better, but because it did not have to compete to exist.`,
    }),
  ],
  salon: [
    makePreviewWork({
      room: 'salon',
      slug: 'bach-suite-no-1-very-slowly',
      title: 'Bach, Suite no. 1, very slowly',
      date: '2026-02-22',
      summary:
        "What it sounds like when a phrase is allowed to take a full breath. A father's recording from the kitchen, recovered.",
      facets: ['beauty', 'body'],
      type: 'note',
      posture: 'listening',
      thumbLabel: 'bach · suite no. 1',
      referent: {
        type: 'music-composition',
        name: 'Cello Suite No. 1 in G major, BWV 1007',
        creator: { name: 'Johann Sebastian Bach' },
        year: 1717,
      },
      body: `The recording is not high fidelity. A chair scrapes somewhere in the kitchen. Someone clears a throat between movements. And still the slowness changes everything.

When the phrase is allowed to take a full breath, ornament stops functioning as decoration and starts behaving like mercy. The line has time to reveal why it turns when it turns.

I keep thinking about what else in a life could be restored by being played that slowly.`,
    }),
    makePreviewWork({
      room: 'salon',
      slug: 'klimt-the-gold-ground-what-it-knows',
      title: 'Klimt, the gold ground, what it knows',
      date: '2026-01-12',
      summary:
        'Color that does not represent light, but holds it. The surface says: what if the world were allowed to glow from within?',
      facets: ['beauty'],
      type: 'note',
      posture: 'looking',
      thumbLabel: 'klimt · gold ground',
      referent: {
        type: 'visual-artwork',
        name: 'Stoclet Frieze (gold ground, detail)',
        creator: { name: 'Gustav Klimt' },
        year: 1911,
      },
      body: `Gold in Klimt is less a color than a weather system. It changes the contract between figure and field; the body does not simply stand in space but begins radiating into it.

That matters to me because it refuses the ordinary realism of explanation. Sometimes beauty is not the accurate depiction of light. Sometimes it is the discovery that a surface can become a source.

What I leave with is not symbolism so much as permission: the world does not always have to be lit from somewhere else.`,
    }),
    makePreviewWork({
      room: 'salon',
      slug: 'arvo-part-and-the-room-between-notes',
      title: 'Arvo Pärt and the room between notes',
      date: '2025-11-30',
      summary:
        'Tintinnabuli is a small theology of restraint. The bell, and the air the bell hangs in.',
      facets: ['beauty', 'consciousness'],
      type: 'note',
      posture: 'listening',
      thumbLabel: 'part · tintinnabuli',
      referent: {
        type: 'music-composition',
        name: 'Spiegel im Spiegel',
        creator: { name: 'Arvo Pärt' },
        year: 1978,
      },
      body: `Pärt's music makes me aware of the room around the sound as much as the sound itself. The note does not finish at its own edge. It keeps happening in the listener.

Restraint is often misunderstood as deprivation. Here it feels like concentration. Fewer materials, more consequence. Nothing is present that does not deepen the stillness.

The lesson is aesthetic and moral at once: enough form to ring, enough space to let the ringing be heard.`,
    }),
    makePreviewWork({
      room: 'salon',
      slug: 'a-small-note-on-tintinnabuli',
      title: 'A small note on tintinnabuli',
      date: '2025-10-18',
      summary:
        "A footnote, written on a Sunday. No image because there's nothing to look at — only a sound the page is trying to point at.",
      facets: ['beauty'],
      type: 'note',
      posture: 'reading',
      thumbLabel: 'score detail · tintinnabuli',
      referent: {
        type: 'book',
        name: 'Arvo Pärt: Out of Silence',
        creator: { name: 'Peter C. Bouteneff' },
        year: 2015,
      },
      body: `A page about music is always slightly embarrassed by its own insufficiency. Language can describe a pattern, a lineage, a reaction. It cannot ring.

That is part of the charm here. The note becomes an arrow more than a container. It points toward the thing it cannot house and trusts the reader to complete the journey in their own ears.

Sometimes criticism is at its best when it knows it is only a threshold.`,
    }),
    makePreviewWork({
      room: 'salon',
      slug: 'vermeer-and-the-small-balance',
      title: 'Vermeer and the small balance',
      date: '2025-09-07',
      summary:
        'A scale held in a pale hand. The most truthful thing in the painting: a roomed stillness.',
      facets: ['beauty', 'consciousness'],
      type: 'note',
      posture: 'looking',
      thumbLabel: 'vermeer · small balance',
      referent: {
        type: 'visual-artwork',
        name: 'Woman Holding a Balance',
        creator: { name: 'Johannes Vermeer' },
        year: 1664,
      },
      body: `Vermeer understands that attention can be dramatic without becoming loud. Nothing seems to happen, and yet everything in the frame is participating in the exactness of a held moment.

The balance matters because it is almost too small to notice. It asks for a finer grade of seeing than spectacle permits. The painting becomes a training ground for proportionality.

I leave wanting to make rooms where that kind of attention is possible, not only paintings about it.`,
    }),
    makePreviewWork({
      room: 'salon',
      slug: 'hockney-in-a-smaller-book',
      title: 'Hockney, in a smaller book',
      date: '2025-08-16',
      summary: 'Looking cuts a figure. The page is close enough to feel like a handheld gallery.',
      facets: ['beauty'],
      type: 'note',
      posture: 'reading',
      thumbLabel: 'hockney · a bigger book',
      referent: {
        type: 'book',
        name: 'A Bigger Book',
        creator: { name: 'David Hockney' },
        year: 2016,
      },
      body: `Reproductions shrink paintings into a domestic scale, but sometimes that shrinkage reveals a different intimacy. The book makes Hockney less mural and more conversation.

You notice sequence, recurrence, the way one chromatic decision answers another three pages later. The encounter becomes paced by turning rather than by crossing a room.

I like the reminder that scale changes genre. A small book can teach a painting to speak in another register.`,
    }),
    makePreviewWork({
      room: 'salon',
      slug: 'turner-the-parliament-burning',
      title: 'Turner, the parliament burning',
      date: '2025-06-10',
      summary:
        'What color does a building stop being a building? The painted version of a thing becoming weather.',
      facets: ['beauty', 'craft'],
      type: 'note',
      posture: 'looking',
      thumbLabel: 'turner · parliament burning',
      referent: {
        type: 'visual-artwork',
        name: 'The Burning of the Houses of Lords and Commons',
        creator: { name: 'J. M. W. Turner' },
        year: 1835,
      },
      body: `Turner turns architecture back into atmosphere. Fire eats contour, smoke eats category, and the building begins behaving like light with memory.

I am interested in the precise moment where representation yields to event. Not because depiction has failed, but because another truth has taken over: some things are more honestly rendered as force than as object.

A painting can record that crossing without pinning it down. That may be one of art's most humane capacities.`,
    }),
  ],
};

export function getPreviewWorksByRoom(room: Room): DisplayWork[] {
  if (room === 'foyer') return [];
  return previewWorksByRoom[room];
}

export function getPreviewWork(room: Room, slug: string): DisplayWork | undefined {
  return getPreviewWorksByRoom(room).find((work) => work.slug === slug);
}
