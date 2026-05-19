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

Status: complete. P74.3 adds preview-only `SloObjectiveCatalog` records
derived from P74.2 telemetry event contracts. Each catalog includes SLO name,
target, measurement window, error-budget state, objective rows, disabled
enforcement/paging/remediation flags, blocked operations, blockers, disabled
reason, evidence/activity references, cost impact, owner capability, and next
action.

Implementation:

- `observability/p74-3-placeholder.js` exports
  `createSloObjectiveCatalog`, `validateSloObjectiveCatalog`,
  `buildSloObjectiveCatalogEnvelope`, `P74_3_REQUIRED_FIELDS`, and
  `P74_3_SAMPLE_CATALOGS`.
- `scripts/check-p743.js` validates SLO catalog shape, source telemetry
  contract reuse, disabled enforcement/paging/remediation, disabled
  telemetry/raw log exposure, disabled DB and project mutation, disabled
  provider/tool/worker execution, disabled network/spend, disabled
  deploy/release/export/package behavior, disabled auth mutation, hidden
  private IDs/tokens/telemetry URLs, evidence/activity, cost impact, and
  non-runnable disabled reasons.

### P74.4 Health / Incident Snapshot Preview

Define observability health and incident snapshot previews without remediation
execution.

Status: complete. P74.4 adds preview-only
`ObservabilityHealthSnapshot` records derived from P74.2 telemetry contracts
and P74.3 SLO catalogs. Each snapshot includes health state, incident state,
affected surface, SLO state, error-budget state, snapshot rows, disabled
remediation/paging/enforcement flags, blocked operations, blockers, disabled
reason, evidence/activity references, cost impact, owner capability, and next
action.

Implementation:

- `observability/p74-4-placeholder.js` exports
  `createObservabilityHealthSnapshot`,
  `validateObservabilityHealthSnapshot`,
  `buildObservabilityHealthSnapshotEnvelope`, `P74_4_REQUIRED_FIELDS`, and
  `P74_4_SAMPLE_SNAPSHOTS`.
- `scripts/check-p744.js` validates health snapshot shape, source telemetry and
  SLO reuse, disabled remediation/paging/SLO enforcement, disabled
  telemetry/raw log exposure, disabled DB and project mutation, disabled
  provider/tool/worker execution, disabled network/spend, disabled
  deploy/release/export/package behavior, disabled auth mutation, hidden
  private IDs/tokens/telemetry URLs, evidence/activity, cost impact, and
  non-runnable disabled reasons.

### P74.5 Command Center Observability UX

Expose observability readiness in Command Center without runnable telemetry,
export, SLO, paging, or remediation actions.

Status: complete. P74.5 adds a display-only Observability Command Center
route. The route shows telemetry posture, SLO posture, health state, current
state, next action, blockers, disabled reason, owner capability,
evidence/activity location, safety posture, and cost impact without raw JSON,
raw logs, raw policy dumps, raw private IDs, raw tokens, internal phase labels,
DemoApp leakage, or runnable observability actions.

Implementation:

- `dashboard/src/data/observabilityReadiness.js` exports
  `buildObservabilityReadinessViewModel` and
  `observabilityReadinessViewModel`.
- `dashboard/src/data/commandCenterRoutes.js` adds the
  `/command-center/observability` route.
- `dashboard/src/data/commandCenterTabs.js` adds `OBSERVABILITY_TABS`.
- `dashboard/src/pages/CommandCenterV2.jsx` renders Observability readiness,
  posture, health snapshot, blockers, disabled reason, and disabled actions as
  display-only content.
- `dashboard/tests/routes.spec.js` adds focused Playwright coverage for the
  Observability route across dark, light, and system themes.
- `scripts/check-p745-command-center-observability-ux.js` validates display
  data, disabled automation flags, raw-output safety, DemoApp boundary, and
  Playwright coverage registration.

### P74.6 Tests / Checkers / Docs

Aggregate P74 validation coverage before final validation.

Status: complete. P74.6 adds an aggregation checker for P74 scripts, reports,
docs, roadmap entries, phase status entries, Command Center Observability route
coverage, route tests, disabled runtime posture, raw-output safety, and stale
phase-status commit checks before final validation.

Implementation:

- `scripts/check-p746-tests-checkers-docs.js` validates P74.1-P74.6 coverage,
  required checkers, reports, docs, roadmap/status records, Command Center
  Observability UX registration, route tests, theme coverage, no unsafe
  identifiers, disabled telemetry/raw log exposure, disabled SLO/paging/
  remediation, disabled DB and project mutation, disabled provider/tool/worker
  execution, disabled network/spend, disabled deploy/release/export/package
  behavior, disabled auth mutation, and stamped status commits for completed
  P74 subphases.
- `reports/p746-tests-checkers-docs-report.md` records aggregation evidence.

### P74.7 Final Validation

Validate and close P74 with telemetry export, SLO enforcement, paging,
remediation, and runtime mutation still disabled.

Status: complete. P74.7 adds final validation for P74 contracts, preview-only
telemetry/SLO/health records, Command Center Observability UX, tests,
checkers, reports, docs, roadmap, phase status, and P75 handoff while
telemetry export, SLO enforcement, paging, remediation, and runtime mutation
remain disabled.

Implementation:

- `scripts/check-p747-final-validation.js` validates completed P74 subphases,
  required reports, stamped prior commits, Command Center Observability route
  preservation, theme test coverage, hidden raw IDs/tokens/phase labels,
  disabled telemetry/raw log exposure, disabled SLO/paging/remediation,
  disabled DB/project mutation, disabled provider/tool/worker execution,
  disabled network/spend, disabled deploy/release/export/package behavior,
  disabled auth mutation, forbidden observability/project paths, and P75
  handoff.
- `reports/p747-final-validation-report.md` records final P74 validation
  evidence.

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

P74 is complete. External telemetry exporters, raw log
streaming, DB writes, project mutation, provider dispatch, tool execution,
worker execution, remediation execution, paging, deploy execution, release
execution, export execution, package creation, auth mutation, external network
calls, and provider spend remain disabled.
