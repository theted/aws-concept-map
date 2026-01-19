import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasRenderer } from './CanvasRenderer';
import type { ServiceMap, Connection } from '../types';

// RAF callback queue for manual mocking
let rafCallbacks: Map<number, FrameRequestCallback> = new Map();
let rafIdCounter = 0;
let mockTime = 0;

// Mock requestAnimationFrame and cancelAnimationFrame
function setupRAFMock(): void {
  rafCallbacks = new Map();
  rafIdCounter = 0;
  mockTime = 0;

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    const id = ++rafIdCounter;
    rafCallbacks.set(id, callback);
    return id;
  });

  vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
    rafCallbacks.delete(id);
  });

  vi.stubGlobal('performance', {
    now: () => mockTime,
  });
}

// Helper to run all pending requestAnimationFrame callbacks
function flushAnimationFrames(durationMs: number = 1000): void {
  const frameTime = 16; // ~60fps
  const endTime = mockTime + durationMs;

  while (mockTime < endTime && rafCallbacks.size > 0) {
    mockTime += frameTime;
    // Copy callbacks as they may schedule new ones
    const currentCallbacks = new Map(rafCallbacks);
    rafCallbacks.clear();
    currentCallbacks.forEach((callback) => {
      callback(mockTime);
    });
  }
}

// Helper to advance time and run one frame
function advanceMockTime(ms: number): void {
  const endTime = mockTime + ms;
  const frameTime = 16;

  while (mockTime < endTime) {
    mockTime += Math.min(frameTime, endTime - mockTime);
    // Run pending callbacks at current time
    const currentCallbacks = new Map(rafCallbacks);
    rafCallbacks.clear();
    currentCallbacks.forEach((callback) => {
      callback(mockTime);
    });
  }
}

// Mock canvas context
function createMockContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    roundRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: text.length * 8, // Approximate 8px per character
    })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  } as unknown as CanvasRenderingContext2D;
}

// Type for mock canvas with event trigger helper
type MockCanvas = HTMLCanvasElement & {
  __triggerEvent: (event: string, eventData: Event) => void;
};

// Mock canvas element
function createMockCanvas(ctx: CanvasRenderingContext2D): MockCanvas {
  const eventListeners: Record<string, EventListener[]> = {};

  return {
    getContext: vi.fn(() => ctx),
    getBoundingClientRect: vi.fn(() => ({
      width: 800,
      height: 600,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })),
    width: 800,
    height: 600,
    style: {
      cursor: 'grab',
    },
    addEventListener: vi.fn((event: string, listener: EventListener) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(listener);
    }),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn(),
    // Helper to trigger events in tests
    __triggerEvent: (event: string, eventData: Event) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach((listener) => listener(eventData));
      }
    },
  } as unknown as MockCanvas;
}

// Sample test data
const testServices: ServiceMap = {
  ec2: {
    name: 'EC2',
    category: 'compute',
    description: 'Test description',
    details: 'Test details',
    keyPoints: ['Point 1'],
    x: 400,
    y: 350,
  },
  s3: {
    name: 'S3',
    category: 'storage',
    description: 'Test storage',
    details: 'Test storage details',
    keyPoints: ['Point 1'],
    x: 600,
    y: 350,
  },
  vpc: {
    name: 'VPC',
    category: 'networking',
    description: 'Test networking',
    details: 'Test networking details',
    keyPoints: ['Point 1'],
    x: 400,
    y: 100,
  },
};

const testConnections: Connection[] = [
  ['ec2', 's3'],
  ['vpc', 'ec2'],
];

