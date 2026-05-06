# Recovery and Rollback Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Recovery Types

- task recovery
- worker recovery
- batch recovery
- evidence recovery
- state transition recovery
- project recovery
- release recovery

---

## Recovery Rules

- recovery must be evidence-linked
- recovery must be audited
- recovery must not bypass the state machine
- recovery must not erase failed state history
- recovery should create a corrective transition or a new task
- recovery of high-risk actions requires approval

Recovery is not “pretend the failure never happened.” It is a traceable corrective path
that preserves what failed and how it was mitigated.

---

## Rollback Types

- code rollback
- config rollback
- deploy rollback
- migration rollback
- provider configuration rollback
- state transition rollback
- release rollback

---

## Rollback Rules

- rollback requires an explicit rollback plan for high-risk tasks
- rollback requires approval for production, deploy, migration, or secrets changes
- rollback produces evidence
- rollback does not delete audit history
- rollback from final state requires `allowRollback` policy and approval evidence
- rollback may create a compensating action rather than reversing state directly

---

## Batch Recovery

Batch reconciliation rules:

- `provider_submitted` must reconcile with the provider result
- `provider_completed` must not be treated as queue `completed` until output is reconciled
- missing output file creates `batch_reconciliation_failure`
- duplicate batch result must be ignored or linked by `custom_id`
- batch retry must avoid duplicate side effects

---

## Reliability Outcome

Recovery handles continuity after failure. Rollback handles deliberate reversal or
compensation when side effects already occurred. Both must remain approval-aware,
evidence-linked, and auditable.

This phase does not implement recovery or rollback runtime behavior yet.
