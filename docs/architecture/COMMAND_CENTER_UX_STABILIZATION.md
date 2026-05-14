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

## P41.5.5 — Route-Wide Screenshot UX Audit + Visual QA Report

This subphase adds a generated visual QA layer on top of the existing route-wide UX and theme checks.

Purpose:

- capture implemented Command Center routes as screenshots
- validate dark and light theme coverage
- record rendered-DOM UX checks in a manifest
- generate a readable visual QA report under `reports/ui-audit/`

### Screenshot Routes

The audit uses the Command Center route matrix and captures every implemented route. Planned routes remain in the audit output as skipped entries rather than being silently ignored.

### Dark / Light Capture

The audit sets `localStorage["nexus-theme"]` deterministically and captures:

- dark
- light

System theme remains covered by the route-wide interaction tests from P41.5.2.

### Manifest

The screenshot script writes:

- `reports/ui-audit/manifest.json`

The manifest records:

- route coverage
- captured screenshot paths

## P41.6.5 — OS Roadmap / Project Roadmap Separation, Boot Docs, Troubleshooting, and Final Validation

This follow-on Command Center finalization step keeps roadmap tracking honest
after local boot and command-palette work landed.

It adds:

- OS roadmap data sourced from the phase-status registry
- separate project progress on the Projects route
- cleaner top-bar environment formatting
- stronger roadmap hierarchy in dark and light themes
- improved planned-route behavior and sidebar label resilience
- boot docs and troubleshooting updates tied to `nexus:up`, `nexus:down`,
  `nexus:status`, and `nexus:doctor`

It does not add backend execution, provider dispatch, worker runtime, DB
writes, or project mutation.
- skipped/planned routes
- heading visibility
- theme control visibility
- sidebar visibility
- stale-label checks
- raw dump checks

### Visual QA Report

The audit also writes:

- `reports/ui-audit/visual-qa-report.md`

This report summarizes:

- expected vs captured routes
- skipped/planned routes
- screenshot counts
- route coverage table
- UX rule status
- current limitations

### Rendered DOM Checks

During capture, the audit verifies baseline rendered UX rules:

- heading visible
- theme control visible
- sidebar visible
- stale phase labels absent from non-roadmap routes
- no raw JSON/log dumps in primary UX
- DemoApp boundary preserved outside Demo Mode

### Limitations

- The audit uses the dashboard's local Vite server and snapshot/file-backed UI fallbacks.
- It does not require the local API to be online.
- It is a route-wide readability audit, not a pixel-perfect visual regression system.

### Next Phase

- P41.5.6 — Usage Docs + Codebase Docs + README Finalization

## P41.6.3 — Command Center Service Health UX

The P41.6 local boot work now has a Command Center surface for operators.

This subphase adds:

- a dedicated Service Health route
- read-only service cards for current and future local services
- command guidance for `nexus:up`, `nexus:down`, `nexus:status`, and `nexus:doctor`
- doctor findings and troubleshooting in the same UI language as the rest of Command Center

The Service Health page preserves:

- dark / light / system theme support
- stale phase-label cleanup
- public/private-safe copy
- no browser-side service execution

Next phase:

- P41.6.4 — NEXUS Command Palette + Simple Operator Actions

## P41.5.6 — Usage Docs + Codebase Docs + README Finalization

This subphase completes the first Command Center UX stabilization arc by adding the documentation layer around the UX work.

It adds:

- operator-facing usage guides under `docs/usage/`
- contributor-facing codebase guides under `docs/codebase/`
- README cleanup and documentation map updates
- a diagram registry placeholder
- a docs coverage checker and report

### Purpose

The goal is to make the current P41.5 Command Center surface understandable without reading source code or phase-by-phase implementation notes.

### Remaining Limitations

- public-safety false positives in the roadmap doc still remain a known issue
- screenshot audit remains a route-wide baseline, not a pixel-diff regression system
- planned Command Center routes remain intentionally skipped rather than fabricated

### Next Phase

- P41.6 — Unified NEXUS Local Boot / Service Orchestration

## P41.6.6 — Command Center Boundary Polish + Mission Control Consistency

This polish subphase closes the remaining Mission Control boundary and consistency gaps before the P41.7 documentation-system work starts.

It adds:

- local-private versus demo badge consistency in Mission Control
- a human-readable active mission display name with the raw mission ID demoted to secondary text
- a compact top bar for Command, Theme, and Environment controls
- a read-only Mission Prompt panel instead of a misleading editable textarea
- corrected primary-action disabled reasons that no longer contradict action-bridge availability
- denser above-the-fold cockpit summaries for current state, next action, pipeline, gates, and recent activity

### Boundary Rules

- local-private Mission Control and Workspace must not show DemoApp as the active project
- demo-specific wording is only allowed on the Demo route
- private-project wording remains the default public-safe label until a governed Project Registry exists

### Sidebar Badge Semantics

- `LIVE` means the route is attached to an actively connected live local service or runtime surface
- `READY` means the capability is available for operator use
- `READ-ONLY` means the surface is available while writes remain disabled by policy
- `PLANNED` means the route or capability is a placeholder for a future phase
- `OFFLINE` means the related service is currently unavailable
- `BLOCKED` means a policy or prerequisite currently prevents use