describe('CanvasRenderer', () => {
  let mockCtx: CanvasRenderingContext2D;
  let mockCanvas: MockCanvas;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    // Setup RAF mock for animation testing
    setupRAFMock();

    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });

    // Mock window resize event
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});

    mockCtx = createMockContext();
    mockCanvas = createMockCanvas(mockCtx);
    renderer = new CanvasRenderer(mockCanvas, testServices, testConnections);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should create a renderer with centered initial state', () => {
      const state = renderer.getState();
      // Initial state should be centered on content, not (0,0)
      // Scale should be within valid bounds
      expect(state.scale).toBeGreaterThanOrEqual(0.3);
      expect(state.scale).toBeLessThanOrEqual(3);
      // Translation should be set to center content
      expect(typeof state.translateX).toBe('number');
      expect(typeof state.translateY).toBe('number');
    });

    it('should get 2D context from canvas', () => {
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should set up mouse event listeners', () => {
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should set up touch event listeners for mobile support', () => {
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    it('should set up keyboard event listener for accessibility', () => {
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockCanvas.setAttribute).toHaveBeenCalledWith('tabindex', '0');
    });

    it('should center view on content during initialization', () => {
      // The view should be centered on the test services
      const state = renderer.getState();
      // Services are at: ec2(400,350), s3(600,350), vpc(400,100)
      // Bounding box: minX=340, maxX=660, minY=80, maxY=370
      // Center: x=500, y=225
      // State should reflect centering (not 0,0)
      expect(state.translateX).not.toBe(0);
      expect(state.translateY).not.toBe(0);
    });
  });

  describe('state management', () => {
    it('should update state via setState', () => {
      const initialState = renderer.getState();
      renderer.setState({ scale: 1.5, translateX: 100 });
      const state = renderer.getState();
      expect(state.scale).toBe(1.5);
      expect(state.translateX).toBe(100);
      expect(state.translateY).toBe(initialState.translateY); // unchanged from initial centered state
    });

    it('should reset view by centering on content', () => {
      renderer.setState({ scale: 2, translateX: 200, translateY: 150 });
      const stateBefore = renderer.getState();
      renderer.resetView();
      // Advance timers to complete animation
      flushAnimationFrames();
      const stateAfter = renderer.getState();
      // resetView should change the state (centering on content)
      expect(stateAfter.scale).not.toBe(stateBefore.scale);
      expect(stateAfter.translateX).not.toBe(stateBefore.translateX);
    });
  });

  describe('centerViewOnContent', () => {
    it('should center view on all services', () => {
      renderer.setState({ scale: 0.5, translateX: 1000, translateY: 1000 });
      renderer.centerViewOnContent();
      // Advance timers to complete animation
      flushAnimationFrames();
      const state = renderer.getState();
      // Should be centered on the content (not at 1000, 1000)
      expect(state.translateX).not.toBe(1000);
      expect(state.translateY).not.toBe(1000);
      // Scale should be within valid range
      expect(state.scale).toBeGreaterThanOrEqual(0.3);
      expect(state.scale).toBeLessThanOrEqual(3);
    });

    it('should center view immediately when animate=false', () => {
      renderer.setState({ scale: 0.5, translateX: 1000, translateY: 1000 });
      renderer.centerViewOnContent(false);
      // No need to advance timers - should be immediate
      const state = renderer.getState();
      expect(state.translateX).not.toBe(1000);
      expect(state.translateY).not.toBe(1000);
    });
  });

  describe('focusOnService', () => {
    it('should center view on specified service', () => {
      renderer.focusOnService('vpc');
      // Advance timers to complete animation
      flushAnimationFrames();
      const state = renderer.getState();
      expect(state.scale).toBe(1.3);
      // The translate should center VPC (at x:400, y:100) in the canvas (800x600)
      // translateX = canvasWidth/2 - serviceX * scale = 400 - 400 * 1.3 = -120
      // translateY = canvasHeight/2 - serviceY * scale = 300 - 100 * 1.3 = 170
      expect(state.translateX).toBe(-120);
      expect(state.translateY).toBe(170);
    });

    it('should focus immediately when animate=false', () => {
      renderer.focusOnService('vpc', false);
      // No need to advance timers - should be immediate
      const state = renderer.getState();
      expect(state.scale).toBe(1.3);
      expect(state.translateX).toBe(-120);
      expect(state.translateY).toBe(170);
    });

    it('should not change state for non-existent service', () => {
      const initialState = renderer.getState();
      renderer.focusOnService('nonexistent');
      const state = renderer.getState();
      expect(state).toEqual(initialState);
    });
  });

  describe('selectService', () => {
    it('should call render when selecting a service', () => {
      const renderSpy = vi.spyOn(renderer, 'render');
      renderer.selectService('ec2');
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should call render when deselecting (null)', () => {
      const renderSpy = vi.spyOn(renderer, 'render');
      renderer.selectService(null);
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should clear canvas on render', () => {
      renderer.render();
      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    it('should save and restore context', () => {
      renderer.render();
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should apply current transform', () => {
      renderer.setState({ scale: 1.5, translateX: 50, translateY: 75 });
      renderer.render();
      expect(mockCtx.translate).toHaveBeenCalledWith(50, 75);
      expect(mockCtx.scale).toHaveBeenCalledWith(1.5, 1.5);
    });

    it('should draw connections', () => {
      renderer.render();
      // Should have beginPath called for each connection
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw nodes', () => {
      renderer.render();
      // Should call fill for node backgrounds
      expect(mockCtx.fill).toHaveBeenCalled();
      // Should draw text for node labels
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
  });

  describe('service click callback', () => {
    it('should register and call click callback', () => {
      const callback = vi.fn();
      renderer.setOnServiceClick(callback);

      // Set a known transform state for predictable click testing
      // With scale=1 and no translation, clicking at (400, 350) hits EC2
      renderer.setState({ scale: 1, translateX: 0, translateY: 0 });

      // Simulate click on EC2 (at x:400, y:350 with node size 120x40)
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 350,
      });
      mockCanvas.__triggerEvent('click', clickEvent);

      expect(callback).toHaveBeenCalledWith('ec2', testServices.ec2);
    });

    it('should call callback with empty values when clicking empty space', () => {
      const callback = vi.fn();
      renderer.setOnServiceClick(callback);

      // Set a known transform state
      renderer.setState({ scale: 1, translateX: 0, translateY: 0 });

      // Click in empty space (far from any node)
      const clickEvent = new MouseEvent('click', {
        clientX: 10,
        clientY: 10,
      });
      mockCanvas.__triggerEvent('click', clickEvent);

      expect(callback).toHaveBeenCalledWith('', expect.any(Object));
    });
  });
});

