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

Status: planned.

### P68.4 Approval + Rollback Gate

Add approval, rollback, and safety gates for self-update proposals.

Status: planned.

### P68.5 Command Center Self-Update UX

Expose self-update readiness without runnable apply actions.

Status: planned.

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
