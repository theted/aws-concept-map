import { createContext } from '../state/context';
import type { AppState, Connection, Service, ServiceMap, Tour } from '../types';

/** Small, hand-checkable dataset so state/view tests don't depend on the real content. */

const service = (name: string, category: Service['category'], tagline = `${name} tagline`): Service => ({
  name,
  fullName: `Amazon ${name}`,
  tagline,
  category,
  summary: `${name} summary`,
  keyPoints: [`${name} point`],
  extendedDescription: `${name} deep dive`,
  resources: [{ title: `${name} docs`, url: `https://example.com/${name.toLowerCase()}` }],
});

export const fixtureServices: ServiceMap = {
  apigw: service('API Gateway', 'edge', 'Managed APIs'),
  lambda: service('Lambda', 'compute', 'Serverless code'),
  ddb: service('DynamoDB', 'database', 'Serverless NoSQL'),
  iam: service('IAM', 'security', 'Who can do what'),
  s3: service('S3', 'storage', 'Object storage'),
};

export const fixtureConnections: Connection[] = [
  { from: 'apigw', to: 'lambda', type: 'invoke', verb: 'invokes' },
  { from: 'lambda', to: 'ddb', type: 'data', verb: 'writes to' },
  { from: 'ddb', to: 'lambda', type: 'invoke', verb: 'streams to' },
  { from: 'iam', to: 'lambda', type: 'security', verb: 'grants a role to' },
];

export const fixtureTours: Tour[] = [
  {
    id: 'api',
    title: 'API',
    summary: 'An API',
    steps: [
      { service: 'apigw', text: 'Requests arrive' },
      { service: 'lambda', text: 'Code runs' },
      { service: 'iam', links: [], text: 'Permissions' },
      { service: 'ddb', links: ['lambda'], text: 'Data saved' },
    ],
  },
];

export const fixtureContext = createContext(fixtureServices, fixtureConnections, fixtureTours);

export const baseState = (overrides: Partial<AppState> = {}): AppState => ({
  selected: null,
  hovered: null,
  focusedEdge: null,
  query: '',
  tour: null,
  hiddenTypes: [],
  showAllEdges: false,
  guideOpen: false,
  theme: 'dark',
  ...overrides,
});
