import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutEngine } from './LayoutEngine';
import type { ServiceMap, ServiceCategory } from '../types';
import { services as realServices } from '../data/services';

describe('LayoutEngine', () => {
  let engine: LayoutEngine;

  beforeEach(() => {
    engine = new LayoutEngine();
  });

  describe('constructor', () => {
    it('should create an instance with default config', () => {
      const config = engine.getConfig();
      expect(config.nodeWidth).toBe(120);
      expect(config.nodeHeight).toBe(40);
      expect(config.nodePadding).toBe(30);
      expect(config.categoryPadding).toBe(80);
      expect(config.categoryColumns).toBe(4);
    });

    it('should allow custom config', () => {
      const customEngine = new LayoutEngine({
        nodeWidth: 100,
        nodePadding: 20,
      });
      const config = customEngine.getConfig();
      expect(config.nodeWidth).toBe(100);
      expect(config.nodePadding).toBe(20);
      expect(config.nodeHeight).toBe(40); // Default
    });
  });

  describe('computeLayout', () => {
    it('should handle empty services', () => {
      const result = engine.computeLayout({});
      expect(Object.keys(result.services)).toHaveLength(0);
    });

    it('should layout a single service', () => {
      const services: ServiceMap = {
        test: {
          name: 'Test',
          category: 'compute',
          description: 'Test service',
          details: 'Test details',
          keyPoints: ['Point 1'],
          x: 0,
          y: 0,
        },
      };

      const result = engine.computeLayout(services);
      expect(result.services.test).toBeDefined();
      expect(result.services.test.name).toBe('Test');
      expect(typeof result.services.test.x).toBe('number');
      expect(typeof result.services.test.y).toBe('number');
    });

    it('should preserve service properties except x and y', () => {
      const services: ServiceMap = {
        test: {
          name: 'Test Service',
          category: 'compute',
          description: 'A test service',
          details: 'Detailed information',
          keyPoints: ['Point 1', 'Point 2'],
          x: 100,
          y: 200,
          extendedDescription: 'Extended info',
          resources: [{ title: 'Link', url: 'https://example.com' }],
        },
      };

      const result = engine.computeLayout(services);
      expect(result.services.test.name).toBe('Test Service');
      expect(result.services.test.category).toBe('compute');
      expect(result.services.test.description).toBe('A test service');
      expect(result.services.test.details).toBe('Detailed information');
      expect(result.services.test.keyPoints).toEqual(['Point 1', 'Point 2']);
      expect(result.services.test.extendedDescription).toBe('Extended info');
      expect(result.services.test.resources).toEqual([{ title: 'Link', url: 'https://example.com' }]);
    });

    it('should group services by category', () => {
      const services: ServiceMap = {
        compute1: {
          name: 'Compute 1',
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 0,
          y: 0,
        },
        compute2: {
          name: 'Compute 2',
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 0,
          y: 0,
        },
        storage1: {
          name: 'Storage 1',
          category: 'storage',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 0,
          y: 0,
        },
      };

      const result = engine.computeLayout(services);

      // Services in same category should share a row or be close
      const compute1Y = result.services.compute1.y;
      const compute2Y = result.services.compute2.y;
      expect(Math.abs(compute1Y - compute2Y)).toBeLessThanOrEqual(70); // Within same category group
    });

    it('should calculate bounds correctly', () => {
      const services: ServiceMap = {
        test1: {
          name: 'Test 1',
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 0,
          y: 0,
        },
        test2: {
          name: 'Test 2',
          category: 'storage',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 0,
          y: 0,
        },
      };

      const result = engine.computeLayout(services);
      expect(result.bounds.minX).toBeLessThan(result.bounds.maxX);
      expect(result.bounds.minY).toBeLessThan(result.bounds.maxY);
    });
  });

  describe('nodesOverlap', () => {
    it('should detect overlapping nodes', () => {
      const pos1 = { x: 100, y: 100 };
      const pos2 = { x: 110, y: 100 }; // Only 10px apart, but nodes are 120px wide

      expect(engine.nodesOverlap(pos1, pos2)).toBe(true);
    });

    it('should not detect overlap for distant nodes', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 200, y: 200 }; // Far apart

      expect(engine.nodesOverlap(pos1, pos2)).toBe(false);
    });

    it('should detect overlap when nodes touch edges', () => {
      // Nodes are 120px wide, so center-to-center distance < 120 means overlap
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 119, y: 0 }; // Just barely overlapping

      expect(engine.nodesOverlap(pos1, pos2)).toBe(true);
    });

    it('should not detect overlap when nodes are separated by gap', () => {
      // Nodes are 120px wide, so > 120 apart (center-to-center) means no overlap
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 121, y: 0 }; // Just beyond touching

      expect(engine.nodesOverlap(pos1, pos2)).toBe(false);
    });

    it('should detect vertical overlap', () => {
      const pos1 = { x: 100, y: 100 };
      const pos2 = { x: 100, y: 110 }; // Same x, only 10px apart vertically (nodes are 40px high)

      expect(engine.nodesOverlap(pos1, pos2)).toBe(true);
    });
  });

  describe('validateNoOverlaps', () => {
    it('should validate layout with no overlaps', () => {
      const services: ServiceMap = {
        test1: {
          name: 'Test 1',
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 0,
          y: 0,
        },
        test2: {
          name: 'Test 2',
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 200,
          y: 200,
        },
      };

      const result = engine.validateNoOverlaps(services);
      expect(result.valid).toBe(true);
      expect(result.overlaps).toHaveLength(0);
    });

    it('should detect overlapping services', () => {
      const services: ServiceMap = {
        test1: {
          name: 'Test 1',
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 100,
          y: 100,
        },
        test2: {
          name: 'Test 2',
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 110,
          y: 100, // Overlapping with test1
        },
      };

      const result = engine.validateNoOverlaps(services);
      expect(result.valid).toBe(false);
      expect(result.overlaps).toContainEqual(['test1', 'test2']);
    });

    it('should handle empty services', () => {
      const result = engine.validateNoOverlaps({});
      expect(result.valid).toBe(true);
      expect(result.overlaps).toHaveLength(0);
    });
  });

  describe('computed layout validation', () => {
    it('should produce non-overlapping layout for multiple services in same category', () => {
      const services: ServiceMap = {};
      for (let i = 0; i < 10; i++) {
        services[`compute${i}`] = {
          name: `Compute ${i}`,
          category: 'compute',
          description: 'Desc',
          details: 'Details',
          keyPoints: [],
          x: 0,
          y: 0,
        };
      }

      const result = engine.computeLayout(services);
      const validation = engine.validateNoOverlaps(result.services);

      expect(validation.valid).toBe(true);
      expect(validation.overlaps).toHaveLength(0);
    });

    it('should produce non-overlapping layout for services across categories', () => {
      const categories: ServiceCategory[] = ['compute', 'storage', 'database', 'networking', 'security'];
      const services: ServiceMap = {};

      categories.forEach((category) => {
        for (let i = 0; i < 5; i++) {
          services[`${category}${i}`] = {
            name: `${category} ${i}`,
            category,
            description: 'Desc',
            details: 'Details',
            keyPoints: [],
            x: 0,
            y: 0,
          };
        }
      });

      const result = engine.computeLayout(services);
      const validation = engine.validateNoOverlaps(result.services);

      expect(validation.valid).toBe(true);
      expect(validation.overlaps).toHaveLength(0);
    });

    it('should produce non-overlapping layout for real services data', () => {
      const result = engine.computeLayout(realServices);
      const validation = engine.validateNoOverlaps(result.services);

      expect(validation.valid).toBe(true);
      expect(validation.overlaps).toHaveLength(0);
    });
  });

  describe('layout consistency', () => {
    it('should produce consistent results for same input', () => {
      const services: ServiceMap = {
        a: { name: 'A', category: 'compute', description: '', details: '', keyPoints: [], x: 0, y: 0 },
        b: { name: 'B', category: 'compute', description: '', details: '', keyPoints: [], x: 0, y: 0 },
        c: { name: 'C', category: 'storage', description: '', details: '', keyPoints: [], x: 0, y: 0 },
      };

      const result1 = engine.computeLayout(services);
      const result2 = engine.computeLayout(services);

      expect(result1.services.a.x).toBe(result2.services.a.x);
      expect(result1.services.a.y).toBe(result2.services.a.y);
      expect(result1.services.b.x).toBe(result2.services.b.x);
      expect(result1.services.b.y).toBe(result2.services.b.y);
      expect(result1.services.c.x).toBe(result2.services.c.x);
      expect(result1.services.c.y).toBe(result2.services.c.y);
    });
  });

  describe('custom configuration', () => {
    it('should respect custom node dimensions', () => {
      const customEngine = new LayoutEngine({
        nodeWidth: 200,
        nodeHeight: 80,
        nodePadding: 50,
      });

      const services: ServiceMap = {
        test1: { name: 'Test 1', category: 'compute', description: '', details: '', keyPoints: [], x: 0, y: 0 },
        test2: { name: 'Test 2', category: 'compute', description: '', details: '', keyPoints: [], x: 0, y: 0 },
      };

      const result = customEngine.computeLayout(services);
      const validation = customEngine.validateNoOverlaps(result.services);

      expect(validation.valid).toBe(true);
    });
  });
});
