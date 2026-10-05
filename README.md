# AWS Services Map

An interactive guide to the core AWS services **and how they fit together**. Built for Cloud Practitioner, Solutions Architect Associate and Developer Associate prep.

Live: https://aws-concept-map.sundbergsolutions.se

## How it works

The map is laid out like a real architecture, so a tile's position already tells you something:

```
 Secure & govern │        Users & internet ↓         │ Operate & deliver
 ────────────────┼───────────────────────────────────┼──────────────────
 Security        │ Front door  (Route 53, CloudFront…)│ Operations
                 │ Networking  (VPC, subnets, ELB…)   │ (CloudWatch…)
                 │ Compute     (EC2, Lambda, ECS…)    │
 Governance      │ App integration (SQS, SNS…)        │ Developer tools
                 │ Storage · Databases · Analytics    │ Migration & hybrid
```

- **Top to bottom follows a request** — users hit the front door, travel through the network to compute, and land in data.
- **The side rails apply everywhere** — security/governance on the left, operations/delivery on the right.
- **Every tile shows a name and a 2–3 word tagline**, so the map reads at a glance.

### Relationships with meaning

Each of the 140+ relationships is directed, typed and reads as a sentence — _"API Gateway **invokes** Lambda"_, _"KMS **encrypts objects in** S3"_. Line colors show the type:

| Type | Color | Meaning |
|------|-------|---------|
| Network | violet | Routes, carries or hosts traffic |
| Triggers | amber | Starts work: events, messages, API calls |
| Data | blue | Reads, writes, stores or moves data |
| Security | rose | Protects, encrypts or grants access |
| Operate | green | Monitors, deploys, scales or manages |

Lines stay hidden until you need them: hover or select a tile to light up its links, hover a neighbor (or a row in the panel) to read that one relationship. The legend chips filter by type; "Show all links" draws everything faintly.

### Guided tours

Step-by-step walkthroughs of common architectures — serverless web app, classic three-tier, event-driven processing, data lake, container CI/CD, hybrid networking and an account security baseline. Each step highlights a service and explains its role.

### Also

- Search (<kbd>/</kbd>, <kbd>Enter</kbd> selects the best match), <kbd>Esc</kbd> resets, <kbd>←</kbd>/<kbd>→</kbd> step through tours
- Shareable URLs: `#service=lambda`, `#tour=data-lake&step=3`; Back/Forward work
- Light and dark themes (follows the system, toggle remembered)
- Responsive: docked side panel on desktop, bottom sheet on tablets and phones
- Fully keyboard accessible — tiles are real buttons, focus previews links

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
npm run test:run   # unit + DOM tests (Vitest, happy-dom)
npm run build      # type-check and build to dist/
```

## Project structure

```
src/
├── main.ts                 # Wires store, views, router and keyboard shortcuts
├── types.ts                # Domain + app state types
├── config/                 # Categories (zones), relationship types, constants
├── data/
│   ├── services.json       # Service content (tagline, summary, key points, links)
│   ├── connections.json    # Typed, directed relationships
│   ├── tours.json          # Guided tours
│   ├── graph.ts            # Relationship lookups
│   ├── search.ts           # Ranked service search
│   └── tours.ts            # Tour helpers
├── state/
│   ├── store.ts            # Tiny observable store
│   ├── actions.ts          # State transitions (pure patch builders)
│   ├── derive.ts           # State → map view model (tile states, edges)
│   ├── router.ts / url.ts  # URL hash ⇄ state
│   └── theme.ts
├── views/
│   ├── map/                # Zones + tiles (DOM), edges (SVG), geometry
│   ├── panel/              # Intro, service and tour views
│   ├── header.ts           # Search, theme, guide button
│   └── toolbar.ts          # Legend filters, show-all switch
└── styles/                 # Tokens, layout and component CSS (index.css imports all)
```

Rendering is plain DOM + SVG — no framework, no canvas. Views are pure functions of the store state: `derive.ts` computes which tiles are selected/related/dimmed and which edges to draw, the map view applies it, and the edge layer reconciles paths by id so only new lines animate in.

## Editing content

**Add a service** to `src/data/services.json` (key order = order within its zone):

```json
"service-id": {
  "name": "Short Name",
  "fullName": "Amazon Full Service Name",
  "tagline": "Two-three words",
  "category": "compute",
  "summary": "One or two sentences.",
  "keyPoints": ["Exam-relevant fact"],
  "extendedDescription": "Deeper explanation.",
  "resources": [{ "title": "Docs", "url": "https://docs.aws.amazon.com/..." }]
}
```

Categories: `edge`, `networking`, `compute`, `integration`, `storage`, `database`, `analytics`, `security`, `governance`, `management`, `devtools`, `migration`.

**Add a relationship** to `src/data/connections.json`. It must read as `<from> <verb> <to>`:

```json
{ "from": "apigateway", "to": "lambda", "type": "invoke", "verb": "invokes" }
```

**Add a tour** to `src/data/tours.json`. Each step links from the previous one unless `links` says otherwise (`[]` for none).

The data tests (`src/data/data.test.ts`) catch dangling ids, invalid types, taglines too long for a tile, and services with no relationships.

## Deployment

Static site on S3 + CloudFront, deployed by GitHub Actions on every push to `master`. See [DEPLOYMENT.md](DEPLOYMENT.md).

## License

MIT
