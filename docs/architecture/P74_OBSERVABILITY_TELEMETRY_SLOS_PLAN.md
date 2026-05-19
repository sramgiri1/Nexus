# P74 Observability, Telemetry, SLOs

P74 formalizes observability, telemetry, and service-level objective readiness
for NEXUS OS. It does not enable external telemetry exporters, raw log
streaming, DB writes, project mutation, provider dispatch, tool execution,
worker execution, remediation execution, paging, deploy execution, release
execution, export execution, package creation, auth mutation, external network
calls, or provider spend.

Contract: `contracts/os-roadmap/p74-execution-contracts.json`

## Boundary

- Scope: NEXUS OS observability readiness only.
- Project source files and project roadmap files remain forbidden.
- DB, Prisma, migration, provider, tool, worker, deploy, release, auth, user,
  and RBAC mutation files remain forbidden.
- Telemetry, SLO, and health records are preview-only until a later explicit
  phase enables governed exporters, enforcement, paging, or remediation.
- Observability state, telemetry posture, SLO posture, disabled reason,
  blockers, evidence, activity, safety posture, owner capability, and cost
  impact must be visible before any future exporter or SLO enforcement path is
  considered.

## Reuse

P74 must reuse existing helpers before adding new ones:

- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/redaction.js`
- `observability/index.js`
- `observability/activityLogger.js`
- `observability/activityTrace.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing evidence, audit, activity, and cost preview patterns

## Subphases

### P74.1 Execution Contract + Observability Boundary

Define P74 execution contracts only; no telemetry export, raw log streaming,
SLO enforcement, paging, remediation, DB writes, project mutation, provider or
tool execution, network calls, deploy/release/export/package behavior, auth
mutation, or provider spend.

Status: complete. P74.1 adds the implementation-grade P74 subphase contract,
observability boundary, validation checker, roadmap handoff, and phase-status
records.

### P74.2 Telemetry Event Contract

Define redacted telemetry event contract records without external exporters or
raw log streaming.

Status: complete. P74.2 adds preview-only `TelemetryEventContract` records.
Each contract includes signal type, source surface, metric family, aggregation
window, redaction state, disabled telemetry export/raw log/raw dump flags,
blocked operations, blockers, disabled reason, evidence/activity references,
cost impact, owner capability, and next action.

Implementation:

- `observability/p74-2-placeholder.js` exports
  `createTelemetryEventContract`, `validateTelemetryEventContract`,
  `buildTelemetryEventContractEnvelope`, `P74_2_REQUIRED_FIELDS`, and
  `P74_2_SAMPLE_CONTRACTS`.
- `scripts/check-p742.js` validates telemetry contract shape, disabled
  exporters, disabled raw log/JSON/policy dumps, disabled DB and project
  mutation, disabled provider/tool/worker execution, disabled network/spend,
  disabled deploy/release/export/package behavior, disabled auth mutation,
  hidden private IDs/tokens/telemetry URLs, evidence/activity, cost impact, and
  non-runnable disabled reasons.

### P74.3 SLO Objective Catalog

Define SLO objective catalog records without enforcement, paging, or incident
automation.

Status: planned.

### P74.4 Health / Incident Snapshot Preview

Define observability health and incident snapshot previews without remediation
execution.

Status: planned.

### P74.5 Command Center Observability UX

Expose observability readiness in Command Center without runnable telemetry,
export, SLO, paging, or remediation actions.

Status: planned.

### P74.6 Tests / Checkers / Docs

Aggregate P74 validation coverage before final validation.

Status: planned.

### P74.7 Final Validation

Validate and close P74 with telemetry export, SLO enforcement, paging,
remediation, and runtime mutation still disabled.

Status: planned.

## Command Center Requirements

Future P74 UX must preserve System, Dark, and Light themes and show:

- what changed
- current observability state
- telemetry posture
- SLO posture
- health or incident posture
- next action
- blockers
- disabled reason
- owner agent or capability
- evidence/activity location
- safety posture
- cost impact

Primary UX must not show raw JSON, raw logs, raw policy dumps, raw private
project IDs, raw tokens, DemoApp outside demo mode, internal phase labels
outside OS Roadmap, or fake runnable observability actions.

## Current Status

P74 is in progress through P74.2. External telemetry exporters, raw log
streaming, DB writes, project mutation, provider dispatch, tool execution,
worker execution, remediation execution, paging, deploy execution, release
execution, export execution, package creation, auth mutation, external network
calls, and provider spend remain disabled.
