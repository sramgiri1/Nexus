# NEXUS Architecture Diagram Registry

This directory is the source of truth for NEXUS architecture diagrams. P41.9.1
adds source-only Mermaid diagrams and a machine-readable registry; rendered PNG
artifacts are planned and intentionally not generated in this phase.

## Registry

- Registry: [diagram-registry.json](diagram-registry.json)
- Mermaid sources: [sources/](sources/)
- Validation: `npm run check:architecture-diagrams`

Each registry entry tracks:

- diagram id and title
- source path
- planned rendered path
- diagram status
- audience
- public-safe flag
- whether private project details are allowed
- short description

## Diagram Status

- `source_available`: Mermaid source exists and the rendered image is planned.
- `planned`: diagram is registered for a future source/rendering pass.
- `rendered`: source and rendered artifact both exist.

Missing rendered image files are valid only when the registry status is
`source_available` or `planned`.

## Current Diagrams

- NEXUS Enterprise Architecture: source available, rendered image planned.
- Command Center Flow: source available, rendered image planned.
- Project / OS Boundary: source available, rendered image planned.
- Agent Governance: source available, rendered image planned.
- Runtime Self-Healing: source available, rendered image planned.
- NEXUS Roadmap: source available, rendered image planned.

## Safety Rules

- Public-safe diagrams must not include private project names, source paths,
  secrets, customer data, raw logs, or raw policy payloads.
- The enterprise architecture diagram must remain architectural. The full
  roadmap belongs in the separate roadmap diagram and roadmap documents.
- Diagrams may describe private-project boundaries generically with terms such
  as `Private Project`, `Project Workspace`, or `Project Progress`.
- Rendered artifacts should not be linked from README files until they exist.

## Rendering

P41.9.1 does not introduce or require a rendering toolchain. Future phases may
render these Mermaid sources into PNG/SVG artifacts after selecting safe local
tooling and adding validation for generated outputs.
