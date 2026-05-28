# P113 Founder Live Agent Work Assignment Readiness Plan

P113 moves governed queue admission candidates toward local agent work
assignment readiness. The phase does not dispatch agents, execute
workers/tools, mutate projects, call providers/models, use hosted DB writes,
expose raw SQL, deploy, release, export, package, network, or spend.

Subphases:
- P113.1 Assignment Readiness Contract / Policy / Schema Plan
- P113.2 Agent Work Assignment SQLite Schema
- P113.3 Governed Local Assignment CRUD Model
- P113.4 Assignment Readiness Preview / Safe Dry Run
- P113.5 Command Center Agent Assignment UX
- P113.6 Work Assignment Validation / Docs
- P113.7 Final Validation

Implementation follows
[`p113-founder-live-agent-work-assignment-readiness-contracts.json`](../../contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json).

## P113.1 Assignment Readiness Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local assignment readiness contract for
admitted founder agent queue candidates without changing DB schema, runtime
models, Command Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `e4bfc7dbd878491f5482717a87394dfcba1955e6`.

Allowed files: P113 contract, P113 plan, README, platform roadmap, P113.1
checker, P112.7 compatibility checker, OS phase status checker, package script
registry, OS roadmap/status files, and generated P113.1/P112.7/status/coverage
reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P113 contract and plan, added the
P113.1 contract checker, registered the package script, updated P112.7 handoff
compatibility, updated the OS status checker for P113.1-P113.7 and P114,
updated README/platform roadmap/status, and regenerated reports.

Expected exports/data shapes: no runtime exports, schema, UI data, or
persistent runtime data in P113.1. Future subphases may add only the documented
assignment readiness exports and local SQLite entities after their own
subphase plans.

Safety rules: contract-only. Hosted DB mutation, raw SQL, provider/model calls,
agent dispatch, worker/tool execution, runtime admission, execution unlock,
project mutation, deploy, release, export, package creation, network calls, and
provider spend remain blocked.

Reuse check: P113.1 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `os-roadmap/updatePhaseStatus.js`, the P112
queue admission contract, and existing DB/runtime/Command Center helper names
as future reuse requirements. No report writer, checker formatter, DB helper,
status helper, UI component, or runtime helper is duplicated.

Command Center UX requirements: no Command Center source change in P113.1.
Later UX work must show assignment readiness state on founder Agent Flow and
Business Build pages and keep Chat with NEXUS and Lite clean.

Dark/light/system theme requirements: no theme source change in P113.1. Later
UX work must preserve System, Dark, and Light themes.

Playwright tests: no new Playwright test in P113.1 because no UI source changes
are made. Later UX work must add focused route coverage.

Checker updates: P113.1 adds a dedicated contract checker, updates the OS phase
status checker to accept P113.1-P113.7 and P114, and updates the P112.7 checker
to accept the P113.1/P113.2 handoff state.

Docs/README/roadmap updates: P113.1 is recorded in this plan, README, platform
roadmap, P113 contract, OS roadmap/status, and generated reports. P113.2 is
next.

OS phase status update: P113 is in progress; P113.1 is complete; current phase
P113.1; previous P112.7; next P113.2.

Validation commands:
- `npm run check:p1131-founder-live-agent-work-assignment-contract`
- `npm run check:p1127-founder-live-agent-work-queue-admission-final`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw assignment/queue table names in primary UX; no fake runnable
actions; no hosted DB mutation, raw SQL interface, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P113.1 files>`
- `git commit -m "feat(nexus): add p113 work assignment contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: assignment readiness wording can sound like agent dispatch is
available. The P113.1 checker blocks unsafe authority claims and fake runnable
actions.

Rollback plan: remove the P113.1 checker/script/docs/status/report updates,
restore current phase to P112.7 with P113 as a handoff placeholder, and keep
P112 completion unchanged.

## P113.2 Agent Work Assignment SQLite Schema

Status: complete

Narrow goal: add local SQLite schema metadata and isolated validation for
assignment items, assignment events, and assignment evidence references without
runtime dispatch.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `50dcc888b70587180b52952a79fe13028fe33b4d`.

Allowed files: local DB schema metadata and SQL, P113.2 schema checker, P113.1
compatibility checker, P113 contract, P113 plan, README, platform roadmap,
package script registry, OS phase status files, and generated P113.2/P113.1/
status/coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added `founder_agent_work_assignments`,
`founder_agent_work_assignment_events`, and
`founder_agent_work_assignment_evidence_refs` to `db/schema.json` and
`db/schema.sql`; added the P113.2 checker; registered the package script;
updated P113 contract/status/docs; and regenerated reports.

Expected exports/data shapes: no runtime exports. The local schema now includes
display-safe assignment item, assignment event, and assignment evidence
reference records with explicit false-capable flags for local CRUD, DB writes,
hosted DB mutation, dispatch, execution, worker execution, runtime admission,
project mutation, and provider spend.

Safety rules: schema-only. Hosted DB mutation, raw SQL interface,
provider/model calls, agent dispatch, worker/tool execution, runtime admission,
execution unlock, project mutation, deploy, release, export, package creation,
network calls, and provider spend remain blocked.

Reuse check: P113.2 reuses `db/sqliteRuntime.js`,
`db/sqliteCrudRepository.js`, `shared/reportWriter.js`, and
`shared/checkResultFormatter.js`. No SQLite runtime, CRUD repository, report
writer, checker formatter, status helper, UI component, or runtime helper is
duplicated.

Command Center UX requirements: no Command Center source change in P113.2.
Assignment readiness UX remains planned for P113.5.

Dark/light/system theme requirements: no theme source change in P113.2.

Playwright tests: no new Playwright test in P113.2 because no UI source changes
are made.

Checker updates: P113.2 adds a dedicated schema checker. P113.1 already accepts
the P113.2/P113.3 handoff state.

Docs/README/roadmap updates: P113.2 is recorded in this plan, README, platform
roadmap, P113 contract, OS roadmap/status, and generated reports. P113.3 is
next.

OS phase status update: P113 is in progress; P113.2 is complete; current phase
P113.2; previous P113.1; next P113.3.

Validation commands:
- `npm run check:p1132-founder-live-agent-work-assignment-schema`
- `npm run check:p1131-founder-live-agent-work-assignment-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/provider/deploy
paths changed; temporary local schema-check DB is removed; no DemoApp exposure;
no raw JSON/log/policy dumps; no raw private IDs or raw assignment/queue table
names in primary UX; no fake runnable actions; no hosted DB mutation, raw SQL
interface, provider/model calls, agent dispatch, worker/tool execution, project
mutation, deploy, release, export, package, network, or provider spend
authority is enabled.

Git add/commit/push commands:
- `git add <allowed P113.2 files>`
- `git commit -m "feat(nexus): add p113 work assignment schema"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: schema additions can be mistaken for live dispatch. P113.2 keeps
all assignment execution, dispatch, project mutation, hosted DB mutation, and
provider spend fields false in isolated validation records.

Rollback plan: remove the P113.2 schema/checker/script/docs/status/report
updates, restore P113 to P113.1 complete with P113.2 planned, and keep P113.1
unchanged.
