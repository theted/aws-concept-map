# AWS Services Concept Map

An interactive visual learning tool for understanding AWS services and their relationships. Designed to help you prepare for AWS certifications including Cloud Practitioner, Solutions Architect Associate, and Developer Associate.

## Features

- **Interactive Canvas** - Pan, zoom, and navigate through 57 AWS services
- **Service Categories** - Services organized into 10 categories (Compute, Storage, Database, Networking, Security, Management, Cost, Messaging, CDN, DevTools)
- **Relationship Visualization** - Visual connections show how services relate to each other
- **Detailed Information** - Click any service to see descriptions, key points, and certification-relevant details
- **Extended Learning** - "Learn More" expands to show in-depth information and official AWS documentation links
- **Responsive Design** - Works on desktop and mobile with touch support
- **Keyboard Navigation** - Arrow keys to pan, +/- to zoom, Escape to deselect

## Demo

Navigate the canvas by dragging or using arrow keys. Zoom with mouse wheel or +/- keys. Click on any service node to see its details.

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd aws-services-concept-map

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

Open http://localhost:5173 in your browser.

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run
```

## Project Structure

```
├── src/
│   ├── main.ts              # Application entry point
│   ├── types.ts             # TypeScript type definitions
│   ├── style.css            # Application styles
│   ├── canvas/
│   │   └── CanvasRenderer.ts    # Canvas rendering and interaction
│   ├── data/
│   │   ├── services.ts      # Data exports
│   │   ├── services.json    # AWS service definitions
│   │   └── connections.json # Service relationships
│   ├── layout/
│   │   └── LayoutEngine.ts  # Non-overlapping layout algorithm
│   └── ui/
│       └── InfoPanel.ts     # Service info panel component
├── lambda/
│   └── handler.ts           # AWS Lambda handler for deployment
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── Dockerfile               # Container image for Lambda deployment
```

## Architecture

### Canvas Renderer

The `CanvasRenderer` class handles all canvas operations:
- Draws service nodes with category-specific gradient colors
- Renders connection lines between related services
- Manages pan/zoom viewport transformations
- Detects clicks and hover states on service nodes
- Supports smooth animations for zoom and navigation
- HiDPI/Retina display support

### Layout Engine

The `LayoutEngine` computes non-overlapping positions for all services:
- Groups services by category
- Arranges categories in a grid pattern
- Places services within categories to prevent overlaps
- Configurable spacing and dimensions

### Info Panel

The `InfoPanel` component displays service details:
- Service name, category, and description
- Key certification points
- Expandable extended description
- Links to official AWS documentation

## Adding New Services

1. **Add the service** to `src/data/services.json`:

```json
{
  "service-id": {
    "name": "Service Name",
    "category": "compute",
    "description": "Brief description",
    "details": "More detailed explanation",
    "keyPoints": [
      "Key certification point 1",
      "Key certification point 2"
    ],
    "x": 0,
    "y": 0,
    "extendedDescription": "In-depth description for the Learn More section...",
    "resources": [
      {"title": "Documentation", "url": "https://docs.aws.amazon.com/..."},
      {"title": "Best Practices", "url": "https://..."},
      {"title": "Pricing", "url": "https://..."}
    ]
  }
}
```

2. **Add connections** to `src/data/connections.json`:

```json
["service-id", "related-service-id"]
```

3. The layout engine will automatically position the new service to avoid overlaps.

## Service Categories

| Category | Color | Description |
|----------|-------|-------------|
| Compute | Orange | EC2, Lambda, ECS, Fargate, etc. |
| Storage | Green | S3, EBS, EFS, Glacier |
| Database | Blue | RDS, DynamoDB, ElastiCache, Redshift |
| Networking | Purple | VPC, Subnets, Load Balancers |
| Security | Red | IAM, KMS, WAF, Shield, GuardDuty |
| Management | Teal | CloudWatch, CloudTrail, CloudFormation |
| Cost | Gold | Cost Explorer, Budgets |
| Messaging | Pink | SQS, SNS, EventBridge, Kinesis |
| CDN | Cyan | CloudFront, Route 53 |
| DevTools | Indigo | CodePipeline, CodeBuild, CodeDeploy |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Pan the canvas |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset view to fit all services |
| `Escape` | Deselect current service |

## Deployment

The application is designed to be deployed as an AWS Lambda function using container images. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:

- AWS infrastructure setup (ECR, Lambda, Function URL)
- GitHub Actions CI/CD configuration
- Local Docker testing
- Manual deployment steps

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Vitest** - Fast unit testing framework
- **Canvas API** - Hardware-accelerated 2D rendering
- **Vanilla CSS** - No CSS framework dependencies

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run build:lambda` | Build Lambda handler |
| `npm run build:all` | Build app and Lambda handler |
| `npm run docker:build` | Build Docker image locally |
| `npm run docker:run` | Run Docker container locally |

## License

MIT
