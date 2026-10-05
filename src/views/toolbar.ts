import { RELATION_TYPES, RELATION_TYPE_IDS } from '../config/relations';
import type { AppState, RelationType } from '../types';
import { closestWithData, esc } from '../utils/dom';
import { swatch } from './panel/fragments';

export interface ToolbarCallbacks {
  onToggleType: (type: RelationType) => void;
  onToggleAll: () => void;
}

export interface ToolbarView {
  render: (state: AppState) => void;
}

const chip = (type: RelationType): string =>
  `<button type="button" class="legend-chip" data-type="${type}" aria-pressed="true"
    title="${esc(RELATION_TYPES[type].description)}">${swatch(type)}${esc(RELATION_TYPES[type].label)}</button>`;

/** Relationship legend that doubles as a filter, plus the "show every link" switch. */
export const createToolbarView = (root: HTMLElement, callbacks: ToolbarCallbacks): ToolbarView => {
  root.innerHTML = `
    <div class="legend" role="group" aria-label="Relationship types">
      <span class="legend-label">Links</span>
      ${RELATION_TYPE_IDS.map(chip).join('')}
    </div>
    <label class="switch">
      <input type="checkbox" data-action="all-edges" />
      <span class="switch-track" aria-hidden="true"></span>
      Show all links
    </label>`;

  const chips = [...root.querySelectorAll<HTMLButtonElement>('.legend-chip')];
  const allToggle = root.querySelector<HTMLInputElement>('[data-action="all-edges"]');

  root.addEventListener('click', (event) => {
    const type = closestWithData(event.target, 'type')?.dataset.type as RelationType | undefined;
    if (type) callbacks.onToggleType(type);
  });
  allToggle?.addEventListener('change', callbacks.onToggleAll);

  const render = (state: AppState): void => {
    chips.forEach((button) =>
      button.setAttribute('aria-pressed', String(!state.hiddenTypes.includes(button.dataset.type as RelationType)))
    );
    if (allToggle) allToggle.checked = state.showAllEdges;
  };

  return { render };
};
