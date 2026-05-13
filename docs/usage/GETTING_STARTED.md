# Getting Started with NEXUS

## What NEXUS OS Is

NEXUS is a local-first agentic operating system that separates mission planning, task activation, review, validation, evidence, approvals, and safety into explicit governed layers.

## Current Completed Foundation Through P41.5

Through P41.5, NEXUS includes:

- Command Center route-wide UX stabilization
- System, Dark, and Light themes
- Mission Control enterprise cockpit layout
- page-specific Command Center UX cleanup
- screenshot-based visual QA audit
- local runtime records with evidence, audit, approvals, and runtime events
- read-only live local API surfaces
- durable state foundation with file-backed fallback

## What Command Center Can Do Now

- show current mission and route status
- plan workflows in Workspace
- view planned and activated tasks
- inspect tasks in Agent Workbench
- review controlled implementation state
- inspect evidence, approvals, safety posture, local API status, and durable state posture
- display screenshot audit and roadmap progress

## What Is Not Enabled Yet

- unified boot
- provider dispatch
- worker runtime
- live DB writes
- real release/deploy actions
- unrestricted source mutation

Unified boot is planned for P41.6. Until then, use the existing dashboard, local API, and action bridge commands documented in `package.json`.

## Safe Ways to Run NEXUS Locally

- Dashboard: `npm run dashboard`
- Local API: `npm run local-api:start`
- Mission action bridge: `npm run mission:action-server`
- Service status: `npm run nexus:status`
- Service doctor: `npm run nexus:doctor`

See [Running NEXUS Locally](RUNNING_NEXUS_LOCALLY.md) for more detail.

## Modes

- demo/public-safe: DemoApp-only public-safe surfaces
- local-private: private project access stays governed and redacted

See [Demo Mode vs Private Mode](DEMO_MODE_VS_PRIVATE_MODE.md).

## Runtime Record Locations

At a high level, governed local runtime records live under:

- `local-state/runtime/tasks.json`
- `local-state/runtime/evidence.jsonl`
- `local-state/runtime/audit.jsonl`
- `local-state/runtime/events.jsonl`
- related approval and incident files

Command Center does not read those files directly in the browser. It consumes generated snapshots and live local API reads where available.

## Where To Go Next

- [Command Center Guide](COMMAND_CENTER_GUIDE.md)
- [Starting a Mission](STARTING_A_MISSION.md)
- [Activating Tasks](ACTIVATING_TASKS.md)
- [Using Agent Workbench](USING_AGENT_WORKBENCH.md)
