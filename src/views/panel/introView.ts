import { RELATION_TYPE_IDS } from '../../config/relations';
import type { AppContext } from '../../state/context';
import type { Tour } from '../../types';
import { esc } from '../../utils/dom';
import { legendItem, section, topbar } from './fragments';

const tourCard = ({ id, title, summary, steps }: Tour): string => `
  <li>
    <button type="button" class="tour-card" data-tour="${esc(id)}">
      <span class="tour-card-head">
        <span class="tour-card-title">${esc(title)}</span>
        <span class="tour-card-meta">${steps.length} steps</span>
      </span>
      <span class="tour-card-summary">${esc(summary)}</span>
    </button>
  </li>`;

export const introView = (ctx: AppContext): string => {
  const serviceCount = Object.keys(ctx.services).length;
  const howTo = `
    <ol class="howto">
      <li><strong>Top to bottom follows a request.</strong> Users reach the front door, travel through your network to compute, and land in data.</li>
      <li><strong>The side rails apply everywhere.</strong> Security and governance on the left, operations and delivery on the right.</li>
      <li><strong>Hover or select a tile</strong> to light up its relationships. Line colors tell you what kind of link it is:</li>
    </ol>
    <ul class="legend-list">${RELATION_TYPE_IDS.map(legendItem).join('')}</ul>`;

  return `
    <div class="panel-body">
      ${topbar('Guide', 'Close guide')}
      <h2 class="panel-title">See how AWS fits together</h2>
      <p class="lead">${serviceCount} core services, placed where they sit in a real architecture. Pick any tile to learn what it does and how it connects — or follow a guided tour.</p>
      ${section('How to read the map', howTo)}
      ${section('Guided tours', `<ul class="tour-list">${ctx.tours.map(tourCard).join('')}</ul>`)}
      <p class="panel-footnote">
        ${serviceCount} services · ${ctx.connections.length} relationships · ${ctx.tours.length} tours.
        Press <kbd>/</kbd> to search, <kbd>Esc</kbd> to reset.
      </p>
    </div>`;
};
