import type { Connection, RelationType, ServiceMap } from '../types';

export type Direction = 'out' | 'in';

/** A connection seen from one service's point of view. */
export interface Relation {
  connection: Connection;
  other: string;
  direction: Direction;
}

export interface Graph {
  relationsOf: (id: string) => readonly Relation[];
  /** Related service id → relationship type (first one wins if several) */
  neighborTypes: (id: string) => ReadonlyMap<string, RelationType>;
  between: (a: string, b: string) => readonly Connection[];
}

export const edgeId = ({ from, to }: Pick<Connection, 'from' | 'to'>): string => `${from}->${to}`;

const pairKey = (a: string, b: string): string => [a, b].sort().join('|');

export const createGraph = (connections: readonly Connection[]): Graph => {
  const relations = new Map<string, Relation[]>();
  const pairs = new Map<string, Connection[]>();

  const push = <T>(map: Map<string, T[]>, key: string, value: T): void => {
    map.set(key, [...(map.get(key) ?? []), value]);
  };

  connections.forEach((connection) => {
    push(relations, connection.from, { connection, other: connection.to, direction: 'out' });
    push(relations, connection.to, { connection, other: connection.from, direction: 'in' });
    push(pairs, pairKey(connection.from, connection.to), connection);
  });

  const relationsOf = (id: string): readonly Relation[] => relations.get(id) ?? [];

  const neighborTypes = (id: string): ReadonlyMap<string, RelationType> =>
    relationsOf(id).reduce(
      (acc, { other, connection }) => (acc.has(other) ? acc : acc.set(other, connection.type)),
      new Map<string, RelationType>()
    );

  const between = (a: string, b: string): readonly Connection[] => pairs.get(pairKey(a, b)) ?? [];

  return { relationsOf, neighborTypes, between };
};

/** Human sentence for a relationship, e.g. "API Gateway invokes Lambda". */
export const describeConnection = (connection: Connection, services: ServiceMap): string =>
  `${services[connection.from]?.name ?? connection.from} ${connection.verb} ${services[connection.to]?.name ?? connection.to}`;

/** Groups relations by type, keeping a stable order defined by `typeOrder`. */
export const groupByType = (
  relations: readonly Relation[],
  typeOrder: readonly RelationType[]
): [RelationType, Relation[]][] =>
  typeOrder
    .map((type): [RelationType, Relation[]] => [type, relations.filter((r) => r.connection.type === type)])
    .filter(([, list]) => list.length > 0);
