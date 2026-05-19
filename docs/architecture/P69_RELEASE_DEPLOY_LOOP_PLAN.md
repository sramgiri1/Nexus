# P69 Release / Deploy Loop

P69 prepares a governed release and deploy loop for NEXUS OS. It does not
enable release execution, deploy execution, provider dispatch, tool execution,
worker execution, DB writes, project mutation, external network calls, or
provider spend.

Contract: `contracts/os-roadmap/p69-execution-contracts.json`

## Boundary

- Scope: NEXUS OS release/deploy governance only.
- Project source files remain forbidden.
- Release and deploy records are preview-only until a later explicit phase
  enables governed execution.
- Rollback, approval, evidence, activity, disabled reason, and cost impact must
  be visible before any future execution path is considered.

## Reuse

P69 must reuse existing helpers before adding new ones:

- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing evidence, audit, activity, and cost preview patterns

## Subphases

### P69.1 Execution Contract + Release/Deploy Boundary

Define P69 execution contracts only; no release or deploy execution behavior.

Status: complete. P69.1 adds the implementation-grade P69 subphase contract,
release/deploy disabled boundary, validation checker, roadmap handoff, and
phase-status records.

### P69.2 Release Intent Contract

Define display-safe release intent records.

Status: complete. P69.2 adds display-safe `ReleaseIntentContract` records for
NEXUS OS release planning. Each record includes release target, environment
label, allowed/forbidden files, disabled release/deploy execution flags,
approval state, rollback requirement, disabled reason, blockers, evidence,
activity, cost impact, owner capability, and next action.

Implementation:

- `release-governance/p69-2-placeholder.js` exports
  `createReleaseIntentContract`, `validateReleaseIntentContract`,
  `buildReleaseIntentEnvelope`, `P69_2_REQUIRED_FIELDS`, and
  `P69_2_SAMPLE_INTENTS`.
- `scripts/check-p692.js` validates release intent shape, project path
  blocking, disabled release/deploy execution, disabled provider/tool/worker
  execution, disabled DB/network/spend, approval, rollback, evidence/activity,
  and non-runnable disabled reasons.

### P69.3 Release Candidate Preview

Create release candidate previews without packaging, deploying, or mutating
source.

Status: complete. P69.3 adds preview-only `ReleaseCandidatePreview` records
derived from P69.2 release intent records. Each candidate lists validation
commands, rollback posture, package state, disabled release/deploy flags,
blockers, evidence/activity references, cost impact, owner capability, and next
action while keeping package creation, release execution, and deploy execution
disabled.

Implementation:

- `release-governance/p69-3-placeholder.js` exports
  `createReleaseCandidatePreview`, `validateReleaseCandidatePreview`,
  `buildReleaseCandidateEnvelope`, `P69_3_REQUIRED_FIELDS`, and
  `P69_3_SAMPLE_CANDIDATES`.
- `scripts/check-p693.js` validates candidate shape, validation commands,
  project path blocking, disabled package/release/deploy execution, disabled
  provider/tool/worker execution, disabled DB/network/spend, rollback posture,
  evidence/activity, cost impact, and non-runnable disabled reasons.

### P69.4 Deploy Readiness Gate

Add deploy readiness gates while keeping deploy execution disabled.

Status: complete. P69.4 adds preview-only `DeployReadinessGate` records
derived from P69.3 release candidate previews. Each gate records approval
state, validation readiness, rollback readiness, evidence readiness, cost
review, blockers, disabled reason, owner capability, evidence/activity
references, and next action while keeping package creation, release execution,
deploy execution, project mutation, provider/tool/worker execution, DB writes,
network calls, and provider spend disabled.

Implementation:

- `release-governance/p69-4-placeholder.js` exports
  `createDeployReadinessGate`, `validateDeployReadinessGate`,
  `buildDeployReadinessGateEnvelope`, `P69_4_REQUIRED_FIELDS`, and
  `P69_4_SAMPLE_GATES`.
- `scripts/check-p694.js` validates gate shape, approval state, validation
  readiness, rollback readiness, evidence readiness, cost review, blockers,
  required evidence, disabled release/deploy execution, disabled
  provider/tool/worker execution, disabled DB/network/spend, and non-runnable
  disabled reasons.

### P69.5 Command Center Release UX

Expose release readiness without runnable release/deploy actions.

Status: complete. P69.5 exposes display-only release and deploy readiness at
`/command-center/release` using the existing Command Center route matrix, tab
shell, page summary, cards, pills, disabled buttons, and theme controls. The
primary UX shows what changed, current state, next action, blockers, disabled
reason, owner capability, evidence/activity locations, rollback posture, and
cost impact without showing raw JSON, raw logs, private IDs, DemoApp, or
internal phase labels.

Implementation:

- `dashboard/src/data/releaseReadiness.js` builds the display-safe release
  readiness view model from the P69.4 deploy readiness gate.
- `dashboard/src/data/commandCenterTabs.js` exports `RELEASE_CONTROL_TABS`.
- `dashboard/src/data/commandCenterRoutes.js` wires release route tabs.
- `dashboard/src/pages/CommandCenterV2.jsx` renders the release readiness
  page with disabled release/package/deploy controls only.
- `scripts/check-p695-command-center-release-ux.js` validates route wiring,
  UX data shape, safety-disabled actions, no private IDs, no DemoApp, no raw
  JSON markers, no primary UX phase labels, and source-level disabled
  execution posture.

### P69.6 Tests / Checkers / Docs

Aggregate P69 validation coverage before final validation.

Status: planned.

### P69.7 Final Validation

Validate and close P69 with release and deploy execution still disabled.

Status: planned.

## Command Center Requirements

Future P69 UX must preserve System, Dark, and Light themes and show:

- what changed
- current release state
- current deploy state
- next action
- blockers
- disabled reason
- owner agent/capability
- evidence/activity location
- rollback posture
- cost impact

Primary UX must not show raw JSON, raw logs, raw policy dumps, raw private
project IDs, DemoApp outside demo mode, internal phase labels outside OS
Roadmap, or fake runnable release/deploy actions.

## Current Status

P69 is in progress through P69.5. Release execution, deploy execution, provider
dispatch, tool execution, worker execution, DB writes, project mutation,
external network calls, and provider spend remain disabled.

Release execution and deploy execution remain disabled.