describe('CanvasRenderer error handling', () => {
  it('should throw error if canvas context is null', () => {
    const badCanvas = {
      getContext: vi.fn(() => null),
      getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, left: 0, top: 0 })),
      addEventListener: vi.fn(),
      setAttribute: vi.fn(),
      style: {},
    } as unknown as HTMLCanvasElement;

    expect(() => new CanvasRenderer(badCanvas, testServices, testConnections)).toThrow(
      'Could not get 2D context from canvas'
    );
  });
});

describe('CanvasRenderer keyboard navigation', () => {
  let mockCtx: CanvasRenderingContext2D;
  let mockCanvas: MockCanvas;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    // Setup RAF mock for animation testing
    setupRAFMock();
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    mockCtx = createMockContext();
    mockCanvas = createMockCanvas(mockCtx);
    renderer = new CanvasRenderer(mockCanvas, testServices, testConnections);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should pan up with ArrowUp key', () => {
    const initialState = renderer.getState();
    const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    mockCanvas.__triggerEvent('keydown', keyEvent);
    const newState = renderer.getState();
    expect(newState.translateY).toBe(initialState.translateY + 50);
  });

  it('should pan down with ArrowDown key', () => {
    const initialState = renderer.getState();
    const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    mockCanvas.__triggerEvent('keydown', keyEvent);
    const newState = renderer.getState();
    expect(newState.translateY).toBe(initialState.translateY - 50);
  });

  it('should pan left with ArrowLeft key', () => {
    const initialState = renderer.getState();
    const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    mockCanvas.__triggerEvent('keydown', keyEvent);
    const newState = renderer.getState();
    expect(newState.translateX).toBe(initialState.translateX + 50);
  });

  it('should pan right with ArrowRight key', () => {
    const initialState = renderer.getState();
    const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    mockCanvas.__triggerEvent('keydown', keyEvent);
    const newState = renderer.getState();
    expect(newState.translateX).toBe(initialState.translateX - 50);
  });

  it('should zoom in with + key', () => {
    const initialState = renderer.getState();
    const keyEvent = new KeyboardEvent('keydown', { key: '+' });
    mockCanvas.__triggerEvent('keydown', keyEvent);
    // Advance timers to complete animation
    flushAnimationFrames();
    const newState = renderer.getState();
    expect(newState.scale).toBeGreaterThan(initialState.scale);
  });

  it('should zoom out with - key', () => {
    const initialState = renderer.getState();
    const keyEvent = new KeyboardEvent('keydown', { key: '-' });
    mockCanvas.__triggerEvent('keydown', keyEvent);
    // Advance timers to complete animation
    flushAnimationFrames();
    const newState = renderer.getState();
    expect(newState.scale).toBeLessThan(initialState.scale);
  });

  it('should reset view with 0 key', () => {
    renderer.setState({ scale: 2.5, translateX: 500, translateY: 500 });
    const keyEvent = new KeyboardEvent('keydown', { key: '0' });
    mockCanvas.__triggerEvent('keydown', keyEvent);
    // Advance timers to complete animation
    flushAnimationFrames();
    const newState = renderer.getState();
    // Should have reset (not at the manually set values)
    expect(newState.scale).not.toBe(2.5);
    expect(newState.translateX).not.toBe(500);
  });

  it('should deselect service with Escape key', () => {
    const callback = vi.fn();
    renderer.setOnServiceClick(callback);
    renderer.selectService('ec2');

    const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    mockCanvas.__triggerEvent('keydown', keyEvent);

    expect(callback).toHaveBeenCalledWith('', expect.any(Object));
  });
});