### Top Bar and Mission Display Rules

- use `Environment: Desktop · Local-private` formatting rather than mechanical badge prefixes
- keep Command Palette and Theme controls compact while preserving keyboard and theme behavior
- do not repeat `Mission Control` as both the page title and hero title
- mission prompts are read-only until a governed mission-edit workflow exists

### Action Reason Rules

- only use `Requires governed action bridge` when the bridge is actually offline
- use capability-specific prerequisites such as `Requires generated mission plan` and `Requires approved task plan` when the bridge is available but later steps are not ready

### Next Phase

- P41.7.1 — Codebase Documentation Standard + Module Registry

## P41.7.3A — Command Center Tab System Foundation + Multi-Project Scope Shell

This foundation subphase starts the tabbed Command Center UX without converting every page at once.

It adds:

- reusable Command Center tab components
- a Mission Control tab shell with Overview, Workflows, Tasks, Agents, Gates, Evidence, Risks / Approvals, and Cost
- a Portfolio / Project / NEXUS OS scope shell
- a ProjectSwitcher placeholder that keeps local-private pages on `Private Project`
- route tests and checker coverage for tab behavior

### Scope Rules

- Portfolio is a placeholder until Project Registry in P42.
- Project is the default local-private scope.
- NEXUS OS scope is for platform roadmap context, not project task state.
- DemoApp remains limited to demo route or demo fixtures.

### Next Phase

- P41.7.3B — Mission Control Tab Content Refinement

## P41.7.3B — Mission Control Tabbed Cockpit

This subphase converts Mission Control from a long cockpit into a scope-aware tabbed cockpit.

Mission Control tabs:

- Overview
- Workflows
- Tasks
- Agents
- Gates
- Evidence
- Risks / Approvals
- Cost

### Scope Model

Mission Control now distinguishes:

- Portfolio: read-only multi-project shell and Project Registry placeholder.
- Project: active local-private project and mission cockpit.
- NEXUS OS: platform phase, service, docs, test, and roadmap posture.

### Boundary Rules

- DemoApp remains limited to Demo Mode.
- Local-private Mission Control uses `Private Project`.
- OS Roadmap remains NEXUS OS-only.
- Project progress stays in project-scoped surfaces and Projects.

### Next Phase

- P41.7.3C — Page Tab Rollout - Workspace / Tasks / Workbench / Implementation

## P41.7.3C — Page Tab Rollout: Workspace, Task Queue, Agent Workbench, Implementation

This subphase applies the reusable `CommandTabs` foundation to the first set of high-traffic operational pages.

Pages converted:

- Workspace: Recommended, Plan, Build, Validate, Govern, Release, All Workflows
- Task Queue: Planned, Active, Review, Blocked, Completed, All Tasks
- Agent Workbench: Task, Review, Evidence, Activity, Context
- Implementation Workflow: Overview, Proposal, Apply, Validation, Rollback, Activity

### Rules Preserved

- The existing shared tab component remains the only tab implementation.
- Each tab has a clear heading, state summary, useful content or honest empty state, and next action guidance.
- Active project context is primary on the converted pages; environment and mode stay secondary metadata.
- If no active project is selected, the page shows start-project guidance instead of falling back to DemoApp.
- Scope/project shell behavior remains local-private safe, with `Private Project` used outside Demo Mode.
- Dark, light, and system theme behavior is preserved through existing theme tokens.
- Stale phase labels such as `Requires P38` and `P39-LOCAL` remain excluded from primary operational UX.
- No backend execution, provider dispatch, DB writes, worker runtime, local API behavior change, or action bridge behavior change is added.

### Next Phase

- P41.7.3D — Page Tab Rollout for Live API, Durable State, Evidence, Safety, Projects, OS Roadmap, Cost, and Batch

## P41.7.3D — Page Tab Rollout: Platform, Governance, Projects

This subphase applies the existing `CommandTabs` foundation to the remaining high-density Command Center pages without adding backend behavior.

Pages converted:

- Live API: Overview, Endpoints, Action Bridges, Diagnostics
- Durable State: Overview, Entities, Import Plan, Fallback, Developer Details
- Evidence: Timeline, By Task, By Agent, By Project, Developer Details
- Safety Center: Posture, Policy Blocks, Approvals, Data & Privacy, Developer Details
- Projects: Portfolio, Active Project, Adapter, Milestones, Gaps
- OS Roadmap: Current, Completed, Planned, Blocked / Risks, History
- Cost Center: Overview, Budgets, By Project, By Agent, Provider Spend
- Batch Queue: Overview, Jobs, Results, Cost

### Rules Preserved

- All converted pages reuse the shared `CommandTabs` component.
- DemoApp remains limited to Demo Mode.
- OS Roadmap remains NEXUS OS-only; project milestones remain under Projects.
- Cost Center and Batch Queue are honest planned/read-only surfaces and do not fake spend, jobs, workers, or provider dispatch.
- Durable State frames file-backed persistence and DB writes disabled by policy as intentional safety posture.
- No backend execution, provider calls, DB writes, worker runtime, local API behavior change, or action bridge behavior change is added.

### Next Phase

- P41.7.3E — Tabbed UX Tests, Docs, and OS Phase Status Finalization
