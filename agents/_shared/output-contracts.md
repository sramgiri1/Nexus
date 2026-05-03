# Output Contracts

Every agent output must conform to one of these formats. Agents must not return unstructured prose where a contract applies.

All outputs must be written to the appropriate file (see `memory-standard.md`). Chat output is a summary only — the file is the record.

---

## 1. Task Completion

Used when an agent finishes a task successfully.

```json
{
  "status":      "completed",
  "agentId":     "core",
  "taskId":      "task-1234567890",
  "projectId":   "careloop",
  "summary":     "Implemented reminder scheduling endpoint. 3 files changed.",
  "filesChanged": [
    "projects/careloop/src/routes/reminders.js",
    "projects/careloop/tests/reminders.test.js"
  ],
  "skillResults": [],
  "nextStep":    "AUDITOR gate required before SENTINEL can run.",
  "completedAt": "2026-05-03T21:00:00.000Z"
}
```

---

## 2. Blocked Task

Used when an agent cannot proceed due to a dependency, missing input, policy block, or governor block.

```json
{
  "status":       "blocked",
  "agentId":      "auditor",
  "taskId":       "task-9876543210",
  "projectId":    "careloop",
  "blockedBy":    "governor | dependency | missing_input | skill_fail",
  "reason":       "Governor blocked write_file: path traversal detected in filePath.",
  "evidence":     "safety-events.json entry se-1234567890",
  "requiredAction": "Founder must resolve path — agent cannot act.",
  "blockedAt":    "2026-05-03T21:00:00.000Z"
}
```

---

## 3. Handoff Request

Used when an agent delegates work to another agent. This is the `context` payload of an `enqueue_task` call — see `handoff-standard.md` for full field definitions.

```json
{
  "sourceAgent":        "core",
  "targetAgent":        "auditor",
  "projectId":          "careloop",
  "taskType":           "verification_gate",
  "objective":          "Verify Sprint 2 backend changes.",
  "allowedFiles":       ["projects/careloop/src/", "projects/careloop/tests/"],
  "forbiddenFiles":     ["projects/careloop/.env"],
  "requiredSkills":     ["auditor.code.lint", "auditor.code.diff_review"],
  "acceptanceCriteria": ["code.lint PASS", "code.diff_review PASS"],
  "riskLevel":          "medium",
  "blocking":           true,
  "dueCondition":       "Before SENTINEL Phase 2.2",
  "parentTaskId":       "task-1234567890"
}
```

---

## 4. Skill Proposal

Used when an agent identifies a verification check that should be deterministic but no skill exists yet.

```json
{
  "proposal":      "new_skill",
  "skillName":     "sentinel.qa.api.smoke",
  "ownerAgent":    "sentinel",
  "trigger":       "After backend deploy — verify API endpoints return expected status codes.",
  "inputContract": {
    "projectId": "string",
    "baseUrl":   "string — API base URL (no credentials)"
  },
  "outputContract": {
    "result":  "PASS | FAIL | INFO",
    "issues":  "[{ severity, endpoint, statusCode, expected, actual }]",
    "summary": "string"
  },
  "backing":       "curl or node fetch against known endpoints; compare status codes",
  "safetyRisk":    "low",
  "safetyNotes":   "Read-only HTTP GET requests only. No auth tokens in payload."
}
```

Write to `reports/nexus/skill-proposals.json` and enqueue a NEXUS review task.

---

## 5. Verification Report

Used by AUDITOR, SENTINEL, or WARDEN after running their gate skills.

```json
{
  "status":      "gate_pass | gate_fail",
  "agentId":     "auditor",
  "taskId":      "task-1234567890",
  "projectId":   "careloop",
  "phase":       "sprint-2-auditor-gate",
  "skillResults": [
    { "skill": "auditor.code.diff_review",    "result": "PASS", "issues": [],  "summary": "No high-risk files changed." },
    { "skill": "auditor.code.lint",           "result": "PASS", "issues": [],  "summary": "0 errors, 0 warnings." },
    { "skill": "auditor.code.static_analysis","result": "PASS", "issues": [],  "summary": "No eval, no localhost refs." },
    { "skill": "auditor.code.test_coverage",  "result": "INFO", "issues": [],  "summary": "14 test files, 62 functions." }
  ],
  "gateDecision": "PASS — all required skills passed. Ready for SENTINEL.",
  "reportFile":   "reports/auditor/careloop-diff-review-sprint2-2026-05-03.md",
  "completedAt":  "2026-05-03T21:00:00.000Z"
}
```

Write the full skill output to the report file. The JSON above is the task result summary.

---

## 6. Release Recommendation

Used by NEXUS after receiving gate results from AUDITOR + SENTINEL + WARDEN.

```json
{
  "decision":    "GO | NO-GO | CONDITIONAL",
  "projectId":   "careloop",
  "sprint":      2,
  "gateStatus": {
    "g0": "done",
    "g1": "done",
    "g2": "partial"
  },
  "conditions":  ["WARDEN compliance.appstore.check must PASS before submission"],
  "blockers":    [],
  "recommendation": "Build is code-clean and QA-clean. App Store copy check is pending — submit after WARDEN clears it.",
  "decidedAt":   "2026-05-03T21:00:00.000Z"
}
```

---

## 7. Code Change Summary

Used by EXECUTE agents (CORE, SWIFT, PIXEL, CANVAS) when reporting a build result.

```json
{
  "status":        "completed",
  "agentId":       "swift",
  "taskId":        "task-1234567890",
  "projectId":     "careloop",
  "sprint":        2,
  "changedFiles": [
    { "path": "projects/careloop-ios/CareLoop/Views/ReminderView.swift", "change": "Added push notification scheduling" },
    { "path": "projects/careloop-ios/CareLoopTests/ReminderTests.swift",  "change": "Added 4 unit tests for scheduling logic" }
  ],
  "lintSelfCheck": "PASS — ran auditor.code.lint pre-handoff",
  "riskAreas":     ["Push notification permissions — requires Info.plist key"],
  "handoffTo":     "auditor",
  "completedAt":   "2026-05-03T21:00:00.000Z"
}
```

---

## 8. Batch Summary

Used by BEACON, RELAY, COMPASS, RADAR, and other batch-eligible agents when a batch task result is reconciled.

```json
{
  "status":         "reconciled | reconciled_requires_review",
  "agentId":        "beacon",
  "batchItemId":    "batch-beacon-001",
  "projectId":      "careloop",
  "taskType":       "marketing_copy",
  "reconcileNote":  "ok",
  "outputSummary":  "Generated 3 App Store subtitle variants (170 chars each).",
  "outputFile":     "reports/beacon/careloop-aso-copy-2026-05-03.md",
  "costActualUsd":  0.005,
  "reconciledAt":   "2026-05-03T21:00:00.000Z"
}
```

If `status` is `reconciled_requires_review`, the output file must be reviewed by a human or NEXUS before any downstream action is taken on its content.
