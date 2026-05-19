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

Status: planned.

### P73.3 RBAC Permission Matrix

Define RBAC permission matrix records without role or permission mutation.

Status: planned.

### P73.4 Multi-user Workspace Boundary

Define multi-user workspace boundary records without tenant or workspace
mutation.

Status: planned.

### P73.5 Command Center Auth Governance UX

Expose auth governance readiness without runnable auth actions.

Status: planned.

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

P73 is in progress through P73.1. Login, identity provider integration,
user/session/role/tenant mutation, DB writes, project mutation, provider
dispatch, tool execution, worker execution, deploy execution, release
execution, export execution, package creation, external network calls, and
provider spend remain disabled.