describe('CanvasRenderer animations', () => {
  let mockCtx: CanvasRenderingContext2D;
  let mockCanvas: MockCanvas;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    // Setup RAF mock for animation testing
    setupRAFMock();
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    mockCtx = createMockContext();
    mockCanvas = createMockCanvas(mockCtx);
    renderer = new CanvasRenderer(mockCanvas, testServices, testConnections);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should report animation state via isAnimating()', () => {
    expect(renderer.isAnimating()).toBe(false);
    renderer.centerViewOnContent();
    expect(renderer.isAnimating()).toBe(true);
    flushAnimationFrames();
    expect(renderer.isAnimating()).toBe(false);
  });

  it('should cancel animation when dragging starts', () => {
    renderer.centerViewOnContent();
    expect(renderer.isAnimating()).toBe(true);

    // Simulate mouse down to cancel animation
    const mouseDownEvent = new MouseEvent('mousedown', {
      clientX: 400,
      clientY: 300,
    });
    mockCanvas.__triggerEvent('mousedown', mouseDownEvent);

    expect(renderer.isAnimating()).toBe(false);
  });

  it('should interpolate state during animation', () => {
    renderer.setState({ scale: 1, translateX: 0, translateY: 0 });
    const initialState = renderer.getState();

    renderer.focusOnService('vpc');

    // Advance time partially through animation
    advanceMockTime(200);

    const midState = renderer.getState();

    // State should be between initial and target
    // Target scale is 1.3, so mid should be somewhere between 1 and 1.3
    expect(midState.scale).toBeGreaterThan(initialState.scale);
    expect(midState.scale).toBeLessThan(1.3);

    // Complete the animation
    flushAnimationFrames();

    const finalState = renderer.getState();
    expect(finalState.scale).toBe(1.3);
  });

  it('should use ease-out easing for smooth deceleration', () => {
    renderer.setState({ scale: 1, translateX: 0, translateY: 0 });

    renderer.focusOnService('vpc');

    // Sample animation at 50% time (200ms of 400ms)
    advanceMockTime(200);
    const midState = renderer.getState();

    // With ease-out cubic, progress at t=0.5 should be 1 - (1-0.5)^3 = 0.875
    // So scale should be closer to target (1.3) than halfway (1.15)
    // Initial: 1, Target: 1.3, Linear midpoint: 1.15
    // With ease-out, should be > 1.15
    const linearMidpoint = 1 + (1.3 - 1) * 0.5; // 1.15
    expect(midState.scale).toBeGreaterThan(linearMidpoint);
  });

  it('should accumulate zoom when wheel events occur during animation', () => {
    const initialState = renderer.getState();

    // First wheel event
    const wheelEvent1 = new WheelEvent('wheel', {
      deltaY: -100, // zoom in
      clientX: 400,
      clientY: 300,
    });
    mockCanvas.__triggerEvent('wheel', wheelEvent1);

    // Don't complete animation, trigger another wheel event
    advanceMockTime(50);

    const wheelEvent2 = new WheelEvent('wheel', {
      deltaY: -100, // zoom in again
      clientX: 400,
      clientY: 300,
    });
    mockCanvas.__triggerEvent('wheel', wheelEvent2);

    // Complete all animations
    flushAnimationFrames();

    const finalState = renderer.getState();

    // Should have zoomed in more than a single zoom step
    // Single zoom factor is 1.1, so two should give > 1.1x original scale
    expect(finalState.scale).toBeGreaterThan(initialState.scale * 1.1);
  });
});
