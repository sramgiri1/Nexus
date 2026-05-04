# Batch Usage Standard

Batch is a cost-reduction mechanism for async, non-blocking work. It is not an authority mechanism. Batch output cannot gate work, release software, or authorize state transitions. Agents must know which tasks are batch-eligible and which are never batch.

---

## 0. Core Rules

> **Batch output cannot pass gates.**
> **Batch is cost optimization, not authority.**

A batch job that produces lint output or test results after the fact cannot retroactively satisfy a gate. Gate evidence must be produced by skills run synchronously during the gate phase. A batch report is a report — not a verification contract.

---

## 1. Batch-Eligible Task Types

These task types may be deferred to async batch processing:

| Task type | Owner agents |
| --- | --- |
| `marketing_copy` | BEACON |
| `aso_copy` | COMPASS |
| `seo_meta` | COMPASS |
| `market_analysis` | RADAR |
| `revenue_model` | MERIDIAN |
| `qa_documentation` | SENTINEL (post-gate checklist only) |
| `analytics_spec` | ORACLE |
| `bug_clustering` | RELAY |
| `report` | RELAY, MERIDIAN, NEXUS (informational) |
| `non_blocking_prd_draft` | ATLAS (non-blocking sections only) |

---

## 2. Never-Batch Task Types

These task types must always run realtime:

| Task type | Why |
| --- | --- |
| `code_edit` | Code agents are never batch-eligible |
| `tool_loop` | Requires synchronous tool execution |
| `verification_gate` | Gates require synchronous skill evidence |
| `release_decision` | Must reference current gate state |
| `deploy` | Infrastructure requires immediate feedback |
| `secrets_change` | Security-critical — no async |
| `ci_cd_change` | Pipeline changes require synchronous validation |
| `migration` | Database migrations require real-time oversight |
| `auto_heal` | Must respond immediately to failures |
| `security_blocker` | Never deferred — blocks on unsafe content |
| `simulator_run` | xcrun simctl requires live execution |
| `xcode_build` | xcodebuild requires live execution |

---

## 3. Batch Lifecycle

A batch task follows this path:

```
batch_pending
  -> provider_submitted   (real batch job submitted; ENABLE_REAL_*_BATCH must be true)
  -> provider_processing
  -> provider_completed
  -> reconciled           (provider_output evidence required)
```

Or, in current dry-run mode:

```
batch_pending -> dry_run_submitted -> batch_pending (reset)
```

Real batch submission is disabled until `ENABLE_REAL_OPENAI_BATCH=true` or `ENABLE_REAL_ANTHROPIC_BATCH=true`. All batch calls currently produce a `dry_run_submitted` state and queue to `memory/batch-queue.json`.

---

## 4. Batch Evidence Rules

After reconciliation, the batch output is available as a report artifact. Before acting on it:

- **Reconciled batch output must be reviewed** before influencing downstream work.
- Batch evidence is valid for: reports, summaries, copy, analysis, documentation.
- Batch evidence is **not valid for**: gate passes, state transitions, release decisions.
- A task with `status: reconciled_requires_review` must be reviewed by a human or NEXUS before any downstream action is taken.

---

## 5. Batch Payload Safety

Batch payloads must:
- Not contain API keys, tokens, passwords, or credentials
- Not contain personally identifying information beyond project scope
- Be classification-safe for the provider's data policies
- Set `data_collection: deny` for OpenRouter requests

The secret guard scans batch payloads before submission. Do not attempt to embed credentials.

---

## 6. Output Format for Batch Tasks

When a batch task is queued, the agent should return:

```json
{
  "status": "deferred_batch",
  "agentId": "beacon",
  "taskId": "task-abc-123",
  "projectId": "careloop",
  "batchItemId": "batch-beacon-001",
  "provider": "direct_openai",
  "taskType": "marketing_copy",
  "expectedReconcileAfter": "2026-05-04T08:00:00Z"
}
```

When a batch task is reconciled:

```json
{
  "status": "reconciled",
  "agentId": "beacon",
  "batchItemId": "batch-beacon-001",
  "projectId": "careloop",
  "taskType": "marketing_copy",
  "reconcileNote": "ok",
  "outputSummary": "3 App Store subtitle variants generated.",
  "outputFile": "reports/beacon/careloop-aso-copy-2026-05-04.md",
  "costActualUsd": 0.005,
  "reconciledAt": "2026-05-04T08:15:00Z",
  "modelPolicyObserved": true,
  "executionMode": "batch",
  "batchEligible": true
}
```
