# State Machine Standard

The state machine is the authoritative source of truth for task, gate, release, and batch state. Agents propose transitions. The state machine validates and commits them. A transition that has not been validated by the state machine has not happened — regardless of what any agent said or wrote.

---

## 0. Core Rule

> **Agents propose. State machines commit.**

An agent writing `"status": "completed"` to a task result is a proposal. The state machine checks: was the correct gate sequence run? Is there verifiable evidence? Is the actor authorized? Without passing those checks, the transition does not commit.

**Schema valid ≠ transition allowed.**

A state-transition contract can pass schema validation and still be blocked by the state machine. Schema checks shape; the state machine checks meaning. See [contract-usage-standard.md](./contract-usage-standard.md).

---

## 1. What Each Agent Tier May Propose

### Worker Agents

Workers (CORE, SWIFT, PIXEL, CANVAS, PRISM, STREAM, RADAR, BEACON, COMPASS, ORACLE, SYNAPSE) may propose:

```
running -> implementation_done
```

Workers may NOT propose:

```
running -> completed              ← blocked: worker self-certification
implementation_done -> completed  ← blocked: skips verification
```

After `implementation_done`, the worker produces a handoff contract to AUDITOR and stops. The verification plane takes over.

### Verification Agents

Verifiers (AUDITOR, SENTINEL, WARDEN) may propose:

```
awaiting_verification -> completed          (with PASS evidence)
awaiting_verification -> verification_failed
```

Verifiers may NOT:
- Modify production source code
- Propose transitions for tasks they did not verify
- Declare a gate passed without running all required skills

### Batch and Report Agents

Agents producing async outputs (BEACON, COMPASS, RADAR, MERIDIAN, ORACLE, RELAY) may propose:

```
running -> deferred_batch    (if task is batch-eligible)
```

After reconciliation, the batch task may propose:

```
deferred_batch -> completed   (requires batch_reconciled evidence)
deferred_batch -> failed      (requires batch_failed evidence)
```

Batch output cannot satisfy verification gate evidence. A reconciled batch report is a report artifact, not a gate pass.

### NEXUS

NEXUS may propose release state transitions:

```
ready_for_review -> go         (requires valid GO release contract)
ready_for_review -> no_go      (requires valid release contract + non-empty evidence)
ready_for_review -> blocked
blocked -> ready_for_review
```

NEXUS may NOT transition directly from `not_ready` to `go`. The review step is mandatory.

---

## 2. Task State Lifecycle

```
draft -> validated -> queued -> running

running -> implementation_done -> awaiting_verification

awaiting_verification -> completed        [verification actor + PASS evidence]
awaiting_verification -> verification_failed

verification_failed -> running            [retry]

running -> awaiting_approval
awaiting_approval -> running              [approval_granted evidence]

running -> deferred_batch
deferred_batch -> completed              [batch_reconciled evidence]
deferred_batch -> failed                 [batch_failed evidence]

running -> failed

any non-final -> cancelled
```

**Final states:** `completed`, `failed`, `cancelled`

---

## 3. Gate State Lifecycle

```
pending -> running
running -> passed         [skill_result / report / verification_contract with PASS]
running -> failed
failed -> running         [retry]
pending -> waived_requires_approval   [approval_granted evidence]
failed -> waived_requires_approval    [approval_granted evidence]
```

**Final states:** `not_required`, `passed`, `waived_requires_approval`

Gate actor enforcement:

| Gate | Authorized to pass/fail |
| --- | --- |
| AUDITOR | auditor, loop, state-machine |
| SENTINEL | sentinel, loop, state-machine |
| WARDEN | warden, loop, state-machine |

Workers and strategy agents cannot pass or fail gates.

---

## 4. Release State Lifecycle

```
not_ready -> ready_for_review
ready_for_review -> go            [nexus/loop/state-machine; valid GO release contract]
ready_for_review -> no_go         [nexus/loop/state-machine; valid release contract + evidence]
ready_for_review -> blocked
blocked -> ready_for_review
no_go -> ready_for_review
go -> blocked                     [only if context.allowRollback + rollback_required evidence]
```

**Final state:** `go` (unless authorized rollback)

Workers, ATLAS, verifiers — none of these may change release state. Only NEXUS, loop, and state-machine are authorized release actors.

---

## 5. Batch State Lifecycle

```
batch_pending -> dry_run_submitted
batch_pending -> provider_submitted
provider_submitted -> provider_processing
provider_submitted -> provider_completed
provider_submitted -> provider_failed
provider_processing -> provider_completed
provider_processing -> provider_failed
provider_completed -> reconciled        [provider_output or batch_result evidence]
provider_failed -> failed               [provider_error evidence]
dry_run_submitted -> batch_pending      [reset]
```

**Final states:** `reconciled`, `failed`

---

## 6. Forbidden Transitions Table

| Transition | Why blocked |
| --- | --- |
| Worker `running -> completed` | Workers cannot self-certify |
| `implementation_done -> completed` | Skips `awaiting_verification` — no edge exists |
| `deferred_batch -> completed` without `batch_reconciled` | Batch output must be reconciled first |
| `awaiting_approval -> running` without `approval_granted` | Founder approval is required |
| `ready_for_review -> go` without valid release contract | Release requires evidence from all three gates |
| Gate `running -> passed` without PASS evidence | Gates require deterministic evidence |
| Gate passed by unauthorized actor | Wrong gate actor |
| Any final state transitioning again | Final states do not move |
| `go -> blocked` without `allowRollback` context | GO is final unless rollback is authorized |

---

## 7. How to Interact With the State Machine

State machine functions are in `state-machine/`. Import and call before proposing any transition:

```javascript
import { canTransition } from '../state-machine/transitionValidator.js';

const result = canTransition({
  entityType: 'task',
  from: 'running',
  to: 'implementation_done',
  actor: 'core',
  agentId: 'core',
  evidence: [],
});

if (!result.allowed) {
  // return BLOCKED output — do not proceed
}
```

The return value is always:

```json
{
  "allowed": true,
  "reason": "Transition 'running -> implementation_done' is allowed.",
  "requiredEvidence": [],
  "issues": []
}
```

Never bypass the state machine check. Never fabricate evidence to satisfy a required evidence check.
