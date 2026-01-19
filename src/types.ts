export type ServiceCategory =
  | 'compute'
  | 'storage'
  | 'database'
  | 'networking'
  | 'security'
  | 'management'
  | 'cost'
  | 'messaging'
  | 'cdn'
  | 'devtools';

export interface Resource {
  title: string;
  url: string;
}

/**
 * Base service interface for raw service data (e.g., from JSON).
 * Positions (x/y) are optional as they are computed dynamically by LayoutEngine.
 */
export interface Service {
  name: string;
  category: ServiceCategory;
  description: string;
  details: string;
  keyPoints: string[];
  x?: number;
  y?: number;
  extendedDescription?: string;
  resources?: Resource[];
}

/**
 * Service with computed positions. Used after LayoutEngine processes raw services.
 * The x/y coordinates are required as they've been computed.
 */
export interface PositionedService extends Omit<Service, 'x' | 'y'> {
  x: number;
  y: number;
}

export type ServiceMap = Record<string, Service>;
export type PositionedServiceMap = Record<string, PositionedService>;

export type Connection = [string, string];
