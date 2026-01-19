import type { ServiceMap, ServiceCategory } from '../types';

export type NodeWidthMap = Map<string, number>;

export interface LayoutConfig {
  defaultNodeWidth: number;
  nodeHeight: number;
  nodePadding: number;
  categoryPadding: number;
  categoryColumns: number;
}

export interface LayoutResult {
  services: ServiceMap;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

const DEFAULT_CONFIG: LayoutConfig = {
  defaultNodeWidth: 120,
  nodeHeight: 40,
  nodePadding: 30, // Space between nodes within a category
  categoryPadding: 80, // Space between category groups
  categoryColumns: 4, // Number of category columns per row
};

// Define the order and arrangement of categories for visual grouping
// Categories are arranged to keep related services near each other
const CATEGORY_ORDER: ServiceCategory[] = [
  'networking',
  'compute',
  'storage',
  'database',
  'security',
  'management',
  'messaging',
  'devtools',
  'cdn',
  'cost',
];

/**
 * LayoutEngine computes non-overlapping positions for service nodes
 * by grouping them by category and arranging in a grid pattern.
 * Supports variable node widths for services with different name lengths.
 */
export class LayoutEngine {
  private config: LayoutConfig;
  private nodeWidths: NodeWidthMap;

  constructor(config: Partial<LayoutConfig> = {}, nodeWidths?: NodeWidthMap) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.nodeWidths = nodeWidths || new Map();
  }

  /**
   * Sets the node widths map for variable-width layout.
   */
  public setNodeWidths(nodeWidths: NodeWidthMap): void {
    this.nodeWidths = nodeWidths;
  }

  /**
   * Gets the width for a specific node, falling back to default.
   */
  private getNodeWidth(key: string): number {
    return this.nodeWidths.get(key) ?? this.config.defaultNodeWidth;
  }

  /**
   * Computes a non-overlapping layout for all services.
   * Groups services by category and arranges each group in a distinct region.
   */
  public computeLayout(services: ServiceMap): LayoutResult {
    const grouped = this.groupByCategory(services);
    const categoryGroups = this.computeCategoryPositions(grouped, services);

    const result: ServiceMap = {};
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const [category, serviceKeys] of Object.entries(grouped)) {
      const groupPosition = categoryGroups.get(category as ServiceCategory);
      if (!groupPosition) continue;

      const positions = this.layoutCategoryServices(serviceKeys, groupPosition, services);

      for (let i = 0; i < serviceKeys.length; i++) {
        const key = serviceKeys[i];
        const pos = positions[i];
        const nodeWidth = this.getNodeWidth(key);
        result[key] = {
          ...services[key],
          x: pos.x,
          y: pos.y,
        };

        minX = Math.min(minX, pos.x - nodeWidth / 2);
        maxX = Math.max(maxX, pos.x + nodeWidth / 2);
        minY = Math.min(minY, pos.y - this.config.nodeHeight / 2);
        maxY = Math.max(maxY, pos.y + this.config.nodeHeight / 2);
      }
    }

