import type { AppContext } from '../../state/context';
import type { MapViewModel, TileStatus } from '../../state/derive';
import { closestWithData, prefersReducedMotion, qs } from '../../utils/dom';
import { createEdgesView } from './edgesView';
import { mapHtml } from './mapTemplate';

export interface MapCallbacks {
  onActivate: (id: string) => void;
  onHover: (id: string | null) => void;
}

export interface MapView {
  render: (model: MapViewModel) => void;
  reveal: (id: string, block: ScrollLogicalPosition) => void;
  relayout: () => void;
}

const applyStatus = (tile: HTMLElement, status: TileStatus): void => {
  tile.classList.toggle('is-selected', status.selected);
  tile.classList.toggle('is-preview', status.preview);
  tile.classList.toggle('is-related', !!status.relation);
  tile.classList.toggle('is-dimmed', status.dimmed);
  tile.classList.toggle('is-filtered', status.filtered);
  tile.classList.toggle('has-step', status.step !== null);
  tile.setAttribute('aria-pressed', String(status.selected));
  if (status.relation) tile.dataset.relation = status.relation;
  else delete tile.dataset.relation;

  const badge = tile.querySelector('.tile-step');
  if (badge) badge.textContent = status.step === null ? '' : String(status.step);
};

export const createMapView = (root: HTMLElement, ctx: AppContext, callbacks: MapCallbacks): MapView => {
  root.innerHTML = mapHtml(ctx.services);
  const container = qs(root, '.map');
  const tiles = new Map(
    [...container.querySelectorAll<HTMLElement>('.tile')].map((tile) => [tile.dataset.id ?? '', tile])
  );
  const edges = createEdgesView(container, tiles);

  const tileId = (event: Event): string | null => closestWithData(event.target, 'id')?.dataset.id ?? null;

  container.addEventListener('click', (event) => {
    const id = tileId(event);
    if (id) callbacks.onActivate(id);
  });
  // Touch "hover" would fire right before a tap and flash the preview, so only mice preview.
  container.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'mouse') callbacks.onHover(tileId(event));
  });
  container.addEventListener('pointerleave', () => callbacks.onHover(null));
  container.addEventListener('focusin', (event) => callbacks.onHover(tileId(event)));
  container.addEventListener('focusout', (event) => {
    if (!container.contains(event.relatedTarget as Node | null)) callbacks.onHover(null);
  });

  const render = (model: MapViewModel): void => {
    container.classList.toggle('has-spotlight', model.edges.some(({ emphasis }) => emphasis === 'focus'));
    model.tiles.forEach((status, id) => {
      const tile = tiles.get(id);
      if (tile) applyStatus(tile, status);
    });
    edges.update(model.edges);
  };

  const reveal = (id: string, block: ScrollLogicalPosition): void =>
    tiles.get(id)?.scrollIntoView({ block, inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  return { render, reveal, relayout: edges.relayout };
};
