# DB Safety Hooks

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

These hook definitions describe the future enforcement points for database safety, LLM context safety, batch safety, logging safety, and evidence persistence safety.

This phase documents the hook contract only. It does not implement runtime hook enforcement yet.

---

## 1. `on_db_query_requested`

### Trigger

Before any future DB tool executes a query, summary read, migration plan request, or schema inspection.

### Input

- `agentId`
- `tool`
- `environment`
- `table` or `view`
- `classification`
- `rowLimit`
- `sqlIntent`
- `approvalId` if supplied

### Checks

- agent allowed?
- tool allowed?
- production access?
- destructive action?
- restricted table or field?
- approval required?
- row limit?
- safe view required?

### Pass Behavior

- allow the safe tool request to continue
- stamp the request with classification and audit metadata

### Block Behavior

- deny execution
- return blocked reason
- require approval path when appropriate

### Audit Event

- `eventType=db_query_requested`
- `result=pass|block`
- `blockedReason` when blocked

---

## 2. `on_db_result_returned`

### Trigger

Immediately after a future DB tool returns rows, counts, schema info, or migration planning output.

### Input

- `agentId`
- `tool`
- `classification`
- raw result set or summary
- `rowCount`

### Checks

- redact PII or secrets
- remove restricted fields
- enforce row limit
- classify result
- block unsafe result

### Pass Behavior

- return only safe, redacted, bounded results
- attach classification and redaction metadata

### Block Behavior

- suppress unsafe payload
- return safe error summary instead

### Audit Event

- `eventType=db_result_returned`
- `redacted=true|false`
- `rowCount`
- `result=pass|block`

---

## 3. `on_llm_context_build`

### Trigger

Before any LLM prompt is constructed from task, evidence, logs, DB output, or user/project data.

### Input

- provider
- model
- task type
- payload fragments
- classification

### Checks

- scan for secret, restricted, or confidential content depending provider
- redact or block
- no raw DB rows
- no tokens, keys, or passwords
- no production personal data

### Pass Behavior

- allow only classified, redacted, provider-safe context

### Block Behavior

- reject context assembly
- surface the blocked class and provider reason

### Audit Event

- `eventType=llm_context_build`
- `provider`
- `classification`
- `result=pass|block`

---

## 4. `on_batch_queued`

### Trigger

Before any future batch-provider item is submitted.

### Input

- task type
- classification
- payload
- provider
- model

### Checks

- only public or internal
- no raw DB rows
- no personal, confidential, restricted, or secret data
- no tool execution payloads
- no gate, release, or security tasks

### Pass Behavior

- allow non-blocking, policy-safe batch submission

### Block Behavior

- reject the batch item
- require realtime or local alternative if needed

### Audit Event

- `eventType=batch_queued`
- `classification`
- `result=pass|block`

---

## 5. `on_log_write`

### Trigger

Before logs are persisted from agents, skills, DB tools, runtime workers, or operator actions.

### Input

- log entry
- source
- classification
- related task or project

### Checks

- redact PII or secrets
- block raw DB dumps
- classify log entry
- avoid storing restricted data

### Pass Behavior

- persist only redacted, classified log content

### Block Behavior

- reject the log write or replace content with redacted summary

### Audit Event

- `eventType=log_write`
- `classification`
- `redacted=true|false`
- `result=pass|block`

---

## 6. `on_tool_result_persisted`

### Trigger

Before tool output, reports, evidence, or runtime artifacts are stored.

### Input

- tool result
- artifact refs
- classification
- task or project linkage

### Checks

- classify
- redact
- store artifact references or hashes
- audit

### Pass Behavior

- persist safe metadata and artifact references

### Block Behavior

- reject unsafe persistence
- require redaction or alternate storage handling

### Audit Event

- `eventType=tool_result_persisted`
- `classification`
- `artifactCount`
- `result=pass|block`

---

## Summary Rule

Across all hooks, the default order is:

```text
classify → redact → scan → approve/block → audit
```

Raw DB rows must not go to LLM context.
Raw DB rows must not go to batch.
Secrets must never be persisted into logs, evidence, or reports.
