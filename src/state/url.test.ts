import { describe, expect, it } from 'vitest';
import { EMPTY_ROUTE, isStepChangeOnly, parseHash, sameRoute, toHash } from './url';

describe('parseHash', () => {
  it('reads a service (format shared before the redesign)', () => {
    expect(parseHash('#service=lambda')).toEqual({ service: 'lambda', tour: null });
  });

  it('reads a tour with a 1-based step', () => {
    expect(parseHash('#tour=data-lake&step=3')).toEqual({ service: null, tour: { id: 'data-lake', step: 2 } });
  });

  it('defaults a missing or bad step to the first', () => {
    expect(parseHash('#tour=x').tour?.step).toBe(0);
    expect(parseHash('#tour=x&step=abc').tour?.step).toBe(0);
    expect(parseHash('#tour=x&step=-4').tour?.step).toBe(0);
  });

  it('returns the empty route for empty or unknown hashes', () => {
    expect(parseHash('')).toEqual(EMPTY_ROUTE);
    expect(parseHash('#foo=bar')).toEqual(EMPTY_ROUTE);
    expect(parseHash('#service=')).toEqual(EMPTY_ROUTE);
  });
});

describe('toHash', () => {
  it('round-trips with parseHash', () => {
    const routes = [
      { service: 'iam', tour: null },
      { service: null, tour: { id: 'three-tier', step: 4 } },
      EMPTY_ROUTE,
    ];
    routes.forEach((route) => expect(parseHash(toHash(route))).toEqual(route));
  });

  it('produces no hash for the overview', () => {
    expect(toHash(EMPTY_ROUTE)).toBe('');
  });

  it('encodes ids', () => {
    expect(toHash({ service: 'a b', tour: null })).toBe('#service=a%20b');
  });
});

describe('route comparison', () => {
  const tourStep = (step: number) => ({ service: null, tour: { id: 't', step } });

  it('compares routes by value', () => {
    expect(sameRoute(tourStep(1), tourStep(1))).toBe(true);
    expect(sameRoute(tourStep(1), tourStep(2))).toBe(false);
  });

  it('detects step changes within one tour', () => {
    expect(isStepChangeOnly(tourStep(1), tourStep(2))).toBe(true);
    expect(isStepChangeOnly(EMPTY_ROUTE, tourStep(0))).toBe(false);
    expect(isStepChangeOnly(tourStep(0), { service: null, tour: { id: 'other', step: 0 } })).toBe(false);
  });
});
