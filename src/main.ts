import { services, connections } from './data/services';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import { InfoPanel } from './ui/InfoPanel';
import { LayoutEngine } from './layout/LayoutEngine';
import type { Service, ServiceMap } from './types';

// DOM elements
const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const infoPanelElement = document.getElementById('infoPanel')!;
const resetBtn = document.getElementById('resetBtn')!;
const focusBtn = document.getElementById('focusBtn')!;

// Canvas renderer and info panel
let renderer: CanvasRenderer;
let infoPanel: InfoPanel;
let layoutServices: ServiceMap;

// Initialize the application
function init(): void {
  // Apply layout algorithm to prevent node overlaps
  const layoutEngine = new LayoutEngine();
  const layoutResult = layoutEngine.computeLayout(services);
  layoutServices = layoutResult.services;

  renderer = new CanvasRenderer(canvasElement, layoutServices, connections);

  // Create info panel with close callback to deselect service in canvas
  infoPanel = new InfoPanel(infoPanelElement, {
    onClose: () => renderer.selectService(null),
  });

  renderer.setOnServiceClick(handleServiceClick);
  setupControlListeners();
}

// Handle service click from canvas
function handleServiceClick(key: string, service: Service): void {
  if (key && service.name) {
    infoPanel.show(key, service);
    renderer.selectService(key);
  } else {
    infoPanel.hide();
    renderer.selectService(null);
  }
}

// Reset view to initial state
function resetView(): void {
  renderer.resetView();
  infoPanel.hide();
  renderer.selectService(null);
}

// Focus on networking/security area (VPC)
function focusNetworking(): void {
  renderer.focusOnService('vpc');
  infoPanel.show('vpc', layoutServices.vpc);
}

// Set up control button listeners
function setupControlListeners(): void {
  resetBtn.addEventListener('click', resetView);
  focusBtn.addEventListener('click', focusNetworking);
}

// Start the application
init();
