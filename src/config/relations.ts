import type { RelationType } from '../types';

export interface RelationMeta {
  label: string;
  description: string;
}

/** Colors live in CSS as `--rel-<type>` so both themes can tune them. */
export const RELATION_TYPES: Readonly<Record<RelationType, RelationMeta>> = {
  network: { label: 'Network', description: 'Routes, carries or hosts traffic' },
  invoke: { label: 'Triggers', description: 'Starts work: events, messages, API calls' },
  data: { label: 'Data', description: 'Reads, writes, stores or moves data' },
  security: { label: 'Security', description: 'Protects, encrypts or grants access' },
  ops: { label: 'Operate', description: 'Monitors, deploys, scales or manages' },
};

export const RELATION_TYPE_IDS = Object.keys(RELATION_TYPES) as RelationType[];
