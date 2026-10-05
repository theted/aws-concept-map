import './styles/index.css';

import { DOCKED_PANEL_MIN_WIDTH, SEARCH_SHORTCUT } from './config/constants';
import { connections, services, tours } from './data';
import { searchServices } from './data/search';
import { currentStepService } from './data/tours';
import {
  activateTile,
  goToStep,
  selectService,
  startTour,
  stepBy,
  toggleRelationType,
} from './state/actions';
import { createContext } from './state/context';
import { deriveMapView } from './state/derive';
import { connectRouter } from './state/router';
import { createStore } from './state/store';
import { applyTheme, initialTheme } from './state/theme';
import type { AppState } from './types';
import { isTypingTarget, qs } from './utils/dom';
import { createHeaderView } from './views/header';
import { createMapView } from './views/map/mapView';
import { createPanelView, panelMode } from './views/panel/panelView';
import { createToolbarView } from './views/toolbar';

const ctx = createContext(services, connections, tours);

const store = createStore<AppState>({
  selected: null,
  hovered: null,
  focusedEdge: null,
  query: '',
  tour: null,
  hiddenTypes: [],
  showAllEdges: false,
  guideOpen: false,
  theme: initialTheme(),
});

const isDocked = (): boolean => window.matchMedia(`(min-width: ${DOCKED_PANEL_MIN_WIDTH}px)`).matches;

/** The tile the user is "on": current tour step, else the selected service. */
const anchorTile = (state: AppState): string | null => currentStepService(ctx.tours, state.tour) ?? state.selected;

const header = createHeaderView(qs(document, '.app-header'), {
  onQuery: (query) => store.set({ query }),
  onSubmitQuery: () => {
    const [first] = searchServices(ctx.services, store.get().query);
    if (first) store.set({ ...selectService(first), query: '' });
  },
  onToggleTheme: () => store.set(({ theme }) => ({ theme: theme === 'dark' ? 'light' : 'dark' })),
  onToggleGuide: () => store.set(({ guideOpen }) => ({ ...selectService(null), guideOpen: !guideOpen })),
});

const toolbar = createToolbarView(qs(document, '.map-toolbar'), {
  onToggleType: (type) => store.set(toggleRelationType(type)),
  onToggleAll: () => store.set(({ showAllEdges }) => ({ showAllEdges: !showAllEdges })),
});

const map = createMapView(qs(document, '#map-root'), ctx, {
  onActivate: (id) => store.set(activateTile(ctx.tours, id)),
  onHover: (hovered) => store.set({ hovered }),
});

const panel = createPanelView(qs(document, '#panel'), ctx, {
  onSelect: (id) => store.set(selectService(id)),
  onTour: (id, step) => store.set(startTour(id, step)),
  onStep: (step) => store.set(goToStep(ctx.tours, step)),
  onNext: () => store.set(stepBy(ctx.tours, 1)),
  onPrev: () => store.set(stepBy(ctx.tours, -1)),
  onClose: () => store.set(selectService(null)),
  onFocusEdge: (focusedEdge) => store.set({ focusedEdge }),
});

const render = (state: AppState, prev?: AppState): void => {
  map.render(deriveMapView(state, ctx));
  panel.render(state);
  header.render(state, searchServices(ctx.services, state.query).length);
  toolbar.render(state);
  document.body.classList.toggle('panel-open', panelMode(state) !== 'intro' || state.guideOpen);

  if (state.theme !== prev?.theme) applyTheme(state.theme, !!prev);

  // On small screens the panel covers the lower part of the map, so bring the tile to the top.
  const anchor = anchorTile(state);
  if (anchor && anchor !== (prev && anchorTile(prev))) map.reveal(anchor, isDocked() ? 'nearest' : 'start');
};

document.addEventListener('keydown', (event) => {
  if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
  const { tour } = store.get();

  if (event.key === SEARCH_SHORTCUT) {
    event.preventDefault();
    header.focusSearch();
  } else if (event.key === 'Escape') {
    store.set(selectService(null));
  } else if (tour && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    event.preventDefault();
    store.set(stepBy(ctx.tours, event.key === 'ArrowRight' ? 1 : -1));
  }
});

store.subscribe(render);
connectRouter(store, ctx);
render(store.get());

// Tile sizes change once the web font arrives; re-measure edge anchors then.
document.fonts?.ready.then(map.relayout);
