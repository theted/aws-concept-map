import type { Service, ServiceMap, Connection } from '../types';

export interface CanvasState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface NodeDimensions {
  width: number;
  height: number;
  padding: number;
}

const CATEGORY_COLORS: Record<string, { start: string; end: string }> = {
  compute: { start: '#FF9900', end: '#FF6600' },
  storage: { start: '#569A31', end: '#3E7B1F' },
  database: { start: '#2E5C8A', end: '#1A3A5C' },
  networking: { start: '#8B5CF6', end: '#6D28D9' },
  security: { start: '#DC2626', end: '#991B1B' },
  management: { start: '#0891B2', end: '#0E7490' },
  cost: { start: '#F59E0B', end: '#D97706' },
  messaging: { start: '#EC4899', end: '#BE185D' },
  cdn: { start: '#14B8A6', end: '#0D9488' },
};

const NODE_DIMENSIONS: NodeDimensions = {
  width: 120,
  height: 40,
  padding: 12,
};

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private services: ServiceMap;
  private connections: Connection[];
  private state: CanvasState;
  private selectedService: string | null = null;
  private hoveredService: string | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private onServiceClick: ((key: string, service: Service) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    services: ServiceMap,
    connections: Connection[]
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
    this.services = services;
    this.connections = connections;
    this.state = {
      scale: 1,
      translateX: 0,
      translateY: 0,
    };

    this.setupCanvas();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = e.clientX - this.state.translateX;
    this.dragStartY = e.clientY - this.state.translateY;
    this.canvas.style.cursor = 'grabbing';
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.isDragging) {
      this.state.translateX = e.clientX - this.dragStartX;
      this.state.translateY = e.clientY - this.dragStartY;
      this.render();
    } else {
      // Check for hover
      const hoveredKey = this.getServiceAtPosition(mouseX, mouseY);
      if (hoveredKey !== this.hoveredService) {
        this.hoveredService = hoveredKey;
        this.canvas.style.cursor = hoveredKey ? 'pointer' : 'grab';
        this.render();
      }
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.canvas.style.cursor = this.hoveredService ? 'pointer' : 'grab';
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, this.state.scale * delta));

    // Zoom towards mouse position
    const worldX = (mouseX - this.state.translateX) / this.state.scale;
    const worldY = (mouseY - this.state.translateY) / this.state.scale;

    this.state.scale = newScale;
    this.state.translateX = mouseX - worldX * newScale;
    this.state.translateY = mouseY - worldY * newScale;

    this.render();
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedKey = this.getServiceAtPosition(mouseX, mouseY);

    if (clickedKey) {
      this.selectedService = clickedKey;
      if (this.onServiceClick) {
        this.onServiceClick(clickedKey, this.services[clickedKey]);
      }
    } else {
      this.selectedService = null;
      if (this.onServiceClick) {
        this.onServiceClick('', {} as Service);
      }
    }
    this.render();
  }

  private getServiceAtPosition(screenX: number, screenY: number): string | null {
    // Convert screen coordinates to world coordinates
    const worldX = (screenX - this.state.translateX) / this.state.scale;
    const worldY = (screenY - this.state.translateY) / this.state.scale;

    for (const [key, service] of Object.entries(this.services)) {
      const nodeX = service.x;
      const nodeY = service.y;
      const halfWidth = NODE_DIMENSIONS.width / 2;
      const halfHeight = NODE_DIMENSIONS.height / 2;

      if (
        worldX >= nodeX - halfWidth &&
        worldX <= nodeX + halfWidth &&
        worldY >= nodeY - halfHeight &&
        worldY <= nodeY + halfHeight
      ) {
        return key;
      }
    }
    return null;
  }

  public render(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    this.ctx.save();
    this.ctx.translate(this.state.translateX, this.state.translateY);
    this.ctx.scale(this.state.scale, this.state.scale);

    // Draw connections first (behind nodes)
    this.drawConnections();

    // Draw nodes on top
    this.drawNodes();

    this.ctx.restore();
  }

  private drawConnections(): void {
    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    this.ctx.lineWidth = 2;

    for (const [fromKey, toKey] of this.connections) {
      const fromService = this.services[fromKey];
      const toService = this.services[toKey];

      if (fromService && toService) {
        const isHighlighted =
          this.selectedService === fromKey || this.selectedService === toKey;

        this.ctx.beginPath();
        this.ctx.strokeStyle = isHighlighted
          ? 'rgba(139, 92, 246, 0.8)'
          : 'rgba(139, 92, 246, 0.3)';
        this.ctx.lineWidth = isHighlighted ? 3 : 1.5;
        this.ctx.moveTo(fromService.x, fromService.y);
        this.ctx.lineTo(toService.x, toService.y);
        this.ctx.stroke();
      }
    }
  }

  private drawNodes(): void {
    for (const [key, service] of Object.entries(this.services)) {
      this.drawNode(key, service);
    }
  }

  private drawNode(key: string, service: Service): void {
    const { x, y } = service;
    const { width, height } = NODE_DIMENSIONS;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const borderRadius = 8;

    const isSelected = this.selectedService === key;
    const isHovered = this.hoveredService === key;

    // Draw shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = isSelected || isHovered ? 12 : 6;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = isSelected || isHovered ? 6 : 4;

    // Create gradient
    const colors = CATEGORY_COLORS[service.category] || { start: '#666', end: '#444' };
    const gradient = this.ctx.createLinearGradient(
      x - halfWidth,
      y - halfHeight,
      x + halfWidth,
      y + halfHeight
    );
    gradient.addColorStop(0, colors.start);
    gradient.addColorStop(1, colors.end);

    // Draw rounded rectangle
    this.ctx.beginPath();
    this.ctx.roundRect(
      x - halfWidth,
      y - halfHeight,
      width,
      height,
      borderRadius
    );
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Reset shadow for border
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // Draw border for selected/hovered state
    if (isSelected || isHovered) {
      this.ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
      this.ctx.lineWidth = isSelected ? 3 : 2;
      this.ctx.stroke();
    }

    // Draw text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '600 13px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(service.name, x, y);
  }

  public setOnServiceClick(callback: (key: string, service: Service) => void): void {
    this.onServiceClick = callback;
  }

  public resetView(): void {
    this.state.scale = 1;
    this.state.translateX = 0;
    this.state.translateY = 0;
    this.render();
  }

  public focusOnService(key: string): void {
    const service = this.services[key];
    if (!service) return;

    const rect = this.canvas.getBoundingClientRect();
    this.state.scale = 1.3;
    this.state.translateX = rect.width / 2 - service.x * this.state.scale;
    this.state.translateY = rect.height / 2 - service.y * this.state.scale;
    this.selectedService = key;
    this.render();
  }

  public selectService(key: string | null): void {
    this.selectedService = key;
    this.render();
  }

  public getState(): CanvasState {
    return { ...this.state };
  }

  public setState(state: Partial<CanvasState>): void {
    this.state = { ...this.state, ...state };
    this.render();
  }
}
