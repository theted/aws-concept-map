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
- [ ] Prepare CI/CD pipeline for deploymenet to AWS Lambda. Credentials can be expected to be stored as github secrets, and specified locally in .env for local development.
- [ ] Revise and polish design
- [ ] Prepare deployment documentation
