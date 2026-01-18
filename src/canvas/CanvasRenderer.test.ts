import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasRenderer } from './CanvasRenderer';
import type { ServiceMap, Connection } from '../types';

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

// Mock canvas element
function createMockCanvas(ctx: CanvasRenderingContext2D): HTMLCanvasElement {
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
    // Helper to trigger events in tests
    __triggerEvent: (event: string, eventData: Event) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach((listener) => listener(eventData));
      }
    },
  } as unknown as HTMLCanvasElement & { __triggerEvent: (event: string, eventData: Event) => void };
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
  let mockCanvas: HTMLCanvasElement & { __triggerEvent: (event: string, eventData: Event) => void };
  let renderer: CanvasRenderer;

  beforeEach(() => {
    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });

    // Mock window resize event
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});

    mockCtx = createMockContext();
    mockCanvas = createMockCanvas(mockCtx);
    renderer = new CanvasRenderer(mockCanvas, testServices, testConnections);
  });

  describe('initialization', () => {
    it('should create a renderer with initial state', () => {
      const state = renderer.getState();
      expect(state.scale).toBe(1);
      expect(state.translateX).toBe(0);
      expect(state.translateY).toBe(0);
    });

    it('should get 2D context from canvas', () => {
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should set up event listeners', () => {
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('state management', () => {
    it('should update state via setState', () => {
      renderer.setState({ scale: 1.5, translateX: 100 });
      const state = renderer.getState();
      expect(state.scale).toBe(1.5);
      expect(state.translateX).toBe(100);
      expect(state.translateY).toBe(0); // unchanged
    });

    it('should reset view to initial state', () => {
      renderer.setState({ scale: 2, translateX: 200, translateY: 150 });
      renderer.resetView();
      const state = renderer.getState();
      expect(state.scale).toBe(1);
      expect(state.translateX).toBe(0);
      expect(state.translateY).toBe(0);
    });
  });

  describe('focusOnService', () => {
    it('should center view on specified service', () => {
      renderer.focusOnService('vpc');
      const state = renderer.getState();
      expect(state.scale).toBe(1.3);
      // The translate should center VPC (at x:400, y:100) in the canvas (800x600)
      // translateX = canvasWidth/2 - serviceX * scale = 400 - 400 * 1.3 = -120
      // translateY = canvasHeight/2 - serviceY * scale = 300 - 100 * 1.3 = 170
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

      // Simulate click on EC2 (at x:400, y:350 with node size 120x40)
      // Screen position for EC2 with no transforms: 400, 350
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
      style: {},
    } as unknown as HTMLCanvasElement;

    expect(() => new CanvasRenderer(badCanvas, testServices, testConnections)).toThrow(
      'Could not get 2D context from canvas'
    );
  });
});
