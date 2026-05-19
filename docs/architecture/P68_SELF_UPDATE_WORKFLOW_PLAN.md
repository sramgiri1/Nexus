# P68 Self-Update Workflow for NEXUS OS

P68 prepares a governed self-update workflow for NEXUS OS. It does not enable
self-update apply, project mutation, provider dispatch, tool execution, worker
execution, automatic source apply, DB writes, deploy, release, external network
calls, or provider spend.

Execution contract: `contracts/os-roadmap/p68-execution-contracts.json`.

## Scope

- NEXUS OS only.
- No `projects/**` edits.
- No self-update apply, project mutation, provider dispatch, tool execution,
  worker execution, automatic source apply, DB writes, deploy, release,
  external network calls, or provider spend.
- No raw JSON, raw logs, raw private IDs, internal phase labels, fake runnable
  apply actions, or DemoApp outside demo mode in primary UX.

## Required Reuse

P68 must reuse existing helpers before adding new ones:

- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/modeGuard.js`
- `os-roadmap/updatePhaseStatus.js`
- `docs/architecture/CONTROLLED_IMPLEMENTATION_WORKFLOW.md`
- existing Command Center cards, tabs, badges, and route tests

## Subphases

### P68.1 Execution Contract + Self-Update Boundary

Create this implementation-grade contract, checker, docs, reports, and phase
status handoff. No self-update behavior changes.

Status: complete.

### P68.2 Self-Update Intent Contract

Define display-safe NEXUS OS self-update intent records.

Status: complete. P68.2 adds display-safe `SelfUpdateIntentContract` records
for NEXUS OS self-update planning. The records include scope, allowed files,
forbidden files, preview state, approval state, rollback plan, blockers,
evidence/activity references, owner capability, and next action while
self-update apply, project mutation, execution, DB writes, deploy, release, and
spend remain disabled.

Implementation:

- `self-update/p68-2-placeholder.js` exports
  `createSelfUpdateIntentContract`, `validateSelfUpdateIntentContract`,
  `buildSelfUpdateIntentEnvelope`, `P68_2_REQUIRED_FIELDS`, and
  `P68_2_SAMPLE_INTENTS`.
- `scripts/check-p682.js` validates required fields, display-safe redaction,
  project path blocking, disabled self-update/mutation/execution/spend flags,
  evidence references, and non-runnable disabled reasons.

### P68.3 Self-Update Proposal Preview

Build preview-only self-update proposals with scoped files and validation
commands.

Status: complete. P68.3 adds preview-only `SelfUpdateProposalPreview`
records derived from P68.2 intent records. Each preview lists allowed files,
forbidden files, proposed updates, validation commands, rollback posture,
approval state, blockers, evidence/activity references, owner capability, and
next action while source apply, project mutation, execution, DB writes, deploy,
release, and spend remain disabled.

Implementation:

- `self-update/p68-3-placeholder.js` exports
  `createSelfUpdateProposalPreview`, `validateSelfUpdateProposalPreview`,
  `buildSelfUpdateProposalEnvelope`, `P68_3_REQUIRED_FIELDS`, and
  `P68_3_SAMPLE_PROPOSALS`.
- `scripts/check-p683.js` validates proposal shape, validation commands,
  rollback posture, project path blocking, disabled apply/execution/spend
  flags, evidence references, and non-runnable disabled reasons.

### P68.4 Approval + Rollback Gate

Add approval, rollback, and safety gates for self-update proposals.

Status: complete. P68.4 adds preview-only `SelfUpdateGate` records derived
from P68.3 proposal previews. Each gate records approval state, scope readiness,
rollback readiness, validation readiness, safety posture, disabled apply
reason, required evidence, evidence/activity references, and next action while
keeping all apply, mutation, execution, DB, deploy, release, network, and spend
flags disabled.

Implementation:

- `self-update/p68-4-placeholder.js` exports `createSelfUpdateGate`,
  `validateSelfUpdateGate`, `buildSelfUpdateGateEnvelope`,
  `P68_4_REQUIRED_FIELDS`, and `P68_4_SAMPLE_GATES`.
- `scripts/check-p684.js` validates gate shape, required approval,
  rollback/validation readiness, project path blocking, disabled
  apply/execution/spend flags, evidence references, and non-runnable disabled
  reasons.

### P68.5 Command Center Self-Update UX

Expose self-update readiness without runnable apply actions.

Status: complete. P68.5 adds the Command Center Self-Update route as a
display-only operator surface. The route shows what changed, current state,
next action, blockers, disabled reason, owner/capability, evidence/activity
location, and cost impact without exposing any runnable self-update apply,
patch generation, provider dispatch, tool dispatch, worker execution, project
mutation, DB write, deploy, release, network call, or provider-spend action.

Implementation:

- `dashboard/src/data/selfUpdateReadiness.js` exports the display-safe
  self-update readiness view model.
- `dashboard/src/data/commandCenterRoutes.js` registers
  `/command-center/self-update` under the OS section.
- `dashboard/src/pages/CommandCenterV2.jsx` renders the route through the
  existing Command Center V2 shell, tabs, cards, pills, and theme controls.
- `scripts/check-p685-command-center-self-update-ux.js` validates route wiring,
  primary UX safety, disabled actions, evidence/activity/cost visibility, and
  non-execution posture.

### P68.6 Tests / Checkers / Docs

Aggregate P68 validation coverage before final validation.

Status: planned.

### P68.7 Final Validation

Validate and close P68 with self-update apply still disabled.

Status: planned.

## Command Center Requirements

Future P68 UX must preserve System, Dark, and Light themes and show:

- self-update intent
- current state
- allowed files
- forbidden files
- preview state
- blockers
- approval state
- owner capability
- evidence/activity location
- rollback posture
- next action

Primary UX must not show raw JSON, raw logs, raw policy dumps, internal phase
labels outside OS Roadmap, DemoApp outside demo mode, raw private project IDs,
or fake runnable apply actions.

## Status

P68 is in progress. P68.1 is a contract-only foundation; real self-update apply
requires later explicit subphases and fresh validation.
