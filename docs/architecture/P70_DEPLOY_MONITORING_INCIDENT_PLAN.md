# P70 Deploy Monitoring + Incident Mitigation

P70 prepares governed deploy monitoring and incident mitigation readiness for
NEXUS OS. It does not enable deploy execution, incident execution, mitigation
execution, rollback execution, alert dispatch, provider dispatch, tool
execution, worker execution, DB writes, project mutation, external network
calls, or provider spend.

Contract: `contracts/os-roadmap/p70-execution-contracts.json`

## Boundary

- Scope: NEXUS OS deploy monitoring and incident mitigation governance only.
- Project source files and project roadmap files remain forbidden.
- Deploy monitor, incident, rollback, alert, and mitigation records are
  preview-only until a later explicit phase enables governed execution.
- Monitor state, incident state, approval, rollback, evidence, activity,
  disabled reason, safety posture, and cost impact must be visible before any
  future execution path is considered.

## Reuse

P70 must reuse existing helpers before adding new ones:

- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing evidence, audit, activity, and cost preview patterns

## Subphases

### P70.1 Execution Contract + Monitoring Boundary

Define P70 execution contracts only; no deploy monitoring, alert, incident,
rollback, or mitigation execution behavior.

Status: complete. P70.1 adds the implementation-grade P70 subphase contract,
disabled monitoring/mitigation execution boundary, validation checker, roadmap
handoff, and phase-status records.

### P70.2 Deploy Monitor Event Contract

Define display-safe deploy monitor event records.

Status: complete. P70.2 adds preview-only `DeployMonitorEvent` records for
NEXUS OS monitoring readiness. Each event includes monitor identity, deploy
identity, target kind, environment label, observed state, severity,
allowed/forbidden files, disabled execution flags, disabled reason, blockers,
evidence/activity references, cost impact, owner capability, and next action.

Implementation:

- `deploy-monitoring/p70-2-placeholder.js` exports
  `createDeployMonitorEvent`, `validateDeployMonitorEvent`,
  `buildDeployMonitorEventEnvelope`, `P70_2_REQUIRED_FIELDS`, and
  `P70_2_SAMPLE_EVENTS`.
- `scripts/check-p702.js` validates event shape, project path blocking,
  disabled deploy/monitor execution, disabled incident/mitigation/rollback
  execution, disabled alert dispatch, disabled provider/tool/worker execution,
  disabled DB/network/spend, evidence/activity, cost impact, and non-runnable
  disabled reasons.

### P70.3 Incident Signal Preview

Create incident signal previews without incident execution, alert dispatch, or
mitigation.

Status: complete. P70.3 adds preview-only `IncidentSignalPreview` records
derived from P70.2 deploy monitor events. Each signal includes incident state,
severity, summary, environment label, allowed/forbidden files, disabled
execution flags, disabled reason, blockers, evidence/activity references, cost
impact, owner capability, and next action.

Implementation:

- `deploy-monitoring/p70-3-placeholder.js` exports
  `createIncidentSignalPreview`, `validateIncidentSignalPreview`,
  `buildIncidentSignalEnvelope`, `P70_3_REQUIRED_FIELDS`, and
  `P70_3_SAMPLE_SIGNALS`.
- `scripts/check-p703.js` validates incident signal shape, project path
  blocking, disabled alert dispatch, disabled incident/mitigation/rollback/
  deploy execution, disabled provider/tool/worker execution, disabled
  DB/network/spend, evidence/activity, cost impact, and non-runnable disabled
  reasons.

### P70.4 Mitigation Readiness Gate

Add mitigation readiness gates while keeping mitigation, rollback, alert, and
deploy execution disabled.

Status: complete. P70.4 adds preview-only `MitigationReadinessGate` records
derived from P70.3 incident signal previews. Each gate records approval state,
validation readiness, rollback readiness, evidence readiness, cost review,
required evidence, blockers, disabled reason, owner capability, evidence/
activity references, and next action while keeping mitigation, rollback, alert,
incident, and deploy execution disabled.

Implementation:

- `deploy-monitoring/p70-4-placeholder.js` exports
  `createMitigationReadinessGate`, `validateMitigationReadinessGate`,
  `buildMitigationReadinessGateEnvelope`, `P70_4_REQUIRED_FIELDS`, and
  `P70_4_SAMPLE_GATES`.
- `scripts/check-p704.js` validates gate shape, approval state, validation
  readiness, rollback readiness, evidence readiness, cost review, blockers,
  required evidence, disabled mitigation/rollback/alert/incident/deploy
  execution, disabled provider/tool/worker execution, disabled DB/network/
  spend, and non-runnable disabled reasons.

### P70.5 Command Center Monitoring UX

Expose deploy monitoring and incident mitigation readiness without runnable
monitoring, alert, rollback, deploy, or mitigation actions.

Status: complete. P70.5 exposes display-only deploy monitoring and incident
mitigation readiness at `/command-center/monitoring` using the existing Command
Center route matrix, tab shell, page summary, cards, pills, disabled buttons,
and theme controls. The primary UX shows what changed, monitor state, incident
state, next action, blockers, disabled reason, owner capability, evidence/
activity locations, safety posture, and cost impact without showing raw JSON,
raw logs, private IDs, DemoApp, or internal phase labels.

Implementation:

- `dashboard/src/data/deployMonitoringReadiness.js` builds the display-safe
  deploy monitoring readiness view model from the P70.4 mitigation readiness
  gate.
- `dashboard/src/data/commandCenterTabs.js` exports
  `DEPLOY_MONITORING_TABS`.
- `dashboard/src/data/commandCenterRoutes.js` wires the monitoring route.
- `dashboard/src/pages/CommandCenterV2.jsx` renders the monitoring readiness
  page with disabled alert/rollback/mitigation controls only.
- `scripts/check-p705-command-center-monitoring-ux.js` validates route wiring,
  UX data shape, disabled actions, no private IDs, no DemoApp, no raw JSON
  markers, no primary UX phase labels, and source-level disabled execution
  posture.

### P70.6 Tests / Checkers / Docs

Aggregate P70 validation coverage before final validation.

Status: complete.

### P70.7 Final Validation

Validate and close P70 with deploy monitoring and incident mitigation execution
still disabled.

Status: planned.

## Command Center Requirements

Future P70 UX must preserve System, Dark, and Light themes and show:

- what changed
- monitor state
- incident state
- next action
- blockers
- disabled reason
- owner agent/capability
- evidence/activity location
- safety posture
- cost impact

Primary UX must not show raw JSON, raw logs, raw policy dumps, raw private
project IDs, DemoApp outside demo mode, internal phase labels outside OS
Roadmap, or fake runnable monitoring, alert, rollback, deploy, or mitigation
actions.

## Current Status

P70 is in progress through P70.6. Deploy execution, incident execution,
mitigation execution, rollback execution, alert dispatch, provider dispatch,
tool execution, worker execution, DB writes, project mutation, external network
calls, and provider spend remain disabled.
