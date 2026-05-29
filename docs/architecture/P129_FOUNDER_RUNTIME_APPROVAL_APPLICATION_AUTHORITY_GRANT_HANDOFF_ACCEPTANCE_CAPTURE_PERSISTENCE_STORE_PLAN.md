# P129 Founder Runtime Approval Application Authority Grant Handoff Acceptance Capture Persistence Store Plan

## Scope Classification

NEXUS_OS_CHANGE. P129 is NEXUS OS work only. P129.2 must not modify project,
CareLoop, generated project, dashboard source/test, provider, tool, worker
runtime, deploy, release, export, package, local runtime state, DB, or
environment files.

## P129 Subphase Split

P129 is split into seven implementation-grade subphases:

- P129.1 Persistence Store Contract / Policy
- P129.2 Store Record Schema Metadata
- P129.3 Store Repository Intent Model
- P129.4 Store Migration Preview
- P129.5 Store CRUD Safe Dry Run
- P129.6 Command Center Store UX
- P129.7 Final Validation

## P129.5 Store CRUD Safe Dry Run

Status: complete
Phase: P129
Subphase: P129.5
Goal: Add browser-safe local blocked safe dry-run envelopes for future
acceptance capture persistence store CRUD while keeping DB schemas, migrations,
reads, writes, runtime records, CRUD execution, providers, dispatch, mutation,
network, and spend blocked.
Why this is needed: P129.4 previewed migration readiness. P129.5 defines the
future dry-run envelope surface before any Command Center store UX can explain
what is blocked and why.
User/operator impact: Operators can see future store create, read, modify,
remove, list, and evidence-link dry-run envelopes with disabled reason, owner,
next action, evidence, activity, and cost labels.
Command Center impact: No dashboard source or route test changes. Existing
read-only persistence cards stay scoped to Business Build and Agent Flow; Chat
with NEXUS and Lite stay clean.
Safety impact: P129.5 is safe-dry-run-only. It does not create DB schemas,
migration files, raw SQL interfaces, reads, writes, runtime records, CRUD
actions, acceptance capture, handoff acceptance, authority handoff, authority
grant, activation, approval application, approve/reject recording, runtime
execution, provider/model calls, agent dispatch, project mutation, deploy,
release, export, package, network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `0997f9e3`

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun.js`
- `contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json`
- `docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md`
- `scripts/check-p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `scripts/check-p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules to create or update:
- Create `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun.js`.
- Create `scripts/check-p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`.
- Update P129 docs, contract, status, package script, and reports listed above.

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun`
- Data shape: browser-safe blocked result envelopes only, with display-safe
  dry-run data, blocked authority flags, P129.4/P129.3/P129.2/P128.2/P127.2
  lineage, blockers, next action, owner, evidence/activity labels, and cost
  label. No DB schema, query, migration file, runtime record, live CRUD
  executor, provider envelope, dispatch packet, raw private ID, or project data.

Reuse check:
- Reuse P129.4 migration preview.
- Reuse `shared/resultEnvelope.js`.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Do not duplicate report writers, checker formatters, result envelopes, mode
  guards, redaction helpers, route matrices, status helpers, or UI components.

Command Center UX requirements:
- Preserve current scoped read-only persistence UX on Business Build and Agent
  Flow.
- Do not add new Chat with NEXUS or Lite page information.
- Do not expose raw JSON, raw logs, raw policy dumps, raw table names, DemoApp,
  raw report paths, or private project IDs in primary UX.
- No provider/tool/project mutation, DB writes, live CRUD, migration execution,
  or deploy controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Do not change dashboard source, CSS, theme tokens, or route layout in P129.5.

Tests to add/update/remove:
- Add the P129.5 checker.
- Do not add or remove Playwright tests in P129.5 because primary UX does not
  change.
- Run existing scoped Playwright coverage for the P128/P129 persistence route
  guard.

