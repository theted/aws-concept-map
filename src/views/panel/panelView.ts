import { clampStep, findTour } from '../../data/tours';
import type { AppContext } from '../../state/context';
import type { AppState } from '../../types';
import { closestWithData } from '../../utils/dom';
import { introView } from './introView';
import { serviceView } from './serviceView';
import { tourView } from './tourView';

export type PanelMode = 'intro' | 'service' | 'tour';

export interface PanelCallbacks {
  onSelect: (id: string) => void;
  onTour: (id: string, step: number) => void;
  onStep: (step: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onFocusEdge: (id: string | null) => void;
}

export interface PanelView {
  render: (state: AppState) => void;
}

export const panelMode = (state: AppState): PanelMode =>
  state.tour ? 'tour' : state.selected ? 'service' : 'intro';

/** Identity of what the panel shows; it only re-renders when this changes. */
const contentKey = (state: AppState): string =>
  state.tour ? `tour:${state.tour.id}:${state.tour.step}` : state.selected ? `service:${state.selected}` : 'intro';

const contentFor = (state: AppState, ctx: AppContext): string => {
  const tour = findTour(ctx.tours, state.tour?.id);
  if (tour && state.tour) return tourView(tour, clampStep(tour, state.tour.step), ctx);
  if (state.selected && ctx.services[state.selected]) return serviceView(state.selected, ctx);
  return introView(ctx);
};

export const createPanelView = (root: HTMLElement, ctx: AppContext, callbacks: PanelCallbacks): PanelView => {
  let renderedKey = '';

  const actions: Record<string, () => void> = {
    close: callbacks.onClose,
    next: callbacks.onNext,
    prev: callbacks.onPrev,
  };

  root.addEventListener('click', (event) => {
    const action = closestWithData(event.target, 'action')?.dataset.action;
    if (action) return actions[action]?.();

    const tourEl = closestWithData(event.target, 'tour');
    if (tourEl?.dataset.tour) return callbacks.onTour(tourEl.dataset.tour, Number(tourEl.dataset.step ?? 0));

    const stepEl = closestWithData(event.target, 'step');
    if (stepEl?.dataset.step) return callbacks.onStep(Number(stepEl.dataset.step));

    const serviceEl = closestWithData(event.target, 'service');
    if (serviceEl?.dataset.service) callbacks.onSelect(serviceEl.dataset.service);
  });

  // Hovering or focusing a relationship row spotlights that edge on the map.
  const edgeOf = (event: Event): string | null => closestWithData(event.target, 'edge')?.dataset.edge ?? null;
  root.addEventListener('pointerover', (event) => callbacks.onFocusEdge(edgeOf(event)));
  root.addEventListener('pointerleave', () => callbacks.onFocusEdge(null));
  root.addEventListener('focusin', (event) => callbacks.onFocusEdge(edgeOf(event)));
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) callbacks.onFocusEdge(null);
  });

  const render = (state: AppState): void => {
    const key = contentKey(state);
    root.dataset.mode = panelMode(state);
    if (key === renderedKey) return;

    const sameTour = renderedKey.split(':').slice(0, 2).join(':') === key.split(':').slice(0, 2).join(':');
    const scroll = sameTour && state.tour ? root.scrollTop : 0;
    renderedKey = key;
    root.innerHTML = contentFor(state, ctx);
    root.scrollTop = scroll;
    root.querySelector('.step.is-current')?.scrollIntoView({ block: 'nearest' });
  };

  return { render };
};
