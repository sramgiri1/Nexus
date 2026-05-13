# NEXUS FAQ

## Can I use NEXUS to build apps today?

You can use NEXUS today for governed local planning, review, evidence, approval, and validation flows. Broad autonomous execution is still intentionally limited.

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

- unified boot in P41.6
- centralized activity log in P41.8
- Project Registry + Adapter Framework in P42
- worker runtime, provider dispatch, and broader governed execution

## Why are some buttons disabled?

Because the capability they depend on is not enabled yet or requires a governed bridge, approval, or runtime support.

## Why does DB show read-only/file-backed?

Because DB foundation is ready, but DB writes remain disabled by policy and runtime still uses file-backed persistence.

## Why does unified boot not exist yet?

It is planned for P41.6. Current local usage still depends on separate commands from `package.json`.

## Where are screenshots and reports?

Visual audit artifacts live under `reports/ui-audit/`. Other validation reports live under `reports/`.

## How do I know if a page is demo vs private?

Demo Mode is explicit. Public/demo surfaces stay DemoApp-safe. Local-private mode uses governed private-project wording and stricter boundaries.
