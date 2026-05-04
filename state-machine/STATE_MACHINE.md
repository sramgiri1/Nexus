# NEXUS Agentic OS — State Machine Layer

**Version:** 1.0
**Date:** 2026-05-03

---

## Purpose

> **State machines own truth.**

Agents propose transitions. State machines validate and commit them. A task that an agent claims is "completed" is not completed until the state machine accepts that transition with the required evidence. This is the structural reason why workers cannot mark final completion directly — judgment and authority are deliberately separated.

---

## Schema Validation vs State Machine Validation

These are two distinct checks. Both must pass for a transition to proceed.

**Schema validation** (contracts layer) answers: is the transition record well-formed?

```json
{
  "entityType": "task",
  "entityId": "task-001",
  "from": "running",
  "to": "completed",
  "requestedBy": "core",
  "evidence": [],
  "reason": "implementation finished",
  "createdAt": "2026-05-03T11:00:00Z"
}
```

This state-transition contract is **schema-valid** — all required fields are present and typed correctly.

It is **state-machine-blocked** — because `core` is a worker, and workers cannot transition a task directly to `completed`. The state machine enforces the rule that completion requires verification-plane sign-off.

**Schema valid ≠ transition allowed.**

---

## Task Lifecycle

```
draft
  -> validated        (contract validated against schema)
  -> queued           (placed in task queue)
  -> running          (picked up by loop dispatcher)
  -> implementation_done    (worker signals work artifact is ready)
  -> awaiting_verification  (handoff contract sent to AUDITOR)
  -> completed        (verification actor confirms gate PASS)
```

**Full task state graph:**

```
draft -> validated -> queued -> running
  running -> implementation_done -> awaiting_verification
  awaiting_verification -> completed        [verification actor + PASS evidence required]
  awaiting_verification -> verification_failed
  verification_failed   -> running          [retry]
  running               -> awaiting_approval
  awaiting_approval     -> running          [approval_granted evidence required]
  running               -> deferred_batch
  deferred_batch        -> completed        [batch_reconciled evidence required]
  deferred_batch        -> failed           [batch_failed evidence required]
  running               -> failed
  any non-final         -> cancelled
```

**Final states:** `completed`, `failed`, `cancelled`

**Forbidden transitions:**

| Transition | Why blocked |
| --- | --- |
| Worker `running -> completed` | Workers cannot self-certify. Requires verification actor. |
| `implementation_done -> completed` | Skips `awaiting_verification` — not allowed even for control actors. |
| `deferred_batch -> completed` without `batch_reconciled` evidence | Batch output must be reconciled before completion. |
| `awaiting_approval -> running` without `approval_granted` | Founder approval is required. |
| Any final state -> any state | Final states do not transition. |

---

## Batch Lifecycle

```
batch_pending
  -> dry_run_submitted    (local dry-run only, no real API)
  -> provider_submitted   (real batch job submitted to provider)
    -> provider_processing
    -> provider_completed
    -> provider_failed
  provider_completed -> reconciled   [provider_output evidence required]
  provider_failed    -> failed       [provider_error evidence required]
  dry_run_submitted  -> batch_pending (reset)
```

**Final states:** `reconciled`, `failed`

**Key rule:** Batch output cannot satisfy gate evidence requirements. A reconciled batch result is a report artifact, not a verification gate. Gates run synchronously in real time.

---

## Gate Lifecycle

```
not_required   (final — gate was skipped for this project/sprint)
pending
  -> running
  -> waived_requires_approval   [approval_granted evidence required]
running
  -> passed     [deterministic skill_result, report, or verification_contract with PASS required]
  -> failed
failed
  -> running    (retry)
  -> waived_requires_approval   [approval_granted evidence required]
```

**Final states:** `not_required`, `passed`, `waived_requires_approval`

**Gate actor enforcement:**

| Gate | Authorized actors |
| --- | --- |
| AUDITOR | auditor, loop, state-machine |
| SENTINEL | sentinel, loop, state-machine |
| WARDEN | warden, loop, state-machine |

Workers and strategy agents cannot pass or fail gates. The governor enforces this at the tool level; the gate state machine enforces it at the transition level.

---

## Release Lifecycle

```
not_ready
  -> ready_for_review
  -> go       [nexus/loop/state-machine only; valid GO release contract required]
  -> no_go    [nexus/loop/state-machine only; valid release contract + non-empty evidence]
  -> blocked
blocked
  -> ready_for_review
no_go
  -> ready_for_review
go            (final unless context.allowRollback === true)
  -> blocked  [rollback_required evidence required]
```

**Final states:** `go` (unless rollback is authorized)

**GO rules:** The release contract must pass full semantic validation — auditor PASS, sentinel PASS, warden PASS or NOT_REQUIRED, all counters zero, evidence non-empty. Schema valid is not enough.

**Workers cannot change release state.** Only `nexus`, `loop`, and `state-machine` are authorized release actors.

---

## Module Map

```text
state-machine/
├── index.js                  ← re-exports all state machines
├── taskStateMachine.js       ← TASK_STATES, FINAL_TASK_STATES, canTransitionTask()
├── gateStateMachine.js       ← GATE_STATES, FINAL_GATE_STATES, canTransitionGate()
├── releaseStateMachine.js    ← RELEASE_STATES, FINAL_RELEASE_STATES, canTransitionRelease()
├── batchStateMachine.js      ← BATCH_STATES, FINAL_BATCH_STATES, canTransitionBatch()
└── transitionValidator.js    ← canTransition(), normalizeActor(), hasEvidence()
```

Run smoke tests:

```bash
npm run check:state-machine
```

---

## Integration Status

Phase 3 adds the state machine modules and validators. They are not yet wired into `loop.js` or `tools/index.js`. Phase 4 will integrate `canTransition()` into the task dispatch and state-write code paths so that invalid transitions are blocked at the tool level, not just in tests.
