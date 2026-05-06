# Task Lease and Heartbeat Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

NEXUS needs a lease and heartbeat model so that only one worker executes a task at a
time and stuck execution becomes visible quickly.

---

## Lease Model

### Lease Fields

- `leaseOwner`
- `leaseId`
- `leaseUntil`
- `leaseAcquiredAt`
- `leaseRenewedAt`
- `heartbeatAt`
- `workerRuntime`
- `workerInstanceId`

### Lease Rules

- only one active lease per task
- a lease is required before running
- the lease expires if it is not renewed
- an expired lease can be reclaimed
- high-risk tasks cannot be reclaimed without review if side effects are possible
- lease renewal requires heartbeat
- lease release emits an audit event

---

## Heartbeat Model

Heartbeat should include:

- `taskId`
- `workerInstanceId`
- `runtime`
- `progressSummary`
- `lastStep`
- `artifactRefs`
- `timestamp`

Heartbeat is not only liveness. It is progress evidence that helps decide whether a task
is merely slow, actually stuck, or safe to reclaim.

---

## Stuck Task Detection

The future reliability layer should detect:

- leased task with expired heartbeat
- running task with no progress beyond timeout
- `deferred_batch` with stale provider status
- `awaiting_approval` expired
- `awaiting_verification` stale
- `implementation_done` with no gate pickup
- failed task with retry budget remaining but no retry scheduled

---

## Reclaim Rules

### Safe to Reclaim

- read-only analysis
- non-side-effect summary
- failed before execution started
- expired batch polling task

### Requires Review

- deploy
- migration
- secrets change
- external API mutation
- production data action
- Xcode build may be rerunnable, but artifacts should be versioned

---

## Reliability Outcome

Leases prevent double execution. Heartbeats prevent invisible worker death. Reclaim
rules keep the system from turning transient infrastructure failure into duplicate side
effects.

This phase defines the model only. It does not implement live task leases or worker
heartbeats yet.
