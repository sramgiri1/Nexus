# P63 AI Interaction Snapshot + Granular Recovery Layer

**Status:** Planned NEXUS OS phase.
**Track:** NEXUS_OS
**Parent phase:** `P63`
**Next phase after closure:** `P64` Provider + Tool Dispatch Through Governance

## Goal

P63 adds a governed recovery layer for AI-assisted work. It should make each
important AI interaction inspectable, redacted, correlated, and recoverable
without enabling provider dispatch, tool execution, worker execution, DB writes,
project mutation, or release/deploy actions.

## Non-goals

- No live provider calls.
- No tool dispatch.
- No worker execution or task reruns.
- No durable DB-backed runtime writes.
- No automatic rollback, restore, or mutation.
- No private project source changes unless a later governed project phase allows
  them.

## Subphases

### P63.1 Snapshot Contract + Redaction Policy

Define the snapshot envelope used to describe AI interactions. The contract
should include correlation IDs, scope, actor, command intent, prompt summary,
response summary, tool-preview references, approval posture, evidence links,
redaction level, and recovery eligibility.

Deliverables:

- snapshot schema
- redaction and public-safety policy
- fixture records for safe validation
- checker for schema and policy conformance

### P63.2 Interaction Capture Points

Map where NEXUS should emit snapshot-ready records across existing preview
surfaces.

Deliverables:

- capture map for command interface, mission composer, worker queue, tool
  governance previews, approvals, and activity records
- adapter plan for converting existing local preview records into snapshot
  records
- explicit exclusions for private payloads and secrets

### P63.3 Recovery Point Model

Define how snapshots become recovery points and what kind of continuation they
support.

Deliverables:

- recovery point schema
- parent-child and supersession model
- failure-state classification
- resumability flags such as `inspect_only`, `resume_plan_available`, and
  `not_recoverable`

### P63.4 Snapshot Store + Retention Preview

Create the local, preview-only storage contract for snapshots and recovery
points.

Deliverables:

- file-backed preview store contract
- retention, pruning, and export rules
- redacted sample dataset
- no DB primary runtime dependency

### P63.5 Command Center Recovery UX

Expose snapshots and recovery points in Command Center as an inspection surface.

Deliverables:

- Recovery page or tab
- snapshot list, detail, and trace correlation views
- recovery posture badges
- disabled action previews for restore, replay, and resume

### P63.6 Recovery Replay / Resume Preview

Build deterministic previews that explain what NEXUS would need to resume from a
recovery point.

Deliverables:

- replay-plan builder
- resume-plan builder
- missing-context and blocked-action explanations
- no execution side effects

### P63.7 Recovery Tests + Docs + Final Validation

Close P63 with validation, docs, and roadmap status updates.

Deliverables:

- contract and fixture checks
- Command Center UX checks
- docs update
- OS phase status update
- final validation report

## Completion Standard

P63 is complete when NEXUS can show redacted AI interaction snapshots, explain
available recovery points, and preview replay/resume plans without executing any
runtime action.
