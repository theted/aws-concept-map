import { clampStep, findTour } from '../data/tours';
import type { AppState } from '../types';
import type { AppContext } from './context';
import type { Store } from './store';
import { isStepChangeOnly, parseHash, sameRoute, toHash, type Route } from './url';

const routeOf = ({ selected, tour }: AppState): Route => ({ service: selected, tour });

/** Drops unknown ids so a stale or hand-edited link falls back to the overview. */
export const sanitizeRoute = (route: Route, ctx: AppContext): Route => {
  const tour = findTour(ctx.tours, route.tour?.id);
  if (tour && route.tour) return { service: null, tour: { id: tour.id, step: clampStep(tour, route.tour.step) } };
  return { service: route.service && ctx.services[route.service] ? route.service : null, tour: null };
};

const routePatch = (route: Route): Partial<AppState> => ({
  selected: route.service,
  tour: route.tour,
  focusedEdge: null,
});

const urlFor = (route: Route): string => `${window.location.pathname}${window.location.search}${toHash(route)}`;

/** Two-way sync between the store and `location.hash`, with Back/Forward support. */
export const connectRouter = (store: Store<AppState>, ctx: AppContext): void => {
  let syncingFromUrl = false;

  const applyUrl = (): void => {
    syncingFromUrl = true;
    const route = sanitizeRoute(parseHash(window.location.hash), ctx);
    store.set(routePatch(route));
    syncingFromUrl = false;
    history.replaceState(null, '', urlFor(route));
  };

  store.subscribe((state, prev) => {
    const next = routeOf(state);
    const before = routeOf(prev);
    if (syncingFromUrl || sameRoute(next, before)) return;
    if (isStepChangeOnly(before, next)) history.replaceState(null, '', urlFor(next));
    else history.pushState(null, '', urlFor(next));
  });

  window.addEventListener('popstate', applyUrl);
  applyUrl();
};
