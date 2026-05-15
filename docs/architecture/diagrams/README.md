# NEXUS Architecture Diagram Registry

This directory is the source of truth for NEXUS architecture diagrams. P41.9.2
adds public-safe rendered SVG artifacts from the diagram registry and Mermaid
sources. PNG artifacts remain optional and are not generated unless safe local
rendering support exists.

## Registry

- Registry: [diagram-registry.json](diagram-registry.json)
- Mermaid sources: [sources/](sources/)
- Rendered SVGs: [rendered/](rendered/)
- Validation: `npm run check:architecture-diagrams`
- Rendering: `npm run diagrams:render`

Each registry entry tracks:

- diagram id and title
- source path
- rendered SVG path
- optional rendered PNG path
- diagram status
- audience
- public-safe flag
- whether private project details are allowed
- short description

## Diagram Status

- `rendered_svg_available`: Mermaid source exists and a rendered SVG artifact
  exists.
- `rendered_png_available`: rendered SVG and PNG artifacts both exist.
- `source_available`: Mermaid source exists and the rendered image is planned.
- `planned`: diagram is registered for a future source/rendering pass.

Missing rendered image files are valid only for entries marked
`source_available` or `planned`. P41.9.2 entries are rendered as SVG.

## Render Modes

- `mermaid`: rendered with a locally available Mermaid CLI.
- `fallback-svg`: deterministic public-safe SVG generated without Mermaid CLI.
- `manual-svg`: hand-authored SVG maintained directly in the repo.

The current P41.9.2 artifacts use `fallback-svg` because Mermaid CLI was not
available without installing dependencies. These SVGs are useful documentation
artifacts, but they are not full Mermaid renders.

## Current Diagrams

| Diagram | Source | Rendered SVG |
| --- | --- | --- |
| NEXUS Enterprise Architecture | [nexus-enterprise-architecture.mmd](sources/nexus-enterprise-architecture.mmd) | [nexus-enterprise-architecture.svg](rendered/nexus-enterprise-architecture.svg) |
| Command Center Flow | [command-center-flow.mmd](sources/command-center-flow.mmd) | [command-center-flow.svg](rendered/command-center-flow.svg) |
| Project / OS Boundary | [project-os-boundary.mmd](sources/project-os-boundary.mmd) | [project-os-boundary.svg](rendered/project-os-boundary.svg) |
| Agent Governance | [agent-governance.mmd](sources/agent-governance.mmd) | [agent-governance.svg](rendered/agent-governance.svg) |
| Runtime Self-Healing | [runtime-self-healing.mmd](sources/runtime-self-healing.mmd) | [runtime-self-healing.svg](rendered/runtime-self-healing.svg) |
| NEXUS Roadmap | [nexus-roadmap.mmd](sources/nexus-roadmap.mmd) | [nexus-roadmap.svg](rendered/nexus-roadmap.svg) |

## Diagram Categories

- Enterprise Architecture explains NEXUS system layers and boundaries.
- Command Center Flow explains operator navigation and governed action flow.
- Project / OS Boundary explains separation between platform state, project
  progress, and demo-only data.
- Agent Governance explains agent roles, approval gates, evidence, and policy.
- Runtime Self-Healing explains the planned recovery loop at a high level.
- Roadmap shows grouped phase progression only.

The roadmap diagram is intentionally separate from the enterprise architecture
diagram. Do not place the full roadmap inside the enterprise architecture
artifact.

## Safety Rules

- Public-safe diagrams must not include private project names, source paths,
  secrets, customer data, raw logs, or raw policy payloads.
- The enterprise architecture diagram must remain architectural. The full
  roadmap belongs in the separate roadmap diagram and roadmap documents.
- Diagrams may describe private-project boundaries generically with terms such
  as `Private Project`, `Project Workspace`, or `Project Progress`.
- Rendered artifacts should not be linked from README files until they exist.

## Rendering

Run `npm run diagrams:render` to regenerate the SVG artifacts. The renderer uses
Mermaid CLI only when it is already available locally. It does not install
dependencies or call external networks. If Mermaid CLI is unavailable, it writes
deterministic fallback SVGs and records `renderMode: fallback-svg` in the
registry and render report.
