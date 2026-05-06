# Durable Execution Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

This document defines how NEXUS should eventually execute tasks without losing state,
duplicating risky work, or relying on in-memory optimism.

JSON memory remains the runtime source of truth today. Durable execution becomes
realistic later when PostgreSQL-backed task state, transition history, evidence, lease
data, and audit events are available.

---

## Durable Task Lifecycle

```text
created
  → validated
  → queued
  → leased
  → running
  → heartbeat_active
  → implementation_done
  → awaiting_verification
  → deferred_batch
  → awaiting_approval
  → completed
  → failed
  → blocked
  → dead_lettered
  → cancelled
  → rolled_back
```

Not every task touches every state, but the durable model must be able to represent
them all without ambiguity.

---

## Required Durable Fields

Task records should eventually include:

- `taskId`
- `projectId`
- `sourceAgent`
- `targetAgent`
- `taskType`
- `objective`
- `state`
- `riskLevel`
- `blocking`
- `dependsOn`
- `idempotencyKey`
- `leaseOwner`
- `leaseUntil`
- `heartbeatAt`
- `attempt`
- `maxAttempts`
- `failureClass`
- `lastError`
- `evidenceIds`
- `auditEventIds`
- `createdAt`
- `updatedAt`

---

## Idempotency

- every state-changing API request should have `idempotencyKey`
- retries should reuse the same `idempotencyKey` where appropriate
- destructive operations require both approval and idempotency
- deploy, migration, and secrets changes require explicit idempotency rules
- duplicate task execution must be detected

Idempotency is not optional metadata. It is the difference between retrying safely and
running a destructive action twice.

---

## State Transition Durability

- state transition requests are append-only events
- the state machine validates the transition
- the transition event includes actor, reason, evidence, and timestamp
- a failed transition emits a safety or audit event
- transition replay can reconstruct task state later

This allows the system to recover current state from durable events rather than trusting
the latest optimistic in-memory write.

---

## Durable Execution Implications

- task durability prevents silent queue loss
- evidence linkage prevents fake completion
- audit linkage preserves operator and worker accountability
- durable transitions make replay, recovery, and incident analysis possible

This phase defines the model only. It does not implement durable state in runtime yet.
