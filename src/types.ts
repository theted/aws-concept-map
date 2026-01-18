export type ServiceCategory =
  | 'compute'
  | 'storage'
  | 'database'
  | 'networking'
  | 'security'
  | 'management'
  | 'cost'
  | 'messaging'
  | 'cdn';

export interface Service {
  name: string;
  category: ServiceCategory;
  description: string;
  details: string;
  keyPoints: string[];
  x: number;
  y: number;
}

export type ServiceMap = Record<string, Service>;

export type Connection = [string, string];
