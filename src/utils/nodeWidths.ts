import type { ServiceMap } from '../types';

export interface NodeWidthConfig {
  font: string;
  minWidth: number;
  maxWidth: number;
  horizontalPadding: number;
}

export type NodeWidthMap = Map<string, number>;

const DEFAULT_CONFIG: NodeWidthConfig = {
  font: '600 13px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  minWidth: 80,
  maxWidth: 200,
  horizontalPadding: 24, // 12px padding on each side
};

/**
 * Computes the width for a single node based on its text content.
 * Uses canvas measureText for accurate font-based measurement.
 */
export function computeNodeWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: NodeWidthConfig = DEFAULT_CONFIG
): number {
  ctx.font = config.font;
  const textWidth = ctx.measureText(text).width;
  const width = textWidth + config.horizontalPadding;
  return Math.min(config.maxWidth, Math.max(config.minWidth, width));
}

/**
 * Computes widths for all services and returns a map of service key -> width.
 * Creates a temporary canvas if none provided.
 */
export function computeAllNodeWidths(
  services: ServiceMap,
  ctx?: CanvasRenderingContext2D,
  config: NodeWidthConfig = DEFAULT_CONFIG
): NodeWidthMap {
  // Create a temporary canvas context if none provided
  let tempCanvas: HTMLCanvasElement | null = null;
  let context = ctx;

  if (!context) {
    tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error('Could not create temporary canvas context');
    }
    context = tempCtx;
  }

  const widths: NodeWidthMap = new Map();

  for (const [key, service] of Object.entries(services)) {
    widths.set(key, computeNodeWidth(context, service.name, config));
  }

  return widths;
}

/**
 * Gets the default node width configuration.
 */
export function getDefaultNodeWidthConfig(): NodeWidthConfig {
  return { ...DEFAULT_CONFIG };
}
