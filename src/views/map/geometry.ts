import { EDGE_GEOMETRY } from '../../config/constants';

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EdgeGeometry {
  d: string;
  mid: Point;
}

const center = ({ x, y, w, h }: Box): Point => ({ x: x + w / 2, y: y + h / 2 });

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const round = (n: number): number => Math.round(n * 10) / 10;

const fmt = ({ x, y }: Point): string => `${round(x)} ${round(y)}`;

/**
 * Where a ray from the box center in direction (dx, dy) leaves the box, pushed out by `gap`.
 * Each edge exits toward its target, so many edges on one tile fan out instead of sharing a point.
 */
export const borderPoint = (box: Box, dx: number, dy: number, gap = 0): Point => {
  const c = center(box);
  const length = Math.hypot(dx, dy) || 1;
  const scaleX = dx === 0 ? Infinity : box.w / 2 / Math.abs(dx);
  const scaleY = dy === 0 ? Infinity : box.h / 2 / Math.abs(dy);
  const t = Math.min(scaleX, scaleY);
  return { x: c.x + dx * t + (dx / length) * gap, y: c.y + dy * t + (dy / length) * gap };
};

/**
 * Gently arced quadratic curve between two boxes, plus its midpoint for a label.
 * The arc always bends to the same side of the travel direction, so A→B and B→A separate.
 */
export const edgePath = (a: Box, b: Box): EdgeGeometry => {
  const ca = center(a);
  const cb = center(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;
  const start = borderPoint(a, dx, dy, EDGE_GEOMETRY.gap);
  const end = borderPoint(b, -dx, -dy, EDGE_GEOMETRY.gap);

  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  const bend = clamp(length * EDGE_GEOMETRY.bend, 0, EDGE_GEOMETRY.maxBend);
  const normal = { x: -(end.y - start.y) / length, y: (end.x - start.x) / length };
  const chordMid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const mid = { x: round(chordMid.x + normal.x * bend), y: round(chordMid.y + normal.y * bend) };
  // A quadratic passes through `mid` at t = 0.5 when its control point sits twice as far out.
  const control = { x: chordMid.x + normal.x * bend * 2, y: chordMid.y + normal.y * bend * 2 };

  return { d: `M ${fmt(start)} Q ${fmt(control)} ${fmt(end)}`, mid };
};

/** Element box relative to an origin rect, ignoring scroll (both move together). */
export const relativeBox = (el: Element, origin: DOMRect): Box => {
  const r = el.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
};
