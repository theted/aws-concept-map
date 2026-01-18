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

export interface Service {
  name: string;
  category: ServiceCategory;
  description: string;
  details: string;
  keyPoints: string[];
  x: number;
  y: number;
  extendedDescription?: string;
  resources?: Resource[];
}

export type ServiceMap = Record<string, Service>;

export type Connection = [string, string];
