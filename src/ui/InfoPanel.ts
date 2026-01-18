import type { Service } from '../types';

export interface InfoPanelOptions {
  onClose?: () => void;
}

export class InfoPanel {
  private element: HTMLElement;
  private onClose: (() => void) | null = null;
  private currentServiceKey: string | null = null;

  constructor(element: HTMLElement, options: InfoPanelOptions = {}) {
    this.element = element;
    this.onClose = options.onClose || null;
  }

  /**
   * Shows the info panel with service details
   */
  public show(serviceKey: string, service: Service): void {
    this.currentServiceKey = serviceKey;
    this.render(service);
    this.element.classList.add('visible');
  }

  /**
   * Hides the info panel
   */
  public hide(): void {
    this.currentServiceKey = null;
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
   * Renders the service information HTML
   */
  private render(service: Service): void {
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
