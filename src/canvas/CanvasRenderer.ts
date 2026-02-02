import type { PositionedService, PositionedServiceMap, Connection, CategoryPosition } from '../types';
import { computeAllNodeWidths, type NodeWidthMap } from '../utils/nodeWidths';
import {
  CATEGORY_COLORS,
  COLORS,
  TYPOGRAPHY,
  NODE_DIMENSIONS,
  ANIMATION,
  CONNECTION_OPACITY,
  CONNECTION_LINE_WIDTH,
  NODE_SHADOW,
  NODE_BORDER,
  ZOOM,
  INTERACTION,
  MOMENTUM,
} from '../config';

export interface CanvasState {
  scale: number;
  translateX: number;
  translateY: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private services: PositionedServiceMap;
  private connections: Connection[];
  private state: CanvasState;

  // Cached service data for performance
  private serviceEntries: [string, PositionedService][];
  private _connectionMap: Map<string, Set<string>>; // Maps service key to connected service keys (for future O(1) lookup)
  private selectedService: string | null = null;
  private hoveredService: string | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragDistance = 0; // Track total drag distance to distinguish click from drag
  private onServiceClick: ((key: string, service: PositionedService) => void) | null = null;

  // Touch gesture tracking
  private lastTouchDistance = 0;
  private isTouching = false;

  // Velocity tracking for momentum/inertia
  private lastDragTime = 0;
  private velocityX = 0;
  private velocityY = 0;

  // Animation state
  private targetState: CanvasState | null = null;
  private animationStartState: CanvasState | null = null;
  private animationStartTime: number = 0;
  private animationDuration: number = 300;
  private animationFrameId: number | null = null;

  // Dynamic node widths
  private nodeWidths: NodeWidthMap;

  // Sorted service keys for keyboard navigation (by category, then alphabetically)
  private sortedServiceKeys: string[];

  // Initial fade-in animation state
  private globalOpacity: number = 0;
  private fadeInStartTime: number = 0;
  private _fadeInAnimationId: number | null = null; // Tracks active fade-in animation

  // Connection opacity animation state
  private connectionOpacities: Map<string, number> = new Map();
  private connectionTargetOpacities: Map<string, number> = new Map();
  private connectionAnimationStartTime: number = 0;
  private connectionAnimationId: number | null = null;

  // Category positions for section headings
  private categoryPositions: CategoryPosition[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    services: PositionedServiceMap,
    connections: Connection[],
    nodeWidths?: NodeWidthMap,
    categoryPositions?: CategoryPosition[]
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
    this.services = services;
    this.connections = connections;
    this.categoryPositions = categoryPositions || [];
    this.state = {
      scale: 1,
      translateX: 0,
      translateY: 0,
    };

    // Use provided widths or compute them
    this.nodeWidths = nodeWidths || computeAllNodeWidths(services, this.ctx);

    // Cache service entries for performance (avoid repeated Object.entries calls)
    this.serviceEntries = Object.entries(services);

    // Sort service keys by category, then alphabetically for consistent keyboard navigation
    this.sortedServiceKeys = this.buildSortedServiceKeys();

    // Build connection map for O(1) lookup during rendering
    this._connectionMap = this.buildConnectionMap(connections);

    // Initialize connection opacities
    this.initializeConnectionOpacities();

    this.setupCanvas();
    this.setupEventListeners();

    // Start fade-in animation after setup
    this.startFadeInAnimation();
  }

  /**
   * Initializes connection opacities to the normal value.
   */
  private initializeConnectionOpacities(): void {
    for (const [from, to] of this.connections) {
      const key = this.getConnectionKey(from, to);
      this.connectionOpacities.set(key, CONNECTION_OPACITY.normal);
      this.connectionTargetOpacities.set(key, CONNECTION_OPACITY.normal);
    }
  }

  /**
   * Creates a unique key for a connection (order-independent).
   */
  private getConnectionKey(from: string, to: string): string {
    return from < to ? `${from}:${to}` : `${to}:${from}`;
  }

  /**
   * Starts the initial fade-in animation for the entire canvas.
   */
  private startFadeInAnimation(): void {
    this.globalOpacity = 0;
    this.fadeInStartTime = performance.now();
    this.fadeInAnimationId = requestAnimationFrame(() => this.fadeInLoop());
  }

