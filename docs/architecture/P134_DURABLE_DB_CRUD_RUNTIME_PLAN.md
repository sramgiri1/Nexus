# P134 Durable DB and CRUD Runtime Plan

P134 turns the planned durable DB/CRUD runtime into an implementation-grade
sequence. It must stay OS-scoped and governed: no project-owned files, no raw
SQL UX, no live DB/runtime writes, and no CRUD execution until the relevant
subphase explicitly allows and validates it.

## Subphases

- P134.1 Contract / Policy / Safety Boundary
- P134.2 Schema and Repository Model
- P134.3 DB Write Plan Preview
- P134.4 DB Runtime Command Center UX
- P134.5 Tests / Checkers
- P134.6 Docs / Roadmap / Status
- P134.7 Final Validation

## P134.1 Contract / Policy / Safety Boundary

Status: complete

Scope classification:
- `NEXUS_OS_CHANGE`

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `4def3d02`

Narrow goal:
- Start P134 with an implementation-grade contract, policy, safety boundary,
  checker, docs, and OS status handoff without enabling DB writes or CRUD.

Allowed files:
- `contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json`
- `docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1341-durable-db-crud-runtime.js`
- `scripts/check-p1337-founder-idea-to-prd-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- Generated P134.1, P133.7, enterprise, OS status, and phase coverage reports

Forbidden files:
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

Expected exports, schemas, and data shapes:
- No runtime exports.
- No DB schema.
- No migrations.
- No repository module.
- No DB adapter.
- No CRUD packet.
- Contract-only records for future schema, repository, preview, UX, test,
  docs, and final validation subphases.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not add DB controls in P134.1.
- Do not expose raw table names, raw SQL, raw JSON, raw logs, raw policy dumps,
  internal helper IDs, or private project IDs in primary UX.
- Keep DB Runtime, Business Build, Agent Flow, and Chat with NEXUS
  non-runnable.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Rerun existing route-wide Playwright coverage.

Tests and checker updates:
- Add `check:p1341-durable-db-crud-runtime`.
- Update P133.7 and enterprise readiness checkers for P134.1 handoff
  compatibility.
- Update OS phase status checker to recognize P134.1/P134.2.
- Do not edit Playwright source in this subphase.

Docs to update:
- This P134 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

Reports to regenerate:
- P134.1 report.
- P133.7 report.
- Enterprise readiness roadmap report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P134 in progress.
- P134.1 complete.
- Current phase P134.1.
- Previous phase P133.7.
- Next phase P134.2 planned-only.

Known risks:
- Operators could mistake the DB contract for live DB capability. P134.1 keeps
  all DB/runtime writes and CRUD actions blocked.
- P134.2 will need a narrow schema/repository model and must not be implemented
  early.

Rollback plan:
- Revert only the P134.1 implementation and stamp commits. P133.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1341-durable-db-crud-runtime`
- `npm run check:p1337-founder-idea-to-prd-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P134.1 allowed files>`
- `git commit -m "chore(nexus): implement p1341 durable db crud contract"`
- `git add <P134.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1341 durable db crud contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No `db/**`, `local-state/runtime/**`, provider, tool, worker, deploy,
  release, export, package, or env changes.
- DB/runtime writes, live CRUD, migrations, raw SQL, provider/model calls,
  agent dispatch, project mutation, network calls, and spend remain blocked.
- P134.2 remains planned-only.
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

## P134.2 Schema and Repository Model

Status: complete

Scope classification:
- `NEXUS_OS_CHANGE`

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `21133d6f`

Narrow goal:
- Define a unified durable DB schema and repository model for OS-owned
  founder/business runtime records without enabling DB reads, DB writes,
  migrations, runtime writes, or CRUD execution.

Allowed files:
- `shared/durableDbCrudRuntimeSchemaModel.js`
- `scripts/check-p1342-durable-db-crud-runtime-schema-model.js`
- `contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json`
- `docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1341-durable-db-crud-runtime.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- Generated P134.2, P134.1, enterprise, OS status, and phase coverage reports

Forbidden files:
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

Expected exports, schemas, and data shapes:
- `DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE`
- `DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION`
- `DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES`
- `DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES`
- `DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS`
- `buildDurableDbCrudRuntimeSchemaModel()`
- `validateDurableDbCrudRuntimeSchemaModel(model)`
- Data shape includes display-safe entity groups, blocked repository operation
  intent rows, source pointers to the existing local schema/repository
  descriptors, owner capability, evidence/activity labels, blockers, next
  action, cost impact, and authority flags set false.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not edit dashboard source or tests in P134.2.
- Do not expose raw table names, raw SQL, raw JSON, raw logs, raw policy dumps,
  internal helper IDs, or private project IDs in primary UX.
- P134.4 owns the later DB Runtime Command Center UX.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Rerun existing route-wide Playwright coverage.

Tests and checker updates:
- Add `check:p1342-durable-db-crud-runtime-schema-model`.
- Update P134.1 and enterprise readiness checkers for P134.2 handoff
  compatibility.
- Do not edit Playwright source in this subphase.

Docs to update:
- This P134 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

Reports to regenerate:
- P134.2 report.
- P134.1 report.
- Enterprise readiness roadmap report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P134 in progress.
- P134.1 and P134.2 complete.
- Current phase P134.2.
- Previous phase P134.1.
- Next phase P134.3 planned-only.

Known risks:
- Operators could mistake the schema/repository model for live CRUD
  capability. P134.2 keeps DB reads, DB writes, migrations, and CRUD execution
  blocked.
- The model imports existing DB descriptors. It must not duplicate SQLite CRUD
  helpers or edit DB files.

Rollback plan:
- Revert only the P134.2 implementation and stamp commits. P134.1 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1342-durable-db-crud-runtime-schema-model`
- `npm run check:p1341-durable-db-crud-runtime`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P134.2 allowed files>`
- `git commit -m "chore(nexus): implement p1342 db schema repository model"`
- `git add <P134.2 status stamp files>`
- `git commit -m "chore(nexus): stamp p1342 db schema repository model"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No `db/**`, `local-state/runtime/**`, provider, tool, worker, deploy,
  release, export, package, or env changes.
- DB/runtime writes, live CRUD, migrations, raw SQL UX, provider/model calls,
  agent dispatch, project mutation, network calls, and spend remain blocked.
- P134.3 remains planned-only.
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
