# Getting Started with NEXUS

## What NEXUS OS Is

NEXUS is a local-first agentic operating system that separates mission planning,
task activation, review, validation, evidence, approvals, and safety into
explicit governed layers.

## Current Completed Foundation Through P41.7.4

Through P41.6.4, NEXUS includes:

- Command Center route-wide UX stabilization
- System, Dark, and Light themes
- Mission Control enterprise cockpit layout
- page-specific Command Center UX cleanup
- screenshot-based visual QA audit
- local runtime records with evidence, audit, approvals, and runtime events
- read-only live local API surfaces
- durable state foundation with file-backed fallback
- localhost-only unified local boot commands
- Service Health visibility in Command Center
- a governed command palette for Plan, Review, QA, Fix, Ship, Retro, Guard, Freeze, and Explain
- reusable tabs across Mission Control, core operations, platform, governance, Projects, OS Roadmap, Cost Center, and Batch Queue
- route metadata that separates OS, project, portfolio, platform, and demo scopes
- operator-facing usage docs for local boot, missions, tasks, workbench review, implementation, evidence, and mode boundaries

## What Command Center Can Do Now

- show current mission and route status
- plan workflows in Workspace
- view planned and activated tasks
- inspect tasks in Agent Workbench
- review controlled implementation state
- inspect evidence, approvals, safety posture, local API status, and durable state posture
- open the Command Palette for Plan / Review / QA / Explain and other governed operator actions
- display screenshot audit and roadmap progress

## What Is Not Enabled Yet

- provider dispatch
- worker runtime
- live DB writes
- real release/deploy actions
- unrestricted source mutation

Unified boot was delivered in P41.6.2 and finalized through P41.6.5.
Use the dashboard, local API, action bridge, and `nexus:*` commands documented
in `package.json` and [Running NEXUS Locally](RUNNING_NEXUS_LOCALLY.md).

## Safe Ways to Run NEXUS Locally

- Dashboard: `npm run dashboard`
- Local API: `npm run local-api:start`
- Mission action bridge: `npm run mission:action-server`
- Service status: `npm run nexus:status`
- Service doctor: `npm run nexus:doctor`
- Command Palette: open Command Center and use `Cmd/Ctrl+K`

See [Running NEXUS Locally](RUNNING_NEXUS_LOCALLY.md) for more detail.

## Modes

- demo/public-safe: DemoApp-only public-safe surfaces
- local-private: private project access stays governed and redacted

See [Demo Mode vs Private Mode](DEMO_MODE_VS_PRIVATE_MODE.md).

## No Project Selected

If Command Center does not have an active project, do not use demo data as a fallback. The operator flow is:

1. create, import, or select a project
2. define or load a project profile
3. define stack and test commands
4. create a mission
5. generate a plan
6. activate the first task
7. review output and evidence

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
