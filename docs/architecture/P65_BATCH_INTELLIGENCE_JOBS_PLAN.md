# P65 Batch Intelligence Jobs for Large-Scale Analysis

P65 prepares governed batch intelligence foundations without enabling provider
upload, batch submission, provider polling, provider reconciliation, tool
execution, worker execution, DB writes, deploy, network calls, or project
mutation.

Execution contract: `contracts/os-roadmap/p65-execution-contracts.json`.

## Scope

- NEXUS OS only.
- No `projects/**` edits.
- No provider upload, batch submission, provider polling, provider
  reconciliation, provider dispatch, tool execution, code execution, worker
  execution, DB writes, deploy, release, external network calls, or project
  mutation.
- No raw provider payloads, raw JSON, raw logs, raw private IDs, or fake
  runnable batch actions in primary UX.

## Required Reuse

P65 must reuse existing helpers before adding new ones:

- `api-batch/batchJobBuilder.js`
- `api-batch/costEstimator.js`
- `api-batch/resultReconciler.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center cards, tabs, badges, and route tests

## Subphases

### P65.1 Execution Contract + Safety Split

Create this implementation-grade contract, checker, docs, reports, and phase
status handoff. No runtime behavior changes.

Status: complete. P65.1 defines the implementation-grade batch intelligence
split and validation rules while provider upload, batch submission, provider
polling, provider reconciliation, tool execution, worker execution, DB writes,
deploy, network calls, and project mutation remain disabled.

### P65.2 Batch Intelligence Job Contract

Define preview-only batch intelligence job records and validation. Jobs must
show state, workload type, request count, disabled upload reason, evidence refs,
and execution-disabled posture.

Status: complete. P65.2 adds preview-only batch intelligence job records that
reuse API batch preview, cost estimate, and redaction helpers. Jobs expose
workload type, request count, disabled upload reason, cost estimate, evidence
refs, activity refs, and next action while provider upload, batch submission,
provider polling, provider reconciliation, execution, DB writes, deploy,
network calls, workers, and project mutation remain disabled.

### P65.3 Workload Selection Preview

Build redacted workload selection previews for large-scale analysis. Workload
previews must not read or mutate project source files.

### P65.4 Cost + Safety Gate

Add preview-only cost and safety gates for batch intelligence jobs. Gates must
block missing redaction evidence and restricted data.

### P65.5 Command Center Batch Intelligence UX

Expose batch intelligence readiness and disabled upload/execution state in
Command Center without enabling runnable actions.

### P65.6 Tests / Checkers / Docs

Aggregate P65 checker coverage and docs before final validation.

### P65.7 Final Validation

Aggregate checks, close P65, and hand off to P66.

## Command Center Requirements

Future P65 UX must preserve System, Dark, and Light themes and show:

- batch intelligence state
- workload type
- selected request count
- redaction state
- cost estimate
- blocked upload reason
- disabled execution reason
- owner capability
- evidence/activity location
- next action

Primary UX must not show raw JSON, raw logs, raw provider payloads, raw policy
dumps, internal phase labels outside OS Roadmap, DemoApp outside demo mode, or
raw private project IDs.

## Status

P65.1 is contract-only. P65 remains in progress until final validation.
