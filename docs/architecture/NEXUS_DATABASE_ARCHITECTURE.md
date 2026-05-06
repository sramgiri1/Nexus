# NEXUS Database Architecture

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

NEXUS currently uses JSON memory as the runtime source of truth. Future durable operation requires a database-backed state model for tasks, contracts, evidence, approvals, usage, and audit history.

Current state:

- `memory/*.json` remains source of truth now
- PostgreSQL becomes durable source later
- this phase does not implement the database

---

## Recommended Stack

- PostgreSQL
- Prisma later
- optional SQLite local mode later only if useful

This phase does not add Prisma or migrations. It defines the durable architecture only.

---

## Migration Strategy

### Phase DB-1: JSON Primary

- current state
- `memory/*.json` remains source of truth

### Phase DB-2: DB Mirror Mode

- JSON remains source of truth
- DB receives copies of tasks, contracts, evidence, usage, safety, approvals, and state transitions
- Command Center may read from DB mirror
- no runtime dependency on DB yet

### Phase DB-3: DB Primary Mode

- DB becomes source of truth
- JSON becomes export or debug snapshot
- worker leases and heartbeats use DB
- API reads and writes DB through kernel, governor, and state machine

### Phase DB-4: Production Mode

- backups
- retention policies
- RBAC
- audit hardening
- data protection enforcement
- artifact or object storage references

---

## Database Principles

- DB stores state, contracts, evidence, and audit history.
- Secrets are never stored raw.
- Large logs and artifacts are referenced by path or hash, not embedded.
- State transitions are append-only.
- Audit log is append-only.
- Contract records are immutable after validation unless versioned.
- DB writes go through API and kernel, not agents directly.
- JSON memory remains export or debug format during migration.
- Task leases and worker heartbeats are future durable execution work.
- Data protection phase must happen before DB contains personal information.

---

## Entity Model

### 1. `projects`

| Attribute | Value |
| --- | --- |
| Purpose | project identity, status, phase, release state |
| Key fields | `id`, `name`, `stage`, `health`, `releaseStatus`, `activeSprint`, `createdAt`, `updatedAt` |
| Append-only or mutable | mutable |
| Classification notes | normally internal |

### 2. `agents`

| Attribute | Value |
| --- | --- |
| Purpose | agent roster, group, plane, readiness, status |
| Key fields | `id`, `name`, `group`, `plane`, `class`, `status`, `currentTaskId`, `readinessStatus` |
| Append-only or mutable | mutable |
| Classification notes | internal |

### 3. `tasks`

| Attribute | Value |
| --- | --- |
| Purpose | durable task queue and task state |
| Key fields | `id`, `projectId`, `targetAgent`, `sourceAgent`, `taskType`, `objective`, `state`, `riskLevel`, `blocking`, `dependsOn`, `leaseOwner`, `leaseUntil`, `attempt`, `maxAttempts` |
| Append-only or mutable | mutable with append-only transition history |
| Classification notes | internal, may reference confidential work |

### 4. `task_contracts`

| Attribute | Value |
| --- | --- |
| Purpose | validated task delegation contracts |
| Key fields | `id`, `taskId`, `projectId`, `agentId`, `allowedFiles`, `forbiddenFiles`, `acceptanceCriteria`, `requiredSkills`, `riskLevel`, `version` |
| Append-only or mutable | immutable after validation unless versioned |
| Classification notes | internal |

### 5. `handoff_contracts`

| Attribute | Value |
| --- | --- |
| Purpose | structured inter-agent handoffs |
| Key fields | `id`, `sourceAgent`, `targetAgent`, `taskId`, `objective`, `requiredSkills`, `acceptanceCriteria`, `version` |
| Append-only or mutable | immutable after validation unless versioned |
| Classification notes | internal |

### 6. `verification_contracts`

| Attribute | Value |
| --- | --- |
| Purpose | gate scope and expected verifier evidence |
| Key fields | `id`, `gateId`, `taskId`, `requiredEvidence`, `requiredSkills`, `ownerAgent`, `version` |
| Append-only or mutable | immutable after validation unless versioned |
| Classification notes | internal |

### 7. `release_contracts`

| Attribute | Value |
| --- | --- |
| Purpose | release evidence bundle and decision context |
| Key fields | `id`, `projectId`, `requiredGates`, `requiredEvidence`, `decisionOwner`, `status`, `version` |
| Append-only or mutable | immutable after validation unless versioned |
| Classification notes | internal, potentially confidential |

### 8. `state_transitions`

| Attribute | Value |
| --- | --- |
| Purpose | append-only transition history |
| Key fields | `id`, `entityType`, `entityId`, `fromState`, `toState`, `requestedBy`, `approvedBy`, `createdAt`, `correlationId` |
| Append-only or mutable | append-only |
| Classification notes | internal |

### 9. `skill_results`

