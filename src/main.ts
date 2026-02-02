import { services, connections } from './data/services';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import { InfoPanel } from './ui/InfoPanel';
import { LayoutEngine } from './layout/LayoutEngine';
import { computeAllNodeWidths } from './utils/nodeWidths';
import type { PositionedService, PositionedServiceMap } from './types';

// DOM elements
const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const infoPanelElement = document.getElementById('infoPanel')!;

// Canvas renderer and info panel
let renderer: CanvasRenderer;
let infoPanel: InfoPanel;
let layoutServices: PositionedServiceMap;
let currentServiceKey: string | null = null;

const HISTORY_HASH_PREFIX = 'service';

const buildUrlForService = (serviceKey: string | null): string => {
  const url = new URL(window.location.href);
  url.hash = serviceKey ? `${HISTORY_HASH_PREFIX}=${encodeURIComponent(serviceKey)}` : '';
  return url.toString();
};

const getServiceKeyFromLocation = (): string | null => {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const [prefix, value] = hash.split('=');
  if (prefix !== HISTORY_HASH_PREFIX || !value) return null;
  return decodeURIComponent(value);
};

const applySelection = (key: string | null, recordHistory = false): void => {
  if (key && layoutServices[key]) {
    infoPanel.show(key, layoutServices[key]);
    renderer.focusOnService(key);
    if (recordHistory && key !== currentServiceKey) {
      history.pushState({ serviceKey: key }, '', buildUrlForService(key));
    }
    currentServiceKey = key;
    return;
  }

  infoPanel.hide();
  renderer.selectService(null);
  if (recordHistory && currentServiceKey) {
    history.pushState({ serviceKey: null }, '', buildUrlForService(null));
  }
  currentServiceKey = null;
};

// Initialize the application
const init = (): void => {
  // Compute dynamic node widths based on service names
  const nodeWidths = computeAllNodeWidths(services);

  // Apply layout algorithm with variable widths to prevent node overlaps
  const layoutEngine = new LayoutEngine({}, nodeWidths);
  const layoutResult = layoutEngine.computeLayout(services);
  layoutServices = layoutResult.services;

  // Create renderer with the same node widths and category positions for headings
  renderer = new CanvasRenderer(
    canvasElement,
    layoutServices,
    connections,
    nodeWidths,
    layoutResult.categories
  );

  // Create info panel with close callback to deselect service in canvas
  // and onServiceSelect to navigate to related services
  infoPanel = new InfoPanel(infoPanelElement, {
    onClose: () => applySelection(null, true),
    onServiceSelect: handleServiceClick,
    connections,
    services: layoutServices,
  });

  renderer.setOnServiceClick(handleServiceClick);
  const initialKey = getServiceKeyFromLocation();
  if (initialKey && layoutServices[initialKey]) {
    history.replaceState({ serviceKey: initialKey }, '', buildUrlForService(initialKey));
    applySelection(initialKey, false);
  } else {
    history.replaceState({ serviceKey: null }, '', buildUrlForService(null));
  }
};

// Handle service click from canvas
const handleServiceClick = (key: string, service: PositionedService): void => {
  if (key && service.name) {
    applySelection(key, true);
    return;
  }

  applySelection(null, false);
};

window.addEventListener('popstate', (event) => {
  const stateKey = (event.state as { serviceKey?: string | null } | null)?.serviceKey;
  const keyFromUrl = stateKey ?? getServiceKeyFromLocation();
  applySelection(keyFromUrl ?? null, false);
});

// Start the application
init();