Checker updates:
- Validate P129.5 exported safe dry-run model and source lineage.
- Validate blocked live CRUD, schema, migration, DB reads/writes, raw SQL,
  runtime writes, execution, providers, dispatch, mutation, network, and spend.
- Validate allowed file scope, forbidden path scope, safe docs, result
  envelopes, and status handoff.

Docs to update:
- This P129 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P129.4 report.
- P129.5 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P129 in progress.
- P129.5 complete.
- Current phase P129.5.
- Previous phase P129.4.
- Next phase P129.6.
- P129.6 remains planned.

Known risks:
- Safe dry-run wording can imply live CRUD exists. The checker blocks unsafe
  positive claims, raw table names, raw SQL wording, and fake runnable action
  phrases.
- Future Command Center store UX must remain scoped and must not expose raw
  dry-run envelope internals.

Rollback plan:
- Revert only the P129.5 implementation and stamp commits. P129.4 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture persistence appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P129.5 allowed files>`
- `git commit -m "feat(nexus): implement p1295 capture persistence store crud dry run"`
- `git add <P129.5 status stamp files>`
- `git commit -m "chore(nexus): stamp p1295 capture persistence store crud dry run"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- Store CRUD execution, DB schemas, migrations, DB/runtime reads or writes,
  live capture, handoff acceptance, authority grant handoff, execution,
  provider/model calls, agent dispatch, project mutation, network calls, and
  spend remain blocked.
- No stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P129.4 Store Migration Preview

