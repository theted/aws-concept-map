import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deriveMapView } from '../../state/derive';
import { baseState, fixtureContext as ctx } from '../../test/fixtures';
import { createMapView, type MapCallbacks } from './mapView';

const setup = () => {
  const root = document.createElement('div');
  document.body.replaceChildren(root);
  const callbacks: MapCallbacks = { onActivate: vi.fn(), onHover: vi.fn() };
  const view = createMapView(root, ctx, callbacks);
  const tile = (id: string) => root.querySelector<HTMLButtonElement>(`.tile[data-id="${id}"]`)!;
  return { root, view, callbacks, tile };
};

describe('createMapView', () => {
  let env: ReturnType<typeof setup>;
  beforeEach(() => {
    env = setup();
  });

  it('renders one tile per service inside its zone', () => {
    expect(env.root.querySelectorAll('.tile')).toHaveLength(Object.keys(ctx.services).length);
    expect(env.tile('lambda').closest('.zone')?.getAttribute('data-category')).toBe('compute');
    expect(env.tile('iam').closest('.map-column')?.getAttribute('data-column')).toBe('left');
  });

  it('shows names and taglines', () => {
    expect(env.tile('ddb').textContent).toContain('DynamoDB');
    expect(env.tile('ddb').textContent).toContain('Serverless NoSQL');
  });

  it('applies selection, relation and dimming state', () => {
    env.view.render(deriveMapView(baseState({ selected: 'lambda' }), ctx));
    expect(env.tile('lambda').classList.contains('is-selected')).toBe(true);
    expect(env.tile('lambda').getAttribute('aria-pressed')).toBe('true');
    expect(env.tile('apigw').dataset.relation).toBe('invoke');
    expect(env.tile('s3').classList.contains('is-dimmed')).toBe(true);
  });

  it('clears state again', () => {
    env.view.render(deriveMapView(baseState({ selected: 'lambda' }), ctx));
    env.view.render(deriveMapView(baseState(), ctx));
    expect(env.tile('apigw').dataset.relation).toBeUndefined();
    expect(env.root.querySelectorAll('.is-dimmed, .is-selected')).toHaveLength(0);
  });

  it('draws one path per visible edge', () => {
    env.view.render(deriveMapView(baseState({ selected: 'lambda' }), ctx));
    expect(env.root.querySelectorAll('.edges-layer path')).toHaveLength(4);
    expect(env.root.querySelector('[data-edge="apigw->lambda"]')?.getAttribute('class')).toContain('edge--invoke');
  });

  it('labels spotlighted edges, merging both directions of a pair', () => {
    env.view.render(deriveMapView(baseState({ selected: 'lambda', hovered: 'ddb' }), ctx));
    const labels = env.root.querySelectorAll('.edge-label');
    expect(labels).toHaveLength(1);
    expect(labels[0].innerHTML).toBe('Lambda writes to DynamoDB<br>DynamoDB streams to Lambda');
  });

  it('shows tour step badges', () => {
    env.view.render(deriveMapView(baseState({ tour: { id: 'api', step: 0 } }), ctx));
    expect(env.tile('ddb').querySelector('.tile-step')?.textContent).toBe('4');
    expect(env.tile('s3').querySelector('.tile-step')?.textContent).toBe('');
  });

  it('reports clicks and hovers', () => {
    env.tile('s3').querySelector('.tile-name')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(env.callbacks.onActivate).toHaveBeenCalledWith('s3');

    env.tile('iam').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(env.callbacks.onHover).toHaveBeenCalledWith('iam');
  });
});
