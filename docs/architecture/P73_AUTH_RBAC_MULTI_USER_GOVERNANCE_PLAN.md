# P73 Auth, RBAC, Multi-user Governance

P73 prepares governed authentication, RBAC, and multi-user workspace readiness
for NEXUS OS. It does not enable login, identity provider integration,
user/session/role/tenant mutation, DB writes, project mutation, provider
dispatch, tool execution, worker execution, deploy execution, release
execution, export execution, package creation, external network calls, or
provider spend.

Contract: `contracts/os-roadmap/p73-execution-contracts.json`

## Boundary

- Scope: NEXUS OS auth governance readiness only.
- Project source files and project roadmap files remain forbidden.
- Auth, user, RBAC, DB, Prisma, migration, and environment files remain
  forbidden.
- Identity/session, RBAC, and multi-user workspace records are preview-only
  until a later explicit phase enables governed auth mutation.
- Identity mode, role posture, tenant/workspace boundary, disabled reason,
  evidence, activity, safety posture, and cost impact must be visible before
  any future login or role mutation path is considered.

## Reuse

P73 must reuse existing helpers before adding new ones:

- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing evidence, audit, activity, and cost preview patterns

## Subphases

### P73.1 Execution Contract + Governance Boundary

Define P73 execution contracts only; no login, identity provider integration,
user/session/role/tenant mutation, DB writes, or runtime auth behavior.

Status: complete. P73.1 adds the implementation-grade P73 subphase contract,
disabled auth mutation boundary, validation checker, roadmap handoff, and
phase-status records.

### P73.2 Identity Session Contract

Define display-safe identity and session contract records without login or
session mutation.

Status: complete. P73.2 adds preview-only `IdentitySessionContract` records.
Each contract includes identity mode, session state, token handling state, auth
provider state, disabled login/provider/token/session/user/role/tenant flags,
forbidden files, blocked operations, blockers, disabled reason,
evidence/activity references, cost impact, owner capability, and next action.

Implementation:

- `auth-governance/p73-2-placeholder.js` exports
  `createIdentitySessionContract`, `validateIdentitySessionContract`,
  `buildIdentitySessionContractEnvelope`, `P73_2_REQUIRED_FIELDS`, and
  `P73_2_SAMPLE_CONTRACTS`.
- `scripts/check-p732.js` validates contract shape, disabled login/session and
  identity provider calls, disabled user/role/tenant mutation, disabled DB and
  project mutation, disabled provider/tool/worker execution, disabled
  network/spend, disabled deploy/release/export/package execution, forbidden
  auth/user/RBAC paths, hidden private IDs/tokens/auth URLs, evidence/activity,
  cost impact, and non-runnable disabled reasons.

### P73.3 RBAC Permission Matrix

Define RBAC permission matrix records without role or permission mutation.

Status: complete. P73.3 adds preview-only `RbacPermissionMatrix` records
derived from P73.2 identity/session contracts. Each matrix includes role set,
permission state, assignment state, display-only permission rows, disabled role
and permission mutation flags, blocked operations, blockers, disabled reason,
evidence/activity references, cost impact, owner capability, and next action.

Implementation:

- `auth-governance/p73-3-placeholder.js` exports
  `createRbacPermissionMatrix`, `validateRbacPermissionMatrix`,
  `buildRbacPermissionMatrixEnvelope`, `P73_3_REQUIRED_FIELDS`, and
  `P73_3_SAMPLE_MATRICES`.
- `scripts/check-p733.js` validates matrix shape, visible roles and
  permission rows, disabled role/permission/user/session/tenant mutation,
  disabled login/provider/token exchange, disabled DB and project mutation,
  disabled provider/tool/worker execution, disabled network/spend, disabled
  deploy/release/export/package execution, hidden private IDs/tokens/auth URLs,
  evidence/activity, cost impact, and non-runnable disabled reasons.

### P73.4 Multi-user Workspace Boundary

Define multi-user workspace boundary records without tenant or workspace
mutation.

Status: complete. P73.4 adds preview-only `MultiUserWorkspaceBoundary`
records derived from P73.2 identity/session contracts and P73.3 RBAC matrices.
Each boundary includes workspace mode, tenant boundary, isolation state,
display-only workspace rows, disabled tenant/workspace/member mutation flags,
blocked operations, blockers, disabled reason, evidence/activity references,
cost impact, owner capability, and next action.

Implementation:

- `auth-governance/p73-4-placeholder.js` exports
  `createMultiUserWorkspaceBoundary`,
  `validateMultiUserWorkspaceBoundary`,
  `buildMultiUserWorkspaceBoundaryEnvelope`, `P73_4_REQUIRED_FIELDS`, and
  `P73_4_SAMPLE_BOUNDARIES`.
- `scripts/check-p734.js` validates boundary shape, display-only workspace
  rows, disabled tenant/workspace/user/session/role/permission mutation,
  disabled login/provider/token exchange, disabled DB and project mutation,
  disabled provider/tool/worker execution, disabled network/spend, disabled
  deploy/release/export/package execution, hidden private IDs/tokens/auth URLs,
  evidence/activity, cost impact, and non-runnable disabled reasons.

### P73.5 Command Center Auth Governance UX

Expose auth governance readiness without runnable auth actions.

Status: complete. P73.5 adds a display-only Auth Governance Command Center
route. The route shows identity mode, role posture, workspace boundary, next
action, blockers, disabled reason, owner capability, evidence/activity
location, safety posture, and cost impact without raw JSON, raw logs, raw
policy dumps, raw private IDs, raw user IDs, raw tokens, internal phase labels,
DemoApp leakage, or runnable auth actions.

Implementation:

- `dashboard/src/data/authGovernanceReadiness.js` exports
  `buildAuthGovernanceReadinessViewModel` and
  `authGovernanceReadinessViewModel`.
- `dashboard/src/data/commandCenterRoutes.js` adds the
  `/command-center/auth-governance` route.
- `dashboard/src/data/commandCenterTabs.js` adds `AUTH_GOVERNANCE_TABS`.
- `dashboard/src/pages/CommandCenterV2.jsx` renders Auth Governance readiness,
  governance posture, blockers, evidence/activity, disabled reason, and
  disabled actions as display-only content.
- `dashboard/tests/routes.spec.js` adds focused Playwright coverage for the
  Auth Governance route.
- `scripts/check-p735-command-center-auth-governance-ux.js` validates display
  data, disabled mutation flags, raw-output safety, DemoApp boundary, and
  Playwright coverage registration.

### P73.6 Tests / Checkers / Docs

Aggregate P73 validation coverage before final validation.

Status: planned.

### P73.7 Final Validation

Validate and close P73 with login and auth mutation still disabled.

Status: planned.

## Command Center Requirements

Future P73 UX must preserve System, Dark, and Light themes and show:

- what changed
- identity mode
- role posture
- tenant/workspace boundary
- next action
- blockers
- disabled reason
- owner agent/capability
- evidence/activity location
- safety posture
- cost impact

Primary UX must not show raw JSON, raw logs, raw policy dumps, raw private
project IDs, raw user IDs, raw tokens, DemoApp outside demo mode, internal
phase labels outside OS Roadmap, or fake runnable auth actions.

## Current Status

P73 is in progress through P73.5. Login, identity provider integration,
user/session/role/tenant mutation, DB writes, project mutation, provider
dispatch, tool execution, worker execution, deploy execution, release
execution, export execution, package creation, external network calls, and
provider spend remain disabled.
