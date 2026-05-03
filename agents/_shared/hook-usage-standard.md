# Hook Usage Standard

Hooks are observability events fired at defined points in the task lifecycle. They are not control flow — they do not decide what happens next.

---

## 1. Hook Catalogue

| Hook | When It Fires | Fired By |
|---|---|---|
| `on_goal_received` | A task is picked up from the queue and is about to start | loop.js at task dispatch |
| `on_step_completed` | A task or skill finishes successfully | loop.js after `markTaskCompleted` |
| `on_failure` | A task or skill returns a failure that could not be auto-recovered | loop.js after `markTaskFailed` |
| `on_safety_blocked` | The governor blocks an action | governor.js / safetyLogger.js |
| `on_handoff_created` | An agent enqueues a task for another agent | Any agent via `enqueue_task` |
| `on_skill_executed` | A deterministic skill completes (PASS, FAIL, or INFO) | loop.js skill task path |
| `on_batch_queued` | A task is deferred to the async batch queue | runner.js `queueBatchTask` |
| `on_batch_reconciled` | A batch result is pulled back and classified | batch-reconcile-openai.js |

---

## 2. Hook Payload Contract

All hooks receive a payload with at minimum:

```json
{
  "hook":      "on_step_completed",
  "agentId":   "auditor",
  "taskId":    "task-1234567890",
  "projectId": "careloop",
  "timestamp": "2026-05-03T21:00:00.000Z"
}
```

Additional fields by hook:

**`on_step_completed` / `on_failure`:**
```json
{
  "success":       true,
  "toolCallCount": 3,
  "iterations":    2,
  "error":         null
}
```

**`on_safety_blocked`:**
```json
{
  "actionType": "tool_call",
  "toolName":   "write_file",
  "reason":     "Path traversal detected",
  "riskLevel":  "high"
}
```

**`on_skill_executed`:**
```json
{
  "skillName": "auditor.code.lint",
  "result":    "FAIL",
  "issueCount": 2,
  "summary":   "2 errors in src/auth.js"
}
```

**`on_handoff_created`:**
```json
{
  "sourceAgent": "core",
  "targetAgent": "auditor",
  "taskType":    "verification_gate",
  "newTaskId":   "task-9876543210"
}
```

**`on_batch_queued`:**
```json
{
  "batchItemId":             "batch-beacon-001",
  "provider":                "direct_openai",
  "estimatedDiscountedCostUsd": 0.006
}
```

**`on_batch_reconciled`:**
```json
{
  "batchItemId":    "batch-beacon-001",
  "status":         "reconciled",
  "reconcileNote":  "ok"
}
```

---

## 3. Rules

### Hooks are observability only

Hooks write to logs. They do not:
- Change task status in `task-queue.json`.
- Re-route work.
- Enqueue new tasks.
- Block execution.

If a hook handler fails, the task continues. A hook failure must not cause a task failure.

### Hooks must not mutate critical project state

A hook handler may append to:
- `memory/conversations/<agentId>.log` — activity log
- `reports/<agent>/` — generated summaries

A hook handler must not write to:
- `memory/safety-events.json` — owned by the safety logger
- `memory/system-usage.json` — owned by the budget guard
- `memory/task-queue.json` — owned by loop.js
- `memory/portfolio.json` — owned by NEXUS/agents via proper tools

### Hooks must not call the governor

Hook handlers run after the governor has already acted. A hook must not call `authorizeAction` or attempt to re-approve or re-block an action that has already been decided.

### Hook handlers must be fast

A hook handler that takes more than 500ms is a bug — it is blocking task throughput. Hooks write a log entry or fire a notification. They do not perform analysis.

---

## 4. Implementing a New Hook

If a new lifecycle event needs observability, add it to `hooks/index.js` following the existing `fireHook(event, payload)` pattern. New hooks:
1. Must be added to the catalogue in this file.
2. Must have a defined payload contract.
3. Must not perform I/O beyond appending to a log or sending a notification.
4. Must be fire-and-forget (no `await` on the hook result in the caller).
