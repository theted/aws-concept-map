import { services, connections } from './data/services';
import { CanvasRenderer } from './canvas/CanvasRenderer';
import type { Service } from './types';

// DOM elements
const canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const infoPanel = document.getElementById('infoPanel')!;
const resetBtn = document.getElementById('resetBtn')!;
const focusBtn = document.getElementById('focusBtn')!;

// Canvas renderer
let renderer: CanvasRenderer;

// Initialize the application
function init(): void {
  renderer = new CanvasRenderer(canvasElement, services, connections);
  renderer.setOnServiceClick(handleServiceClick);
  setupControlListeners();
}

// Handle service click from canvas
function handleServiceClick(key: string, service: Service): void {
  if (key && service.name) {
    showInfo(key, service);
  } else {
    hideInfo();
  }
}

// Display service information in the info panel
function showInfo(serviceKey: string, service: Service): void {
  let html = `
    <h2>${service.name}</h2>
    <div class="category ${service.category}">${service.category.toUpperCase()}</div>
    <p><strong>${service.description}</strong></p>
    <p>${service.details}</p>
  `;

  if (service.keyPoints.length > 0) {
    html += `
      <div class="key-points">
        <h3>Key Points for Exam:</h3>
        <ul>
          ${service.keyPoints.map((point) => `<li>${point}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  infoPanel.innerHTML = html;
  infoPanel.classList.add('visible');
  renderer.selectService(serviceKey);
}

// Hide the info panel
function hideInfo(): void {
  infoPanel.classList.remove('visible');
  renderer.selectService(null);
}

// Reset view to initial state
function resetView(): void {
  renderer.resetView();
  hideInfo();
}

// Focus on networking/security area (VPC)
function focusNetworking(): void {
  renderer.focusOnService('vpc');
  showInfo('vpc', services.vpc);
}

// Set up control button listeners
function setupControlListeners(): void {
  resetBtn.addEventListener('click', resetView);
  focusBtn.addEventListener('click', focusNetworking);
}

// Start the application
init();
