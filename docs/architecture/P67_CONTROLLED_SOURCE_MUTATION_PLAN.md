# P67 Controlled Source Mutation Expansion

P67 prepares controlled source mutation expansion without enabling project
mutation, provider dispatch, tool execution, worker execution, automatic source
apply, DB writes, deploy, release, external network calls, or provider spend.

Execution contract: `contracts/os-roadmap/p67-execution-contracts.json`.

## Scope

- NEXUS OS only.
- No `projects/**` edits.
- No project mutation, provider dispatch, tool execution, worker execution,
  automatic source apply, DB writes, deploy, release, external network calls,
  or provider spend.
- No raw JSON, raw logs, raw private IDs, fake runnable apply actions, or
  DemoApp outside demo mode in primary UX.

## Required Reuse

P67 must reuse existing helpers before adding new ones:

- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/modeGuard.js`
- `os-roadmap/updatePhaseStatus.js`
- `docs/architecture/CONTROLLED_IMPLEMENTATION_WORKFLOW.md`
- `docs/architecture/PROJECT_REGISTRY_ADAPTER_FRAMEWORK.md`
- existing Command Center cards, tabs, badges, and route tests

## Subphases

### P67.1 Execution Contract + Mutation Boundary

Create this implementation-grade contract, checker, docs, reports, and phase
status handoff. No mutation behavior changes.

Status: complete. P67.1 defines the implementation-grade controlled mutation
split and validation rules while project mutation, provider/tool execution,
worker execution, automatic source apply, DB writes, deploy, release, network
calls, and provider spend remain disabled.

### P67.2 Mutation Intent Contract

Define display-safe source mutation intent records with allowed and forbidden
scope.

Status: planned.

### P67.3 Patch Plan Preview

Build preview-only patch plans with allowed files, forbidden files, validation
commands, and rollback posture.

Status: planned.

### P67.4 Approval + Scope Gate

Add approval, scope, safety, and rollback gates for patch plans.

Status: planned.

### P67.5 Command Center Controlled Mutation UX

Expose controlled mutation readiness without runnable apply actions.

Status: planned.

### P67.6 Tests / Checkers / Docs

Aggregate P67 validation coverage before final validation.

Status: planned.

### P67.7 Final Validation

Aggregate checks, close P67, and hand off to P68.

Status: planned.

## Command Center Requirements

Future P67 UX must preserve System, Dark, and Light themes and show:

- mutation intent
- current state
- allowed files
- forbidden files
- diff preview state
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

P67 is in progress. P67.1 is a contract-only foundation; real mutation behavior
requires later explicit subphases and fresh validation.
