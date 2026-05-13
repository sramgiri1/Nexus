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
