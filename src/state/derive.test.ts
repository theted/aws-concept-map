import { describe, expect, it } from 'vitest';
import { baseState, fixtureContext as ctx } from '../test/fixtures';
import { deriveMapView } from './derive';

const statusOf = (state: ReturnType<typeof baseState>, id: string) => deriveMapView(state, ctx).tiles.get(id)!;
const edgeIds = (state: ReturnType<typeof baseState>) => deriveMapView(state, ctx).edges.map(({ id }) => id);

describe('deriveMapView — overview', () => {
  it('shows nothing highlighted or drawn at rest', () => {
    const view = deriveMapView(baseState(), ctx);
    expect(view.edges).toEqual([]);
    expect([...view.tiles.values()].every((t) => !t.dimmed && !t.selected && !t.relation)).toBe(true);
  });

  it('draws every link faintly when "show all" is on', () => {
    const view = deriveMapView(baseState({ showAllEdges: true }), ctx);
    expect(view.edges).toHaveLength(4);
    expect(view.edges.every(({ emphasis }) => emphasis === 'faint')).toBe(true);
  });

  it('filters out tiles that do not match the search', () => {
    expect(statusOf(baseState({ query: 'lambda' }), 's3').filtered).toBe(true);
    expect(statusOf(baseState({ query: 'lambda' }), 'lambda').filtered).toBe(false);
  });
});

describe('deriveMapView — selection', () => {
  const selected = baseState({ selected: 'lambda' });

  it('marks the selection, its neighbors and dims the rest', () => {
    expect(statusOf(selected, 'lambda')).toMatchObject({ selected: true, dimmed: false });
    expect(statusOf(selected, 'apigw')).toMatchObject({ relation: 'invoke', dimmed: false });
    expect(statusOf(selected, 'iam').relation).toBe('security');
    expect(statusOf(selected, 's3')).toMatchObject({ relation: null, dimmed: true });
  });

  it('draws the selection\'s links', () => {
    expect(edgeIds(selected).sort()).toEqual(['apigw->lambda', 'ddb->lambda', 'iam->lambda', 'lambda->ddb']);
  });

  it('respects hidden relationship types', () => {
    const state = baseState({ selected: 'lambda', hiddenTypes: ['security'] });
    expect(edgeIds(state)).not.toContain('iam->lambda');
    expect(statusOf(state, 'iam').dimmed).toBe(true);
  });

  it('spotlights both directions when hovering a neighbor, with labels', () => {
    const focus = deriveMapView(baseState({ selected: 'lambda', hovered: 'ddb' }), ctx).edges.filter(
      (e) => e.emphasis === 'focus'
    );
    expect(focus.map(({ label }) => label)).toEqual(['Lambda writes to DynamoDB', 'DynamoDB streams to Lambda']);
  });

  it('spotlights the edge focused from the panel', () => {
    const edges = deriveMapView(baseState({ selected: 'lambda', focusedEdge: 'iam->lambda' }), ctx).edges;
    expect(edges.find(({ id }) => id === 'iam->lambda')?.emphasis).toBe('focus');
    expect(edges.find(({ id }) => id === 'apigw->lambda')?.emphasis).toBe('normal');
  });

  it('previews on hover when nothing is selected', () => {
    const state = baseState({ hovered: 'apigw' });
    expect(statusOf(state, 'apigw')).toMatchObject({ preview: true, selected: false });
    expect(statusOf(state, 'ddb').dimmed).toBe(true);
    expect(edgeIds(state)).toEqual(['apigw->lambda']);
  });
});

describe('deriveMapView — tour', () => {
  const state = baseState({ tour: { id: 'api', step: 1 } });

  it('numbers tour tiles, selects the current step and dims the rest', () => {
    expect(statusOf(state, 'apigw')).toMatchObject({ step: 1, selected: false, dimmed: false });
    expect(statusOf(state, 'lambda')).toMatchObject({ step: 2, selected: true });
    expect(statusOf(state, 's3')).toMatchObject({ step: null, dimmed: true });
  });

  it('draws tour links with emphasis by progress', () => {
    const edges = deriveMapView(state, ctx).edges;
    expect(edges.map(({ id, kind, emphasis }) => [id, kind, emphasis])).toEqual([
      ['tour:apigw->lambda', 'tour', 'focus'],
      ['tour:lambda->ddb', 'tour', 'faint'],
    ]);
  });

  it('ignores hover and selection while touring', () => {
    expect(edgeIds(baseState({ tour: { id: 'api', step: 3 }, hovered: 's3' }))).toEqual([
      'tour:apigw->lambda',
      'tour:lambda->ddb',
    ]);
  });
});