Status: complete
Phase: P129
Subphase: P129.4
Goal: Add browser-safe local migration preview rows for future acceptance
capture persistence store readiness while keeping DB schemas, migration files,
SQL, reads, writes, runtime records, CRUD, providers, dispatch, mutation,
network, and spend blocked.
Why this is needed: P129.3 defined repository intent rows. P129.4 defines the
future migration readiness surface before P129.5 can model a safe dry run.
User/operator impact: Operators can see future migration review areas,
disabled reasons, owner, next action, evidence, activity, and cost labels
without any executable migration controls.
Command Center impact: No dashboard source or route test changes. Existing
read-only persistence cards stay scoped to Business Build and Agent Flow; Chat
with NEXUS and Lite stay clean.
Safety impact: P129.4 is preview-only. It does not create DB schemas,
migration files, raw SQL interfaces, reads, writes, runtime records, CRUD
actions, acceptance capture, handoff acceptance, authority handoff, authority
grant, activation, approval application, approve/reject recording, runtime
execution, provider/model calls, agent dispatch, project mutation, deploy,
release, export, package, network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `d88313b4`

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview.js`
- `contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json`
- `docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md`
- `scripts/check-p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `scripts/check-p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules to create or update:
- Create `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview.js`.
- Create `scripts/check-p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`.
- Update P129 docs, contract, status, package script, and reports listed above.

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_ITEMS`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview`
- Data shape: browser-safe migration preview model only, with display-safe
  preview rows, blocked authority flags, P129.3/P129.2/P128.2/P127.2 lineage,
  blockers, next action, owner, evidence/activity labels, and cost label. No DB
  schema, query, migration file, runtime record, CRUD executor, read/write
  envelope, provider envelope, dispatch packet, raw private ID, or project data.

Reuse check:
- Reuse P129.3 repository intent model.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Do not duplicate report writers, checker formatters, mode guards, redaction
  helpers, route matrices, status helpers, or UI components.

Command Center UX requirements:
- Preserve current scoped read-only persistence UX on Business Build and Agent
  Flow.
- Do not add new Chat with NEXUS or Lite page information.
- Do not expose raw JSON, raw logs, raw policy dumps, raw table names, DemoApp,
  raw report paths, or private project IDs in primary UX.
- No provider/tool/project mutation, DB writes, migration execution, or deploy
  controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Do not change dashboard source, CSS, theme tokens, or route layout in P129.4.

Tests to add/update/remove:
- Add the P129.4 checker.
- Do not add or remove Playwright tests in P129.4 because primary UX does not
  change.
- Run existing scoped Playwright coverage for the P128/P129 persistence route
  guard.

Checker updates:
- Validate P129.4 exported migration preview model and source lineage.
- Validate blocked schema, migration, DB reads/writes, raw SQL, runtime writes,
  CRUD, execution, providers, dispatch, mutation, network, and spend.
- Validate allowed file scope, forbidden path scope, safe docs, and status
  handoff.

Docs to update:
- This P129 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P129.3 report.
- P129.4 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P129 in progress.
- P129.4 complete.
- Current phase P129.4.
- Previous phase P129.3.
- Next phase P129.5.
- P129.5 remains planned.

Known risks:
- Migration preview wording can imply real migrations exist. The checker blocks
  unsafe positive claims, raw table names, raw SQL wording, and fake runnable
  action phrases.
- Future safe dry run and local persistence implementation must be split into
  their own subphases before any DB/runtime files are allowed.

Rollback plan:
- Revert only the P129.4 implementation and stamp commits. P129.3 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture persistence appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P129.4 allowed files>`
- `git commit -m "feat(nexus): implement p1294 capture persistence store migration preview"`
- `git add <P129.4 status stamp files>`
- `git commit -m "chore(nexus): stamp p1294 capture persistence store migration preview"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- Store CRUD, DB schemas, migrations, DB/runtime reads or writes, live capture,
  handoff acceptance, authority grant handoff, execution, provider/model calls,
  agent dispatch, project mutation, network calls, and spend remain blocked.
- No stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P129.3 Store Repository Intent Model

Status: complete
Phase: P129
Subphase: P129.3
Goal: Add browser-safe local repository intent rows for future acceptance
capture persistence store operations while keeping DB schemas, migrations,
CRUD, reads, writes, runtime records, providers, dispatch, mutation, network,
and spend blocked.
Why this is needed: P129.2 defined the store record vocabulary. P129.3 defines
the future operation intent surface before any migration preview, safe dry run,
or local persistence implementation can be considered.
User/operator impact: Operators can see the future store create, read, modify,
remove, list, and evidence-link intents as blocked readiness rows with disabled
reason, owner, next action, evidence, activity, and cost labels.
Command Center impact: No dashboard source or route test changes. Existing
read-only persistence cards stay scoped to Business Build and Agent Flow; Chat
with NEXUS and Lite stay clean.
Safety impact: P129.3 is model-only and intent-only. It does not create DB
schemas, migrations, tables, indexes, raw SQL interfaces, reads, writes, runtime
records, CRUD actions, acceptance capture, handoff acceptance, authority
handoff, authority grant, activation, approval application, approve/reject
recording, runtime execution, provider/model calls, agent dispatch, project
mutation, deploy, release, export, package, network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `ce6f29be`

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntent.js`
- `contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json`
- `docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md`
- `scripts/check-p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `scripts/check-p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules to create or update:
- Create `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntent.js`.
- Create `scripts/check-p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`.
- Update P129 docs, contract, status, package script, and reports listed above.

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_ROWS`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel`
- Data shape: browser-safe repository intent model only, with display-safe
  operation rows, blocked authority flags, P129.2/P128.2/P127.2 lineage,
  blockers, next action, owner, evidence/activity labels, and cost label. No DB
  schema, query, migration, runtime record, CRUD executor, read/write envelope,
  provider envelope, dispatch packet, raw private ID, or project data.

Reuse check:
- Reuse P129.2 store metadata.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Do not duplicate report writers, checker formatters, mode guards, redaction
  helpers, route matrices, status helpers, or UI components.

Command Center UX requirements:
- Preserve current scoped read-only persistence UX on Business Build and Agent
  Flow.
- Do not add new Chat with NEXUS or Lite page information.
- Do not expose raw JSON, raw logs, raw policy dumps, raw table names, DemoApp,
  raw report paths, or private project IDs in primary UX.
- No provider/tool/project mutation, DB writes, or deploy controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Do not change dashboard source, CSS, theme tokens, or route layout in P129.3.

