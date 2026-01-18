import { services, connections } from './data/services';
import type { Service } from './types';

// Canvas state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// DOM elements
const canvas = document.getElementById('canvas')!;
const infoPanel = document.getElementById('infoPanel')!;
const resetBtn = document.getElementById('resetBtn')!;
const focusBtn = document.getElementById('focusBtn')!;

// Initialize the application
function init(): void {
  createNodes();
  createConnections();
  setupEventListeners();
}

// Create service nodes on the canvas
function createNodes(): void {
  Object.entries(services).forEach(([key, service]) => {
    const node = document.createElement('div');
    node.className = `node ${service.category}`;
    node.textContent = service.name;
    node.style.left = `${service.x}px`;
    node.style.top = `${service.y}px`;
    node.dataset.service = key;

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      showInfo(key, service);
    });

    canvas.appendChild(node);
  });
}

// Create connection lines between services
function createConnections(): void {
  connections.forEach(([from, to]) => {
    const fromNode = document.querySelector(`[data-service="${from}"]`);
    const toNode = document.querySelector(`[data-service="${to}"]`);

    if (fromNode && toNode) {
      const line = document.createElement('div');
      line.className = 'connection';
      line.dataset.from = from;
      line.dataset.to = to;
      updateLine(line, fromNode as HTMLElement, toNode as HTMLElement);
      canvas.appendChild(line);
    }
  });
}

// Update connection line position and angle
function updateLine(line: HTMLElement, fromNode: HTMLElement, toNode: HTMLElement): void {
  const fromRect = fromNode.getBoundingClientRect();
  const toRect = toNode.getBoundingClientRect();

  const x1 = fromRect.left + fromRect.width / 2;
  const y1 = fromRect.top + fromRect.height / 2;
  const x2 = toRect.left + toRect.width / 2;
  const y2 = toRect.top + toRect.height / 2;

  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  line.style.width = `${length}px`;
  line.style.left = `${x1}px`;
  line.style.top = `${y1}px`;
  line.style.transform = `rotate(${angle}deg)`;
}

// Display service information in the info panel
function showInfo(serviceKey: string, service: Service): void {
  // Remove previous selection
  document.querySelectorAll('.node').forEach((n) => n.classList.remove('selected'));
  document.querySelector(`[data-service="${serviceKey}"]`)?.classList.add('selected');

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
}

// Update all node and connection transforms
function updateTransform(): void {
  const nodes = document.querySelectorAll('.node') as NodeListOf<HTMLElement>;
  nodes.forEach((node) => {
    node.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  });

  // Update connection lines after transform
  const lines = document.querySelectorAll('.connection') as NodeListOf<HTMLElement>;
  lines.forEach((line) => {
    const fromKey = line.dataset.from;
    const toKey = line.dataset.to;
    const fromNode = document.querySelector(`[data-service="${fromKey}"]`) as HTMLElement;
    const toNode = document.querySelector(`[data-service="${toKey}"]`) as HTMLElement;
    if (fromNode && toNode) {
      updateLine(line, fromNode, toNode);
    }
  });
}

// Reset view to initial state
function resetView(): void {
  scale = 1;
  translateX = 0;
  translateY = 0;
  updateTransform();
}

// Focus on networking/security area
function focusNetworking(): void {
  resetView();
  translateX = 200;
  translateY = 100;
  scale = 1.3;
  updateTransform();
  showInfo('vpc', services.vpc);
}

// Set up all event listeners
function setupEventListeners(): void {
  // Pan functionality
  canvas.addEventListener('mousedown', (e) => {
    if (e.target === canvas) {
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  // Zoom functionality
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= delta;
    scale = Math.max(0.5, Math.min(2, scale));
    updateTransform();
  });

  // Click outside to close info panel
  canvas.addEventListener('click', (e) => {
    if (e.target === canvas) {
      infoPanel.classList.remove('visible');
      document.querySelectorAll('.node').forEach((n) => n.classList.remove('selected'));
    }
  });

  // Control buttons
  resetBtn.addEventListener('click', resetView);
  focusBtn.addEventListener('click', focusNetworking);
}

// Start the application
init();
