import type { CategoryId } from '../types';

/**
 * Map columns mirror a typical AWS architecture: the request path runs top-down through
 * the center, while security/governance and operations wrap everything as side rails.
 */
export type MapColumn = 'left' | 'center' | 'right';

export interface CategoryMeta {
  label: string;
  blurb: string;
  column: MapColumn;
}

/** Key order is the reading order within each column (top to bottom). */
export const CATEGORIES: Readonly<Record<CategoryId, CategoryMeta>> = {
  edge: { label: 'Front door', blurb: 'How users reach your app', column: 'center' },
  networking: { label: 'Networking', blurb: 'Your private network and how traffic moves', column: 'center' },
  compute: { label: 'Compute', blurb: 'Where your code runs', column: 'center' },
  integration: { label: 'App integration', blurb: 'Decouple services with events and messages', column: 'center' },
  storage: { label: 'Storage', blurb: 'Objects, disks and files', column: 'center' },
  database: { label: 'Databases', blurb: 'Managed SQL, NoSQL and caching', column: 'center' },
  analytics: { label: 'Analytics', blurb: 'Stream, transform and query data', column: 'center' },
  security: { label: 'Security', blurb: 'Identity, encryption and threat protection', column: 'left' },
  governance: { label: 'Governance', blurb: 'Accounts, compliance and cost', column: 'left' },
  management: { label: 'Operations', blurb: 'Monitor, audit and manage resources', column: 'right' },
  devtools: { label: 'Developer tools', blurb: 'Build, test and ship', column: 'right' },
  migration: { label: 'Migration & hybrid', blurb: 'Move data and systems into AWS', column: 'right' },
};

export const COLUMN_CAPTIONS: Readonly<Record<MapColumn, string>> = {
  left: 'Secure & govern',
  center: 'Users & internet',
  right: 'Operate & deliver',
};

export const COLUMN_ORDER: readonly MapColumn[] = ['left', 'center', 'right'];

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

/**
 * Stacking order when the rails collapse on narrow screens: request path first,
 * then the cross-cutting concerns.
 */
export const STACKED_ORDER: readonly CategoryId[] = [
  ...CATEGORY_IDS.filter((id) => CATEGORIES[id].column === 'center'),
  ...CATEGORY_IDS.filter((id) => CATEGORIES[id].column !== 'center'),
];
