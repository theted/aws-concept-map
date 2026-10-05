import { RELATION_TYPES } from '../../config/relations';
import type { RelationType } from '../../types';
import { esc } from '../../utils/dom';

/** Small HTML building blocks shared by the panel views. */

export const closeButton = (label = 'Close'): string =>
  `<button type="button" class="icon-btn panel-close" data-action="close" aria-label="${esc(label)}">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>`;

export const topbar = (eyebrow: string, closeLabel?: string): string =>
  `<div class="panel-topbar"><p class="eyebrow">${eyebrow}</p>${closeButton(closeLabel)}</div>`;

export const section = (title: string, body: string, extra = ''): string =>
  `<section class="panel-section"><h3 class="section-title">${esc(title)}${extra}</h3>${body}</section>`;

export const swatch = (type: RelationType): string => `<span class="swatch swatch--${type}" aria-hidden="true"></span>`;

export const legendItem = (type: RelationType): string => {
  const { label, description } = RELATION_TYPES[type];
  return `<li class="legend-item">${swatch(type)}<span><strong>${esc(label)}</strong> — ${esc(description)}</span></li>`;
};

export const bulletList = (items: readonly string[], className = 'points'): string =>
  `<ul class="${className}">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
