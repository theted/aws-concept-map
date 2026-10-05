import type { Tour, TourPosition } from '../types';

export interface TourLink {
  from: string;
  to: string;
  /** Index of the step this link leads into */
  step: number;
}

/** Each step links from its explicit `links`, or from the previous step by default. */
export const tourLinks = (tour: Tour): TourLink[] =>
  tour.steps.flatMap(({ service, links }, step) => {
    const sources = links ?? (step > 0 ? [tour.steps[step - 1].service] : []);
    return sources.map((from) => ({ from, to: service, step }));
  });

export const findTour = (tours: readonly Tour[], id: string | undefined): Tour | undefined =>
  tours.find((tour) => tour.id === id);

export const clampStep = (tour: Tour, step: number): number =>
  Math.min(Math.max(step, 0), tour.steps.length - 1);

export const currentStepService = (tours: readonly Tour[], position: TourPosition | null): string | null => {
  const tour = findTour(tours, position?.id);
  return tour && position ? tour.steps[clampStep(tour, position.step)].service : null;
};

/** Tours a service appears in, with the step to jump to. */
export const toursFeaturing = (tours: readonly Tour[], serviceId: string): { tour: Tour; step: number }[] =>
  tours.flatMap((tour) => {
    const step = tour.steps.findIndex(({ service }) => service === serviceId);
    return step >= 0 ? [{ tour, step }] : [];
  });
