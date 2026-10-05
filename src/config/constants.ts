/** Panel docks beside the map at and above this viewport width (matches styles/layout.css). */
export const DOCKED_PANEL_MIN_WIDTH = 1024;

/** URL hash keys — `#service=` is kept compatible with links shared before the redesign. */
export const HASH_KEYS = {
  service: 'service',
  tour: 'tour',
  step: 'step',
} as const;

export const THEME_STORAGE_KEY = 'aws-map-theme';

export const EDGE_GEOMETRY = {
  /** Sideways arc as a share of edge length — enough to separate overlapping lines */
  bend: 0.12,
  maxBend: 48,
  /** Space between a tile border and the line/arrow tip (px) */
  gap: 3,
} as const;

export const SEARCH_SHORTCUT = '/';
