# P111 Founder Live Agent Work Order Persistence Plan

P111 moves founder live agent work orders toward governed local SQLite
persistence so approved agent work can be tracked durably before any dispatch,
execution, project mutation, hosted DB mutation, deploy, network, or spend
authority is considered.

## Phase Split

- P111.1 Work Order Persistence Contract / Policy / Schema Plan
- P111.2 Agent Work Order SQLite Schema
- P111.3 Governed Local Work Order CRUD Model
- P111.4 Command Center Work Order Persistence UX
- P111.5 Work Order Persistence Validation
- P111.6 Docs / Roadmap
- P111.7 Final Validation

The canonical implementation-grade scope, allowed files, forbidden files,
expected exports, data shapes, UX rules, theme rules, Playwright requirements,
checker updates, docs updates, OS status updates, validation commands, git
commands, and final response checklists are recorded in
[`p111-founder-live-agent-work-order-persistence-contracts.json`](../../contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json).

## P111.1 Work Order Persistence Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local SQLite persistence contract for
founder-approved agent work orders without changing DB schema, runtime models,
Command Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `d0c8d2aa`.

Allowed files: P111 contract, P111 plan, README, platform roadmap, package
script registry, P111.1 checker, P110.7 compatibility checker, OS phase
checker, OS phase status files, and generated P111.1/P110.7/status/coverage
reports.

Forbidden files: `projects/**`, `careloop/**`, generated project sources/tests,
`db/**`, `live-ready/**`, `dashboard/src/**`, `dashboard/tests/**`,
`local-state/runtime/**`, `providers/**`, `tools/**`, `worker-runtime/**`,
`deploy/**`, `release/**`, `exports/**`, `packages/**`, and `.env*`.

Exact files/modules changed: added the P111 contract and P111.1 checker,
registered the P111.1 package script, updated the P110.7 final checker for the
P111.1/P111.2 handoff, updated the OS phase checker to accept P111.1-P111.7,
updated README/platform roadmap/P111 docs, and advanced OS status.

Expected exports/data shapes: P111.1 exports no runtime API and adds no DB
schema. It documents future exports and future local schemas for later scoped
subphases only. Future work order records must remain display-safe and include
current state, next action, blockers, disabled reason, owner capability,
evidence/audit/activity references, cost impact, and unsafe runtime flags set
false.

Safety rules: P111.1 is contract/docs/status/checker only. It does not call
providers/models, dispatch agents, run workers/tools, mutate projects, use
hosted DBs, run raw SQL, deploy, release, export, package, call networks, or
spend.

Reuse check: P111.1 requires reuse of the shared report/checker helpers,
existing SQLite runtime/repository helpers, existing founder handoff work order
helpers, existing founder work admission helpers, and existing Command Center
route/card/status patterns. No helper duplication is allowed.

Command Center UX requirements: no Command Center source change in P111.1.
Later P111 UX must surface work order persistence only on relevant founder
routes and must keep Chat/Lite clean.

Dark/light/system theme requirements: no theme source change in P111.1. P111.4
must preserve and test System, Dark, and Light theme behavior when UX changes.

Playwright tests: no new Playwright test in P111.1 because no UI files change.
P111.4 must add focused route coverage for work order persistence UX.

Checker updates: P111.1 adds
`check:p1111-founder-live-agent-work-order-persistence-contract`, updates
P110.7 final validation compatibility, and updates OS phase status acceptance.

Docs/README/roadmap updates: P111.1 is recorded in this plan, README, platform
roadmap, P111 contract, OS roadmap/status, and generated reports. P111.2 is
next.

OS phase status update: P111 is in progress; P111.1 is complete; current phase
P111.1; previous P110.7; next P111.2.

Validation commands:
- `npm run check:p1111-founder-live-agent-work-order-persistence-contract`
- `npm run check:p1107-founder-live-operator-decision-ledger-persistence-final`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden paths changed; no DemoApp exposure; no raw
JSON/log/policy dumps; no raw private project IDs; no raw packet keys; no fake
runnable actions; no hosted DB mutation, raw SQL, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.1 files>`
- `git commit -m "feat(nexus): define p111 agent work order persistence contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: contract wording can accidentally imply agent dispatch or
execution is available, or future schema names can be added to DB schema too
early. The P111.1 checker blocks those risks.

Rollback plan: remove P111 contract/checker/docs/status/report updates, restore
top-level status to P110.7 with P111 planned, and leave P110 complete.
