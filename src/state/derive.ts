import { describeConnection, edgeId } from '../data/graph';
import { searchServices } from '../data/search';
import { clampStep, findTour, tourLinks } from '../data/tours';
import type { AppState, Connection, RelationType, Tour } from '../types';
import type { AppContext } from './context';

export type EdgeKind = RelationType | 'tour';
export type EdgeEmphasis = 'focus' | 'normal' | 'faint';

export interface EdgeSpec {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  emphasis: EdgeEmphasis;
  label?: string;
}

export interface TileStatus {
  /** Selected service, or the current tour step */
  selected: boolean;
  /** Hover/keyboard preview center when nothing is selected */
  preview: boolean;
  relation: RelationType | null;
  dimmed: boolean;
  /** Hidden by the search query */
  filtered: boolean;
  /** 1-based tour step number */
  step: number | null;
}

export interface MapViewModel {
  tiles: Map<string, TileStatus>;
  edges: EdgeSpec[];
}

const EMPHASIS_RANK: Record<EdgeEmphasis, number> = { faint: 0, normal: 1, focus: 2 };

/** Merges edge lists by id, keeping the strongest emphasis. */
const mergeEdges = (edges: EdgeSpec[]): EdgeSpec[] =>
  [
    ...edges
      .reduce((acc, edge) => {
        const existing = acc.get(edge.id);
        return !existing || EMPHASIS_RANK[edge.emphasis] > EMPHASIS_RANK[existing.emphasis]
          ? acc.set(edge.id, edge)
          : acc;
      }, new Map<string, EdgeSpec>())
      .values(),
  ];

const toEdge = (connection: Connection, emphasis: EdgeEmphasis, ctx: AppContext): EdgeSpec => ({
  id: edgeId(connection),
  from: connection.from,
  to: connection.to,
  kind: connection.type,
  emphasis,
  ...(emphasis === 'focus' && { label: describeConnection(connection, ctx.services) }),
});

const tourEdges = (tour: Tour, current: number): EdgeSpec[] =>
  tourLinks(tour).map(({ from, to, step }) => ({
    id: `tour:${from}->${to}`,
    from,
    to,
    kind: 'tour',
    emphasis: step === current ? 'focus' : step < current ? 'normal' : 'faint',
  }));

const relationEdges = (state: AppState, ctx: AppContext): EdgeSpec[] => {
  const visible = (c: Connection): boolean => !state.hiddenTypes.includes(c.type);
  const focus = state.selected ?? state.hovered;
  const background = state.showAllEdges ? ctx.connections.filter(visible).map((c) => toEdge(c, 'faint', ctx)) : [];
  const around = focus
    ? ctx.graph.relationsOf(focus).map(({ connection }) => connection).filter(visible).map((c) => toEdge(c, 'normal', ctx))
    : [];
  // Hovering a neighbor of the selected service, or a row in the panel, spotlights that one link.
  const hoveredPair =
    state.selected && state.hovered && state.hovered !== state.selected
      ? ctx.graph.between(state.selected, state.hovered).filter(visible)
      : [];
  const panelFocus = ctx.connections.filter((c) => edgeId(c) === state.focusedEdge);
  const spotlight = [...hoveredPair, ...panelFocus].map((c) => toEdge(c, 'focus', ctx));

  return mergeEdges([...background, ...around, ...spotlight]);
};

const baseStatus = (filtered: boolean): TileStatus => ({
  selected: false,
  preview: false,
  relation: null,
  dimmed: false,
  filtered,
  step: null,
});

export const deriveMapView = (state: AppState, ctx: AppContext): MapViewModel => {
  const matches = new Set(searchServices(ctx.services, state.query));
  const isFiltered = (id: string): boolean => state.query.trim() !== '' && !matches.has(id);
  const ids = Object.keys(ctx.services);
  const tour = findTour(ctx.tours, state.tour?.id);

  if (tour && state.tour) {
    const current = clampStep(tour, state.tour.step);
    const stepOf = new Map(tour.steps.map(({ service }, i) => [service, i] as const).reverse());
    const tiles = new Map(
      ids.map((id) => [
        id,
        {
          ...baseStatus(isFiltered(id)),
          selected: tour.steps[current].service === id,
          dimmed: !stepOf.has(id),
          step: stepOf.has(id) ? (stepOf.get(id) ?? 0) + 1 : null,
        },
      ])
    );
    return { tiles, edges: tourEdges(tour, current) };
  }

  const focus = state.selected ?? state.hovered;
  const neighbors = focus
    ? new Map([...ctx.graph.neighborTypes(focus)].filter(([, type]) => !state.hiddenTypes.includes(type)))
    : new Map<string, RelationType>();

  const tiles = new Map(
    ids.map((id) => [
      id,
      {
        ...baseStatus(isFiltered(id)),
        selected: id === state.selected,
        preview: !state.selected && id === state.hovered,
        relation: neighbors.get(id) ?? null,
        dimmed: !!focus && id !== focus && !neighbors.has(id),
      },
    ])
  );
  return { tiles, edges: relationEdges(state, ctx) };
};
