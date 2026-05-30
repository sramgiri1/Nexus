# P135 Identity, Tenant, Roles, and Permissions Plan

P135 turns enterprise identity, tenant isolation, role governance, session
state, and permission checks into implementation-grade NEXUS OS boundaries.
It is intentionally staged. P135.1 starts the contract and safety boundary.
P135.2 adds the read-only auth and tenant model. Later subphases own
permission previews, Command Center UX, tests, docs, and final validation.

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

## P135.3 Permission Preview

Status: complete

Scope classification:
- NEXUS_OS_CHANGE

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `b1aa2826`

Narrow goal:
- Add a display-safe permission preview that composes the P135.2 auth/tenant
  model into role, tenant-scope, Command Center surface, and sensitive-workflow
  permission rows without granting permissions, enforcing access, or enabling
  runtime authorization.

Allowed files:
- `auth-governance/p135-3-permission-preview.js`
- `contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json`
- `docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1353-permission-preview.js`
- `scripts/check-p1352-auth-tenant-model.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `reports/p1353-permission-preview-report.md`
- regenerated P135.2, enterprise, OS status, and phase coverage reports

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
- Create `auth-governance/p135-3-permission-preview.js`.
- Create `scripts/check-p1353-permission-preview.js`.
- Update package scripts, P135.2 checker, enterprise checker, OS phase status
  checker, README, platform roadmap, enterprise roadmap, OS phase status,
  phase index, and this plan.

Expected exports, schemas, and data shapes:
- Exports:
  - `P135_3_REQUIRED_FIELDS`
  - `P135_3_SAFETY_FLAG_NAMES`
  - `P135_3_SAMPLE_PREVIEWS`
  - `createPermissionPreview`
  - `validatePermissionPreview`
  - `buildPermissionPreviewEnvelope`
- Data shape:
  - `permissionPreviewId`
  - `previewState`
  - `authTenantModel`
  - `rolePreviewRows`
  - `tenantScopePreviewRows`
  - `commandCenterSurfaceRows`
  - `sensitiveWorkflowRows`
  - `permissionPreviewPolicy`
  - `safetyFlags`
  - `displayFields`
  - `blockedOperations`
  - `disabledReason`
  - `blockers`
  - `forbiddenFiles`
  - `evidenceRefs`
  - `activityRefs`
  - `costImpact`
  - `ownerCapability`
  - `nextAction`
  - `commandCenterVisible`
- No permission engine, authorization adapter, grant store, auth schema, tenant
  store, role store, session store, auth provider, DB adapter, runtime writer,
  dashboard source, Playwright source, or live execution is added.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not edit dashboard source or Playwright source.
- Validate UX preservation through route-wide Playwright coverage.
- P135.4 owns scoped Auth Governance UX updates that can surface this preview.
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
- Add `scripts/check-p1353-permission-preview.js`.
- Update `scripts/check-p1352-auth-tenant-model.js` for P135.3 handoff
  compatibility.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P135.3 handoff
  compatibility.
- Update `scripts/check-os-phase-status.js` so P135.4 is a valid OS phase
  handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update `README.md`.
- Update `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- Update `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

OS phase status update:
- P135 is in progress.
- P135.1 complete.
- P135.2 complete.
- P135.3 complete.
- Current phase P135.3.
- Previous phase P135.2.
- Next phase P135.4 planned-only.

Validation commands:
- `npm run check:p1353-permission-preview`
- `npm run check:p1352-auth-tenant-model`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P135.3 allowed files>`
- `git commit -m "chore(nexus): implement p1353 permission preview"`
- `git add <P135.3 status stamp files>`
- `git commit -m "chore(nexus): stamp p1353 permission preview"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source or Playwright source changes.
- No `db/**`, `local-state/runtime/**`, provider, tool, worker, deploy,
  release, export, package, or env changes.
- Role assignment, permission grants, permission revokes, permission
  enforcement, access decisions as live authority, login, sessions, tenant
  mutation, auth providers, DB/runtime writes, provider/model calls, agent
  dispatch, project mutation, network calls, and spend remain blocked.
- P135.4 remains planned-only.
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

## P135.4 Auth Governance Command Center UX

Status: complete

Scope classification:
- NEXUS_OS_CHANGE

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `3bcfb764`

Narrow goal:
- Surface the P135.3 permission preview in Auth Governance Command Center UX
  without enabling auth, permission enforcement, tenant writes, DB/runtime
  writes, provider calls, agent dispatch, project mutation, deploy, package,
  network, or spend.

Allowed files:
- `dashboard/src/data/authGovernanceReadiness.js`
- `dashboard/src/data/commandCenterTabs.js`
- `dashboard/src/data/commandCenterRoutes.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json`
- `docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1354-auth-governance-command-center-ux.js`
- `scripts/check-p1353-permission-preview.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `reports/p1354-auth-governance-command-center-ux-report.md`
- regenerated P135.3, enterprise, OS status, and phase coverage reports

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
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
- Update `dashboard/src/data/authGovernanceReadiness.js` to reuse the P135.3
  permission preview and expose sanitized Auth Governance rows.
- Update Auth Governance tabs, route badge, and page renderer.
- Update Playwright route coverage.
- Add `scripts/check-p1354-auth-governance-command-center-ux.js`.
- Update package scripts, P135.3 checker, enterprise checker, OS phase status
  checker, README, platform roadmap, enterprise roadmap, OS phase status,
  phase index, and this plan.

Expected exports, schemas, and data shapes:
- Exports:
  - `buildAuthGovernanceReadinessViewModel`
  - `authGovernanceReadinessViewModel`
- Auth Governance view model includes:
  - `routeId`
  - `pageTitle`
  - `whatChanged`
  - `currentState`
  - `nextAction`
  - `ownerAgent`
  - `ownerCapability`
  - `evidenceLocation`
  - `activityLocation`
  - `costImpact`
  - `disabledReason`
  - `readinessCards`
  - `roleAccessRows`
  - `tenantScopeRows`
  - `commandCenterSurfaceRows`
  - `sensitiveWorkflowRows`
  - `governanceRows`
  - `blockers`
  - `blockedOperations`
  - `disabledActions`
  - `safety`
- All auth, permission, tenant, DB/runtime, provider, agent, project, deploy,
  package, network, and spend safety flags remain false.

Command Center UX requirements:
- Auth Governance shows concise review-only identity, role, tenant-scope,
  Command Center surface, blocked workflow, evidence, blocker, and
  disabled-action sections.
- Do not expose raw JSON, raw logs, raw policy dumps, raw auth provider
  payloads, private IDs, tenant IDs, user IDs, role IDs, permission IDs,
  mutation controls, provider controls, deploy controls, package controls, or
  spend controls.
- Do not expose internal phase labels in primary UX.
- Do not expose DemoApp in full Command Center.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Use existing Command Center classes and route-wide navigation patterns.

Playwright tests:
- Update Auth Governance route coverage to verify dark/light/system themes,
  role rows, tenant scope rows, Command Center surface rows, blocked workflows,
  disabled actions, no DemoApp leakage, no raw tokens/URLs, no internal phase
  labels, and no fake runnable auth actions.

Checker updates:
- Add `scripts/check-p1354-auth-governance-command-center-ux.js`.
- Update `scripts/check-p1353-permission-preview.js` for P135.4 handoff
  compatibility.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P135.4 handoff
  compatibility.
- Update `scripts/check-os-phase-status.js` so P135.5 is a valid OS phase
  handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update `README.md`.
- Update `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- Update `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

OS phase status update:
- P135 is in progress.
- P135.1 through P135.4 complete.
- Current phase P135.4.
- Previous phase P135.3.
- Next phase P135.5 planned-only.

Validation commands:
- `npm run check:p1354-auth-governance-command-center-ux`
- `npm run check:p1353-permission-preview`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Auth Governance route"`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P135.4 allowed files>`
- `git commit -m "chore(nexus): implement p1354 auth governance command center ux"`
- `git add <P135.4 status stamp files>`
- `git commit -m "chore(nexus): stamp p1354 auth governance command center ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No `db/**`, `local-state/runtime/**`, provider, tool, worker, deploy,
  release, export, package, or env changes.
- Login, sessions, token exchange, role assignment, permission grants,
  permission revokes, permission enforcement, access decisions as live
  authority, tenant mutation, auth providers, DB/runtime writes,
  provider/model calls, agent dispatch, project mutation, network calls, and
  spend remain blocked.
- P135.5 remains planned-only.
- No stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX changes.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P135.5 Tests / Checkers

Status: complete

Scope classification:
- NEXUS_OS_CHANGE

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `3d8f9afb`

Narrow goal:
- Add aggregate test/checker hardening for the P135 identity, tenant, role,
  permission, Auth Governance UX chain without changing dashboard source or
  enabling live auth, permission, tenant, DB/runtime, provider, agent, project,
  deploy, package, network, or spend actions.

Allowed files:
- `dashboard/tests/routes.spec.js`
- `contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json`
- `docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js`
- `scripts/check-p1354-auth-governance-command-center-ux.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `reports/p1355-identity-tenant-roles-permissions-tests-checkers-report.md`
- regenerated P135.4, enterprise, OS status, and phase coverage reports

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
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
- Add focused Auth Governance Playwright regression coverage.
- Add `scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js`.
- Update package scripts, P135.4 checker, enterprise checker, OS phase status
  checker, README, platform roadmap, enterprise roadmap, OS phase status,
  phase index, and this plan.

Expected exports, schemas, and data shapes:
- No new runtime exports.
- No auth schema, tenant store, role store, permission engine, auth provider,
  DB/runtime write, dashboard source, or live execution.
- P135.5 report validates prior P135 reports, auth/tenant model shape,
  permission preview shape, Auth Governance view model, Playwright regression,
  checker handoffs, allowed-file scope, safety wording, and docs/status.

Command Center UX requirements:
- Preserve P135.4 Auth Governance UX.
- Add Playwright coverage proving Auth Governance remains review-only.
- Do not expose raw JSON, raw logs, raw policy dumps, raw auth provider
  payloads, private IDs, tenant IDs, user IDs, role IDs, permission IDs,
  mutation controls, provider controls, deploy controls, package controls, or
  spend controls.
- Do not expose internal phase labels in primary UX.
- Do not expose DemoApp in full Command Center.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through focused Auth Governance and route-wide Playwright coverage.

Playwright tests:
- Add a focused Auth Governance regression that verifies roles, tenant scope,
  surfaces, blocked workflows, evidence, disabled actions, no DemoApp leakage,
  no raw dumps, no tokens/URLs, no internal phase labels, and no fake runnable
  auth actions.

Checker updates:
- Add `scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js`.
- Update `scripts/check-p1354-auth-governance-command-center-ux.js` for
  P135.5 handoff compatibility.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P135.5 handoff
  compatibility.
- Update `scripts/check-os-phase-status.js` so P135.6 is a valid OS phase
  handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update `README.md`.
- Update `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- Update `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

OS phase status update:
- P135 is in progress.
- P135.1 through P135.5 complete.
- Current phase P135.5.
- Previous phase P135.4.
- Next phase P135.6 planned-only.

Validation commands:
- `npm run check:p1355-identity-tenant-roles-permissions-tests-checkers`
- `npm run check:p1354-auth-governance-command-center-ux`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "P135.5 identity tenant roles permissions"`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P135.5 allowed files>`
- `git commit -m "chore(nexus): implement p1355 identity tenant tests checkers"`
- `git add <P135.5 status stamp files>`
- `git commit -m "chore(nexus): stamp p1355 identity tenant tests checkers"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source changes.
- No `db/**`, `local-state/runtime/**`, provider, tool, worker, deploy,
  release, export, package, or env changes.
- Login, sessions, token exchange, role assignment, permission grants,
  permission revokes, permission enforcement, access decisions as live
  authority, tenant mutation, auth providers, DB/runtime writes,
  provider/model calls, agent dispatch, project mutation, network calls, and
  spend remain blocked.
- P135.6 remains planned-only.
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

## P135.2 Auth and Tenant Model

Status: complete

Scope classification:
- NEXUS_OS_CHANGE

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `fc267945`

Narrow goal:
- Add a display-safe, read-only auth and tenant model that composes existing
  identity/session, RBAC, and tenant boundary contracts without enabling auth,
  tenant, role, permission, DB/runtime, provider, agent, project, deploy,
  package, network, or spend execution.

Allowed files:
- `auth-governance/p135-2-auth-tenant-model.js`
- `contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json`
- `docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1352-auth-tenant-model.js`
- `scripts/check-p1351-identity-tenant-roles-permissions.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `reports/p1352-auth-tenant-model-report.md`
- regenerated P135.1, enterprise, OS status, and phase coverage reports

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
- Create `auth-governance/p135-2-auth-tenant-model.js`.
- Create `scripts/check-p1352-auth-tenant-model.js`.
- Update package scripts, enterprise checker, OS phase status checker, README,
  platform roadmap, enterprise roadmap, OS phase status, phase index, and this
  plan.

Expected exports, schemas, and data shapes:
- Exports:
  - `P135_2_REQUIRED_FIELDS`
  - `P135_2_SAFETY_FLAG_NAMES`
  - `P135_2_SAMPLE_MODELS`
  - `createAuthTenantModel`
  - `validateAuthTenantModel`
  - `buildAuthTenantModelEnvelope`
- Data shape:
  - `authTenantModelId`
  - `modelState`
  - `identityContract`
  - `tenantBoundaryContract`
  - `rbacMatrix`
  - `roleCatalog`
  - `tenantScopeCatalog`
  - `sessionPolicy`
  - `authProviderPolicy`
  - `permissionPolicy`
  - `safetyFlags`
  - `displayFields`
  - `blockedOperations`
  - `disabledReason`
  - `blockers`
  - `forbiddenFiles`
  - `evidenceRefs`
  - `activityRefs`
  - `costImpact`
  - `ownerCapability`
  - `nextAction`
  - `commandCenterVisible`
- No auth schema, session store, tenant store, role store, permission store,
  permission engine, auth provider, DB adapter, runtime writer, dashboard
  source, Playwright source, or live execution is added.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not edit dashboard source or Playwright source.
- Validate UX preservation through route-wide Playwright coverage.
- P135.4 owns scoped Auth Governance UX updates that can surface this model.
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
- Add `scripts/check-p1352-auth-tenant-model.js`.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P135.2 handoff
  compatibility.
- Update `scripts/check-os-phase-status.js` so P135.3 is a valid OS phase
  handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update `README.md`.
- Update `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- Update `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

OS phase status update:
- P135 is in progress.
- P135.1 complete.
- P135.2 complete.
- Current phase P135.2.
- Previous phase P135.1.
- Next phase P135.3 planned-only.

Validation commands:
- `npm run check:p1352-auth-tenant-model`
- `npm run check:p1351-identity-tenant-roles-permissions`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P135.2 allowed files>`
- `git commit -m "chore(nexus): implement p1352 auth tenant model"`
- `git add <P135.2 status stamp files>`
- `git commit -m "chore(nexus): stamp p1352 auth tenant model"`
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
- P135.3 remains planned-only.
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
