# Handoff Standard

A handoff is how one agent delegates a unit of work to another. It is a structured work package — not a message. An agent receiving an incomplete handoff must reject it and request a corrected version from NEXUS or SHEPHERD.

---

## 1. Handoff Schema

Every handoff task enqueued via `enqueue_task` must include a `context` object with the following fields:

```json
{
  "sourceAgent":        "core",
  "targetAgent":        "auditor",
  "projectId":          "careloop",
  "taskType":           "verification_gate",
  "objective":          "Verify Sprint 2 backend changes before QA handoff.",
  "allowedFiles": [
    "projects/careloop/src/",
    "projects/careloop/tests/"
  ],
  "forbiddenFiles": [
    "projects/careloop/.env",
    "memory/safety-events.json",
    "memory/system-usage.json"
  ],
  "requiredSkills": [
    "auditor.code.diff_review",
    "auditor.code.lint",
    "auditor.code.static_analysis",
    "auditor.code.test_coverage"
  ],
  "acceptanceCriteria": [
    "code.diff_review PASS",
    "code.lint PASS — 0 errors",
    "code.static_analysis PASS — no eval, no localhost refs",
    "code.test_coverage INFO — at least 10 test functions"
  ],
  "riskLevel":          "medium",
  "blocking":           true,
  "dueCondition":       "Before SENTINEL can run Phase 2.2",
  "parentTaskId":       "task-1234567890"
}
```

---

## 2. Field Definitions

| Field | Required | Description |
|---|---|---|
| `sourceAgent` | Yes | Agent creating the handoff |
| `targetAgent` | Yes | Agent receiving the work |
| `projectId` | Yes | Project this work belongs to |
| `taskType` | Yes | One of the task types in `config/task-classification.json` |
| `objective` | Yes | One sentence — what the receiving agent must accomplish |
| `allowedFiles` | Yes | Paths the receiving agent is permitted to read and/or write |
| `forbiddenFiles` | Yes | Paths the receiving agent must not touch |
| `requiredSkills` | Yes | Skills that must be called to satisfy this handoff |
| `acceptanceCriteria` | Yes | Specific, verifiable conditions that define done |
| `riskLevel` | Yes | `low` / `medium` / `high` / `critical` |
| `blocking` | Yes | `true` if downstream work is blocked until this is complete |
| `dueCondition` | Yes | What must happen before or after this task (or `"none"`) |
| `parentTaskId` | Yes | Task ID that spawned this handoff (`"none"` if founder-initiated) |

---

## 3. Validity Rules

**A handoff is invalid if:**
- `targetAgent` is the same as `sourceAgent` (self-handoff — blocked by loop guard).
- `acceptanceCriteria` is empty or contains only vague statements ("looks good", "done").
- `requiredSkills` is empty for a `verification_gate` task type.
- `allowedFiles` is empty and the task requires file writes.
- `riskLevel` is missing (defaults cannot be assumed).
- `parentTaskId` is missing (traceability requirement).

**When a receiving agent gets an invalid handoff:**
1. Do not start the work.
2. Return a blocked task output (see `output-contracts.md`).
3. Log the rejection with `log_event` (level: warn, event: `handoff_rejected`).
4. The rejection surfaces back to NEXUS via the failed task queue.

---

## 4. Handoff Flow

```
Source Agent
  → calls enqueue_task(targetAgent, taskText, projectId, priority, context: <handoff schema>)
  → governor checks permissions (source tier can enqueue to target)
  → task enters task-queue.json with status: pending
  → loop.js picks it up
  → on_handoff_created hook fires
  → Target Agent receives task + context
  → Target Agent validates handoff schema
  → Target Agent executes, using only allowedFiles
  → Target Agent returns result in output-contracts.md format
  → on_step_completed or on_failure hook fires
```

---

## 5. Risk Levels

| Level | Meaning | Example |
|---|---|---|
| `low` | Reversible, isolated, low stakes | Add a new utility function |
| `medium` | Affects shared state or user-facing feature | Modify auth flow logic |
| `high` | Touches security, payments, data models, release | Change Prisma schema |
| `critical` | Production release, compliance gate, secrets, CI/CD | App Store submission, hotfix deploy |

Tasks with `riskLevel: critical` require human review before the target agent acts (governed by `guardrails/approval-policy.json`).

---

## 6. Standard Handoff Chains

These are the canonical handoff sequences for CareLoop sprints. All other handoffs must justify deviation.

**Sprint Build Phase:**
```
SHEPHERD → CORE (backend build)
SHEPHERD → SWIFT (iOS build)
```

**Verification Chain (blocking, sequential):**
```
CORE/SWIFT → AUDITOR (code gate)
AUDITOR → SENTINEL (QA gate)
SENTINEL → WARDEN (compliance gate)
WARDEN → NEXUS (release decision)
```

**Post-Gate Deliverables (non-blocking, parallel):**
```
NEXUS → SENTINEL (QA checklist doc)
NEXUS → BEACON (App Store copy)
NEXUS → RELAY (tester comms — Sprint 3+)
```