Tests to add/update/remove:
- Add the P129.3 checker.
- Do not add or remove Playwright tests in P129.3 because primary UX does not
  change.
- Run existing scoped Playwright coverage for the P128/P129 persistence route
  guard.

Checker updates:
- Validate P129.3 exported repository intent model and source lineage.
- Validate blocked repository CRUD, DB reads/writes, migrations, raw SQL,
  runtime writes, execution, providers, dispatch, mutation, network, and spend.
- Validate allowed file scope, forbidden path scope, safe docs, and status
  handoff.

Docs to update:
- This P129 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P129.2 report.
- P129.3 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P129 in progress.
- P129.3 complete.
- Current phase P129.3.
- Previous phase P129.2.
- Next phase P129.4.
- P129.4 remains planned.

Known risks:
- Repository intent wording can imply live CRUD exists. The checker blocks
  unsafe positive claims, raw table names, raw SQL wording, and fake runnable
  action phrases.
- Future migration preview and local persistence implementation must be split
  into their own subphases before any DB/runtime files are allowed.

Rollback plan:
- Revert only the P129.3 implementation and stamp commits. P129.2 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture persistence appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P129.3 allowed files>`
- `git commit -m "feat(nexus): implement p1293 capture persistence store intent model"`
- `git add <P129.3 status stamp files>`
- `git commit -m "chore(nexus): stamp p1293 capture persistence store intent model"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- Store CRUD, DB schemas, migrations, DB/runtime reads or writes, live capture,
  handoff acceptance, authority grant handoff, execution, provider/model calls,
  agent dispatch, project mutation, network calls, and spend remain blocked.
- No stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P129.2 Store Record Schema Metadata

