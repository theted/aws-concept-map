import { createGraph, type Graph } from '../data/graph';
import type { Connection, ServiceMap, Tour } from '../types';

/** Static data plus derived lookups, shared by every view. */
export interface AppContext {
  services: ServiceMap;
  connections: readonly Connection[];
  tours: readonly Tour[];
  graph: Graph;
}

export const createContext = (
  services: ServiceMap,
  connections: readonly Connection[],
  tours: readonly Tour[]
): AppContext => ({ services, connections, tours, graph: createGraph(connections) });
