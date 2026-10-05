import type { EdgeSpec } from '../../state/derive';
import { esc, qs } from '../../utils/dom';
import { edgePath, relativeBox } from './geometry';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Matches the `edge-leave` CSS transition so paths fade before removal. */
const LEAVE_MS = 200;
/** Half of the label's CSS max-width plus a margin — keeps labels inside the map horizontally. */
const LABEL_HALF_WIDTH = 148;

export interface EdgesView {
  update: (specs: readonly EdgeSpec[]) => void;
  relayout: () => void;
}

interface Label {
  x: number;
  y: number;
  kind: EdgeSpec['kind'];
  lines: string[];
}

const edgeClass = ({ kind, emphasis }: EdgeSpec): string => `edge edge--${kind} is-${emphasis}`;

const labelHtml = ({ x, y, kind, lines }: Label): string =>
  `<span class="edge-label edge-label--${kind}" style="left:${x}px;top:${y}px">${lines.map(esc).join('<br>')}</span>`;

const createPath = (spec: EdgeSpec): SVGPathElement => {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('pathLength', '1');
  path.setAttribute('marker-end', `url(#arrow-${spec.kind})`);
  path.dataset.edge = spec.id;
  path.classList.add('is-new');
  path.addEventListener('animationend', () => path.classList.remove('is-new'), { once: true });
  return path;
};

/**
 * Draws relationship curves in an SVG layered between zone backgrounds and tiles.
 * Paths are keyed by edge id so persisting edges don't replay their draw-in animation.
 */
export const createEdgesView = (container: HTMLElement, tiles: ReadonlyMap<string, HTMLElement>): EdgesView => {
  const svg = qs<SVGSVGElement>(container, '.edges');
  const layer = qs<SVGGElement>(svg, '.edges-layer');
  const labels = qs(container, '.edge-labels');
  const paths = new Map<string, SVGPathElement>();
  const leaving = new Map<string, { path: SVGPathElement; timer: number }>();
  let specs: readonly EdgeSpec[] = [];
  let frame = 0;

  const relayout = (): void => {
    const origin = container.getBoundingClientRect();
    svg.setAttribute('width', String(container.scrollWidth));
    svg.setAttribute('height', String(container.scrollHeight));

    // Two-way relationships (A→B and B→A) share one label so their texts don't overlap.
    const pairLabels = new Map<string, Label>();
    specs.forEach((spec) => {
      const from = tiles.get(spec.from);
      const to = tiles.get(spec.to);
      const path = paths.get(spec.id);
      if (!from || !to || !path) return;
      const { d, mid } = edgePath(relativeBox(from, origin), relativeBox(to, origin));
      path.setAttribute('d', d);
      if (!spec.label) return;
      const key = [spec.from, spec.to].sort().join('|');
      const existing = pairLabels.get(key);
      pairLabels.set(key, existing ? { ...existing, lines: [...existing.lines, spec.label] } : { ...mid, kind: spec.kind, lines: [spec.label] });
    });
    const maxX = Math.max(container.scrollWidth - LABEL_HALF_WIDTH, LABEL_HALF_WIDTH);
    labels.innerHTML = [...pairLabels.values()]
      .map((label) => labelHtml({ ...label, x: Math.min(Math.max(label.x, LABEL_HALF_WIDTH), maxX) }))
      .join('');
  };

  const scheduleRelayout = (): void => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(relayout);
  };

  const remove = (id: string, path: SVGPathElement): void => {
    paths.delete(id);
    path.classList.add('is-leaving');
    const timer = window.setTimeout(() => {
      path.remove();
      leaving.delete(id);
    }, LEAVE_MS);
    leaving.set(id, { path, timer });
  };

  /** A path still fading out from a moment ago is revived in place instead of redrawn. */
  const revive = (id: string): SVGPathElement | undefined => {
    const pending = leaving.get(id);
    if (!pending) return undefined;
    clearTimeout(pending.timer);
    leaving.delete(id);
    paths.set(id, pending.path);
    return pending.path;
  };

  const update = (next: readonly EdgeSpec[]): void => {
    const nextIds = new Set(next.map(({ id }) => id));
    [...paths].filter(([id]) => !nextIds.has(id)).forEach(([id, path]) => remove(id, path));

    next.forEach((spec) => {
      const existing = paths.get(spec.id) ?? revive(spec.id);
      const path = existing ?? createPath(spec);
      path.setAttribute('class', `${edgeClass(spec)}${path.classList.contains('is-new') ? ' is-new' : ''}`);
      if (!existing) {
        paths.set(spec.id, path);
        layer.append(path);
      }
    });

    // Focused edges paint last so they sit on top of their neighbors.
    next.filter(({ emphasis }) => emphasis === 'focus').forEach(({ id }) => layer.append(paths.get(id)!));
    specs = next;
    relayout();
  };

  new ResizeObserver(scheduleRelayout).observe(container);
  return { update, relayout: scheduleRelayout };
};
