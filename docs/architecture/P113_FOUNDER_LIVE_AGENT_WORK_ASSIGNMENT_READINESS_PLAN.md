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
