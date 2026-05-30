# P135 Identity, Tenant, Roles, and Permissions Plan

P135 turns enterprise identity, tenant isolation, role governance, session
state, and permission checks into implementation-grade NEXUS OS boundaries.
It is intentionally staged. P135.1 starts the contract and safety boundary
only; later subphases own models, previews, Command Center UX, tests, docs, and
final validation.

## Subphases

- P135.1 Contract / Policy / Safety Boundary
- P135.2 Auth and Tenant Model
- P135.3 Permission Preview
- P135.4 Auth Governance Command Center UX
- P135.5 Tests / Checkers
- P135.6 Docs / Roadmap / Status
- P135.7 Final Validation

## P135.1 Contract / Policy / Safety Boundary

Status: complete

Scope classification:
- NEXUS_OS_CHANGE

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `4dd47e11`

Narrow goal:
- Start P135 with an implementation-grade identity/tenant/RBAC contract,
  seven-subphase split, safety boundary, checker, docs/status handoff, and
  planned-only P135.2 handoff.

Allowed files:
- `contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json`
- `docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1351-identity-tenant-roles-permissions.js`
- `scripts/check-p1347-durable-db-crud-runtime-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `reports/p1351-identity-tenant-roles-permissions-report.md`
- regenerated P134.7, enterprise, OS status, and phase coverage reports

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

Exact files/modules to create or update:
- Create the P135 contract JSON.
- Create this P135 plan.
- Create the P135.1 checker and report.
- Update package scripts, enterprise checker, P134.7 checker, OS phase status
  checker, README, platform roadmap, enterprise roadmap, OS phase status, and
  phase index.

Expected exports, schemas, and data shapes:
- No runtime export, auth schema, tenant store, role store, permission engine,
  session adapter, auth provider, dashboard source, Playwright source, DB
  adapter, or live execution.
- Create `check:p1351-identity-tenant-roles-permissions` and report.
- P135 contract records seven subphases with implementation-grade scope,
  safety, validation, and handoff fields.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not edit dashboard source or Playwright source.
- Validate UX preservation through route-wide Playwright coverage.
- Do not expose raw JSON, raw logs, raw policy dumps, raw auth provider
  payloads, private IDs, tenant IDs, user IDs, role IDs, permission IDs,
  mutation controls, provider controls, deploy controls, package controls, or
  spend controls.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through the existing route-wide Playwright suite.

Playwright tests:
- Do not edit Playwright source in this subphase.
- Run `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"` to prove UX preservation.

Checker updates:
- Add `scripts/check-p1351-identity-tenant-roles-permissions.js`.
- Update `scripts/check-p1347-durable-db-crud-runtime-final-validation.js`
  for P135.1 handoff compatibility.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P135.1 handoff
  compatibility.
- Update `scripts/check-os-phase-status.js` so P135.1 and P135.2 are valid OS
  phase handoff IDs.

Docs/README/roadmap updates:
- Add this plan.
- Update `README.md`.
- Update `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- Update `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

OS phase status update:
- P135 is in progress.
- P135.1 complete.
- Current phase P135.1.
- Previous phase P134.7.
- Next phase P135.2 planned-only.

Validation commands:
- `npm run check:p1351-identity-tenant-roles-permissions`
- `npm run check:p1347-durable-db-crud-runtime-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P135.1 allowed files>`
- `git commit -m "chore(nexus): implement p1351 identity tenant rbac contract"`
- `git add <P135.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1351 identity tenant rbac contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source or Playwright source changes.
- No `db/**`, `local-state/runtime/**`, provider, tool, worker, deploy,
  release, export, package, or env changes.
- Login, sessions, tenant mutation, role mutation, permission grants,
  permission enforcement, auth providers, DB/runtime writes, provider/model
  calls, agent dispatch, project mutation, network calls, and spend remain
  blocked.
- P135.2 remains planned-only.
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
