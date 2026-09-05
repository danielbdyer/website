import { describe, expect, it } from 'vitest';
import { groundingIssues } from '@dbd/slice';
import { sliceFromVault, splitFrontmatter, wikilinks, type VaultFile } from './index';

const AT = '2026-09-04T00:00:00.000Z';

const note = (path: string, frontmatter: string, body = ''): VaultFile => ({
  path,
  text: `---\n${frontmatter}\n---\n${body}`,
});

const VAULT: readonly VaultFile[] = [
  note('notes/index.md', 'description: the hub\ntype: moc\ntopics: ["[[index]]"]', '# index\n'),
  note(
    'notes/recognition.md',
    'description: truth as un-forgetting\ntype: moc\ntopics: ["[[index]]"]',
    '# recognition\n- [[reading is remembering]]\n',
  ),
  note(
    'notes/felt-shift.md',
    'description: the verification standard\ntype: moc\ntopics: ["[[index]]"]',
  ),
  note(
    'notes/reading is remembering.md',
    'description: "The front matter states the doctrine: you already know everything in this book."\ncategory: claim\ntopics: ["[[recognition]]"]\nstate: full\ncreated: 2026-08-02',
    '# reading is remembering\n\nSee [[a claim counts when it checks out somatically]], [[Recognition]], and [[a missing note]].\n',
  ),
  note(
    'notes/a claim counts when it checks out somatically.md',
    'description: A claim is verified in the body.\ncategory: claim\ntopics: ["[[felt-shift]]", "[[recognition]]"]\nstate: nascent',
    'Back to [[reading is remembering|the doctrine]] and [[reading is remembering#Substantiation]].\n',
  ),
  note(
    'notes/unparseable.md',
    'description: a statement: with a colon\ncategory: image\ntopics: ["[[recognition]]"]',
    'body\n',
  ),
  { path: 'inbox/a fresh capture.md', text: 'a thought\n' },
  { path: 'ops/goals.md', text: 'not a note\n' },
  { path: 'sources/the poems.pdf', text: '' },
];

describe('splitFrontmatter', () => {
  it('separates the frontmatter from the body', () => {
    const { frontmatter, body } = splitFrontmatter('---\na: 1\nb: [x]\n---\nthe body\n');
    expect(frontmatter).toEqual({ a: 1, b: ['x'] });
    expect(body).toBe('the body\n');
  });

  it('reads a note without frontmatter, and one whose frontmatter will not parse, as bodies', () => {
    expect(splitFrontmatter('just text').frontmatter).toEqual({});
    const broken = splitFrontmatter('---\ndescription: a: b\n---\nbody');
    expect(broken.frontmatter).toEqual({});
    expect(broken.body).toBe('body');
  });
});

describe('wikilinks', () => {
  it('finds targets, dropping aliases and heading anchors', () => {
    expect(wikilinks('see [[a note]], [[b note|alias]], [[c note#heading]] and [[ d ]]')).toEqual([
      'a note',
      'b note',
      'c note',
      'd',
    ]);
  });
});

describe('sliceFromVault', () => {
  const slice = sliceFromVault(VAULT, { space: 'book', asOf: AT });

  it('takes the topic maps as the compass, evenly spaced, the hub excluded', () => {
    expect(slice.axes).toEqual([
      { id: 'felt-shift', name: 'felt-shift', azimuthDeg: 0 },
      { id: 'recognition', name: 'recognition', azimuthDeg: 180 },
    ]);
  });

  it('takes the claims as nodes placed by their maps, with description, category, and state', () => {
    expect(slice.nodes.map((n) => n.id)).toEqual([
      'a claim counts when it checks out somatically',
      'reading is remembering',
      'unparseable',
    ]);
    expect(slice.nodes[1]).toEqual({
      id: 'reading is remembering',
      title: 'reading is remembering',
      kind: 'claim',
      axes: ['recognition'],
      summary: 'The front matter states the doctrine: you already know everything in this book.',
      createdAt: '2026-08-02T00:00:00.000Z',
      status: 'full',
    });
    expect(slice.nodes[0]?.axes).toEqual(['felt-shift', 'recognition']);
    expect(slice.nodes[0]?.status).toBe('nascent');
    expect(slice.nodes[0]?.createdAt).toBe(AT);
  });

  it('keeps a note whose frontmatter will not parse, as a note with no axes', () => {
    expect(slice.nodes[2]).toEqual({
      id: 'unparseable',
      title: 'unparseable',
      kind: 'note',
      axes: [],
      createdAt: AT,
    });
  });

  it('carries the wiki links between claims as declared references, grounded and deduplicated', () => {
    expect(slice.edges).toEqual([
      {
        subject: 'a claim counts when it checks out somatically',
        predicate: 'references',
        object: 'reading is remembering',
        origin: 'declared',
      },
      {
        subject: 'reading is remembering',
        predicate: 'references',
        object: 'a claim counts when it checks out somatically',
        origin: 'declared',
      },
    ]);
    expect(groundingIssues(slice)).toEqual([]);
  });

  it('reads the inbox as pending: ghosts the sky may draw', () => {
    expect(slice.pending).toEqual({
      unresolved: 1,
      ghosts: [{ id: 'a fresh capture', operation: 'create_entity', title: 'a fresh capture' }],
    });
  });

  it('is deterministic in its input', () => {
    expect(sliceFromVault([...VAULT].toReversed(), { space: 'book', asOf: AT })).toEqual(slice);
  });
});
