# Execution Evidence Model

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

NEXUS release decisions and state transitions must be backed by execution evidence, not by agent claims.

This document defines the evidence model produced by execution runtimes and skills. It applies across:

- `node-local`
- `linux-container`
- `macos-xcode`
- `provider-api`
- `batch-provider`
- `human-approval`

---

## Evidence Types

NEXUS should treat the following as first-class evidence types:

- `command_result`
- `test_result`
- `lint_result`
- `static_analysis_result`
- `test_coverage_result`
- `diff_review_result`
- `simulator_result`
- `xcresult`
- `log_artifact`
- `screenshot_artifact`
- `crash_log`
- `security_scan_result`
- `privacy_check_result`
- `permissions_validation_result`
- `appstore_policy_result`
- `skill_result`
- `model_result`
- `batch_result`
- `approval_result`
- `release_contract`
- `release_decision_result`

---

## Evidence Item Shape

```json
{
  "evidenceId": "",
  "type": "",
  "taskId": "",
  "projectId": "",
  "agentId": "",
  "runtime": "",
  "result": "PASS|FAIL|INFO",
  "summary": "",
  "artifactPaths": [],
  "createdAt": "",
  "hash": "",
  "redacted": true,
  "dataClassification": "public|internal|confidential|restricted|secret|unknown"
}
```

---

## Field Notes

| Field | Meaning |
| --- | --- |
| `evidenceId` | Stable identifier for cross-reference and audit |
| `type` | One of the defined evidence types |
| `taskId` | Task that caused the evidence to exist |
| `projectId` | Project scope for the evidence |
| `agentId` | Agent that requested or owns the evidence |
| `runtime` | Execution runtime that produced it |
| `result` | `PASS`, `FAIL`, or `INFO` |
| `summary` | Short human-readable summary |
| `artifactPaths` | Filesystem references to logs, results, screenshots, or reports |
| `createdAt` | Creation timestamp |
| `hash` | Optional integrity or content hash |
| `redacted` | Confirms output was redacted for secrets and sensitive data |
| `dataClassification` | Sensitivity classification for downstream handling |

---

## Runtime to Evidence Examples

| Runtime | Typical evidence |
| --- | --- |
| `node-local` | `command_result`, `lint_result`, `static_analysis_result`, `diff_review_result`, `log_artifact` |
| `linux-container` | `command_result`, `test_result`, `security_scan_result`, `log_artifact` |
| `macos-xcode` | `simulator_result`, `test_result`, `xcresult`, `screenshot_artifact`, `crash_log`, `log_artifact` |
| `provider-api` | `model_result`, `release_decision_result`, planning or aggregation summaries referenced through evidence |
| `batch-provider` | `batch_result` for reports and summaries only |
| `human-approval` | `approval_result` |

---

## Core Rules

- Evidence supports state transitions and release decisions.
- Agent claims are not evidence.
- iOS verification requires Xcode or simulator evidence when applicable.
- Batch output is evidence for reports, not gates.
- Release decisions require gate evidence.
- Logs must be redacted.
- Large artifacts should be referenced by path or hash, not embedded in memory.
- Evidence containing confidential, restricted, or secret data must not be sent to batch or OpenRouter.
- Evidence should link to `taskId`, `projectId`, and `agentId` where possible.

---

## Gate and Release Implications

Verification gates should depend on execution evidence, not narrative summaries.

Examples:

- AUDITOR gate depends on `lint_result`, `static_analysis_result`, `diff_review_result`, and where applicable `test_coverage_result`
- SENTINEL gate depends on `test_result`, `simulator_result`, `log_artifact`, `security_scan_result`, and `xcresult` where applicable
- WARDEN gate depends on `privacy_check_result`, `permissions_validation_result`, and `appstore_policy_result` where applicable
- NEXUS release decisions depend on verifier evidence plus `release_contract`

This model keeps release authority in the control plane while making evidence authority runtime-backed.

---

## Artifact Handling Rules

Large artifacts should be stored as files and referenced, not copied inline into memory or prompts.

Recommended handling:

- logs by path
- `xcresult` by path
- screenshots by path
- crash logs by path
- structured skill outputs by report file path plus short summary

This avoids oversized memory state and reduces accidental disclosure risk.

---

## Data Classification Rules

Evidence must carry sensitivity classification because downstream use depends on it.

- `public` and `internal` evidence can be summarized more freely where policy allows
- `confidential`, `restricted`, and `secret` evidence require tighter handling
- restricted or secret evidence must never be routed to `batch-provider`
- restricted or secret evidence must never be sent to OpenRouter

Where evidence is sensitive, NEXUS should pass references and summaries rather than raw content.

---

## Phase Boundary

Phase 6 defines the evidence model only.

It does not:

- implement new evidence writers
- change runtime dispatch
- change state-machine enforcement
- change memory schema

It provides the contract future runtime integration should produce and consume.
