import { describe, it, expect } from 'vitest';
import {
  COLORS,
  CATEGORY_COLORS,
  TYPOGRAPHY,
  NODE_DIMENSIONS,
  NODE_WIDTH_CONFIG,
  ANIMATION,
  CONNECTION_OPACITY,
  CONNECTION_LINE_WIDTH,
  NODE_SHADOW,
  NODE_BORDER,
  ZOOM,
  INTERACTION,
  MOMENTUM,
  LAYOUT,
  BREAKPOINTS,
} from './index';

describe('Configuration', () => {
  describe('COLORS', () => {
    it('should have valid primary colors', () => {
      expect(COLORS.primary.base).toBe('#14B8A6');
      expect(COLORS.primary.light).toBe('#2DD4BF');
      expect(COLORS.primary.dark).toBe('#0D9488');
    });

    it('should have RGB value for primary color', () => {
      expect(COLORS.primaryRGB).toBe('20, 184, 166');
    });

    it('should have text and border colors', () => {
      expect(COLORS.text).toBe('#ffffff');
      expect(COLORS.border.selected).toBe('#ffffff');
      expect(COLORS.border.hovered).toBe('rgba(255, 255, 255, 0.6)');
    });
  });

  describe('CATEGORY_COLORS', () => {
    it('should have all 10 category colors', () => {
      const categories = [
        'compute', 'storage', 'database', 'networking', 'security',
        'management', 'cost', 'messaging', 'cdn', 'devtools'
      ];

      categories.forEach(category => {
        expect(CATEGORY_COLORS[category]).toBeDefined();
        expect(CATEGORY_COLORS[category].start).toBeDefined();
        expect(CATEGORY_COLORS[category].end).toBeDefined();
      });
    });

    it('should have valid hex color format', () => {
      const hexPattern = /^#[0-9A-F]{6}$/i;

      Object.values(CATEGORY_COLORS).forEach(colors => {
        expect(colors.start).toMatch(hexPattern);
        expect(colors.end).toMatch(hexPattern);
      });
    });
  });

  describe('TYPOGRAPHY', () => {
    it('should have font configuration', () => {
      expect(TYPOGRAPHY.fontFamily).toContain('Inter');
      expect(TYPOGRAPHY.fontWeight).toBe('600');
      expect(TYPOGRAPHY.fontSize).toBe(13);
    });

    it('should generate valid canvas font string', () => {
      expect(TYPOGRAPHY.canvasFont).toContain('600');
      expect(TYPOGRAPHY.canvasFont).toContain('13px');
      expect(TYPOGRAPHY.canvasFont).toContain('Inter');
    });
  });

  describe('NODE_DIMENSIONS', () => {
    it('should have positive dimensions', () => {
      expect(NODE_DIMENSIONS.defaultWidth).toBeGreaterThan(0);
      expect(NODE_DIMENSIONS.height).toBeGreaterThan(0);
      expect(NODE_DIMENSIONS.padding).toBeGreaterThan(0);
      expect(NODE_DIMENSIONS.borderRadius).toBeGreaterThan(0);
    });
  });

  describe('NODE_WIDTH_CONFIG', () => {
    it('should have valid width constraints', () => {
      expect(NODE_WIDTH_CONFIG.minWidth).toBeLessThan(NODE_WIDTH_CONFIG.maxWidth);
      expect(NODE_WIDTH_CONFIG.horizontalPadding).toBeGreaterThan(0);
    });
  });

  describe('ANIMATION', () => {
    it('should have positive durations', () => {
      expect(ANIMATION.fadeInDuration).toBeGreaterThan(0);
      expect(ANIMATION.nodeZoomInDuration).toBeGreaterThan(0);
      expect(ANIMATION.nodeZoomInMaxDelay).toBeGreaterThan(0);
      expect(ANIMATION.connectionTransitionDuration).toBeGreaterThan(0);
      expect(ANIMATION.wheelZoomDuration).toBeGreaterThan(0);
      expect(ANIMATION.keyboardZoomDuration).toBeGreaterThan(0);
      expect(ANIMATION.keyboardPanDuration).toBeGreaterThan(0);
      expect(ANIMATION.viewTransitionDuration).toBeGreaterThan(0);
      expect(ANIMATION.momentumDuration).toBeGreaterThan(0);
      expect(ANIMATION.defaultDuration).toBeGreaterThan(0);
    });

    it('should have valid node zoom-in start scale', () => {
      expect(ANIMATION.nodeZoomInStartScale).toBeGreaterThan(0);
      expect(ANIMATION.nodeZoomInStartScale).toBeLessThan(1);
    });

    it('should have valid node zoom-in shadow boost', () => {
      expect(ANIMATION.nodeZoomInShadowBoost).toBeGreaterThan(0);
    });
  });

  describe('CONNECTION_OPACITY', () => {
    it('should have valid opacity values between 0 and 1', () => {
      expect(CONNECTION_OPACITY.normal).toBeGreaterThanOrEqual(0);
      expect(CONNECTION_OPACITY.normal).toBeLessThanOrEqual(1);
      expect(CONNECTION_OPACITY.highlighted).toBeGreaterThanOrEqual(0);
      expect(CONNECTION_OPACITY.highlighted).toBeLessThanOrEqual(1);
      expect(CONNECTION_OPACITY.dimmed).toBeGreaterThanOrEqual(0);
      expect(CONNECTION_OPACITY.dimmed).toBeLessThanOrEqual(1);
    });

    it('should have highlighted > normal > dimmed', () => {
      expect(CONNECTION_OPACITY.highlighted).toBeGreaterThan(CONNECTION_OPACITY.normal);
      expect(CONNECTION_OPACITY.normal).toBeGreaterThan(CONNECTION_OPACITY.dimmed);
    });
  });

  describe('CONNECTION_LINE_WIDTH', () => {
    it('should have positive line widths', () => {
      expect(CONNECTION_LINE_WIDTH.normal).toBeGreaterThan(0);
      expect(CONNECTION_LINE_WIDTH.highlighted).toBeGreaterThan(0);
    });

    it('should have highlighted > normal', () => {
      expect(CONNECTION_LINE_WIDTH.highlighted).toBeGreaterThan(CONNECTION_LINE_WIDTH.normal);
    });
  });

  describe('NODE_SHADOW', () => {
    it('should have positive blur values', () => {
      expect(NODE_SHADOW.blurNormal).toBeGreaterThan(0);
      expect(NODE_SHADOW.blurActive).toBeGreaterThan(0);
    });

    it('should have active > normal blur', () => {
      expect(NODE_SHADOW.blurActive).toBeGreaterThan(NODE_SHADOW.blurNormal);
    });
  });

  describe('NODE_BORDER', () => {
    it('should have positive border widths', () => {
      expect(NODE_BORDER.widthSelected).toBeGreaterThan(0);
      expect(NODE_BORDER.widthHovered).toBeGreaterThan(0);
    });
  });

  describe('ZOOM', () => {
    it('should have valid zoom limits', () => {
      expect(ZOOM.min).toBeGreaterThan(0);
      expect(ZOOM.max).toBeGreaterThan(ZOOM.min);
      expect(ZOOM.maxFitContent).toBeLessThanOrEqual(ZOOM.max);
      expect(ZOOM.maxFitContent).toBeGreaterThan(ZOOM.min);
    });

    it('should have valid wheel zoom factors', () => {
      expect(ZOOM.wheelIn).toBeGreaterThan(1);
      expect(ZOOM.wheelOut).toBeLessThan(1);
      expect(ZOOM.wheelOut).toBeGreaterThan(0);
    });

    it('should have positive keyboard step', () => {
      expect(ZOOM.keyboardStep).toBeGreaterThan(0);
      expect(ZOOM.keyboardStep).toBeLessThan(1);
    });

    it('should have valid focus scale', () => {
      expect(ZOOM.focusScale).toBeGreaterThan(0);
      expect(ZOOM.focusScale).toBeLessThanOrEqual(ZOOM.max);
    });
  });

  describe('INTERACTION', () => {
    it('should have positive interaction thresholds', () => {
      expect(INTERACTION.dragThreshold).toBeGreaterThan(0);
      expect(INTERACTION.panStep).toBeGreaterThan(0);
      expect(INTERACTION.viewPadding).toBeGreaterThan(0);
      expect(INTERACTION.viewportCullingPadding).toBeGreaterThan(0);
      expect(INTERACTION.spatialNavigationThreshold).toBeGreaterThan(0);
    });

    it('should have valid perpendicular weight', () => {
      expect(INTERACTION.spatialNavigationPerpendicularWeight).toBeGreaterThan(0);
      expect(INTERACTION.spatialNavigationPerpendicularWeight).toBeLessThan(1);
    });
  });

  describe('MOMENTUM', () => {
    it('should have positive momentum values', () => {
      expect(MOMENTUM.velocityThreshold).toBeGreaterThan(0);
      expect(MOMENTUM.multiplier).toBeGreaterThan(0);
    });

    it('should have valid smoothing factor', () => {
      expect(MOMENTUM.velocitySmoothing).toBeGreaterThan(0);
      expect(MOMENTUM.velocitySmoothing).toBeLessThan(1);
    });
  });

  describe('LAYOUT', () => {
    it('should have positive layout values', () => {
      expect(LAYOUT.defaultNodeWidth).toBeGreaterThan(0);
      expect(LAYOUT.nodeHeight).toBeGreaterThan(0);
      expect(LAYOUT.nodePadding).toBeGreaterThan(0);
      expect(LAYOUT.categoryPadding).toBeGreaterThan(0);
      expect(LAYOUT.categoryColumns).toBeGreaterThan(0);
    });

    it('should have integer category columns', () => {
      expect(Number.isInteger(LAYOUT.categoryColumns)).toBe(true);
    });
  });

  describe('BREAKPOINTS', () => {
    it('should have tablet > mobile', () => {
      expect(BREAKPOINTS.tablet).toBeGreaterThan(BREAKPOINTS.mobile);
    });

    it('should have positive breakpoint values', () => {
      expect(BREAKPOINTS.tablet).toBeGreaterThan(0);
      expect(BREAKPOINTS.mobile).toBeGreaterThan(0);
    });
  });
});