  /**
   * Animation loop for the initial fade-in effect.
   */
  private fadeInLoop(): void {
    const elapsed = performance.now() - this.fadeInStartTime;
    const progress = Math.min(elapsed / ANIMATION.fadeInDuration, 1);

    // Use ease-out cubic for smooth deceleration
    this.globalOpacity = this.easeOutCubic(progress);
    this.render();

    if (progress < 1) {
      this.fadeInAnimationId = requestAnimationFrame(() => this.fadeInLoop());
    } else {
      this.fadeInAnimationId = null;
      this.globalOpacity = 1;
    }
  }

  /**
   * Updates connection target opacities based on the selected service.
   * When a service is selected, its connections are highlighted and others are dimmed.
   */
  private updateConnectionTargets(selectedKey: string | null): void {
    for (const [from, to] of this.connections) {
      const key = this.getConnectionKey(from, to);
      let targetOpacity: number;

      if (selectedKey === null) {
        // No selection - all connections return to normal
        targetOpacity = CONNECTION_OPACITY.normal;
      } else if (from === selectedKey || to === selectedKey) {
        // This connection involves the selected service - highlight it
        targetOpacity = CONNECTION_OPACITY.highlighted;
      } else {
        // Other connections - dim them
        targetOpacity = CONNECTION_OPACITY.dimmed;
      }

      this.connectionTargetOpacities.set(key, targetOpacity);
    }

    // Start the animation if not already running
    this.startConnectionAnimation();
  }

  /**
   * Starts or continues the connection opacity animation.
   */
  private startConnectionAnimation(): void {
    // Store current opacities as start values
    this.connectionAnimationStartTime = performance.now();

    if (this.connectionAnimationId === null) {
      this.connectionAnimationId = requestAnimationFrame(() => this.connectionAnimationLoop());
    }
  }

  /**
   * Animation loop for connection opacity transitions.
   */
  private connectionAnimationLoop(): void {
    const elapsed = performance.now() - this.connectionAnimationStartTime;
    const progress = Math.min(elapsed / ANIMATION.connectionTransitionDuration, 1);
    const eased = this.easeOutCubic(progress);

    let needsUpdate = false;

    for (const [key, targetOpacity] of this.connectionTargetOpacities) {
      const currentOpacity = this.connectionOpacities.get(key) ?? CONNECTION_OPACITY.normal;

      if (Math.abs(currentOpacity - targetOpacity) > 0.001) {
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * eased;
        this.connectionOpacities.set(key, newOpacity);
        needsUpdate = true;
      } else {
        this.connectionOpacities.set(key, targetOpacity);
      }
    }

    if (needsUpdate) {
      this.render();
    }

    if (progress < 1 && needsUpdate) {
      this.connectionAnimationId = requestAnimationFrame(() => this.connectionAnimationLoop());
    } else {
      this.connectionAnimationId = null;
      // Ensure all opacities are at target values
      for (const [key, target] of this.connectionTargetOpacities) {
        this.connectionOpacities.set(key, target);
      }
    }
  }

  /**
   * Gets the current opacity for a connection.
   */
  private getConnectionOpacity(from: string, to: string): number {
    const key = this.getConnectionKey(from, to);
    return this.connectionOpacities.get(key) ?? CONNECTION_OPACITY.normal;
  }

