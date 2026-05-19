# P76 Tenant / Project Isolation

P76 formalizes tenant and project isolation readiness for NEXUS OS. It does
not enable tenant creation, tenant update, tenant delete, project creation,
project update, project delete, access grants, membership mutation, permission
mutation, role mutation, DB writes, project mutation, provider dispatch, tool
execution, worker execution, deploy execution, release execution, export
execution, package creation, auth/session/user/workspace mutation, external
network calls, or provider spend.

Contract: `contracts/os-roadmap/p76-execution-contracts.json`

## Boundary

- Scope: NEXUS OS tenant and project isolation readiness only.
- Project source files and project roadmap files remain forbidden.
- DB, Prisma, migration, provider, tool, worker, deploy, release, auth, user,
  and RBAC mutation files remain forbidden.
- Tenant, project, access, membership, permission, role, session, and
  workspace mutation remain disabled until a later explicit phase enables
  governed runtime operations.
- Tenant posture, project isolation posture, access context posture, disabled
  reason, blockers, evidence, activity, safety posture, owner capability, next
  action, and cost impact must be visible before any future isolation runtime
  path is considered.

## Reuse

P76 must reuse existing helpers before adding new ones:

- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `shared/modeGuard.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing evidence, audit, activity, and cost preview patterns

## Subphases

### P76.1 Execution Contract + Isolation Boundary

Define P76 execution contracts and isolation boundary only. No tenant/project
creation, update, delete, access grants, membership mutation, permission
mutation, role mutation, DB writes, project mutation, provider or tool
execution, network calls, deploy/release/export/package behavior, auth/session
user/workspace mutation, or provider spend.

Status: complete. P76.1 adds implementation-grade P76 subphase contracts,
the isolation boundary plan, validation checker, roadmap handoff, and
phase-status records.

### P76.2 Tenant Boundary Contract

Define tenant boundary contract records without tenant mutation.

Status: complete. P76.2 adds preview-only `TenantBoundaryContract` records
that capture tenant boundary, isolation mode, disabled tenant mutation,
disabled membership/permission/role mutation, disabled access grants, disabled
project mutation, disabled DB writes and runtime execution, evidence/activity
references, cost impact, disabled reason, owner capability, and next action.

### P76.3 Project Scope Isolation Preview

Define project scope isolation previews without project mutation.

Status: complete. P76.3 adds preview-only
`ProjectScopeIsolationPreview` records that capture project scope, source
tenant boundary, disabled project mutation, disabled cross-project access,
required approval state, disabled tenant/access/runtime mutation,
evidence/activity references, cost impact, disabled reason, owner capability,
and next action.

### P76.4 Access Context Packet Preview

Define access context packet previews without access grants or role mutation.

Status: complete. P76.4 adds preview-only `AccessContextPacketPreview`
records that capture access context mode, tenant boundary, project scope,
disabled access grants, disabled role/permission/membership mutation,
required approval state, evidence/activity references, cost impact, disabled
reason, owner capability, and next action.

### P76.5 Command Center Isolation UX

Expose tenant and project isolation readiness in Command Center without
runnable tenant, project, access, membership, permission, role, session, or
workspace mutation actions.

Status: complete. P76.5 adds a display-only Command Center Isolation route
that shows tenant posture, project isolation posture, access context posture,
current state, next action, blockers, disabled reason, owner capability,
evidence/activity location, safety posture, cost impact, and disabled action
reasons. Primary UX does not show raw JSON, raw logs, raw policy dumps, raw
private project IDs, raw tokens, internal phase labels outside OS Roadmap, or
DemoApp in full Command Center. System, Dark, and Light themes remain covered.

### P76.6 Tests / Checkers / Docs

Aggregate P76 validation coverage before final validation.

Status: complete. P76.6 verifies P76 checker scripts, package scripts,
reports, docs, phase status, Command Center route coverage, disabled runtime
tenant/project/access behavior, and no project-file changes.

### P76.7 Final Validation

Run final validation, close P76, and hand off to P77.

Status: planned. P76.7 will verify all P76 subphases are complete, Command
Center Isolation UX remains display-only, roadmap/status evidence is current,
and tenant/project/access/auth/workspace mutation, DB writes, project
mutation, provider/tool/worker execution, network calls, deploy/release/export
package behavior, and provider spend remain disabled.

## Validation

P76.1 validation:

- `npm run check:p76-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`

P76.2 validation:

- `npm run check:p762`
- `npm run check:p76-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`

P76.3 validation:

- `npm run check:p763`
- `npm run check:p76-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`

P76.4 validation:

- `npm run check:p764`
- `npm run check:p76-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`

P76.5 validation:

- `npm run check:p765-command-center-isolation-ux`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Isolation route"`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npm run build`
- `npm run check:p76-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`

P76.6 validation:

- `npm run check:p766-tests-checkers-docs`
- `npm run check:p76-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`
