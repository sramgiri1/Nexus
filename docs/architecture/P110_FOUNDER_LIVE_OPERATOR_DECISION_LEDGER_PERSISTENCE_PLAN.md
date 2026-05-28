# P110 Founder Live Operator Decision Ledger Persistence

P110 moves the P109 display-safe operator decision ledger toward governed
local SQLite persistence for founder/operator decisions. It must reuse the
existing NEXUS DB runtime and CRUD repository. It must not introduce a second
database layer, hosted DB mutation, runtime admission, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
deploy, release, export, package creation, network calls, or provider spend.

## P110.1 Persistence Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local SQLite persistence contract for operator
decision ledger records without changing DB schema, runtime models, Command
Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` from `b91ac690`.

Scope classification: `NEXUS_OS_CHANGE`.

Allowed files:
`contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json`,
this plan, `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`, `README.md`,
`scripts/check-p1101-founder-live-operator-decision-ledger-persistence-contract.js`,
`scripts/check-p1097-founder-live-operator-decision-ledger-final.js`,
`scripts/check-os-phase-status.js`, `package.json`,
`os-roadmap/phase-status.json`, `os-roadmap/nexus-phases.json`, and generated
P109.7 compatibility, P110.1, status, and coverage reports.

Forbidden files: `projects/**`, `careloop/**`, generated project
`Sources/**` and `Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: created the P110 contract, this plan, and
`scripts/check-p1101-founder-live-operator-decision-ledger-persistence-contract.js`;
registered `check:p1101-founder-live-operator-decision-ledger-persistence-contract`;
updated the P109.7 final checker to accept the concrete P110.1/P110.2 handoff;
updated the OS phase checker to accept P110.1-P110.7; updated README, platform
roadmap, OS roadmap/status; generated P110.1, OS status, and phase coverage
reports.

Expected exports/data shapes: P110.1 exports no runtime API. Future P110 work
is expected to define `P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE`,
`P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES`,
`buildFounderLiveOperatorDecisionLedgerPersistenceContract`,
`validateFounderLiveOperatorDecisionLedgerPersistenceContract`,
`buildSafeOperatorDecisionLedgerDbRecord`,
`executeApprovedOperatorDecisionLedgerDbCrudRequest`, and
`buildOperatorDecisionLedgerDbViewModel`. Future schema entries are
`operator_decision_ledger_entries`, `operator_decision_ledger_events`, and
`operator_decision_ledger_evidence_refs`.

Reuse check: P110.1 requires reuse of `shared/reportWriter.js`,
`shared/reportMetadata.js`, `shared/resultEnvelope.js`, `shared/modeGuard.js`,
`shared/redaction.js`, `shared/checkResultFormatter.js`,
`os-roadmap/updatePhaseStatus.js`, `db/sqliteRuntime.js`,
`db/sqliteCrudRepository.js`, and the P109 decision-ledger boundary/model/audit
preview helpers. No report writer, mode guard, redaction helper, checker
formatter, result envelope, route matrix, UI card/tab/status component, or
activity/evidence/audit helper may be duplicated.

Command Center UX requirements: no Command Center source change in P110.1.
Later P110 UX must show local decision-ledger DB state, current state, next
action, blockers, disabled reason, owner capability, evidence/activity
location, and cost impact on relevant non-chat pages. Chat with NEXUS and Lite
must stay clean and must not show raw JSON, raw logs, raw policy dumps, raw
private IDs, raw packet keys, DemoApp, or fake runnable actions.

Dark/light/system theme requirements: no theme source change in P110.1. P110.4
must preserve System, Dark, and Light route-wide behavior and add focused
Playwright coverage when UX changes.

Playwright tests: no Playwright update in P110.1 because no UI files change.
P110.4 must add route coverage for decision-ledger persistence on non-chat
founder routes and preserve Chat/Lite cleanliness.

Checker updates: P110.1 adds a dedicated contract checker, registers the
package script, validates reuse/safety/forbidden scope, confirms P109.7 remains
complete, updates the P109.7 final checker for the concrete P110.1/P110.2
handoff, and updates the OS phase checker to accept P110.1-P110.7.

Docs/README/roadmap updates: P110.1 is recorded in this plan, README, platform
roadmap, P110 contract, OS roadmap/status, and generated reports. P110.2 is
next.

OS phase status update: P110 is in progress; P110.1 is complete; current phase
P110.1; previous P109.7; next P110.2.

Validation commands:
- `npm run check:p1101-founder-live-operator-decision-ledger-persistence-contract`
- `npm run check:p1097-founder-live-operator-decision-ledger-final`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: contract/docs/status/checker only; no DB schema changes;
no live runtime model changes; no Command Center source/test changes; no
project files; no runtime data; no hosted DB mutation, raw SQL, runtime
admission, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, deploy, release, export, package creation,
network calls, or provider spend.

Rollback plan: remove the P110.1 contract/checker/docs/status updates and
restore OS phase status to P109.7 complete with P110 as planned placeholder.

Final response checklist: branch, commit hash, files changed, implementation
summary, Command Center UX changes, tests/checkers, dashboard build/page
results if applicable, docs/README/roadmap updates, OS phase status,
evidence/audit/activity/cost records if applicable, safety confirmations,
forbidden paths confirmation, known limitations, and next phase/subphase.

## P110.2 Decision Ledger SQLite Schema

Status: planned

Narrow goal: add local SQLite schema definitions for display-safe operator
decision ledger entries, events, and evidence references. Allowed files are
limited to `db/schema.json`, `db/schema.sql`, P110 schema checker, docs/status,
package, and reports. Command Center source, runtime models, project files,
providers, tools, workers, deploy/release/export/package paths, and env files
remain forbidden. Validation must include the P110.2 checker, P110.1 checker,
OS status, phase coverage, and diff check.

## P110.3 Governed Local CRUD Model

Status: planned

Narrow goal: add a governed local CRUD adapter for allowlisted operator
decision ledger records using P110.2 schema and `db/sqliteCrudRepository.js`.
The model must require explicit local operator approval, rollback acceptance,
audit acceptance, validation command acceptance, `sqlite-live` mode, and write
enablement before test-only local SQLite writes can occur. Delete, raw SQL,
hosted DB mutation, project mutation, providers, agents, workers, runtime
admission, execution unlock, deploy/release/export/package, network, and spend
must remain blocked.

## P110.4 Command Center Ledger Persistence UX

Status: planned

Narrow goal: render display-safe decision-ledger persistence state on relevant
non-chat Command Center pages while keeping Chat with NEXUS and Lite focused on
chat only. UX must show current state, next action, blockers, disabled reason,
owner capability, evidence/activity location, and cost impact. It must not show
raw JSON, raw logs, raw policy dumps, raw private IDs, raw packet keys, DemoApp,
or fake runnable actions. Dark/light/system route coverage and focused
Playwright checks are required.

## P110.5 Tests / Checkers

Status: planned

Narrow goal: aggregate P110.1-P110.4 validation, route safety, forbidden scope,
local SQLite CRUD safety, report coverage, and stale status prevention. It must
not change runtime behavior except checker/report evidence.

## P110.6 Docs / Roadmap

Status: planned

Narrow goal: close P110 docs, README, platform roadmap, contract, reports, and
OS status evidence without changing runtime behavior or Command Center source.

## P110.7 Final Validation

Status: planned

Narrow goal: run final P110 validation and hand off to the next planned phase
without enabling non-scoped unsafe authority. Final validation must not leave
stale phase status, stale pending commit placeholders, project file changes, or
fake live claims.
