import { CATEGORIES, COLUMN_CAPTIONS, COLUMN_ORDER, STACKED_ORDER, type MapColumn } from '../../config/categories';
import { RELATION_TYPE_IDS } from '../../config/relations';
import type { CategoryId, ServiceMap } from '../../types';
import { esc } from '../../utils/dom';

const ARROW_KINDS = [...RELATION_TYPE_IDS, 'tour'];

const markerDefs = (): string =>
  ARROW_KINDS.map(
    (kind) => `
      <marker id="arrow-${kind}" class="arrow arrow--${kind}" viewBox="0 0 10 10" refX="9" refY="5"
        markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M 0 1 L 9 5 L 0 9 z" />
      </marker>`
  ).join('');

const tileHtml = (id: string, services: ServiceMap): string => {
  const { name, fullName, tagline } = services[id];
  return `
    <li>
      <button type="button" class="tile" data-id="${esc(id)}" aria-pressed="false"
        aria-label="${esc(`${name} — ${tagline}`)}" title="${esc(fullName)}">
        <span class="tile-name">${esc(name)}</span>
        <span class="tile-tag">${esc(tagline)}</span>
        <span class="tile-step" aria-hidden="true"></span>
      </button>
    </li>`;
};

const zoneHtml = (category: CategoryId, ids: string[], services: ServiceMap): string => {
  const { label, blurb } = CATEGORIES[category];
  return `
    <section class="zone" data-category="${category}" aria-labelledby="zone-${category}"
      style="--cat: var(--cat-${category}); order: ${STACKED_ORDER.indexOf(category)}">
      <header class="zone-header">
        <h2 class="zone-title" id="zone-${category}"><span class="zone-dot"></span>${esc(label)}</h2>
        <p class="zone-blurb">${esc(blurb)}</p>
      </header>
      <ul class="zone-tiles">${ids.map((id) => tileHtml(id, services)).join('')}</ul>
    </section>`;
};

const columnHtml = (column: MapColumn, byCategory: Map<CategoryId, string[]>, services: ServiceMap): string => {
  const zones = [...byCategory]
    .filter(([category]) => CATEGORIES[category].column === column)
    .map(([category, ids]) => zoneHtml(category, ids, services))
    .join('');
  const caption =
    column === 'center'
      ? `<p class="column-caption column-caption--entry"><span class="entry-pill">${esc(COLUMN_CAPTIONS.center)}</span></p>`
      : `<p class="column-caption">${esc(COLUMN_CAPTIONS[column])}</p>`;
  return `<div class="map-column" data-column="${column}">${caption}${zones}</div>`;
};

/** Groups ids by category, in category config order, keeping data-file order within each. */
const groupServices = (services: ServiceMap): Map<CategoryId, string[]> =>
  Object.entries(services).reduce(
    (acc, [id, { category }]) => acc.set(category, [...(acc.get(category) ?? []), id]),
    new Map((Object.keys(CATEGORIES) as CategoryId[]).map((c) => [c, [] as string[]]))
  );

export const mapHtml = (services: ServiceMap): string => {
  const byCategory = groupServices(services);
  return `
    <div class="map">
      <svg class="edges" aria-hidden="true" focusable="false">
        <defs>${markerDefs()}</defs>
        <g class="edges-layer"></g>
      </svg>
      <div class="edge-labels" aria-hidden="true"></div>
      ${COLUMN_ORDER.map((column) => columnHtml(column, byCategory, services)).join('')}
    </div>`;
};
