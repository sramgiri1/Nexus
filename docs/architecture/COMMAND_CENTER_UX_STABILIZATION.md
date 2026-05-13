# Command Center UX Stabilization

## Purpose

P41.5 stabilizes Command Center user experience after the major capability phases landed.

## P41.5.1 Scope

- Route-wide copy cleanup
- Capability states instead of stale phase-gating labels
- Sidebar cleanup
- Workflow card cleanup
- Route matrix for validation
- Playwright route-wide UX validation

## Capability States vs Phase Labels

Primary UX now uses product-facing capability states such as:

- Available
- Available for scoped implementation
- Read-only
- Requires worker runtime
- Requires release action bridge
- Requires iOS/Xcode runner

Phase labels remain on OS Roadmap, which is the intended place to track P37 through later roadmap work.

## Sidebar Cleanup

Command Center sidebar labels now use product labels only:

- Mission Control
- Workspace
- Task Queue
- Agent Workbench
- Implementation
- Live API
- Durable State

The sidebar no longer shows stale P37/P38/P39/P40/P41 labels.

## Route Matrix

`dashboard/src/data/commandCenterRoutes.js` is the route matrix for current and planned Command Center routes. It carries:

- route path
- product name
- section grouping
- expected heading
- whether roadmap-style phase labels are allowed

## Playwright Validation

`dashboard/tests/routes.spec.js` validates:

- primary routes render
- non-roadmap routes do not show stale phase labels
- OS Roadmap still shows phases
- sidebar labels are cleaned
- workspace cards use capability states
- local-private Mission Control and Workspace do not show DemoApp-active primary labels

## Next Subphases

- P41.5.2 adds the theme switcher
- P41.5.3 addresses visual layout refinement
- P41.5.5 adds screenshot audit

This subphase does not include theme work, layout redesign, screenshot audit, or backend execution changes.

## P41.5.2 — Global Theme Switcher + Route-Wide Theme Validation

Command Center now supports three themes:

- System
- Dark
- Light

Theme preference is stored in local storage under:

- `nexus-theme`

Command Center applies theme state through root attributes:

- `data-nexus-theme="system|dark|light"`
- `data-nexus-resolved-theme="dark|light"`

The stylesheet is token-based. Command Center components read shared `--nexus-*` theme tokens and route rendering is validated under dark and light across the implemented route matrix.

Playwright coverage now validates:

- global theme switcher visibility
- theme persistence across reloads
- system theme resolution
- route-wide dark/light rendering
- stale phase-label absence after theme changes

Next subphase:

- P41.5.3 — Mission Control Enterprise Dashboard Layout

## P41.5.3 — Mission Control Enterprise Dashboard Layout

Mission Control now acts as the primary NEXUS enterprise cockpit rather than a loose collection of cards.

The cockpit includes:

- Mission Hero
- Next Best Action
- System Status
- KPI Cards
- Execution Pipeline
- Activity Stream
- Verification Gates
- Active Mission Tasks
- Project Progress
- Evidence Timeline
- Safety / Approval
- Release Readiness
- Cost Snapshot

### Data Honesty Rule

Mission Control must use existing view-model, runtime snapshot, and local report data where available. If a source is not available yet, the UI must show a clear empty state or “not enabled yet” message instead of inventing precise runtime numbers.

### Theme Compatibility

Mission Control uses the shared `--nexus-*` tokens from P41.5.2 and must remain readable in:

- System
- Dark
- Light

### Copy Rules

Mission Control primary UX does not reintroduce stale phase labels such as:

- Requires P37 / P38 / P39 / P40 / P41
- P38-LOCAL / P39-LOCAL / P40-LOCAL / P41-LOCAL

OS Roadmap remains the only Command Center route where roadmap phase labels are expected.

### Next Subphase

- P41.5.4 — Page-Specific UX Cleanup for Agent Workbench, Implementation, Live API, Durable State, Workspace, and related routes

## P41.5.4 — Page-Specific UX Cleanup

This subphase brings the major Command Center routes up to the same user-facing standard as Mission Control without changing backend behavior.

Pages cleaned:

- Workspace
- Task Queue
- Agent Workbench
- Implementation Workflow
- Live API Status
- Durable State
- Evidence
- Safety Center
- Projects

### UX Rules

- Each page explains purpose, current state, next action, and capability posture in plain language.
- Empty states stay honest and actionable instead of leaving large blank surfaces.
- Disabled actions show user-facing reasons.
- Raw policy keys, raw payloads, and raw log dumps do not appear in primary UX.

### Theme Compatibility

The cleaned pages continue to use the shared System / Dark / Light theme tokens and remain covered by the existing route-wide theme tests.

### Copy Rules

- Stale P37 / P38 / P39 / P40 / P41 labels remain absent from primary UX.
- Product-facing states such as Available, Read-only, Disabled by policy, and Not enabled remain the preferred language.
- Public/demo boundaries remain strict.

### Next Subphase

- P41.5.5 — Screenshot UX Audit
- Route screenshots in dark/light
- Visual regression and readability review
