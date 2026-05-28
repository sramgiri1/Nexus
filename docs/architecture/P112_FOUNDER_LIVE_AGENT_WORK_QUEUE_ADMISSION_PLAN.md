# P112 Founder Live Agent Work Queue Admission Plan

P112 moves persisted founder agent work orders toward a governed local queue
admission layer. The phase does not dispatch agents, execute workers/tools,
mutate projects, call providers/models, use hosted DB writes, expose raw SQL,
deploy, release, export, package, network, or spend.

Subphases:
- P112.1 Queue Admission Contract / Policy / Schema Plan
- P112.2 Agent Work Queue SQLite Schema
- P112.3 Governed Local Queue CRUD Model
- P112.4 Queue Admission Preview / Safe Dry Run
- P112.5 Command Center Queue Admission UX
- P112.6 Work Queue Admission Validation / Docs
- P112.7 Final Validation

Implementation follows
[`p112-founder-live-agent-work-queue-admission-contracts.json`](../../contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json).

## P112.1 Queue Admission Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local queue admission contract for persisted
founder agent work orders without changing DB schema, runtime models, Command
Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `6b6b0987`.

Allowed files: P112 contract, P112 plan, README, platform roadmap, P112.1
checker, P111.7 compatibility checker, OS phase status checker, package script
registry, OS roadmap/status files, and generated P112.1/P111.7/status/coverage
reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P112 contract and plan, added the P112.1
contract checker, registered the package script, updated P111.7 handoff
compatibility, updated the OS status checker for P112.1-P112.7, updated
README/platform roadmap/status, and regenerated reports.

Expected exports/data shapes: no runtime exports, schema, UI data, or persistent
runtime data in P112.1. Future subphases may add only the documented queue
admission exports and local SQLite entities after their own subphase plans.

Safety rules: contract-only. Hosted DB mutation, raw SQL, provider/model calls,
agent dispatch, worker/tool execution, runtime admission, execution unlock,
project mutation, deploy, release, export, package creation, network calls, and
provider spend remain blocked.

Reuse check: P112.1 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `os-roadmap/updatePhaseStatus.js`, the P111
work order persistence contract, and existing DB/runtime/Command Center helper
names as future reuse requirements. No report writer, checker formatter, DB
helper, status helper, UI component, or runtime helper is duplicated.

Command Center UX requirements: no Command Center source change in P112.1.
Later UX work must show queue admission state on founder Agent Flow/Business
Build pages and keep Chat/Lite clean.

Dark/light/system theme requirements: no theme source change in P112.1. Later
UX work must preserve System, Dark, and Light themes.

Playwright tests: no new Playwright test in P112.1 because no UI source changes
are made. Later UX work must add focused route coverage.

Checker updates: P112.1 adds a dedicated contract checker, updates the OS phase
status checker to accept P112.1-P112.7, and updates the P111.7 checker to
accept the P112.1/P112.2 handoff state.

Docs/README/roadmap updates: P112.1 is recorded in this plan, README, platform
roadmap, P112 contract, OS roadmap/status, and generated reports. P112.2 is
next.

OS phase status update: P112 is in progress; P112.1 is complete; current phase
P112.1; previous P111.7; next P112.2.

Validation commands:
- `npm run check:p1121-founder-live-agent-work-queue-admission-contract`
- `npm run check:p1117-founder-live-agent-work-order-persistence`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw queue/work order table names in primary UX; no fake runnable
actions; no hosted DB mutation, raw SQL interface, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P112.1 files>`
- `git commit -m "feat(nexus): add p112 work queue admission contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: queue admission wording can sound like dispatch is available. The
P112.1 checker blocks unsafe authority claims and fake runnable actions.

Rollback plan: remove the P112.1 checker/script/docs/status/report updates,
restore current phase to P111.7 with P112 as a handoff placeholder, and keep
P111 completion unchanged.
