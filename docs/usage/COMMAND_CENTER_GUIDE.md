# Command Center Guide

## Purpose

Command Center is the operator surface for governed local NEXUS work.
It summarizes what is active, what is blocked, what evidence exists, and what is
not enabled yet.

## NEXUS Command Palette

- Purpose: expose a simple operator command surface for governed local work
  without requiring operators to memorize internal scripts or roadmap phases
- How to open it: use the `Command Palette` button in the top bar or `Cmd/Ctrl+K`
- Available commands now: `Plan Mission`, `Review Work`, `Run Retro`,
  `Guard Scope`, and `Explain Current State` when the underlying local state
  exists
- Disabled commands: `Run QA Gate`, `Propose Fix`, `Prepare Ship`, and
  `Freeze Workspace` stay disabled until their required governed capabilities
  exist
- Safety rule: no unsafe action executes directly from the palette; commands
  either open an existing governed route, show a read-only summary, or explain
  why they are not enabled

## Using Command Center Tabs

- Tabs split high-density routes into focused operator sections without changing backend behavior.
- The first tab on each route is the default overview or recommended action surface.
- Secondary tabs expose drilldowns such as tasks, evidence, gates, diagnostics, policy blocks, and developer details.
- Non-roadmap tabs use capability language such as `Ready`, `Read-only`, `Not enabled`, or `Disabled by policy`.
- OS phase labels belong only on OS Roadmap.
- If a tab shows an empty state, follow its next-action guidance instead of assuming the service or project is broken.

## Scope and Project Shell

- Active Project is the primary work context when a project is selected; mode
  and environment badges are secondary metadata.
- Project scope shows the active project, active mission, project tasks, evidence, gates, and cost posture when available.
- Portfolio scope is a placeholder until Project Registry is implemented in P42.
- NEXUS OS scope is for platform progress, service posture, docs/tests readiness, and roadmap status.
- If no project is selected, Command Center should guide the operator to create
  or import a project, add a project profile, define stack and test commands,
  create a mission, generate a plan, and activate the first task.
- DemoApp is demo mode only and must not be treated as the local-private fallback.

## Roadmap Separation

- OS Roadmap tracks NEXUS OS phases and subphases only.
- Project progress, project milestones, adapters, and open project gaps belong on the Projects route.
- Project Registry is planned for P42; until then, multi-project views use honest placeholders instead of fabricated live project data.

## Mission Control

- Purpose: enterprise cockpit for the active mission and current platform posture
- Shows: mission hero, next best action, system status, gates, tasks, safety, evidence, and readiness
- Available actions: mission planning, review, explain, and operator action
  previews through the command palette and Mission Control action row
- Disabled actions: show user-facing reasons such as `Requires governed action bridge`, worker runtime requirements, or
  `Requires release action bridge`
- Evidence/activity: summarized from runtime records and snapshots
- Known limitations: does not execute providers or worker runtime

## Workspace

- Purpose: plan and choose governed workflows
- Shows: workflow groups, capability states, owner agents, and blocked reasons
- Available actions: planning-oriented workflow entry points
- Disabled actions: explain missing capability such as release bridge, provider dispatch, or iOS runner
- Evidence/activity: workflow expectations only; evidence appears after governed actions
- Known limitations: no broad autonomous execution

## Task Queue

- Purpose: view planned tasks and activated/runtime tasks
- Shows: task state, owner agent, risk, evidence count, and next action
- Available actions: task activation when supported by the activation bridge
- Disabled actions: explain activation constraints instead of phase labels
- Evidence/activity: evidence counts and next-action guidance
- Known limitations: runtime execution remains governed and scoped

## Agent Workbench

- Purpose: inspect activated tasks and capture human review decisions
- Shows: selected task details, owner agent, state, review posture, blockers, evidence, and activity
- Available actions: review output, request changes, approve plan, open evidence when the bridge is online
- Disabled actions: show bridge or workflow limitations clearly
- Evidence/activity: linked evidence and audit counts
- Known limitations: no free agent execution from this page

## Implementation Workflow

- Purpose: review controlled implementation state
- Shows: status, scope, owner, validation, rollback posture, and developer details
- Available actions: scoped implementation review flows only
- Disabled actions: explain when broader implementation or mutation is not enabled
- Evidence/activity: validation and implementation review context
- Known limitations: documentation-only or scoped implementation boundaries remain active

## Live API Status

- Purpose: show local API availability and data-source posture
- Shows: online/offline state, mode, data source, endpoint groups, and dependency context
- Available actions: refresh and operator inspection only
- Disabled actions: no API mutation flows are exposed here
- Evidence/activity: route-level health rather than task evidence
- Known limitations: the local API may still be offline, in which case Command Center falls back to snapshot or file-backed data

## Durable State