  /**
   * Builds a map from service key to set of connected service keys.
   * This enables O(1) lookup for connection highlighting.
   */
  private buildConnectionMap(connections: Connection[]): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const [from, to] of connections) {
      if (!map.has(from)) {
        map.set(from, new Set());
      }
      if (!map.has(to)) {
        map.set(to, new Set());
      }
      map.get(from)!.add(to);
      map.get(to)!.add(from);
    }
    return map;
  }

  /**
   * Builds a sorted list of service keys for keyboard navigation.
   * Sorts by category first, then alphabetically by service name within each category.
   */
  private buildSortedServiceKeys(): string[] {
    return this.serviceEntries
      .slice() // Don't mutate cached entries
      .sort((a, b) => {
        // First sort by category
        const categoryCompare = a[1].category.localeCompare(b[1].category);
        if (categoryCompare !== 0) return categoryCompare;
        // Then sort by name within category
        return a[1].name.localeCompare(b[1].name);
      })
      .map(([key]) => key);
  }

  /**
   * Navigate to the next service in the sorted list.
   * If no service is selected, selects the first service.
   */
  public navigateToNextService(): void {
    if (this.sortedServiceKeys.length === 0) return;

    let nextIndex: number;
    if (this.selectedService === null) {
      nextIndex = 0;
    } else {
      const currentIndex = this.sortedServiceKeys.indexOf(this.selectedService);
      nextIndex = (currentIndex + 1) % this.sortedServiceKeys.length;
    }

    const nextKey = this.sortedServiceKeys[nextIndex];
    this.focusOnService(nextKey);
    if (this.onServiceClick) {
      this.onServiceClick(nextKey, this.services[nextKey]);
    }
  }

  /**
   * Navigate to the previous service in the sorted list.
   * If no service is selected, selects the last service.
   */
  public navigateToPreviousService(): void {
    if (this.sortedServiceKeys.length === 0) return;

    let prevIndex: number;
    if (this.selectedService === null) {
      prevIndex = this.sortedServiceKeys.length - 1;
    } else {
      const currentIndex = this.sortedServiceKeys.indexOf(this.selectedService);
      prevIndex = (currentIndex - 1 + this.sortedServiceKeys.length) % this.sortedServiceKeys.length;
    }

    const prevKey = this.sortedServiceKeys[prevIndex];
    this.focusOnService(prevKey);
    if (this.onServiceClick) {
      this.onServiceClick(prevKey, this.services[prevKey]);
    }
  }

  /**
   * Gets the sorted service keys for keyboard navigation (for testing).
   */
  public getSortedServiceKeys(): string[] {
    return [...this.sortedServiceKeys];
  }

  /**
   * Navigate to the nearest service in the specified direction from the current selection.
   * Direction: 'up' | 'down' | 'left' | 'right'
   * Returns true if navigation occurred, false otherwise.
   */
  public navigateToServiceInDirection(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (!this.selectedService || this.sortedServiceKeys.length <= 1) {
      return false;
    }

    const currentService = this.services[this.selectedService];
    if (!currentService) return false;

    let bestCandidate: string | null = null;
    let bestScore = Infinity;

    for (const [key, service] of this.serviceEntries) {
      if (key === this.selectedService) continue;

      const dx = service.x - currentService.x;
      const dy = service.y - currentService.y;

      // Check if service is in the correct direction
      let isInDirection = false;
      let primaryDistance = 0;
      let perpendicularOffset = 0;

      const threshold = INTERACTION.spatialNavigationThreshold;
      switch (direction) {
        case 'up':
          isInDirection = dy < -threshold; // Negative Y is up
          primaryDistance = -dy;
          perpendicularOffset = Math.abs(dx);
          break;
        case 'down':
          isInDirection = dy > threshold;
          primaryDistance = dy;
          perpendicularOffset = Math.abs(dx);
          break;
        case 'left':
          isInDirection = dx < -threshold;
          primaryDistance = -dx;
          perpendicularOffset = Math.abs(dy);
          break;
        case 'right':
          isInDirection = dx > threshold;
          primaryDistance = dx;
          perpendicularOffset = Math.abs(dy);
          break;
      }

      if (!isInDirection) continue;

      // Score: prioritize services more directly in line (lower perpendicular offset)
      // Use weighted combination of primary distance and perpendicular offset
      const score = primaryDistance + perpendicularOffset * INTERACTION.spatialNavigationPerpendicularWeight;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = key;
      }
    }

    if (bestCandidate) {
      this.focusOnService(bestCandidate);
      if (this.onServiceClick) {
        this.onServiceClick(bestCandidate, this.services[bestCandidate]);
      }
      return true;
    }

    return false;
  }

  private setupCanvas(): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    // Center view on content after initial setup (no animation on initial load)
    this.centerViewOnContent(false);
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
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

    // Keyboard events for accessibility
    this.canvas.setAttribute('tabindex', '0'); // Make canvas focusable
    this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private handleMouseDown(e: MouseEvent): void {
    // Cancel any running animation when user starts dragging
    this.cancelAnimation();
    this.isDragging = true;
    this.dragDistance = 0; // Reset drag distance on new drag
    this.dragStartX = e.clientX - this.state.translateX;
    this.dragStartY = e.clientY - this.state.translateY;
    // Reset velocity tracking
    this.lastDragTime = performance.now();
    this.velocityX = 0;
    this.velocityY = 0;
    this.canvas.style.cursor = 'grabbing';
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.isDragging) {
      const newTranslateX = e.clientX - this.dragStartX;
      const newTranslateY = e.clientY - this.dragStartY;
      // Track total distance moved during drag
      this.dragDistance += Math.abs(newTranslateX - this.state.translateX) +
                          Math.abs(newTranslateY - this.state.translateY);

      // Track velocity for momentum
      const now = performance.now();
      const dt = now - this.lastDragTime;
      if (dt > 0) {
        // Use exponential smoothing to reduce noise in velocity
        const alpha = MOMENTUM.velocitySmoothing;
        const instantVelX = (newTranslateX - this.state.translateX) / dt;
        const instantVelY = (newTranslateY - this.state.translateY) / dt;
        this.velocityX = alpha * instantVelX + (1 - alpha) * this.velocityX;
        this.velocityY = alpha * instantVelY + (1 - alpha) * this.velocityY;
      }
      this.lastDragTime = now;

      this.state.translateX = newTranslateX;
      this.state.translateY = newTranslateY;
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
    if (this.isDragging) {
      this.applyMomentum();
    }
    this.isDragging = false;
    this.canvas.style.cursor = this.hoveredService ? 'pointer' : 'grab';
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get current scale (from target if animating, otherwise from state)
    const currentScale = this.targetState?.scale ?? this.state.scale;
    const delta = e.deltaY > 0 ? ZOOM.wheelOut : ZOOM.wheelIn;
    const newScale = Math.max(ZOOM.min, Math.min(ZOOM.max, currentScale * delta));

    // Calculate world position under mouse using current state (for smooth feel)
    const worldX = (mouseX - this.state.translateX) / this.state.scale;
    const worldY = (mouseY - this.state.translateY) / this.state.scale;

    // Calculate target translate for zoom towards mouse position
    const targetTranslateX = mouseX - worldX * newScale;
    const targetTranslateY = mouseY - worldY * newScale;

    // Use short animation for responsive feel
    this.animateTo({
      scale: newScale,
      translateX: targetTranslateX,
      translateY: targetTranslateY,
    }, ANIMATION.wheelZoomDuration);
  }

  private handleClick(e: MouseEvent): void {
    // Ignore clicks that were actually drags
    if (this.dragDistance > INTERACTION.dragThreshold) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const clickedKey = this.getServiceAtPosition(mouseX, mouseY);
    const previousSelection = this.selectedService;

    if (clickedKey) {
      this.selectedService = clickedKey;
      if (this.onServiceClick) {
        this.onServiceClick(clickedKey, this.services[clickedKey]);
      }
    } else {
      this.selectedService = null;
      if (this.onServiceClick) {
        this.onServiceClick('', {} as PositionedService);
      }
    }

    // Trigger connection animation if selection changed
    if (previousSelection !== this.selectedService) {
      this.updateConnectionTargets(this.selectedService);
    }

    this.render();
  }

  // Touch event handlers for mobile support
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    // Cancel any running animation when user starts touching
    this.cancelAnimation();
    this.isTouching = true;
    this.dragDistance = 0;

    if (e.touches.length === 1) {
      // Single touch - pan
      const touch = e.touches[0];
      this.dragStartX = touch.clientX - this.state.translateX;
      this.dragStartY = touch.clientY - this.state.translateY;
      // Reset velocity tracking
      this.lastDragTime = performance.now();
      this.velocityX = 0;
      this.velocityY = 0;
    } else if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      this.lastTouchDistance = this.getTouchDistance(e.touches);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isTouching) return;

    if (e.touches.length === 1) {
      // Single touch - pan
      const touch = e.touches[0];
      const newTranslateX = touch.clientX - this.dragStartX;
      const newTranslateY = touch.clientY - this.dragStartY;
      this.dragDistance += Math.abs(newTranslateX - this.state.translateX) +
                          Math.abs(newTranslateY - this.state.translateY);

      // Track velocity for momentum
      const now = performance.now();
      const dt = now - this.lastDragTime;
      if (dt > 0) {
        // Use exponential smoothing to reduce noise in velocity
        const alpha = MOMENTUM.velocitySmoothing;
        const instantVelX = (newTranslateX - this.state.translateX) / dt;
        const instantVelY = (newTranslateY - this.state.translateY) / dt;
        this.velocityX = alpha * instantVelX + (1 - alpha) * this.velocityX;
        this.velocityY = alpha * instantVelY + (1 - alpha) * this.velocityY;
      }
      this.lastDragTime = now;

      this.state.translateX = newTranslateX;
      this.state.translateY = newTranslateY;
      this.render();
    } else if (e.touches.length === 2) {
      // Two finger touch - pinch zoom
      const distance = this.getTouchDistance(e.touches);
      const center = this.getTouchCenter(e.touches);
      const rect = this.canvas.getBoundingClientRect();

      // Calculate zoom
      const delta = distance / this.lastTouchDistance;
      const newScale = Math.max(ZOOM.min, Math.min(ZOOM.max, this.state.scale * delta));

      // Zoom towards touch center
      const centerX = center.x - rect.left;
      const centerY = center.y - rect.top;
      const worldX = (centerX - this.state.translateX) / this.state.scale;
      const worldY = (centerY - this.state.translateY) / this.state.scale;

      this.state.scale = newScale;
      this.state.translateX = centerX - worldX * newScale;
      this.state.translateY = centerY - worldY * newScale;

      this.lastTouchDistance = distance;
      this.render();
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    // Check if this was a tap (not a drag)
    const wasDragging = this.isTouching && this.dragDistance >= INTERACTION.dragThreshold;

    if (this.isTouching && this.dragDistance < INTERACTION.dragThreshold && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      const clickedKey = this.getServiceAtPosition(touchX, touchY);
      const previousSelection = this.selectedService;

      if (clickedKey) {
        this.selectedService = clickedKey;
        if (this.onServiceClick) {
          this.onServiceClick(clickedKey, this.services[clickedKey]);
        }
      } else {
        this.selectedService = null;
        if (this.onServiceClick) {
          this.onServiceClick('', {} as PositionedService);
        }
      }

      // Trigger connection animation if selection changed
      if (previousSelection !== this.selectedService) {
        this.updateConnectionTargets(this.selectedService);
      }

      this.render();
    }

    if (e.touches.length === 0) {
      // All fingers lifted - apply momentum if was a single-finger drag
      if (wasDragging) {
        this.applyMomentum();
      }
      this.isTouching = false;
    } else if (e.touches.length === 1) {
      // Continuing with single touch after pinch
      const touch = e.touches[0];
      this.dragStartX = touch.clientX - this.state.translateX;
      this.dragStartY = touch.clientY - this.state.translateY;
      // Reset velocity for new single-touch drag
      this.lastDragTime = performance.now();
      this.velocityX = 0;
      this.velocityY = 0;
    }
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchCenter(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  // Keyboard event handler for accessibility
  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        // When a service is selected, try spatial navigation first
        if (this.selectedService && this.navigateToServiceInDirection('up')) {
          break;
        }
        this.panByAmount(0, INTERACTION.panStep, ANIMATION.keyboardPanDuration);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (this.selectedService && this.navigateToServiceInDirection('down')) {
          break;
        }
        this.panByAmount(0, -INTERACTION.panStep, ANIMATION.keyboardPanDuration);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (this.selectedService && this.navigateToServiceInDirection('left')) {
          break;
        }
        this.panByAmount(INTERACTION.panStep, 0, ANIMATION.keyboardPanDuration);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (this.selectedService && this.navigateToServiceInDirection('right')) {
          break;
        }
        this.panByAmount(-INTERACTION.panStep, 0, ANIMATION.keyboardPanDuration);
        break;
      case '+':
      case '=':
        e.preventDefault();
        this.zoomAtCenter(1 + ZOOM.keyboardStep);
        break;
      case '-':
        e.preventDefault();
        this.zoomAtCenter(1 - ZOOM.keyboardStep);
        break;
      case '0':
        e.preventDefault();
        this.centerViewOnContent();
        break;
      case 'Escape':
        if (this.selectedService !== null) {
          this.selectedService = null;
          this.updateConnectionTargets(null);
          if (this.onServiceClick) {
            this.onServiceClick('', {} as PositionedService);
          }
          this.render();
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          this.navigateToPreviousService();
        } else {
          this.navigateToNextService();
        }
        break;
    }
  }

  private zoomAtCenter(factor: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newScale = Math.max(ZOOM.min, Math.min(ZOOM.max, this.state.scale * factor));
    const worldX = (centerX - this.state.translateX) / this.state.scale;
    const worldY = (centerY - this.state.translateY) / this.state.scale;

    const targetTranslateX = centerX - worldX * newScale;
    const targetTranslateY = centerY - worldY * newScale;

    this.animateTo({
      scale: newScale,
      translateX: targetTranslateX,
      translateY: targetTranslateY,
    }, ANIMATION.keyboardZoomDuration);
  }

  /**
   * Easing function for smooth deceleration (ease-out cubic)
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Start a smooth animation to the target state
   */
  private animateTo(targetState: Partial<CanvasState>, duration: number = ANIMATION.defaultDuration): void {
    // Cancel any existing animation
    this.cancelAnimation();

    this.animationStartState = { ...this.state };
    this.targetState = { ...this.state, ...targetState };
    this.animationStartTime = performance.now();
    this.animationDuration = duration;

    this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
  }

  /**
   * The main animation loop that interpolates between states
   */
  private animationLoop(): void {
    if (!this.targetState || !this.animationStartState) {
      this.animationFrameId = null;
      return;
    }

    const elapsed = performance.now() - this.animationStartTime;
    const progress = Math.min(elapsed / this.animationDuration, 1);
    const eased = this.easeOutCubic(progress);

    // Interpolate state
    this.state.scale = this.animationStartState.scale +
      (this.targetState.scale - this.animationStartState.scale) * eased;
    this.state.translateX = this.animationStartState.translateX +
      (this.targetState.translateX - this.animationStartState.translateX) * eased;
    this.state.translateY = this.animationStartState.translateY +
      (this.targetState.translateY - this.animationStartState.translateY) * eased;

    this.render();

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
    } else {
      this.animationFrameId = null;
      this.targetState = null;
      this.animationStartState = null;
    }
  }

  /**
   * Cancel any running animation
   */
  private cancelAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.targetState = null;
    this.animationStartState = null;
  }

  /**
   * Check if an animation is currently running
   */
  public isAnimating(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * Pan the view by a given amount with smooth animation
   */
  private panByAmount(deltaX: number, deltaY: number, duration: number): void {
    // Get current target (if animating) or current state
    const currentX = this.targetState?.translateX ?? this.state.translateX;
    const currentY = this.targetState?.translateY ?? this.state.translateY;

    this.animateTo({
      translateX: currentX + deltaX,
      translateY: currentY + deltaY,
    }, duration);
  }

  /**
   * Apply momentum/inertia after drag release
   * Only applies if velocity exceeds threshold
   */
  private applyMomentum(): void {
    const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);

    if (speed > MOMENTUM.velocityThreshold) {
      const targetTranslateX = this.state.translateX + this.velocityX * MOMENTUM.multiplier;
      const targetTranslateY = this.state.translateY + this.velocityY * MOMENTUM.multiplier;

      this.animateTo({
        translateX: targetTranslateX,
        translateY: targetTranslateY,
      }, ANIMATION.momentumDuration);
    }

    // Reset velocity
    this.velocityX = 0;
    this.velocityY = 0;
  }

  /**
   * Gets the width for a specific service node.
   */
  private getNodeWidth(key: string): number {
    return this.nodeWidths.get(key) ?? NODE_DIMENSIONS.defaultWidth;
  }

  /**
   * Calculates the visible viewport bounds in world coordinates.
   * Used for viewport culling to skip drawing off-screen elements.
   */
  private getViewportBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const rect = this.canvas.getBoundingClientRect();
    const padding = INTERACTION.viewportCullingPadding / this.state.scale;

    // Convert screen bounds to world coordinates
    const minX = (0 - this.state.translateX) / this.state.scale - padding;
    const maxX = (rect.width - this.state.translateX) / this.state.scale + padding;
    const minY = (0 - this.state.translateY) / this.state.scale - padding;
    const maxY = (rect.height - this.state.translateY) / this.state.scale + padding;

    return { minX, maxX, minY, maxY };
  }

  /**
   * Checks if a node is within the visible viewport.
   */
  private isNodeInViewport(
    x: number,
    y: number,
    width: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): boolean {
    const halfWidth = width / 2;
    const halfHeight = NODE_DIMENSIONS.height / 2;
    return (
      x + halfWidth >= bounds.minX &&
      x - halfWidth <= bounds.maxX &&
      y + halfHeight >= bounds.minY &&
      y - halfHeight <= bounds.maxY
    );
  }

  /**
   * Checks if a connection line is potentially visible in the viewport.
   */
  private isConnectionInViewport(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): boolean {
    // Use bounding box of the line segment for quick rejection
    const lineMinX = Math.min(x1, x2);
    const lineMaxX = Math.max(x1, x2);
    const lineMinY = Math.min(y1, y2);
    const lineMaxY = Math.max(y1, y2);

    return (
      lineMaxX >= bounds.minX &&
      lineMinX <= bounds.maxX &&
      lineMaxY >= bounds.minY &&
      lineMinY <= bounds.maxY
    );
  }

  private getServiceAtPosition(screenX: number, screenY: number): string | null {
    // Convert screen coordinates to world coordinates
    const worldX = (screenX - this.state.translateX) / this.state.scale;
    const worldY = (screenY - this.state.translateY) / this.state.scale;

    // Use cached entries instead of Object.entries()
    for (const [key, service] of this.serviceEntries) {
      const nodeX = service.x;
      const nodeY = service.y;
      const halfWidth = this.getNodeWidth(key) / 2;
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

    // Calculate viewport bounds once for culling
    const viewportBounds = this.getViewportBounds();

    // Draw category headings first (behind everything)
    this.drawCategoryHeadings(viewportBounds);

    // Draw connections (behind nodes)
    this.drawConnections(viewportBounds);

    // Draw nodes on top
    this.drawNodes(viewportBounds);

    this.ctx.restore();
  }

  private drawConnections(viewportBounds: { minX: number; maxX: number; minY: number; maxY: number }): void {
    for (const [fromKey, toKey] of this.connections) {
      const fromService = this.services[fromKey];
      const toService = this.services[toKey];

      if (fromService && toService) {
        // Viewport culling: skip connections entirely outside the viewport
        if (!this.isConnectionInViewport(
          fromService.x, fromService.y,
          toService.x, toService.y,
          viewportBounds
        )) {
          continue;
        }

        const isHighlighted =
          this.selectedService === fromKey || this.selectedService === toKey;

        // Get animated opacity for this connection
        const connectionOpacity = this.getConnectionOpacity(fromKey, toKey);
        const finalOpacity = connectionOpacity * this.globalOpacity;

        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(${COLORS.primaryRGB}, ${finalOpacity})`;
        this.ctx.lineWidth = isHighlighted ? CONNECTION_LINE_WIDTH.highlighted : CONNECTION_LINE_WIDTH.normal;
        this.ctx.moveTo(fromService.x, fromService.y);
        this.ctx.lineTo(toService.x, toService.y);
        this.ctx.stroke();
      }
    }
  }

  private drawNodes(viewportBounds: { minX: number; maxX: number; minY: number; maxY: number }): void {
    // Use cached entries instead of Object.entries()
    for (const [key, service] of this.serviceEntries) {
      const nodeWidth = this.getNodeWidth(key);

      // Viewport culling: skip nodes entirely outside the viewport
      if (!this.isNodeInViewport(service.x, service.y, nodeWidth, viewportBounds)) {
        continue;
      }

      this.drawNode(key, service);
    }
  }

  /**
   * Draws category section headings above each category group.
   */
  private drawCategoryHeadings(viewportBounds: { minX: number; maxX: number; minY: number; maxY: number }): void {
    const headingConfig = TYPOGRAPHY.categoryHeading;

    for (const category of this.categoryPositions) {
      // Calculate heading position (centered above the category group)
      const headingX = category.x + category.width / 2;
      const headingY = category.y - headingConfig.offsetY;

      // Viewport culling: check if heading is visible
      // Use a generous width estimate for the heading text
      const estimatedWidth = category.displayName.length * 12;
      if (!this.isNodeInViewport(headingX, headingY, estimatedWidth, viewportBounds)) {
        continue;
      }

      // Apply global opacity for fade-in effect
      this.ctx.globalAlpha = this.globalOpacity * headingConfig.opacity;

      // Get category color for the heading
      const colors = CATEGORY_COLORS[category.category] || COLORS.fallbackCategory;

      // Draw heading text
      this.ctx.font = headingConfig.font;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = colors.start; // Use the lighter category color
      this.ctx.fillText(category.displayName, headingX, headingY);

      // Reset global alpha
      this.ctx.globalAlpha = 1;
    }
  }

  private drawNode(key: string, service: PositionedService): void {
    const { x, y } = service;
    const width = this.getNodeWidth(key);
    const { height, borderRadius } = NODE_DIMENSIONS;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const isSelected = this.selectedService === key;
    const isHovered = this.hoveredService === key;
    const isActive = isSelected || isHovered;

    // Apply global opacity for fade-in effect
    this.ctx.globalAlpha = this.globalOpacity;

    // Draw shadow
    this.ctx.shadowColor = COLORS.shadow;
    this.ctx.shadowBlur = isActive ? NODE_SHADOW.blurActive : NODE_SHADOW.blurNormal;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = isActive ? NODE_SHADOW.offsetYActive : NODE_SHADOW.offsetYNormal;

    // Create gradient
    const colors = CATEGORY_COLORS[service.category] || COLORS.fallbackCategory;
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
    if (isActive) {
      this.ctx.strokeStyle = isSelected ? COLORS.border.selected : COLORS.border.hovered;
      this.ctx.lineWidth = isSelected ? NODE_BORDER.widthSelected : NODE_BORDER.widthHovered;
      this.ctx.stroke();
    }

    // Draw text
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = TYPOGRAPHY.canvasFont;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(service.name, x, y);

    // Reset global alpha
    this.ctx.globalAlpha = 1;
  }

  public setOnServiceClick(callback: (key: string, service: PositionedService) => void): void {
    this.onServiceClick = callback;
  }

  public resetView(): void {
    this.centerViewOnContent();
  }

  /**
   * Centers the view on the content, fitting all services within the canvas
   * with appropriate padding
   * @param animate Whether to animate the transition (default: true)
   */
  public centerViewOnContent(animate: boolean = true): void {
    // Use cached entries instead of Object.entries()
    if (this.serviceEntries.length === 0) {
      this.state.scale = 1;
      this.state.translateX = 0;
      this.state.translateY = 0;
      this.render();
      return;
    }

    // Calculate bounding box of all services using their individual widths
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const [key, service] of this.serviceEntries) {
      const nodeWidth = this.getNodeWidth(key);
      minX = Math.min(minX, service.x - nodeWidth / 2);
      maxX = Math.max(maxX, service.x + nodeWidth / 2);
      minY = Math.min(minY, service.y - NODE_DIMENSIONS.height / 2);
      maxY = Math.max(maxY, service.y + NODE_DIMENSIONS.height / 2);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const rect = this.canvas.getBoundingClientRect();

    // Calculate scale to fit content with padding
    const scaleX = (rect.width - INTERACTION.viewPadding * 2) / contentWidth;
    const scaleY = (rect.height - INTERACTION.viewPadding * 2) / contentHeight;
    const scale = Math.min(Math.max(ZOOM.min, Math.min(scaleX, scaleY, ZOOM.maxFitContent)), ZOOM.max);

    const targetTranslateX = rect.width / 2 - centerX * scale;
    const targetTranslateY = rect.height / 2 - centerY * scale;

    if (animate) {
      this.animateTo({
        scale,
        translateX: targetTranslateX,
        translateY: targetTranslateY,
      }, ANIMATION.viewTransitionDuration);
    } else {
      this.state.scale = scale;
      this.state.translateX = targetTranslateX;
      this.state.translateY = targetTranslateY;
      this.render();
    }
  }

  /**
   * Focus and zoom on a specific service
   * @param key The service key to focus on
   * @param animate Whether to animate the transition (default: true)
   */
  public focusOnService(key: string, animate: boolean = true): void {
    const service = this.services[key];
    if (!service) return;

    const rect = this.canvas.getBoundingClientRect();
    const targetScale = ZOOM.focusScale;
    const targetTranslateX = rect.width / 2 - service.x * targetScale;
    const targetTranslateY = rect.height / 2 - service.y * targetScale;

    const previousSelection = this.selectedService;
    this.selectedService = key;

    // Trigger connection animation if selection changed
    if (previousSelection !== key) {
      this.updateConnectionTargets(key);
    }

    if (animate) {
      this.animateTo({
        scale: targetScale,
        translateX: targetTranslateX,
        translateY: targetTranslateY,
      }, ANIMATION.viewTransitionDuration);
    } else {
      this.state.scale = targetScale;
      this.state.translateX = targetTranslateX;
      this.state.translateY = targetTranslateY;
      this.render();
    }
  }

  public selectService(key: string | null): void {
    const previousSelection = this.selectedService;
    this.selectedService = key;

    // Trigger connection opacity animation if selection changed
    if (previousSelection !== key) {
      this.updateConnectionTargets(key);
    }

    this.render();
  }

  public getState(): CanvasState {
    return { ...this.state };
  }

  public setState(state: Partial<CanvasState>): void {
    this.state = { ...this.state, ...state };
    this.render();
  }

  /**
   * Gets the computed node widths map.
   */
  public getNodeWidths(): NodeWidthMap {
    return this.nodeWidths;
  }
}
