import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeNodeWidth,
  computeAllNodeWidths,
  getDefaultNodeWidthConfig,
  type NodeWidthConfig,
} from './nodeWidths';
import type { ServiceMap } from '../types';

// Mock canvas context for testing
function createMockContext(): CanvasRenderingContext2D {
  return {
    font: '',
    measureText: vi.fn((text: string) => ({
      width: text.length * 8, // Approximate 8px per character
    })),
  } as unknown as CanvasRenderingContext2D;
}

describe('nodeWidths utility', () => {
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCtx = createMockContext();
  });

  describe('computeNodeWidth', () => {
    it('should compute width based on text length', () => {
      const width = computeNodeWidth(mockCtx, 'EC2');
      // 3 chars * 8px + 24px padding = 48px, but min is 80px
      expect(width).toBe(80);
    });

    it('should respect minimum width', () => {
      const width = computeNodeWidth(mockCtx, 'S3'); // Very short name
      expect(width).toBeGreaterThanOrEqual(80);
    });

    it('should respect maximum width', () => {
      const veryLongName = 'This Is A Very Long Service Name That Exceeds Maximum';
      const width = computeNodeWidth(mockCtx, veryLongName);
      expect(width).toBeLessThanOrEqual(200);
    });

    it('should calculate appropriate width for medium-length names', () => {
      const width = computeNodeWidth(mockCtx, 'CloudFormation');
      // 14 chars * 8px + 24px padding = 136px
      expect(width).toBe(136);
    });

    it('should set font on context', () => {
      const config = getDefaultNodeWidthConfig();
      computeNodeWidth(mockCtx, 'Test');
      expect(mockCtx.font).toBe(config.font);
    });

    it('should accept custom config', () => {
      const customConfig: NodeWidthConfig = {
        font: '14px Arial',
        minWidth: 50,
        maxWidth: 300,
        horizontalPadding: 10,
      };
      const width = computeNodeWidth(mockCtx, 'Test', customConfig);
      // 4 chars * 8px + 10px padding = 42px, but min is 50px
      expect(width).toBe(50);
    });
  });

  describe('computeAllNodeWidths', () => {
    const testServices: ServiceMap = {
      ec2: {
        name: 'EC2',
        category: 'compute',
        description: 'Virtual servers',
        details: 'Details',
        keyPoints: [],
        x: 0,
        y: 0,
      },
      cloudformation: {
        name: 'CloudFormation',
        category: 'management',
        description: 'Infrastructure as Code',
        details: 'Details',
        keyPoints: [],
        x: 0,
        y: 0,
      },
      s3: {
        name: 'S3',
        category: 'storage',
        description: 'Object storage',
        details: 'Details',
        keyPoints: [],
        x: 0,
        y: 0,
      },
    };

    it('should compute widths for all services', () => {
      const widths = computeAllNodeWidths(testServices, mockCtx);
      expect(widths.size).toBe(3);
      expect(widths.has('ec2')).toBe(true);
      expect(widths.has('cloudformation')).toBe(true);
      expect(widths.has('s3')).toBe(true);
    });

    it('should return a Map of service key to width', () => {
      const widths = computeAllNodeWidths(testServices, mockCtx);
      expect(widths).toBeInstanceOf(Map);

      // Verify widths are numbers
      widths.forEach((width) => {
        expect(typeof width).toBe('number');
        expect(width).toBeGreaterThanOrEqual(80);
        expect(width).toBeLessThanOrEqual(200);
      });
    });

    it('should produce different widths for different name lengths', () => {
      const widths = computeAllNodeWidths(testServices, mockCtx);

      const s3Width = widths.get('s3')!;
      const cloudformationWidth = widths.get('cloudformation')!;

      // S3 is very short, CloudFormation is longer
      expect(s3Width).toBe(80); // Minimum width
      expect(cloudformationWidth).toBeGreaterThan(s3Width);
    });

    it('should handle empty services', () => {
      const widths = computeAllNodeWidths({}, mockCtx);
      expect(widths.size).toBe(0);
    });
  });

  describe('getDefaultNodeWidthConfig', () => {
    it('should return default configuration', () => {
      const config = getDefaultNodeWidthConfig();
      expect(config.minWidth).toBe(80);
      expect(config.maxWidth).toBe(200);
      expect(config.horizontalPadding).toBe(24);
      expect(config.font).toContain('13px');
    });

    it('should return a copy (not the original object)', () => {
      const config1 = getDefaultNodeWidthConfig();
      const config2 = getDefaultNodeWidthConfig();
      config1.minWidth = 999;
      expect(config2.minWidth).toBe(80);
    });
  });
});
