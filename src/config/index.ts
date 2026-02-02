/**
 * Centralized configuration for the AWS Services Concept Map application.
 * All magic numbers, colors, and configurable values are defined here.
 */

// =============================================================================
// COLORS
// =============================================================================

/**
 * Primary color used throughout the application (teal/cyan).
 * This is the main brand color.
 */
export const COLORS = {
  primary: {
    base: '#14B8A6',      // Teal-500
    light: '#2DD4BF',     // Teal-400
    dark: '#0D9488',      // Teal-600
  },
  /** RGB values for use in rgba() functions */
  primaryRGB: '20, 184, 166',

  /** Node text color */
  text: '#ffffff',
  /** Node border colors */
  border: {
    selected: '#ffffff',
    hovered: 'rgba(255, 255, 255, 0.6)',
  },
  /** Shadow color for nodes */
  shadow: 'rgba(0, 0, 0, 0.3)',

  /** Fallback category color for unknown categories */
  fallbackCategory: { start: '#666', end: '#444' },
} as const;

/**
 * Category-specific gradient colors for service nodes.
 * Each category has a start (lighter) and end (darker) color for gradients.
 */
export const CATEGORY_COLORS: Record<string, { start: string; end: string }> = {
  compute: { start: '#FF9900', end: '#FF6600' },
  storage: { start: '#569A31', end: '#3E7B1F' },
  database: { start: '#2E5C8A', end: '#1A3A5C' },
  networking: { start: '#8B5CF6', end: '#6D28D9' },
  security: { start: '#DC2626', end: '#991B1B' },
  management: { start: '#0891B2', end: '#0E7490' },
  cost: { start: '#F59E0B', end: '#D97706' },
  messaging: { start: '#EC4899', end: '#BE185D' },
  cdn: { start: '#14B8A6', end: '#0D9488' },
  devtools: { start: '#3B82F6', end: '#1D4ED8' },
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

/**
 * Font configuration used in canvas rendering.
 */
export const TYPOGRAPHY = {
  /** Main font family with fallbacks */
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  /** Font weight for node labels */
  fontWeight: '600',
  /** Font size for node labels (pixels) */
  fontSize: 13,
  /** Complete font string for canvas context */
  get canvasFont(): string {
    return `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
  },
} as const;

// =============================================================================
// NODE DIMENSIONS
// =============================================================================

/**
 * Default dimensions for service nodes.
 */
export const NODE_DIMENSIONS = {
  /** Default width when not computed dynamically (pixels) */
  defaultWidth: 120,
  /** Height of all nodes (pixels) */
  height: 40,
  /** Internal padding within nodes (pixels) */
  padding: 12,
  /** Border radius for rounded corners (pixels) */
  borderRadius: 8,
} as const;

/**
 * Configuration for dynamic node width calculation.
 */
export const NODE_WIDTH_CONFIG = {
  /** Minimum node width regardless of text length (pixels) */
  minWidth: 80,
  /** Maximum node width regardless of text length (pixels) */
  maxWidth: 200,
  /** Horizontal padding around text (12px on each side) */
  horizontalPadding: 24,
} as const;

// =============================================================================
// ANIMATION DURATIONS
// =============================================================================

/**
 * Animation timing configuration (all values in milliseconds).
 */
export const ANIMATION = {
  /** Duration for initial canvas fade-in effect */
  fadeInDuration: 800,
  /** Duration for connection opacity transitions */
  connectionTransitionDuration: 300,
  /** Duration for wheel/scroll zoom animations */
  wheelZoomDuration: 120,
  /** Duration for keyboard zoom (+/-) animations */
  keyboardZoomDuration: 150,
  /** Duration for keyboard pan (arrow keys) animations */
  keyboardPanDuration: 150,
  /** Duration for centerViewOnContent and focusOnService */
  viewTransitionDuration: 400,
  /** Duration for momentum/inertia after drag release */
  momentumDuration: 600,
  /** Default animation duration for generic transitions */
  defaultDuration: 300,
} as const;

// =============================================================================
// CONNECTION APPEARANCE
// =============================================================================

/**
 * Opacity values for connection lines between services.
 */
export const CONNECTION_OPACITY = {
  /** Default opacity when no service is selected */
  normal: 0.3,
  /** Opacity for connections involving the selected service */
  highlighted: 0.8,
  /** Opacity for connections not involving the selected service */
  dimmed: 0.1,
} as const;

/**
 * Line width for connections (pixels).
 */
export const CONNECTION_LINE_WIDTH = {
  normal: 1.5,
  highlighted: 3,
} as const;

// =============================================================================
// NODE APPEARANCE
// =============================================================================

/**
 * Shadow configuration for service nodes.
 */
export const NODE_SHADOW = {
  /** Shadow blur radius for normal state (pixels) */
  blurNormal: 6,
  /** Shadow blur radius for hovered/selected state (pixels) */
  blurActive: 12,
  /** Shadow Y offset for normal state (pixels) */
  offsetYNormal: 4,
  /** Shadow Y offset for hovered/selected state (pixels) */
  offsetYActive: 6,
} as const;

/**
 * Border configuration for service nodes.
 */
export const NODE_BORDER = {
  /** Border width when selected (pixels) */
  widthSelected: 3,
  /** Border width when hovered (pixels) */
  widthHovered: 2,
} as const;

// =============================================================================
// ZOOM CONFIGURATION
// =============================================================================

/**
 * Zoom level constraints and increments.
 */
export const ZOOM = {
  /** Minimum zoom level (zoomed out) */
  min: 0.3,
  /** Maximum zoom level (zoomed in) */
  max: 3,
  /** Maximum zoom level when fitting content to view */
  maxFitContent: 1.5,
  /** Zoom multiplier for wheel scroll (>1 = zoom in, <1 = zoom out) */
  wheelIn: 1.1,
  wheelOut: 0.9,
  /** Zoom step for keyboard +/- */
  keyboardStep: 0.1,
  /** Target scale when focusing on a single service */
  focusScale: 1.3,
} as const;

// =============================================================================
// PAN & INTERACTION
// =============================================================================

/**
 * Panning and drag interaction configuration.
 */
export const INTERACTION = {
  /** Distance threshold to distinguish click from drag (pixels) */
  dragThreshold: 5,
  /** Pan distance per arrow key press (pixels) */
  panStep: 50,
  /** Padding around content when centering view (pixels) */
  viewPadding: 80,
  /** Viewport culling padding for smooth edge rendering (pixels) */
  viewportCullingPadding: 100,
  /** Direction detection threshold for spatial navigation (pixels) */
  spatialNavigationThreshold: 10,
  /** Weight for perpendicular offset in spatial navigation scoring */
  spatialNavigationPerpendicularWeight: 0.5,
} as const;

// =============================================================================
// MOMENTUM / INERTIA
// =============================================================================

/**
 * Momentum/inertia configuration for drag release.
 */
export const MOMENTUM = {
  /** Minimum velocity threshold to trigger momentum (pixels per millisecond) */
  velocityThreshold: 0.15,
  /** Multiplier for momentum distance (higher = farther coast) */
  multiplier: 180,
  /** Smoothing factor for velocity calculation (0-1, lower = smoother) */
  velocitySmoothing: 0.3,
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

/**
 * Layout engine configuration for service positioning.
 */
export const LAYOUT = {
  /** Default node width for layout calculations (pixels) */
  defaultNodeWidth: 120,
  /** Node height for layout calculations (pixels) */
  nodeHeight: 40,
  /** Space between nodes within a category (pixels) */
  nodePadding: 30,
  /** Space between category groups (pixels) */
  categoryPadding: 80,
  /** Number of category columns per row */
  categoryColumns: 4,
} as const;

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================

/**
 * Responsive design breakpoints (pixels).
 * These values should match the CSS media queries.
 */
export const BREAKPOINTS = {
  /** Tablet breakpoint */
  tablet: 768,
  /** Mobile breakpoint */
  mobile: 480,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CategoryColorMap = typeof CATEGORY_COLORS;
