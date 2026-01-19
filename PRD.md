# AWS services concept map

Visual tool for visualizing and learning about additionalAWS services.

## Project description

Tool for visualizing an assortment of AWS services. Intended to be used for learning purposes - specifically in preparation for the AWS Cloud Practitioner, Solutions Architect Associate, and Developer Associate certifications.

- A network of AWS services is displayed on an interactive (movable/zoomable) canvas.
- The network/graph shows the relationships between the services.
- Clicking on a service reveals a short description (including the abbreviation), as well as an bullet point with list of features. In this view the user can also click 'Learn more' to see a more detailed description of the service, along with sources for more in-depth learning.

## Tech stack

- Modern look & feel, clean design. Smooth colors.
- Modern vanilla JS, grouped into smaller files.
- Minimal extra dependencies. Vanilla JS if feasible? External libraries may be used to speed up production and enhance the user experience. Vanilla CSS.
- Build in Typescript, compile to JS in production. Live reloading in dev environment.
- Prefer ES6 modules. Logic should be kept in separated, smaller files.
- The overall network visualization is using the canvas HTML element (library to be decided).
- Vite as build tool.
- Tests using Vitest.

## Deployment

- Deployment as a simple node js AWS Lambda function, serving a compiled static version of the webpage. No DB, no API, no server, just a simple Lambda function, running in a docker container.

## Current state

Project structure has been set up with Vite, TypeScript, and Vitest. The POC code has been refactored into modular TypeScript files with proper separation of concerns (types, data, main logic). Tests verify data integrity.

## Steps

- [x] Initial specifications completed
- [x] Create PRD
- [x] Accept PRD
- [x] Initial proof of concept implementation
- [x] Setup project structure and dependencies according to spec
- [x] Initial implementation of network visualization using canvas element
- [x] Ensure canvas navigation works as expected - users can both navigate through and zoom in the canvas element.
- [x] Add support for showing detailed descriptions of services when clicked
- [x] Move content to json file(s)
- [x] Add content for additional services, ensure every service has good bullet point and overview descriptions
- [x] Add extra description for each service, revealed by a "Learn more" button
- [x] Prepare CI/CD pipeline for deploymenet to AWS Lambda. Credentials can be expected to be stored as github secrets, and specified locally in .env for local development.
- [x] Revise and polish design
- [x] Prepare deployment documentation
- [x] Revise graph layout - services should never overlap - maybe need to group services by category for a clearer layout? It's OK if relationship lines overlap, but the nodes should not.
- [x] Add detailed descriptions for all services
- [x] Ensure smooth animations, especially when zooming in/out
- [x] Add a "toggle legends" button which toggles service categories visibility
- [x] Add documentation in README
- [x] Design; update layout/grid system to not have hard-coded widths (this looks weird for services with long names)
- [x] Design: Add a smooth mesh gradient background in dark blue-greenish colors, update color palette to match (from purple to greenish blue)
- [ ] Design: Use modern, smooth sans-serif fonts
- [ ] Add a "Relationships" section in the in the infopanel, containing a list of services that are related to the selected service. Clicking a service opens the infopanel for that service.
- [ ] Ensure service positions are not hard-coded
- [ ] Ensure smooth animations - zoom and panning should have ease-out animations/transitions
- [ ] Ensure good performance
- [ ] Add keyboard navigation - tab/arrow keys should navigate between "next/previous" service
- [ ] Add additional 'learn more' links in infopanel for all services - can be any useful external links (tutorials, best practices, blogs, youtube videos, etc.), not only AWS links. Every service should have at least total 3 links and at most 12.
