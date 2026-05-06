# Retry and Dead Letter Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Retry Principle

Retries are controlled, evidence-linked, bounded, and failure-class aware.

NEXUS should never "just try again" without understanding what failed, whether retry is
safe, and whether the previous attempt could already have caused side effects.

---

## Retry Policy

### `transient_failure`

- retry allowed
- exponential backoff
- max attempts: 3

### `provider_failure`

- retry allowed if there is no safety, budget, permission, or secret failure
- fallback allowed only if policy permits
- max attempts: 2

### `batch_failure`

- retry submit, poll, and reconcile separately
- no duplicate completion
- requires provider idempotency where available

### `runtime_failure`

- retry allowed for safe commands
- Xcode retries allowed if build or test command is idempotent
- deploy or migration requires approval before retry

### `tool_failure`

- retry allowed if deterministic tool failure is environmental
- no retry if the tool returns a policy failure

### `verification_failure`

- no automatic retry as pass
- route remediation to the owner
- re-run only after remediation evidence exists

### `policy_block`

- no retry
- requires policy change or scoped approval

### `approval_block`

- no retry
- waits for approval, rejection, or expiry

### `secret_or_security_failure`

- no retry
- requires security incident or human review

### `data_protection_failure`

- no retry
- requires redaction or policy fix

### `contract_failure`

- no retry
- requires contract correction

### `state_transition_failure`

- no retry
- requires state machine or contract correction

---

## Dead Letter Queue

Task enters the dead-letter queue when:

- max attempts exceeded
- unrecoverable policy, security, or data failure
- repeated provider failure
- invalid contract cannot be corrected automatically
- stuck task cannot be safely reclaimed
- batch reconciliation fails repeatedly

### DLQ Record Fields

- `taskId`
- `projectId`
- `failureClass`
- `reason`
- `attempts`
- `lastError`
- `evidenceIds`
- `owner`
- `recommendedAction`
- `createdAt`

---

## Auto-Heal Limits

- bounded auto-heal only
- no auto-heal for security, secret, data, or policy blocks
- no auto-heal for release decisions
- no auto-heal for failed gates without remediation
- no auto-heal for deploy, migration, or secrets changes without approval

---

## Reliability Outcome

Retries should absorb transient infrastructure noise without hiding repeated failure.
The dead-letter queue should preserve unrecoverable work for human or operator follow-up
instead of silently discarding it.

This phase defines policy and architecture only. It does not implement retry or DLQ
runtime behavior yet.
