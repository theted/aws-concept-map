import { clampStep, findTour } from '../data/tours';
import type { AppState, Tour } from '../types';

/** State transitions as pure patch builders, so views stay free of business rules. */

export const selectService = (id: string | null): Partial<AppState> => ({
  selected: id,
  tour: null,
  focusedEdge: null,
  guideOpen: false,
});

export const startTour = (id: string, step = 0): Partial<AppState> => ({
  tour: { id, step },
  selected: null,
  focusedEdge: null,
  guideOpen: false,
});

export const goToStep =
  (tours: readonly Tour[], step: number) =>
  (state: AppState): Partial<AppState> => {
    const tour = findTour(tours, state.tour?.id);
    return tour ? { tour: { id: tour.id, step: clampStep(tour, step) } } : {};
  };

export const stepBy =
  (tours: readonly Tour[], delta: number) =>
  (state: AppState): Partial<AppState> =>
    goToStep(tours, (state.tour?.step ?? 0) + delta)(state);

/** Clicking a tile during a tour jumps to its step; outside the tour it leaves the tour. */
export const activateTile =
  (tours: readonly Tour[], id: string) =>
  (state: AppState): Partial<AppState> => {
    const tour = findTour(tours, state.tour?.id);
    const step = tour?.steps.findIndex(({ service }) => service === id) ?? -1;
    if (tour && step >= 0) return { tour: { id: tour.id, step } };
    return selectService(state.selected === id && !tour ? null : id);
  };

export const closeAll = (): Partial<AppState> => ({ ...selectService(null), query: '' });

export const toggleRelationType =
  (type: AppState['hiddenTypes'][number]) =>
  (state: AppState): Partial<AppState> => ({
    hiddenTypes: state.hiddenTypes.includes(type)
      ? state.hiddenTypes.filter((t) => t !== type)
      : [...state.hiddenTypes, type],
  });
