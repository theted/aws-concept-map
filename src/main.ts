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

// Initialize the application
function init(): void {
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
    onClose: () => renderer.selectService(null),
    onServiceSelect: handleServiceClick,
    connections,
    services: layoutServices,
  });

  renderer.setOnServiceClick(handleServiceClick);
}

// Handle service click from canvas
function handleServiceClick(key: string, service: PositionedService): void {
  if (key && service.name) {
    infoPanel.show(key, service);
    renderer.selectService(key);
  } else {
    infoPanel.hide();
    renderer.selectService(null);
  }
}

// Start the application
init();
