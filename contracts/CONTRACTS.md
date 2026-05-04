# NEXUS Contracts Layer

**Version:** 1.0
**Date:** 2026-05-03

---

## Purpose

Contracts are the interface between agents. No work moves between agents without a typed contract. A contract is a pre-work specification that the receiving agent can execute deterministically — not a message, not a summary, not a description of what happened.

> **Rule: No contract, no work.**

Every task dispatched by the control plane carries a task contract. Every cross-agent handoff carries a handoff contract. Every gate produces a verification contract. Every release decision produces a release contract. Every state transition is backed by a state transition record.

---

## Contract Types

| Type | File | Purpose |
| --- | --- | --- |
| Task Contract | `schemas/task-contract.schema.json` | What a single agent is asked to do |
| Handoff Contract | `schemas/handoff-contract.schema.json` | Delegation from one agent to another |
| Skill Result | `schemas/skill-result.schema.json` | Output of a deterministic skill execution |
| Verification Contract | `schemas/verification-contract.schema.json` | Gate specification and pass criteria |
| Release Contract | `schemas/release-contract.schema.json` | GO / NO-GO decision with gate evidence |
| State Transition | `schemas/state-transition.schema.json` | Proposed state change for state machine validation |

---

## Examples

### Task Contract

```json
{
  "id": "task-abc-123",
  "contractVersion": "1.0",
  "projectId": "careloop",
  "sourceAgent": "nexus",
  "targetAgent": "core",
  "taskType": "implementation",
  "objective": "Implement medication reminder scheduling endpoint",
  "allowedFiles": ["projects/careloop/src/routes/", "projects/careloop/src/jobs/"],
  "forbiddenFiles": ["projects/careloop/.env", "memory/"],
  "inputs": { "sprint": 2 },
  "acceptanceCriteria": ["POST /reminders returns 201", "job is registered in scheduler"],
  "requiredSkills": [],
  "riskLevel": "medium",
  "blocking": true,
  "dependsOn": [],
  "parentTaskId": null,
  "createdAt": "2026-05-03T10:00:00Z"
}
```

### Handoff Contract

```json
{
  "contractType": "verification",
  "sourceAgent": "core",
  "targetAgent": "auditor",
  "projectId": "careloop",
  "objective": "Verify Sprint 2 backend implementation",
  "evidence": ["task-abc-123 completed"],
  "allowedFiles": ["projects/careloop/src/", "projects/careloop/tests/"],
  "forbiddenFiles": ["projects/careloop/.env"],
  "requiredSkills": ["auditor.code.lint", "auditor.code.diff_review", "auditor.code.test_coverage"],
  "doneCriteria": ["code.lint PASS", "code.diff_review PASS", "code.test_coverage INFO"],
  "riskLevel": "medium",
  "blocking": true,
  "parentTaskId": "task-abc-123"
}
```

### Skill Result

```json
{
  "result": "PASS",
  "issues": [],
  "summary": "ESLint: 0 errors, 0 warnings across 12 files",
  "reportPath": "reports/auditor/careloop-lint-sprint2-2026-05-03.json",
  "command": "eslint projects/careloop/src --format json",
  "startedAt": "2026-05-03T10:05:00Z",
  "finishedAt": "2026-05-03T10:05:03Z",
  "durationMs": 3100
}
```

### Release Contract

```json
{
  "projectId": "careloop",
  "auditorResult": "PASS",
  "sentinelResult": "PASS",
  "wardenResult": "PASS",
  "openCriticalSafetyEvents": 0,
  "unreconciledBlockingBatchTasks": 0,
  "failedBlockingGates": 0,
  "releaseDecision": "GO",
  "evidence": [
    "reports/auditor/careloop-diff-review-sprint2-2026-05-03.md",
    "reports/sentinel/careloop-qa-sprint2-2026-05-03.md",
    "reports/warden/careloop-compliance-sprint2-2026-05-03.md"
  ],
  "decidedAt": "2026-05-03T12:00:00Z"
}
```

---

## Anti-Patterns

These are not contracts. They will be rejected.

| Anti-pattern | Why it fails |
| --- | --- |
| `"CORE is done, SENTINEL should QA now"` | No scope, no acceptance criteria, no skills, not typed |
| Agent marks own task `verified` without gate evidence | State machine rejects — `verified` requires verifier artifact |
| Handoff with empty `doneCriteria` | `minItems: 1` — receiving agent has no success condition |
| Release with `releaseDecision: GO` and `auditorResult: FAIL` | Semantic validation blocks GO without PASS evidence |
| Task with no `acceptanceCriteria` | `minItems: 1` — no way to know when done |
| Verification contract missing `skillsRequired` | Gate has no deterministic content — not a real gate |

---

## Validators

```text
contracts/validators/
├── index.js                      ← re-exports all validators
├── validateSchema.js             ← core mini JSON Schema engine
├── validateTaskContract.js
├── validateHandoffContract.js
├── validateSkillResult.js
├── validateVerificationContract.js
├── validateReleaseContract.js    ← includes GO semantic validation
└── validateStateTransition.js
```

Run validation smoke tests:

```bash
npm run check:contracts
```

---

## Migration Note

This contracts layer is documentation and schema validation only. It does not yet block invalid contracts at queue write time — that integration happens in Phase 3 (loop.js + tools integration). The contracts define the target shape; `check-contracts.js` verifies the validators work correctly.
