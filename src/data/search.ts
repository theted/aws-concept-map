import type { Service, ServiceMap } from '../types';

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const haystack = (id: string, service: Service): string =>
  normalize([id, service.name, service.fullName, service.tagline].join(' '));

/** Name matches rank above matches buried in the full name or tagline. */
const score = (id: string, service: Service, needle: string): number => {
  const name = normalize(service.name);
  if (name === needle || id === needle) return 0;
  if (name.startsWith(needle)) return 1;
  if (name.includes(needle)) return 2;
  return 3;
};

/**
 * Returns ids of services matching every word of the query, best match first.
 * An empty query matches nothing (callers treat that as "no filter").
 */
export const searchServices = (services: ServiceMap, query: string): string[] => {
  const needle = normalize(query);
  if (!needle) return [];
  const words = needle.split(' ');

  return Object.entries(services)
    .filter(([id, service]) => {
      const text = haystack(id, service);
      return words.every((word) => text.includes(word));
    })
    .sort(([idA, a], [idB, b]) => score(idA, a, needle) - score(idB, b, needle))
    .map(([id]) => id);
};
