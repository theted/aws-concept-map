import { HASH_KEYS } from '../config/constants';
import type { TourPosition } from '../types';

/** The part of app state that lives in the URL, so views are shareable and Back works. */
export interface Route {
  service: string | null;
  tour: TourPosition | null;
}

export const EMPTY_ROUTE: Route = { service: null, tour: null };

/** Parses `#service=lambda` or `#tour=data-lake&step=2` (step is 1-based in the URL). */
export const parseHash = (hash: string): Route => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const tourId = params.get(HASH_KEYS.tour);
  if (tourId) {
    const step = Number.parseInt(params.get(HASH_KEYS.step) ?? '1', 10);
    return { service: null, tour: { id: tourId, step: Number.isFinite(step) ? Math.max(step - 1, 0) : 0 } };
  }
  return { service: params.get(HASH_KEYS.service) || null, tour: null };
};

export const toHash = ({ service, tour }: Route): string => {
  if (tour) return `#${HASH_KEYS.tour}=${encodeURIComponent(tour.id)}&${HASH_KEYS.step}=${tour.step + 1}`;
  if (service) return `#${HASH_KEYS.service}=${encodeURIComponent(service)}`;
  return '';
};

export const sameRoute = (a: Route, b: Route): boolean => toHash(a) === toHash(b);

/** Stepping within one tour replaces history so Back leaves the tour instead of rewinding it. */
export const isStepChangeOnly = (prev: Route, next: Route): boolean =>
  !!prev.tour && !!next.tour && prev.tour.id === next.tour.id;
