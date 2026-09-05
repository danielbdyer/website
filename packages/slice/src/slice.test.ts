import { describe, expect, it } from 'vitest';
import {
  GHOST_OPERATIONS,
  METABOLIC_STATES,
  ORIGINS,
  PREDICATES,
  SOFT_PREDICATES,
  groundingIssues,
  parseSlice,
  sliceSchema,
  type Slice,
} from './index';

const AT = '2026-09-03T12:00:00.000Z';

const axis = (id: string, azimuthDeg: number) => ({ id, name: id, azimuthDeg });
const node = (id: string, axes: string[] = []) => ({
  id,
  title: id,
  kind: 'note',
  axes,
  createdAt: AT,
});

const grounded = (): Slice => ({
  space: 'site',
  asOf: AT,
  axes: [axis('craft', 0), axis('body', 45)],
  nodes: [node('garden/a', ['craft']), node('study/b', ['body'])],
  edges: [{ subject: 'garden/a', predicate: 'references', object: 'study/b', origin: 'declared' }],
  pending: { unresolved: 0, ghosts: [] },
});

describe('the vocabularies', () => {
  it('are the engine’s, closed', () => {
    expect(ORIGINS).toEqual(['declared', 'discovered', 'emergent']);
    expect(PREDICATES).toHaveLength(8);
    expect(PREDICATES).toContain('is_a');
    expect(SOFT_PREDICATES).toEqual(['resonates']);
    expect(METABOLIC_STATES).toEqual(['nascent', 'privated', 'full', 'flourishing', 'composting']);
    expect(GHOST_OPERATIONS).toEqual(['create_entity', 'create_relation']);
  });
});

describe('a grounded slice', () => {
  it('parses to itself', () => {
    const slice = grounded();
    expect(parseSlice(slice)).toEqual(slice);
    expect(groundingIssues(slice)).toEqual([]);
  });

  it('survives the round trip through JSON', () => {
    const slice = grounded();
    const text = JSON.stringify(slice);
    expect(parseSlice(JSON.parse(text))).toEqual(slice);
  });

  it('fills in what a source may leave out: axes and ghosts', () => {
    const { axes: _axes, ...bare } = node('garden/c');
    const parsed = parseSlice({
      ...grounded(),
      nodes: [bare],
      edges: [],
      pending: { unresolved: 2 },
    });
    expect(parsed.nodes[0]?.axes).toEqual([]);
    expect(parsed.pending.ghosts).toEqual([]);
    expect(parsed.pending.unresolved).toBe(2);
  });

  it('may carry a ghost with its evidence, and a resonance that is not declared', () => {
    const parsed = parseSlice({
      ...grounded(),
      edges: [
        ...grounded().edges,
        {
          subject: 'garden/a',
          predicate: 'resonates',
          object: 'study/b',
          origin: 'emergent',
          weight: 0.42,
        },
      ],
      pending: {
        unresolved: 1,
        ghosts: [
          {
            id: 'p1',
            operation: 'create_relation',
            subject: 'garden/a',
            predicate: 'expands_on',
            object: 'study/b',
            confidence: 0.8,
            evidence: 'Both name the cello.',
          },
        ],
      },
    });
    expect(parsed.edges).toHaveLength(2);
    expect(parsed.pending.ghosts[0]?.operation).toBe('create_relation');
  });
});

describe('the invariants', () => {
  it('INV-SLC-001: an edge that names a node outside the slice is refused', () => {
    const slice: Slice = {
      ...grounded(),
      edges: [
        { subject: 'garden/a', predicate: 'references', object: 'salon/x', origin: 'declared' },
      ],
    };
    expect(groundingIssues(slice)).toEqual([
      'INV-SLC-001: edge garden/a references salon/x names a node not in the slice: salon/x',
    ]);
    expect(sliceSchema.safeParse(slice).success).toBe(false);
  });

  it('INV-SLC-002: a node that names an axis outside the slice is refused', () => {
    const slice: Slice = { ...grounded(), nodes: [node('garden/a', ['craft', 'weather'])] };
    expect(groundingIssues({ ...slice, edges: [] })).toEqual([
      'INV-SLC-002: node garden/a names an axis not in the slice: weather',
    ]);
    expect(sliceSchema.safeParse({ ...slice, edges: [] }).success).toBe(false);
  });

  it('INV-SLC-003: a resonance is never declared', () => {
    const slice: Slice = {
      ...grounded(),
      edges: [
        { subject: 'garden/a', predicate: 'resonates', object: 'study/b', origin: 'declared' },
      ],
    };
    expect(groundingIssues(slice)).toHaveLength(1);
    expect(groundingIssues(slice)[0]).toContain('INV-SLC-003');
    expect(sliceSchema.safeParse(slice).success).toBe(false);
    expect(
      sliceSchema.safeParse({ ...slice, edges: [{ ...slice.edges[0]!, origin: 'discovered' }] })
        .success,
    ).toBe(true);
  });

  it('refuses a predicate outside the closed set, and an azimuth off the compass', () => {
    expect(
      sliceSchema.safeParse({
        ...grounded(),
        edges: [
          { subject: 'garden/a', predicate: 'mentions', object: 'study/b', origin: 'declared' },
        ],
      }).success,
    ).toBe(false);
    expect(sliceSchema.safeParse({ ...grounded(), axes: [axis('craft', 360)] }).success).toBe(
      false,
    );
  });

  it('reports every issue at once, so a source can fix them together', () => {
    const slice: Slice = {
      ...grounded(),
      nodes: [node('garden/a', ['weather'])],
      edges: [
        { subject: 'garden/a', predicate: 'resonates', object: 'study/b', origin: 'declared' },
      ],
    };
    const issues = groundingIssues(slice);
    expect(issues.map((issue) => issue.slice(0, 11))).toEqual([
      'INV-SLC-001',
      'INV-SLC-002',
      'INV-SLC-003',
    ]);
  });
});