| Attribute | Value |
| --- | --- |
| Purpose | structured outputs from deterministic skills |
| Key fields | `id`, `taskId`, `projectId`, `agentId`, `skillId`, `runtime`, `result`, `summary`, `artifactRefs` |
| Append-only or mutable | append-only |
| Classification notes | internal; may point to confidential evidence |

### 10. `gates`

| Attribute | Value |
| --- | --- |
| Purpose | AUDITOR, SENTINEL, WARDEN gate state |
| Key fields | `id`, `projectId`, `gateType`, `status`, `requiredEvidence`, `blockingIssues`, `lastEvaluatedAt` |
| Append-only or mutable | mutable with evidence and transition history |
| Classification notes | internal |

### 11. `batch_jobs`

| Attribute | Value |
| --- | --- |
| Purpose | batch provider job tracking |
| Key fields | `id`, `provider`, `model`, `status`, `estimatedCost`, `discountedCost`, `submittedAt`, `reconciledAt` |
| Append-only or mutable | mutable |
| Classification notes | internal |

### 12. `batch_items`

| Attribute | Value |
| --- | --- |
| Purpose | item-level batch tracking |
| Key fields | `id`, `batchJobId`, `taskId`, `projectId`, `taskType`, `status`, `classification`, `reconcileStatus` |
| Append-only or mutable | mutable |
| Classification notes | internal; classification required |

### 13. `model_usage`

| Attribute | Value |
| --- | --- |
| Purpose | cost and usage accounting |
| Key fields | `id`, `agentId`, `projectId`, `provider`, `model`, `tokensIn`, `tokensOut`, `costUsd`, `createdAt` |
| Append-only or mutable | append-only |
| Classification notes | internal |

### 14. `safety_events`

| Attribute | Value |
| --- | --- |
| Purpose | governor blocks and safety decisions |
| Key fields | `id`, `eventType`, `blockedBy`, `agentId`, `projectId`, `summary`, `detailsRef`, `createdAt` |
| Append-only or mutable | append-only |
| Classification notes | internal, may include restricted references |

### 15. `approvals`

| Attribute | Value |
| --- | --- |
| Purpose | approval workflow records |
| Key fields | `id`, `projectId`, `approvalType`, `requestedBy`, `reviewedBy`, `riskLevel`, `status`, `evidenceRefs`, `createdAt` |
| Append-only or mutable | mutable with append-only decision history |
| Classification notes | internal, potentially confidential |

### 16. `evidence`

| Attribute | Value |
| --- | --- |
| Purpose | normalized execution evidence catalog |
| Key fields | `id`, `type`, `taskId`, `projectId`, `agentId`, `runtime`, `result`, `artifactRefs`, `classification`, `hash` |
| Append-only or mutable | append-only |
| Classification notes | classification varies; restricted handling required |

### 17. `reports`

| Attribute | Value |
| --- | --- |
| Purpose | structured report references and summaries |
| Key fields | `id`, `projectId`, `agentId`, `reportType`, `path`, `summary`, `createdAt` |
| Append-only or mutable | append-only |
| Classification notes | internal, sometimes public for demo outputs |

### 18. `audit_log`

| Attribute | Value |
| --- | --- |
| Purpose | append-only operator and kernel audit trail |
| Key fields | `id`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `correlationId`, `createdAt` |
| Append-only or mutable | append-only |
| Classification notes | internal |

### 19. `artifacts`

| Attribute | Value |
| --- | --- |
| Purpose | large artifact references |
| Key fields | `id`, `projectId`, `type`, `path`, `hash`, `sizeBytes`, `classification`, `createdAt` |
| Append-only or mutable | append-only |
| Classification notes | varies; often confidential or restricted |

### 20. `secrets_metadata`

| Attribute | Value |
| --- | --- |
| Purpose | metadata about secret usage without raw secret storage |
| Key fields | `id`, `name`, `scope`, `environment`, `lastRotatedAt`, `approvalRef` |
| Append-only or mutable | mutable |
| Classification notes | restricted; values never stored raw |

### 21. `runtime_events`

| Attribute | Value |
| --- | --- |
| Purpose | runtime execution, health, and failure events |
| Key fields | `id`, `runtime`, `eventType`, `taskId`, `projectId`, `summary`, `status`, `createdAt` |
| Append-only or mutable | append-only |
| Classification notes | internal |

---

## Storage Boundary Rules

- agents do not write DB rows directly
- API and kernel mediate writes
- state transition authority remains outside agent prompts
- evidence references should prefer path and hash over embedded payloads
- personal information must not enter the DB until data protection boundaries are defined

---

## Obsidian Note

Obsidian is not NEXUS runtime memory.

Obsidian may be used only for human planning notes.

Runtime memory belongs in:

- JSON now
- PostgreSQL later

---

## What Phase 7 Does Not Implement

This phase does not:

- create a DB schema
- add migrations
- add Prisma
- change runtime reads or writes
- move memory out of JSON

It defines the durable storage architecture and the migration path only.