    return {
      services: result,
      bounds: { minX, maxX, minY, maxY },
    };
  }

  /**
   * Groups services by their category.
   */
  private groupByCategory(services: ServiceMap): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const [key, service] of Object.entries(services)) {
      const category = service.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(key);
    }

    // Sort keys within each group for consistent ordering
    for (const keys of Object.values(groups)) {
      keys.sort();
    }

    return groups;
  }

  /**
   * Gets the maximum node width for a category's services.
   */
  private getMaxWidthForCategory(serviceKeys: string[]): number {
    if (serviceKeys.length === 0) return this.config.defaultNodeWidth;
    let maxWidth = 0;
    for (const key of serviceKeys) {
      maxWidth = Math.max(maxWidth, this.getNodeWidth(key));
    }
    return maxWidth;
  }

  /**
   * Computes the top-left position for each category group.
   * Categories are arranged in a grid pattern.
   * Uses maximum node width within each category for consistent spacing.
   */
  private computeCategoryPositions(
    grouped: Record<string, string[]>,
    _services: ServiceMap
  ): Map<ServiceCategory, { x: number; y: number; width: number; height: number; maxNodeWidth: number }> {
    const positions = new Map<ServiceCategory, { x: number; y: number; width: number; height: number; maxNodeWidth: number }>();

    // Calculate dimensions for each category group
    const categoryDimensions: Map<ServiceCategory, { cols: number; rows: number; width: number; height: number; maxNodeWidth: number }> = new Map();

    for (const category of CATEGORY_ORDER) {
      const keys = grouped[category];
      if (!keys || keys.length === 0) continue;

      const cols = Math.ceil(Math.sqrt(keys.length));
      const rows = Math.ceil(keys.length / cols);

      // Use the maximum node width in this category for consistent column spacing
      const maxNodeWidth = this.getMaxWidthForCategory(keys);
      const width = cols * (maxNodeWidth + this.config.nodePadding) - this.config.nodePadding;
      const height = rows * (this.config.nodeHeight + this.config.nodePadding) - this.config.nodePadding;

      categoryDimensions.set(category, { cols, rows, width, height, maxNodeWidth });
    }

    // Arrange categories in rows
    let currentX = 0;
    let currentY = 0;
    let rowMaxHeight = 0;
    let colCount = 0;

    for (const category of CATEGORY_ORDER) {
      const dims = categoryDimensions.get(category);
      if (!dims) continue;

      // Start new row if we've reached column limit
      if (colCount >= this.config.categoryColumns) {
        currentX = 0;
        currentY += rowMaxHeight + this.config.categoryPadding;
        rowMaxHeight = 0;
        colCount = 0;
      }

      positions.set(category, {
        x: currentX,
        y: currentY,
        width: dims.width,
        height: dims.height,
        maxNodeWidth: dims.maxNodeWidth,
      });

      currentX += dims.width + this.config.categoryPadding;
      rowMaxHeight = Math.max(rowMaxHeight, dims.height);
      colCount++;
    }

    return positions;
  }

  /**
   * Lays out services within a category group in a grid pattern.
   * Returns center positions for each service node.
   * Uses the category's maximum node width for consistent cell spacing.
   */
  private layoutCategoryServices(
    serviceKeys: string[],
    groupPosition: { x: number; y: number; width: number; height: number; maxNodeWidth: number },
    _services: ServiceMap
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const cols = Math.ceil(Math.sqrt(serviceKeys.length));

    // Use the category's maximum node width for cell spacing
    const cellWidth = groupPosition.maxNodeWidth + this.config.nodePadding;
    const cellHeight = this.config.nodeHeight + this.config.nodePadding;

    for (let i = 0; i < serviceKeys.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Calculate center position using max width for consistent spacing
      const x = groupPosition.x + col * cellWidth + groupPosition.maxNodeWidth / 2;
      const y = groupPosition.y + row * cellHeight + this.config.nodeHeight / 2;

      positions.push({ x, y });
    }

    return positions;
  }

  /**
   * Checks if two nodes overlap using their individual widths.
   */
  public nodesOverlap(
    key1: string,
    pos1: { x: number; y: number },
    key2: string,
    pos2: { x: number; y: number }
  ): boolean {
    const halfWidth1 = this.getNodeWidth(key1) / 2;
    const halfWidth2 = this.getNodeWidth(key2) / 2;
    const halfHeight = this.config.nodeHeight / 2;

    const rect1 = {
      left: pos1.x - halfWidth1,
      right: pos1.x + halfWidth1,
      top: pos1.y - halfHeight,
      bottom: pos1.y + halfHeight,
    };

    const rect2 = {
      left: pos2.x - halfWidth2,
      right: pos2.x + halfWidth2,
      top: pos2.y - halfHeight,
      bottom: pos2.y + halfHeight,
    };

    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  /**
   * Validates that no nodes in the layout overlap.
   * Uses individual node widths for accurate collision detection.
   */
  public validateNoOverlaps(services: ServiceMap): { valid: boolean; overlaps: [string, string][] } {
    const overlaps: [string, string][] = [];
    const keys = Object.keys(services);

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const key1 = keys[i];
        const key2 = keys[j];
        const service1 = services[key1];
        const service2 = services[key2];

        if (this.nodesOverlap(key1, service1, key2, service2)) {
          overlaps.push([key1, key2]);
        }
      }
    }

    return { valid: overlaps.length === 0, overlaps };
  }

  /**
   * Gets the current configuration.
   */
  public getConfig(): LayoutConfig {
    return { ...this.config };
  }
}
