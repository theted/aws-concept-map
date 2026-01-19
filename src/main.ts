import { services, connections } from './data/services';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import { InfoPanel } from './ui/InfoPanel';
import { LayoutEngine } from './layout/LayoutEngine';
import { computeAllNodeWidths } from './utils/nodeWidths';
import type { Service, ServiceMap } from './types';

// DOM elements
const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const infoPanelElement = document.getElementById('infoPanel')!;
const resetBtn = document.getElementById('resetBtn')!;
const focusBtn = document.getElementById('focusBtn')!;
const toggleLegendBtn = document.getElementById('toggleLegendBtn')!;
const legendElement = document.getElementById('legend')!;

// Canvas renderer and info panel
let renderer: CanvasRenderer;
let infoPanel: InfoPanel;
let layoutServices: ServiceMap;

// Initialize the application
function init(): void {
  // Compute dynamic node widths based on service names
  const nodeWidths = computeAllNodeWidths(services);

  // Apply layout algorithm with variable widths to prevent node overlaps
  const layoutEngine = new LayoutEngine({}, nodeWidths);
  const layoutResult = layoutEngine.computeLayout(services);
  layoutServices = layoutResult.services;

  // Create renderer with the same node widths
  renderer = new CanvasRenderer(canvasElement, layoutServices, connections, nodeWidths);

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

// Toggle legend visibility
function toggleLegend(): void {
  legendElement.classList.toggle('hidden');
}

// Set up control button listeners
function setupControlListeners(): void {
  resetBtn.addEventListener('click', resetView);
  focusBtn.addEventListener('click', focusNetworking);
  toggleLegendBtn.addEventListener('click', toggleLegend);
}

// Start the application
init();
