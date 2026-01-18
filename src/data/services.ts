import type { ServiceMap, Connection } from '../types';
import servicesData from './services.json';
import connectionsData from './connections.json';

// Type assertions to ensure proper typing from JSON imports
export const services: ServiceMap = servicesData as ServiceMap;
export const connections: Connection[] = connectionsData as Connection[];
