import { describe, it, expect } from 'vitest';
import { services, connections } from './services';

describe('services data', () => {
  it('should have at least 30 services defined', () => {
    const serviceCount = Object.keys(services).length;
    expect(serviceCount).toBeGreaterThanOrEqual(30);
  });

  it('each service should have required fields', () => {
    Object.entries(services).forEach(([key, service]) => {
      expect(service.name, `${key} missing name`).toBeDefined();
      expect(service.category, `${key} missing category`).toBeDefined();
      expect(service.description, `${key} missing description`).toBeDefined();
      expect(service.details, `${key} missing details`).toBeDefined();
      expect(service.keyPoints, `${key} missing keyPoints`).toBeInstanceOf(Array);
      // Note: x/y coordinates are computed dynamically by LayoutEngine, not stored in JSON
    });
  });

  it('each service should have at least one key point', () => {
    Object.entries(services).forEach(([key, service]) => {
      expect(
        service.keyPoints.length,
        `${key} should have at least one key point`
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it('service categories should be valid', () => {
    const validCategories = [
      'compute',
      'storage',
      'database',
      'networking',
      'security',
      'management',
      'cost',
      'messaging',
      'cdn',
      'devtools',
    ];

    Object.entries(services).forEach(([key, service]) => {
      expect(
        validCategories,
        `${key} has invalid category: ${service.category}`
      ).toContain(service.category);
    });
  });

  it('each service should have 3-12 resources', () => {
    Object.entries(services).forEach(([key, service]) => {
      const resourceCount = service.resources?.length ?? 0;
      expect(
        resourceCount,
        `${key} has ${resourceCount} resources (expected 3-12)`
      ).toBeGreaterThanOrEqual(3);
      expect(
        resourceCount,
        `${key} has ${resourceCount} resources (expected 3-12)`
      ).toBeLessThanOrEqual(12);
    });
  });

  it('each resource should have valid title and url', () => {
    Object.entries(services).forEach(([key, service]) => {
      service.resources?.forEach((resource, index) => {
        expect(
          resource.title,
          `${key} resource ${index} missing title`
        ).toBeDefined();
        expect(
          resource.title.length,
          `${key} resource ${index} has empty title`
        ).toBeGreaterThan(0);
        expect(
          resource.url,
          `${key} resource ${index} missing url`
        ).toBeDefined();
        expect(
          resource.url,
          `${key} resource ${index} has invalid url`
        ).toMatch(/^https?:\/\//);
      });
    });
  });
});

describe('connections data', () => {
  it('should have connections defined', () => {
    expect(connections.length).toBeGreaterThan(0);
  });

  it('all connections should reference valid services', () => {
    const serviceKeys = Object.keys(services);

    connections.forEach(([from, to]) => {
      expect(
        serviceKeys,
        `Connection references invalid service: ${from}`
      ).toContain(from);
      expect(
        serviceKeys,
        `Connection references invalid service: ${to}`
      ).toContain(to);
    });
  });

  it('connections should be unique', () => {
    const connectionStrings = connections.map(([from, to]) => `${from}-${to}`);
    const uniqueConnections = new Set(connectionStrings);
    expect(uniqueConnections.size).toBe(connections.length);
  });
});
