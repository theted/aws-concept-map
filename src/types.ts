/** Map zones. Each service belongs to exactly one, which decides its position and color. */
export type CategoryId =
  | 'edge'
  | 'networking'
  | 'compute'
  | 'integration'
  | 'storage'
  | 'database'
  | 'analytics'
  | 'security'
  | 'governance'
  | 'management'
  | 'devtools'
  | 'migration';

/** What kind of interaction a relationship describes. */
export type RelationType = 'network' | 'invoke' | 'data' | 'security' | 'ops';

export interface Resource {
  title: string;
  url: string;
}

export interface Service {
  name: string;
  fullName: string;
  /** Two-to-three word "what is it" shown on the map tile */
  tagline: string;
  category: CategoryId;
  summary: string;
  keyPoints: string[];
  extendedDescription: string;
  resources: Resource[];
}

export type ServiceMap = Readonly<Record<string, Service>>;

/** Directed relationship that reads as a sentence: `${from} ${verb} ${to}` */
export interface Connection {
  from: string;
  to: string;
  type: RelationType;
  verb: string;
}

export interface TourStep {
  service: string;
  text: string;
  /** Services this step connects from on the map. Defaults to the previous step. */
  links?: string[];
}

export interface Tour {
  id: string;
  title: string;
  summary: string;
  steps: TourStep[];
}

export interface TourPosition {
  id: string;
  /** Zero-based step index */
  step: number;
}

export type ThemeName = 'light' | 'dark';

export interface AppState {
  selected: string | null;
  /** Tile under the pointer or keyboard focus — used for previews */
  hovered: string | null;
  /** Edge emphasized from the panel (hovering a relationship row) */
  focusedEdge: string | null;
  query: string;
  tour: TourPosition | null;
  hiddenTypes: readonly RelationType[];
  showAllEdges: boolean;
  /** Small screens: panel opened manually to show the intro/tour list */
  guideOpen: boolean;
  theme: ThemeName;
}
