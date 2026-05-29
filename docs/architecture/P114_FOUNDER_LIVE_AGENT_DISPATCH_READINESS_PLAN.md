# P114 Founder Live Agent Dispatch Readiness Plan

P114 moves approved local assignment readiness toward governed local dispatch
readiness. The phase does not dispatch agents, execute workers/tools, mutate
projects, call providers/models, use hosted DB writes, expose raw SQL, deploy,
release, export, package, network, or spend.

Subphases:
- P114.1 Dispatch Readiness Contract / Policy / Schema Plan
- P114.2 Agent Dispatch SQLite Schema
- P114.3 Governed Local Dispatch CRUD Model
- P114.4 Dispatch Readiness Preview / Safe Dry Run
- P114.5 Command Center Agent Dispatch UX
- P114.6 Dispatch Validation / Docs
- P114.7 Final Validation

Implementation follows
[`p114-founder-live-agent-dispatch-readiness-contracts.json`](../../contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json).

## P114.1 Dispatch Readiness Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local dispatch readiness contract for
approved founder agent assignment candidates without changing DB schema,
runtime models, Command Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `96e7a4c5e720`.

Allowed files: P114 contract, P114 plan, README, platform roadmap, P114.1
checker, P113.7 compatibility checker, OS phase status checker, package script
registry, OS roadmap/status files, and generated P114.1/P113.7/status/coverage
reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P114 contract and plan, added the
P114.1 contract checker, registered the package script, updated P113.7 handoff
compatibility, updated the OS status checker for P114.1-P114.7 and P115,
updated README/platform roadmap/status, and regenerated reports.

Expected exports/data shapes: no runtime exports, schema, UI data, or
persistent runtime data in P114.1. Future subphases may add only the documented
dispatch readiness exports and local SQLite entities after their own subphase
plans.

Safety rules: contract-only. Hosted DB mutation, raw SQL, provider/model calls,
agent dispatch, worker/tool execution, runtime admission, execution unlock,
project mutation, deploy, release, export, package creation, network calls, and
provider spend remain blocked.

Reuse check: P114.1 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `os-roadmap/updatePhaseStatus.js`, the P113
assignment readiness contract, and existing DB/runtime/Command Center helper
names as future reuse requirements. No report writer, checker formatter, DB
helper, status helper, UI component, or runtime helper is duplicated.

Command Center UX requirements: no Command Center source change in P114.1.
Later UX work must show dispatch readiness state on founder Agent Flow and
Business Build pages and keep Chat with NEXUS and Lite clean.

Dark/light/system theme requirements: no theme source change in P114.1. Later
UX work must preserve System, Dark, and Light themes.

Playwright tests: no new Playwright test in P114.1 because no UI source changes
are made. Later UX work must add focused route coverage.

Checker updates: P114.1 adds a dedicated contract checker, updates the OS phase
status checker to accept P114.1-P114.7 and P115, and updates the P113.7 checker
to accept the P114.1/P114.2 handoff state.

Docs/README/roadmap updates: P114.1 is recorded in this plan, README, platform
roadmap, P114 contract, OS roadmap/status, and generated reports. P114.2 is
next.

OS phase status update: P114 is in progress; P114.1 is complete; current phase
P114.1; previous P113.7; next P114.2.

Validation commands:
- `npm run check:p1141-founder-live-agent-dispatch-contract`
- `npm run check:p1137-founder-live-agent-work-assignment-final`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw dispatch/assignment/queue table names in primary UX; no fake
runnable actions; no hosted DB mutation, raw SQL interface, provider/model
calls, agent dispatch, worker/tool execution, project mutation, deploy,
release, export, package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P114.1 files>`
- `git commit -m "feat(nexus): implement p1141 dispatch readiness contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: dispatch readiness wording can sound like live agent dispatch is
available. The P114.1 checker blocks unsafe authority claims and fake runnable
actions.

Rollback plan: remove the P114.1 checker/script/docs/status/report updates,
restore current phase to P113.7 with P114 as a handoff placeholder, and keep
P113 completion unchanged.
