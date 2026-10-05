import type { Connection, ServiceMap, Tour } from '../types';
import servicesData from './services.json';
import connectionsData from './connections.json';
import toursData from './tours.json';

// JSON imports widen string unions to `string`; data tests guard the narrower types.
export const services = servicesData as ServiceMap;
export const connections = connectionsData as Connection[];
export const tours = toursData as Tour[];
