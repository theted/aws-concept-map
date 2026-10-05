import { describe, expect, it } from 'vitest';
import { fixtureTours } from '../test/fixtures';
import { clampStep, currentStepService, findTour, tourLinks, toursFeaturing } from './tours';

const [tour] = fixtureTours;

describe('tourLinks', () => {
  it('links each step from the previous one unless told otherwise', () => {
    expect(tourLinks(tour)).toEqual([
      { from: 'apigw', to: 'lambda', step: 1 },
      { from: 'lambda', to: 'ddb', step: 3 },
    ]);
  });
});

describe('tour helpers', () => {
  it('finds tours by id', () => {
    expect(findTour(fixtureTours, 'api')).toBe(tour);
    expect(findTour(fixtureTours, 'nope')).toBeUndefined();
    expect(findTour(fixtureTours, undefined)).toBeUndefined();
  });

  it('clamps steps into range', () => {
    expect(clampStep(tour, -3)).toBe(0);
    expect(clampStep(tour, 2)).toBe(2);
    expect(clampStep(tour, 99)).toBe(3);
  });

  it('resolves the service of the current step', () => {
    expect(currentStepService(fixtureTours, { id: 'api', step: 1 })).toBe('lambda');
    expect(currentStepService(fixtureTours, { id: 'api', step: 42 })).toBe('ddb');
    expect(currentStepService(fixtureTours, null)).toBeNull();
  });

  it('lists tours featuring a service with its step', () => {
    expect(toursFeaturing(fixtureTours, 'iam')).toEqual([{ tour, step: 2 }]);
    expect(toursFeaturing(fixtureTours, 's3')).toEqual([]);
  });
});
