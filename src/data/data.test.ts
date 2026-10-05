import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '../config/categories';
import { RELATION_TYPE_IDS } from '../config/relations';
import { connections, services, tours } from '.';

/** Guards the content files: the JSON is hand-edited, so these catch typos and dangling ids. */

const ids = Object.keys(services);
const MAX_TAGLINE = 22;

describe('services.json', () => {
  it('has a broad set of services', () => {
    expect(ids.length).toBeGreaterThanOrEqual(60);
  });

  it.each(ids)('%s has complete content', (id) => {
    const s = services[id];
    expect(s.name.trim()).not.toBe('');
    expect(s.fullName.trim()).not.toBe('');
    expect(s.summary.trim()).not.toBe('');
    expect(s.extendedDescription.trim()).not.toBe('');
    expect(s.keyPoints.length).toBeGreaterThanOrEqual(1);
    expect(CATEGORY_IDS).toContain(s.category);
  });

  it.each(ids)('%s has a tagline short enough for a tile', (id) => {
    expect(services[id].tagline.length).toBeGreaterThan(0);
    expect(services[id].tagline.length).toBeLessThanOrEqual(MAX_TAGLINE);
  });

  it.each(ids)('%s has 3-12 https resources', (id) => {
    const { resources } = services[id];
    expect(resources.length).toBeGreaterThanOrEqual(3);
    expect(resources.length).toBeLessThanOrEqual(12);
    resources.forEach(({ title, url }) => {
      expect(title.trim()).not.toBe('');
      expect(url).toMatch(/^https:\/\//);
    });
  });

  it('fills every map zone', () => {
    const used = new Set(Object.values(services).map(({ category }) => category));
    expect([...used].sort()).toEqual([...CATEGORY_IDS].sort());
  });

  it('has unique display names', () => {
    const names = Object.values(services).map(({ name }) => name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('connections.json', () => {
  it.each(connections.map((c) => [`${c.from}->${c.to}`, c] as const))('%s is valid', (_, c) => {
    expect(services[c.from], `unknown from: ${c.from}`).toBeDefined();
    expect(services[c.to], `unknown to: ${c.to}`).toBeDefined();
    expect(c.from).not.toBe(c.to);
    expect(RELATION_TYPE_IDS).toContain(c.type);
    expect(c.verb.trim()).not.toBe('');
  });

  it('has no duplicate directed edges', () => {
    const keys = connections.map(({ from, to }) => `${from}->${to}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('connects every service to at least one other', () => {
    const connected = new Set(connections.flatMap(({ from, to }) => [from, to]));
    expect(ids.filter((id) => !connected.has(id))).toEqual([]);
  });
});

describe('tours.json', () => {
  it('has unique ids', () => {
    const tourIds = tours.map(({ id }) => id);
    expect(new Set(tourIds).size).toBe(tourIds.length);
  });

  it.each(tours.map((t) => [t.id, t] as const))('%s references real services', (_, tour) => {
    expect(tour.steps.length).toBeGreaterThanOrEqual(3);
    tour.steps.forEach(({ service, links, text }) => {
      expect(services[service], `unknown step service: ${service}`).toBeDefined();
      (links ?? []).forEach((link) => expect(services[link], `unknown link: ${link}`).toBeDefined());
      expect(text.trim()).not.toBe('');
    });
  });
});
