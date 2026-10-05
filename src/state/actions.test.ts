import { describe, expect, it } from 'vitest';
import { baseState, fixtureContext, fixtureTours } from '../test/fixtures';
import { activateTile, closeAll, goToStep, selectService, startTour, stepBy, toggleRelationType } from './actions';
import { sanitizeRoute } from './router';

const inTour = (step: number) => baseState({ tour: { id: 'api', step } });

describe('selection actions', () => {
  it('selecting a service leaves any tour and closes the guide', () => {
    expect(selectService('lambda')).toEqual({ selected: 'lambda', tour: null, focusedEdge: null, guideOpen: false });
  });

  it('starting a tour clears the selection', () => {
    expect(startTour('api', 2)).toMatchObject({ tour: { id: 'api', step: 2 }, selected: null });
  });

  it('closeAll also clears the search', () => {
    expect(closeAll()).toMatchObject({ selected: null, tour: null, query: '' });
  });
});

describe('tour navigation', () => {
  it('moves and clamps steps', () => {
    expect(stepBy(fixtureTours, 1)(inTour(0))).toEqual({ tour: { id: 'api', step: 1 } });
    expect(stepBy(fixtureTours, 1)(inTour(3))).toEqual({ tour: { id: 'api', step: 3 } });
    expect(stepBy(fixtureTours, -1)(inTour(0))).toEqual({ tour: { id: 'api', step: 0 } });
    expect(goToStep(fixtureTours, 2)(inTour(0))).toEqual({ tour: { id: 'api', step: 2 } });
  });

  it('does nothing outside a tour', () => {
    expect(stepBy(fixtureTours, 1)(baseState())).toEqual({});
  });
});

describe('activateTile', () => {
  it('jumps to the step when the tile is part of the current tour', () => {
    expect(activateTile(fixtureTours, 'iam')(inTour(0))).toEqual({ tour: { id: 'api', step: 2 } });
  });

  it('leaves the tour for tiles outside it', () => {
    expect(activateTile(fixtureTours, 's3')(inTour(0))).toMatchObject({ selected: 's3', tour: null });
  });

  it('toggles the selection outside tours', () => {
    expect(activateTile(fixtureTours, 'lambda')(baseState())).toMatchObject({ selected: 'lambda' });
    expect(activateTile(fixtureTours, 'lambda')(baseState({ selected: 'lambda' }))).toMatchObject({ selected: null });
  });
});

describe('toggleRelationType', () => {
  it('hides and shows a type', () => {
    expect(toggleRelationType('data')(baseState())).toEqual({ hiddenTypes: ['data'] });
    expect(toggleRelationType('data')(baseState({ hiddenTypes: ['data', 'ops'] }))).toEqual({ hiddenTypes: ['ops'] });
  });
});

describe('sanitizeRoute', () => {
  it('keeps valid routes and clamps tour steps', () => {
    expect(sanitizeRoute({ service: 'lambda', tour: null }, fixtureContext)).toEqual({ service: 'lambda', tour: null });
    expect(sanitizeRoute({ service: null, tour: { id: 'api', step: 40 } }, fixtureContext)).toEqual({
      service: null,
      tour: { id: 'api', step: 3 },
    });
  });

  it('drops unknown ids', () => {
    expect(sanitizeRoute({ service: 'nope', tour: null }, fixtureContext)).toEqual({ service: null, tour: null });
    expect(sanitizeRoute({ service: null, tour: { id: 'nope', step: 0 } }, fixtureContext)).toEqual({
      service: null,
      tour: null,
    });
  });
});
