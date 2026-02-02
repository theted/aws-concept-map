import type { PositionedService, PositionedServiceMap, Connection } from '../types';

export interface InfoPanelOptions {
  onClose?: () => void;
  onServiceSelect?: (key: string, service: PositionedService) => void;
  connections?: Connection[];
  services?: PositionedServiceMap;
}

export class InfoPanel {
  private element: HTMLElement;
  private onClose: (() => void) | null = null;
  private onServiceSelect: ((key: string, service: PositionedService) => void) | null = null;
  private connections: Connection[] = [];
  private services: PositionedServiceMap = {};
  private currentServiceKey: string | null = null;
  private currentService: PositionedService | null = null;

  constructor(element: HTMLElement, options: InfoPanelOptions = {}) {
    this.element = element;
    this.onClose = options.onClose || null;
    this.onServiceSelect = options.onServiceSelect || null;
    this.connections = options.connections || [];
    this.services = options.services || {};
  }

  /**
   * Shows the info panel with service details
   */
  public show(serviceKey: string, service: PositionedService): void {
    this.currentServiceKey = serviceKey;
    this.currentService = service;
    this.render();
    this.element.classList.add('visible');
  }

  /**
   * Hides the info panel
   */
  public hide(): void {
    this.currentServiceKey = null;
    this.currentService = null;
    this.element.classList.remove('visible');
  }

  /**
   * Returns whether the panel is currently visible
   */
  public isVisible(): boolean {
    return this.element.classList.contains('visible');
  }

  /**
   * Returns the currently displayed service key, or null if hidden
   */
  public getCurrentServiceKey(): string | null {
    return this.currentServiceKey;
  }

  /**
   * Gets all services related to the current service via connections
   * Returns an array of [key, service] tuples sorted by service name
   */
  private getRelatedServices(): [string, PositionedService][] {
    if (!this.currentServiceKey || this.connections.length === 0) return [];

    const relatedKeys = new Set<string>();

    // Find all connections involving the current service (connections are bidirectional)
    for (const [from, to] of this.connections) {
      if (from === this.currentServiceKey) {
        relatedKeys.add(to);
      } else if (to === this.currentServiceKey) {
        relatedKeys.add(from);
      }
    }

    // Map keys to [key, service] tuples, filtering out missing services
    const related: [string, PositionedService][] = [];
    for (const key of relatedKeys) {
      if (this.services[key]) {
        related.push([key, this.services[key]]);
      }
    }

    // Sort by service name for consistent display
    return related.sort((a, b) => a[1].name.localeCompare(b[1].name));
  }

  /**
   * Renders the service information HTML
   */
  private render(): void {
    if (!this.currentService) return;

    const service = this.currentService;
    let html = `
      <button class="close-btn" aria-label="Close panel">&times;</button>
      <h2>${this.escapeHtml(service.name)}</h2>
      <div class="category ${service.category}">${service.category.toUpperCase()}</div>
      <p class="description"><strong>${this.escapeHtml(service.description)}</strong></p>
      <p class="details">${this.escapeHtml(service.details)}</p>
    `;

    if (service.keyPoints && service.keyPoints.length > 0) {
      html += `
        <div class="key-points">
          <h3>Key Points for Exam:</h3>
          <ul>
            ${service.keyPoints.map((point) => `<li>${this.escapeHtml(point)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Add Relationships section if there are related services
    const relatedServices = this.getRelatedServices();
    if (relatedServices.length > 0) {
      html += `
        <div class="relationships">
          <h3>Related Services:</h3>
          <ul>
            ${relatedServices
              .map(
                ([key, relService]) =>
                  `<li><button class="related-service-btn" data-service-key="${this.escapeHtml(key)}">${this.escapeHtml(relService.name)}</button></li>`
              )
              .join('')}
          </ul>
        </div>
      `;
    }

    // Add extended content section (always visible when available)
    const hasExtended =
      service.extendedDescription ||
      (service.resources && service.resources.length > 0);

    if (hasExtended) {
      html += '<div class="extended-content">';

      if (service.extendedDescription) {
        html += `
          <div class="extended-description">
            <h3>In-Depth Details:</h3>
            <p>${this.escapeHtml(service.extendedDescription)}</p>
          </div>
        `;
      }

      if (service.resources && service.resources.length > 0) {
        html += `
          <div class="resources">
            <h3>Learn More:</h3>
            <ul>
              ${service.resources
                .map(
                  (resource) =>
                    `<li><a href="${this.escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(resource.title)}</a></li>`
                )
                .join('')}
            </ul>
          </div>
        `;
      }

      html += '</div>';
    }

    this.element.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Attaches event listeners to the panel elements
   */
  private attachEventListeners(): void {
    const closeBtn = this.element.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
        if (this.onClose) {
          this.onClose();
        }
      });
    }

    // Attach click handlers for related service buttons
    const relatedServiceBtns = this.element.querySelectorAll('.related-service-btn');
    relatedServiceBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-service-key');
        if (key && this.services[key] && this.onServiceSelect) {
          this.onServiceSelect(key, this.services[key]);
        }
      });
    });
  }

  /**
   * Escapes HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
