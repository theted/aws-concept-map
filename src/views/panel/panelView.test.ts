import { beforeEach, describe, expect, it, vi } from 'vitest';
import { baseState, fixtureContext as ctx } from '../../test/fixtures';
import { createPanelView, panelMode, type PanelCallbacks } from './panelView';

const setup = () => {
  const root = document.createElement('aside');
  document.body.replaceChildren(root);
  const callbacks: PanelCallbacks = {
    onSelect: vi.fn(),
    onTour: vi.fn(),
    onStep: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onClose: vi.fn(),
    onFocusEdge: vi.fn(),
  };
  const view = createPanelView(root, ctx, callbacks);
  const click = (selector: string) =>
    root.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return { root, view, callbacks, click };
};

describe('panelMode', () => {
  it('prefers tour over service over intro', () => {
    expect(panelMode(baseState())).toBe('intro');
    expect(panelMode(baseState({ selected: 'lambda' }))).toBe('service');
    expect(panelMode(baseState({ selected: 'lambda', tour: { id: 'api', step: 0 } }))).toBe('tour');
  });
});

describe('createPanelView', () => {
  let env: ReturnType<typeof setup>;
  beforeEach(() => {
    env = setup();
  });

  it('renders the intro with tours and counts', () => {
    env.view.render(baseState());
    expect(env.root.dataset.mode).toBe('intro');
    expect(env.root.querySelectorAll('.tour-card')).toHaveLength(1);
    expect(env.root.textContent).toContain('5 services · 4 relationships · 1 tours');
  });

  it('starts a tour from the intro', () => {
    env.view.render(baseState());
    env.click('[data-tour="api"]');
    expect(env.callbacks.onTour).toHaveBeenCalledWith('api', 0);
  });

  it('renders service details with relationships as sentences', () => {
    env.view.render(baseState({ selected: 'lambda' }));
    expect(env.root.querySelector('.panel-title')?.textContent).toBe('Lambda');
    expect(env.root.querySelector('.full-name')?.textContent).toBe('Amazon Lambda');
    const rows = [...env.root.querySelectorAll('.rel-row')].map((row) => row.textContent?.replace(/\s+/g, ' ').trim());
    expect(rows).toContain('← API Gateway invokes Lambda');
    expect(rows).toContain('→ Lambda writes to DynamoDB');
    expect(env.root.querySelectorAll('.rel-group')).toHaveLength(3);
  });

  it('navigates to related services and spotlights their edge', () => {
    env.view.render(baseState({ selected: 'lambda' }));
    const row = env.root.querySelector<HTMLElement>('[data-edge="iam->lambda"]')!;
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(env.callbacks.onSelect).toHaveBeenCalledWith('iam');
    row.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
    expect(env.callbacks.onFocusEdge).toHaveBeenCalledWith('iam->lambda');
  });

  it('links to tours that feature the service', () => {
    env.view.render(baseState({ selected: 'ddb' }));
    env.click('.chip[data-tour]');
    expect(env.callbacks.onTour).toHaveBeenCalledWith('api', 3);
  });

  it('escapes content', () => {
    const root = document.createElement('div');
    const evil = { ...ctx, services: { ...ctx.services, x: { ...ctx.services.s3, name: '<img src=x onerror=alert(1)>' } } };
    createPanelView(root, evil, env.callbacks).render(baseState({ selected: 'x' }));
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.panel-title')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('renders tour progress and navigation', () => {
    env.view.render(baseState({ tour: { id: 'api', step: 1 } }));
    expect(env.root.querySelector('.eyebrow')?.textContent).toContain('2 of 4');
    expect(env.root.querySelector('.step.is-current .step-name')?.textContent).toBe('Lambda');
    expect(env.root.querySelectorAll('.step.is-done')).toHaveLength(1);

    env.click('[data-action="next"]');
    env.click('[data-action="prev"]');
    env.click('.step-head[data-step="3"]');
    expect(env.callbacks.onNext).toHaveBeenCalled();
    expect(env.callbacks.onPrev).toHaveBeenCalled();
    expect(env.callbacks.onStep).toHaveBeenCalledWith(3);
  });

  it('offers Finish on the last step and disables Back on the first', () => {
    env.view.render(baseState({ tour: { id: 'api', step: 3 } }));
    expect(env.root.querySelector('[data-action="close"].btn')?.textContent).toBe('Finish');
    env.view.render(baseState({ tour: { id: 'api', step: 0 } }));
    expect(env.root.querySelector<HTMLButtonElement>('[data-action="prev"]')?.disabled).toBe(true);
  });

  it('only re-renders when the content changes', () => {
    env.view.render(baseState({ selected: 'lambda' }));
    const body = env.root.querySelector('.panel-body');
    env.view.render(baseState({ selected: 'lambda', hovered: 's3', query: 'x' }));
    expect(env.root.querySelector('.panel-body')).toBe(body);
  });
});
