import type { Service } from '../types';

export interface InfoPanelOptions {
  onClose?: () => void;
}

export class InfoPanel {
  private element: HTMLElement;
  private onClose: (() => void) | null = null;
  private currentServiceKey: string | null = null;
  private currentService: Service | null = null;
  private isExpanded: boolean = false;

  constructor(element: HTMLElement, options: InfoPanelOptions = {}) {
    this.element = element;
    this.onClose = options.onClose || null;
  }

  /**
   * Shows the info panel with service details
   */
  public show(serviceKey: string, service: Service): void {
    this.currentServiceKey = serviceKey;
    this.currentService = service;
    this.isExpanded = false;
    this.render();
    this.element.classList.add('visible');
  }

  /**
   * Hides the info panel
   */
  public hide(): void {
    this.currentServiceKey = null;
    this.currentService = null;
    this.isExpanded = false;
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
   * Returns whether the extended content is currently shown
   */
  public isExtendedContentVisible(): boolean {
    return this.isExpanded;
  }

  /**
   * Toggles the expanded state to show/hide extended content
   */
  public toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.render();
  }

  /**
   * Checks if the current service has extended content
   */
  private hasExtendedContent(): boolean {
    if (!this.currentService) return false;
    return !!(
      this.currentService.extendedDescription ||
      (this.currentService.resources && this.currentService.resources.length > 0)
    );
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

    // Add Learn More button if there's extended content
    if (this.hasExtendedContent()) {
      const buttonText = this.isExpanded ? 'Show less' : 'Learn more';
      const ariaExpanded = this.isExpanded ? 'true' : 'false';
      html += `
        <button class="learn-more-btn" aria-expanded="${ariaExpanded}">${buttonText}</button>
      `;

      // Add extended content section if expanded
      if (this.isExpanded) {
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

    const learnMoreBtn = this.element.querySelector('.learn-more-btn');
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener('click', () => {
        this.toggleExpanded();
      });
    }
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
