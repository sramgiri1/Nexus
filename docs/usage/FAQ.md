# NEXUS FAQ

## Can I use NEXUS to build apps today?

You can use NEXUS today for governed local planning, review, evidence, approval,
and validation flows. Broad autonomous execution is still intentionally limited.

## What works now?

- Command Center operator surface
- theme-aware route coverage
- task planning and activation flows
- Agent Workbench review loop
- controlled implementation summaries
- local API read surfaces
- durable state foundation
- screenshot-based UX audit

## What is still planned?

- centralized activity log in P41.8
- Project Registry + Adapter Framework in P42
- worker runtime, provider dispatch, and broader governed execution

Unified boot exists for enabled localhost-only services through `npm run nexus:up` and `npm run nexus:down`.

## Why are some buttons disabled?

Because the capability they depend on is not enabled yet or requires a governed bridge, approval, or runtime support.

## Why does DB show read-only/file-backed?

Because DB foundation is ready, but DB writes remain disabled by policy and runtime still uses file-backed persistence.

## Why does Service Health say a service is disabled?

Disabled services are usually intentional placeholders for future runtime
capabilities such as workers, provider dispatch, or DB-primary writes.
Use `npm run nexus:doctor` and `/command-center/services` to distinguish
disabled-by-policy from broken.

## Why do pages have tabs?

Tabs keep high-density operator pages readable. Overview tabs show the next safe
action; drilldown tabs show tasks, evidence, gates, policy, diagnostics, and
developer details without changing backend behavior.

## What happens if no project is selected?

Command Center should show a start-project empty state.
Create, import, or select a project, add a profile, define stack/test commands,
create a mission, generate a plan, and activate the first task.
DemoApp is not the local-private fallback.

## Where are screenshots and reports?

Visual audit artifacts live under `reports/ui-audit/`. Other validation reports live under `reports/`.

## How do I know if a page is demo vs private?

Demo Mode is explicit. Public/demo surfaces stay DemoApp-safe.
Local-private mode uses governed private-project wording and stricter
boundaries.
