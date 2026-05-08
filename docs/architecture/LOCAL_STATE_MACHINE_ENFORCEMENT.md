# Local State Machine Enforcement

**Version:** 1.0  
**Date:** 2026-05-07

---

## Purpose

Make local controlled execution respect the existing task state machine before
any task-state write is committed under `local-state/runtime/`.

## Why local task writes must respect state machines

Without transition enforcement, a local executor can create truthful audit
records about untruthful task states.

NEXUS needs local writes to preserve the same separation of concerns as the
full OS:

- implementation agents cannot complete directly
- verification or control actors handle completion transitions
- approval transitions require approval evidence
- deferred batch completion requires batch reconciliation evidence
- blocked transitions must not silently mutate task state

Phase 23-LOCAL builds on this by wiring a local approval workflow that creates
real `approval_granted` or `approval_rejected` evidence records before
`awaiting_approval -> running` may proceed.

## Flow

```text
task state request
  → current state lookup
  → transition guard
  → state-machine canTransition
  → evidence check
  → local write boundary
  → audit, evidence, and runtime event update
```

## Allowed examples

- `queued -> running` for an execution actor
- `running -> implementation_done` for an implementation agent
- `implementation_done -> awaiting_verification`
- `awaiting_verification -> completed` for a verification actor with PASS
  evidence
- `awaiting_approval -> running` when `approval_granted` evidence exists
- `deferred_batch -> completed` when `batch_reconciled` evidence exists

## Blocked examples

- `running -> completed` by an implementation agent
- `awaiting_verification -> completed` without verification evidence
- `awaiting_approval -> running` without approval evidence
- `deferred_batch -> completed` without reconciliation evidence
- unknown or missing task states

## Current phase boundary

Phase 22-LOCAL enforces task transitions only.

It does not yet enforce:

- gate state transitions through the local write boundary
- release state transitions through the local write boundary
- batch state transitions through the local write boundary
- live `loop.js` or `runner.js` dispatch
- provider, tool, DB, or API execution
- private product execution

## Future path

Later phases can extend the same guard pattern to:

- gate, release, and batch enforcement later
- gate write commits
- release write commits
- batch lifecycle commits
- dispatch-time transition requests
- Command Center read surfaces for blocked transition summaries

## P28 — CareLoop first governed validation task

P28-LOCAL exercised the state machine enforcement layer for the first governed
CareLoop task. The validation planning task transitioned `queued → running →
implementation_done` via `validateLocalTaskTransition` and `updateTaskState`.
The WORKER_AGENTS block on `running → completed` was confirmed not to apply to
shepherd, allowing the full transition sequence.