- Purpose: explain persistence posture
- Shows: file-backed persistence, DB foundation readiness, DB write policy, and import preview
- Available actions: inspection only
- Disabled actions: DB writes remain disabled by policy
- Evidence/activity: source mapping and readiness context
- Known limitations: runtime DB primary is not enabled yet

## Evidence

- Purpose: show what governed actions produced
- Shows: evidence summary, timeline, linked task/action context, redaction status
- Available actions: inspection only
- Disabled actions: raw payload access is intentionally withheld from primary UX
- Evidence/activity: evidence-first view
- Known limitations: raw confidential payloads are not displayed

## Safety Center

- Purpose: explain current safety and governance posture
- Shows: mode boundary, provider status, network policy, DB write posture, approvals, and policy blocks
- Available actions: inspection only
- Disabled actions: mutation and unsafe actions remain governed or disabled
- Evidence/activity: safety posture rather than action history
- Known limitations: no raw policy JSON in primary UX

## Projects

- Purpose: summarize current project or private-project state
- Shows: active scope, backend validation, iOS readiness, release readiness,
  adapter posture, and local-private project progress when available
- Available actions: inspection only
- Disabled actions: project registry and adapter framework are not complete yet
- Evidence/activity: validation posture and readiness context
- Known limitations: Project Registry + Adapter Framework is planned for P42,
  so project progress is still a temporary local-private example rather than a
  dynamic registry

## Service Health

- Purpose: show which local NEXUS services are running, offline, disabled, planned, or unknown
- Shows: localhost-only service manifest posture, current status snapshot, operator commands, doctor findings, and troubleshooting guidance
- Available actions: inspection only
- Disabled actions: UI execution for `nexus:up`, `nexus:down`, `nexus:status`, and `nexus:doctor` is intentionally disabled
- Evidence/activity: service-state and doctor-report summaries rather than task evidence
- Known limitations: the page reflects existing manifest and local-state data; it does not create a new backend status channel

## OS Roadmap

- Purpose: track NEXUS OS platform capability only
- Shows: three primary tabs for Completed, In Progress, and Planned OS phases
- Available actions: inspection only
- Disabled actions: no mutations
- Evidence/activity: roadmap only; project progress stays on the Projects route
- Known limitations: phase labels belong here, not on primary product pages, and project-specific milestones do not belong in the OS roadmap

## Docs & Guides

- Purpose: provide one local index for current usage, codebase, and architecture docs
- Shows: usage guides, codebase documentation references, and architecture references as readable cards
- Available actions: local documentation navigation only
- Disabled actions: no command execution, provider calls, DB writes, or project mutation
- Known limitations: docs are file-backed references; they do not replace future contextual help or searchable docs

## Header and Global Controls

- The global header is intentionally compact: `NEXUS / <Current Page>`, a scope/project chip, Guide, command palette icon, and compact theme control.
- Environment, Local API, Durable State, service details, and local boot posture live on their dedicated pages instead of crowding every page.
- Theme support remains System, Dark, and Light.

## Demo Mode

- Purpose: public-safe explanation of the demo surface
- Shows: DemoApp-safe boundaries and guided demo context
- Available actions: demo inspection
- Disabled actions: private-project actions remain hidden
- Evidence/activity: demo-safe summaries only
- Known limitations: does not expose local-private details

## Agent Fleet

- Purpose: summarize agent roles and readiness
- Shows: current agents, role posture, and readiness states
- Available actions: inspection only
- Disabled actions: no direct dispatch from this page
- Known limitations: provider-backed execution is not enabled

## Approvals

- Purpose: summarize pending and decided approvals
- Shows: approval counts, recent approval state, and linked evidence posture
- Available actions: UI is read-only; local approval decisions use CLI
- Disabled actions: no UI mutation bridge
- Known limitations: approval decisions remain CLI-driven

## Contracts

- Purpose: show governed contracts and their role in execution
- Shows: contract coverage, summaries, and route-level references
- Available actions: inspection only
- Disabled actions: no contract mutation from the page
- Known limitations: developer details remain secondary

## Release Control

- Purpose: show release posture and blockers
- Shows: readiness state, gate status, and release bridge posture
- Available actions: inspection only
- Disabled actions: release action bridge is not enabled
- Known limitations: no deploy actions

## Cost Center

- Purpose: show cost-enforcement posture
- Shows: budget enforcement status, provider spend posture, and batch/API cost context
- Available actions: inspection only
- Disabled actions: cost execution controls are not enabled
- Known limitations: no provider spend because provider dispatch is disabled

## Batch Queue

- Purpose: show batch-processing posture
- Shows: batch readiness, queue posture, and not-enabled guidance
- Available actions: inspection only
- Disabled actions: batch runtime is not enabled
- Known limitations: no live background worker runtime
