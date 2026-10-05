import { describe, expect, it } from 'vitest';
import { fixtureConnections, fixtureServices } from '../test/fixtures';
import { createGraph, describeConnection, edgeId, groupByType } from './graph';

const graph = createGraph(fixtureConnections);

describe('createGraph', () => {
  it('lists relations from both directions', () => {
    const relations = graph.relationsOf('lambda');
    expect(relations).toHaveLength(4);
    expect(relations.filter((r) => r.direction === 'out').map((r) => r.other)).toEqual(['ddb']);
    expect(relations.filter((r) => r.direction === 'in').map((r) => r.other)).toEqual(['apigw', 'ddb', 'iam']);
  });

  it('returns nothing for unconnected services', () => {
    expect(graph.relationsOf('s3')).toEqual([]);
    expect(graph.neighborTypes('s3').size).toBe(0);
  });

  it('maps neighbors to the first relationship type seen', () => {
    const neighbors = graph.neighborTypes('lambda');
    expect([...neighbors]).toEqual([
      ['apigw', 'invoke'],
      ['ddb', 'data'],
      ['iam', 'security'],
    ]);
  });

  it('finds connections between a pair in either order', () => {
    expect(graph.between('ddb', 'lambda').map(edgeId)).toEqual(['lambda->ddb', 'ddb->lambda']);
    expect(graph.between('lambda', 'ddb')).toHaveLength(2);
    expect(graph.between('s3', 'lambda')).toEqual([]);
  });
});

describe('describeConnection', () => {
  it('reads as a sentence using display names', () => {
    expect(describeConnection(fixtureConnections[0], fixtureServices)).toBe('API Gateway invokes Lambda');
  });

  it('falls back to ids for unknown services', () => {
    expect(describeConnection({ from: 'x', to: 'y', type: 'data', verb: 'feeds' }, fixtureServices)).toBe('x feeds y');
  });
});

describe('groupByType', () => {
  it('follows the given type order and skips empty groups', () => {
    const groups = groupByType(graph.relationsOf('lambda'), ['security', 'network', 'invoke', 'data']);
    expect(groups.map(([type, list]) => [type, list.length])).toEqual([
      ['security', 1],
      ['invoke', 2],
      ['data', 1],
    ]);
  });
});
