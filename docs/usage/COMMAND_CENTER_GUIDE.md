# Command Center Guide

## Purpose

Command Center is the operator surface for governed local NEXUS work. It summarizes what is active, what is blocked, what evidence exists, and what is not enabled yet.

## NEXUS Command Palette

- Purpose: expose a simple operator command surface for governed local work without requiring operators to memorize internal scripts or roadmap phases
- How to open it: use the `Command Palette` button in the top bar or `Cmd/Ctrl+K`
- Available commands now: `Plan Mission`, `Review Work`, `Run Retro`, `Guard Scope`, and `Explain Current State` when the underlying local state exists
- Disabled commands: `Run QA Gate`, `Propose Fix`, `Prepare Ship`, and `Freeze Workspace` stay disabled until their required governed capabilities exist
- Safety rule: no unsafe action executes directly from the palette; commands either open an existing governed route, show a read-only summary, or explain why they are not enabled

## Mission Control

- Purpose: enterprise cockpit for the active mission and current platform posture
- Shows: mission hero, next best action, system status, gates, tasks, safety, evidence, and readiness
- Available actions: mission planning, review, explain, and operator action previews through the command palette and Mission Control action row
- Disabled actions: show user-facing reasons such as action bridge, worker runtime, or release bridge requirements
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
- Known limitations: unified boot is not available yet

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
- Shows: active scope, backend validation, iOS readiness, release readiness, and adapter posture
- Available actions: inspection only
- Disabled actions: project registry and adapter framework are not complete yet
- Evidence/activity: validation posture and readiness context
- Known limitations: Project Registry + Adapter Framework is planned for P42

## OS Roadmap

- Purpose: phase-tracking route for roadmap state
- Shows: roadmap phases, current status, and future phase context
- Available actions: inspection only
- Disabled actions: no mutations
- Evidence/activity: roadmap only
- Known limitations: phase labels belong here, not on primary product pages

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
