# NEXUS API Architecture

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

The future NEXUS API is the only mutation boundary between the operator UI and the kernel.

Core flow:

```text
UI → NEXUS API → Governor → Contract Validator → State Machine → Memory/DB
```

This API is not implemented in this phase.

---

## Core Principles

- UI never mutates DB, memory, or task files directly.
- API enforces auth and RBAC later.
- API validates contracts before scheduling work.
- API calls governor before state-changing actions.
- API uses the state machine for transitions.
- API writes audit events.
- API returns evidence links, not large raw logs by default.
- API never returns raw secrets.
- API uses correlation IDs.
- state-changing endpoints support idempotency keys.
- API supports read-only investor or demo mode later.

---

## Request Metadata

State-changing and traceable requests should carry:

- `correlationId`
- `idempotencyKey`
- `actorId`
- `actorRole`
- `projectId`
- `source`
- `requestedAt`

---

## Standard Error Format

```json
{
  "error": {
    "code": "",
    "message": "",
    "details": {},
    "correlationId": "",
    "blockedBy": "governor|contract|state_machine|approval|policy|unknown"
  }
}
```

---

## Endpoint Groups

### 1. Intent

- `GET /intent/current`
- `POST /intent`

### 2. Projects

- `GET /projects`
- `GET /projects/:id`
- `GET /projects/:id/status`
- `GET /projects/:id/evidence`
- `GET /projects/:id/gates`

### 3. Tasks

- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `POST /tasks/:id/request-transition`
- `POST /tasks/:id/cancel`
- `POST /tasks/:id/retry`
- `GET /tasks/:id/evidence`

### 4. Contracts

- `GET /contracts`
- `GET /contracts/:id`
- `POST /contracts/validate`

### 5. Agents

- `GET /agents`
- `GET /agents/:id`
- `GET /agents/:id/runs`
- `GET /agents/:id/usage`
- `GET /agents/:id/readiness`

### 6. Skills

- `GET /skills`
- `POST /skills/:id/run`
- `GET /skill-results`
- `GET /skill-results/:id`

### 7. Gates

- `GET /gates`
- `GET /gates/:id`
- `POST /gates/:id/request-transition`

### 8. Runtime

- `GET /runtimes`
- `GET /runtimes/:id/status`
- `GET /runtime-events`

### 9. Batch

- `GET /batch`
- `GET /batch/:id`
- `POST /batch/submit`
- `POST /batch/:id/poll`
- `POST /batch/:id/reconcile`

### 10. Safety

- `GET /safety-events`
- `GET /safety-events/:id`
- `GET /usage`
- `GET /budget`

### 11. Approvals

- `GET /approvals`
- `GET /approvals/:id`
- `POST /approvals/:id/approve`
- `POST /approvals/:id/reject`

### 12. Evidence

- `GET /evidence`
- `GET /evidence/:id`
- `GET /evidence/by-task/:taskId`
- `GET /evidence/by-project/:projectId`

### 13. Release

- `GET /release/:projectId/status`
- `POST /release/:projectId/decision`

### 14. Demo

- `GET /demo/scenarios`
- `POST /demo/scenarios/:id/replay`
- `POST /demo/reset`
- `GET /demo/read-only-status`

---

## Mutation Path

Every state-changing endpoint should follow this flow:

1. receive request metadata
2. authenticate and authorize later
3. validate payload shape
4. validate contract or requested action
5. call governor for sensitive mutation
6. request state-machine transition where applicable
7. write audit event
8. return structured result with evidence references

The API is not the state machine. It is the boundary that invokes the state machine.

---

## Safety Rules

- no raw secrets in response
- no restricted data in UI payloads unless explicit role allows it later
- large artifacts returned as references
- mutations always audited
- risky mutations require approval
- release decisions require evidence

Additional rules:

- approval is required before risky deploy, secret, migration, or production-data actions
- idempotency keys protect against duplicate mutation requests
- correlation IDs tie API actions to task, audit, and safety records

---

## Read Model vs Mutation Model

The operator platform should separate:

- read-oriented API views for dashboards
- mutation-oriented API actions for scheduling, transitions, approvals, and release decisions

That allows:

- lightweight UI polling or subscriptions later
- strict mutation auditing
- safer read-only demo or investor mode

---

## What Phase 7 Does Not Implement

This phase does not:

- implement an API server
- add auth
- add RBAC
- add persistence code
- change runtime dispatch
- change JSON memory

It defines the future mutation boundary and the operator-to-kernel flow.