Status: complete
Phase: P129
Subphase: P129.2
Goal: Add browser-safe local metadata for the future acceptance capture
persistence store record shape, reuse P128.2 persistence boundary metadata, and
keep DB schemas, migrations, CRUD, runtime writes, providers, dispatch,
mutation, network, and spend blocked.
Why this is needed: P129.3 repository intent modeling needs a stable,
display-safe store record vocabulary before any later local persistence work can
be specified.
User/operator impact: Operators can see the future store record, index, and
evidence-link shapes without seeing raw table names, raw IDs, fake live actions,
or runnable CRUD controls.
Command Center impact: No dashboard source or route test changes. Existing
P128 read-only capture persistence cards stay scoped to Business Build and
Agent Flow; Chat with NEXUS and Lite stay chat-focused and clean.
Safety impact: P129.2 is metadata-only and schema-only. It does not create DB
schemas, migrations, tables, indexes, raw SQL interfaces, reads, writes, runtime
records, CRUD actions, acceptance capture, handoff acceptance, authority
handoff, authority grant, activation, approval application, approve/reject
recording, runtime execution, provider/model calls, agent dispatch, project
mutation, deploy, release, export, package, network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `bcf5a901`

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata.js`
- `contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json`
- `docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md`
- `scripts/check-p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `scripts/check-p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules to create or update:
- Create `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata.js`.
- Create `scripts/check-p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`.
- Update the P129.1 checker so it accepts P129.2 handoff.
- Update P129 docs, contract, status, package script, and reports listed above.

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITIES`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata`
- Data shape: browser-safe metadata only, with display-safe entity labels,
  blocked authority flags, source P128.2 lineage, blockers, next action, owner,
  and cost label. No DB schema, migration, runtime record, CRUD envelope, write
  envelope, provider envelope, dispatch packet, raw private ID, or project data.

Reuse check:
- Reuse P128.2 persistence boundary metadata.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Do not duplicate report writers, checker formatters, mode guards, redaction
  helpers, route matrices, status helpers, or UI components.

Command Center UX requirements:
- Preserve current scoped read-only persistence UX on Business Build and Agent
  Flow.
- Do not add new Chat with NEXUS or Lite page information.
- Do not expose raw JSON, raw logs, raw policy dumps, raw table names, DemoApp,
  raw report paths, or private project IDs in primary UX.
- No provider/tool/project mutation, DB writes, or deploy controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Do not change dashboard source, CSS, theme tokens, or route layout in P129.2.

Tests to add/update/remove:
- Add the P129.2 checker.
- Update the P129.1 checker handoff assertion.
- Do not add or remove Playwright tests in P129.2 because primary UX does not
  change.
- Run existing scoped Playwright coverage for the P128 capture persistence
  route guard.

Checker updates:
- Validate P129.2 exported metadata and source lineage.
- Validate blocked store CRUD, DB reads/writes, migrations, raw SQL, runtime
  writes, execution, providers, dispatch, mutation, network, and spend.
- Validate allowed file scope, forbidden path scope, safe docs, and status
  handoff.

Docs to update:
- This P129 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P129.1 report.
- P129.2 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P129 in progress.
- P129.2 complete.
- Current phase P129.2.
- Previous phase P129.1.
- Next phase P129.3.
- P129.3 remains planned.

Known risks:
- Store metadata wording can imply live CRUD exists. The checker blocks unsafe
  positive claims, raw table names, raw SQL wording, and fake runnable action
  phrases.
- Future local persistence implementation must be split into its own subphase
  before any DB/runtime files are allowed.

Rollback plan:
- Revert only the P129.2 implementation and stamp commits. P129.1 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture persistence appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P129.2 allowed files>`
- `git commit -m "feat(nexus): implement p1292 capture persistence store metadata"`
- `git add <P129.2 status stamp files>`
- `git commit -m "chore(nexus): stamp p1292 capture persistence store metadata"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- Store CRUD, DB schemas, migrations, DB/runtime writes, live capture, handoff
  acceptance, authority grant handoff, execution, provider/model calls, agent
  dispatch, project mutation, network calls, and spend remain blocked.
- No stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P129.1 Persistence Store Contract / Policy

Status: complete
Phase: P129
Subphase: P129.1
Goal: Create the P129 implementation-grade contract, seven-subphase split,
safety rules, docs, status handoff, and checker while keeping store CRUD and
DB/runtime writes blocked.
Why this is needed: P128 closed the acceptance capture persistence boundary.
P129 needs a store-specific contract before later local CRUD or DB work can be
implemented safely.
User/operator impact: Operators can see P129 started, P129.1 complete, P129.2
next, and exactly which store capabilities remain unavailable until narrower
subphases implement them.
Command Center impact: No dashboard source or route test changes. Existing
P128 read-only capture persistence cards stay scoped to Business Build and
Agent Flow; Chat with NEXUS and Lite stay clean.
Safety impact: P129.1 does not create DB schemas, create migrations, write
DB/runtime records, persist acceptance capture, run CRUD actions, capture
acceptance, accept handoff, hand off authority, grant authority, activate
authority, apply approvals, record approve/reject decisions, unlock execution,
call providers/models, dispatch agents, execute workers/tools, mutate projects,
deploy, release, export, package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.

Files expected to change:
- `contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json`
- `docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md`
- `scripts/check-p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
- `reports/p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Tests to add/update/remove:
- Add `scripts/check-p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`.
- Update the P128.7 checker so it accepts the P129.1 handoff.
- Update `scripts/check-os-phase-status.js` so P129.1-P129.7 are recognized.
- Do not add or remove Playwright tests in P129.1 because primary UX does not
  change.

Docs to update:
- This P129 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P128.7 report.
- P129.1 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P129 in progress.
- P129.1 complete.
- Current phase P129.1.
- Previous phase P128.7.
- Next phase P129.2.

Known risks:
- Store wording can imply live CRUD exists. The checker blocks unsafe positive
  claims, raw table names, raw SQL wording, and fake runnable action phrases.

Rollback plan:
- Revert the P129.1 implementation and stamp commits only. P128.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture persistence appears only on scoped pages"`
- `git diff --check`

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.
