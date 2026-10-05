import { describe, expect, it } from 'vitest';
import { borderPoint, edgePath, relativeBox, type Box } from './geometry';

const box = (x: number, y: number, w = 100, h = 40): Box => ({ x, y, w, h });

describe('borderPoint', () => {
  it('exits through the side facing the direction', () => {
    expect(borderPoint(box(0, 0), 1, 0)).toEqual({ x: 100, y: 20 });
    expect(borderPoint(box(0, 0), 0, -1)).toEqual({ x: 50, y: 0 });
  });

  it('exits through the nearer side for diagonals on wide boxes', () => {
    // Steep diagonal hits the bottom edge, not the right edge
    expect(borderPoint(box(0, 0), 1, 1)).toEqual({ x: 70, y: 40 });
  });

  it('adds a gap along the direction', () => {
    expect(borderPoint(box(0, 0), 1, 0, 4)).toEqual({ x: 104, y: 20 });
  });
});

describe('edgePath', () => {
  const parse = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);

  it('starts and ends just outside the facing borders', () => {
    const [sx, sy, , , ex, ey] = parse(edgePath(box(0, 0), box(300, 0)).d);
    expect([sx, sy]).toEqual([103, 20]);
    expect([ex, ey]).toEqual([297, 20]);
  });

  it('bows sideways so opposite directions do not overlap', () => {
    const forward = edgePath(box(0, 0), box(300, 0)).mid;
    const backward = edgePath(box(300, 0), box(0, 0)).mid;
    expect(forward.y).toBeGreaterThan(20);
    expect(backward.y).toBeLessThan(20);
    expect(forward.x).toBeCloseTo(200);
  });

  it('uses a quadratic curve', () => {
    expect(edgePath(box(0, 0), box(0, 200)).d).toMatch(/^M [\d. -]+ Q [\d. -]+ [\d. -]+$/);
  });
});

describe('relativeBox', () => {
  it('offsets an element rect by the origin', () => {
    const el = { getBoundingClientRect: () => ({ left: 110, top: 70, width: 50, height: 20 }) } as unknown as Element;
    expect(relativeBox(el, { left: 10, top: 20 } as DOMRect)).toEqual({ x: 100, y: 50, w: 50, h: 20 });
  });
});
