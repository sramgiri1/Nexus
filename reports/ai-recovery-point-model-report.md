# AI Recovery Point Model Report

## Metadata

- Phase: P63.3
- Generated at: 2026-05-18T13:41:24.364Z
- Validation branch: codex/p63-snapshot-contract
- Validation HEAD: 70f993e
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Phase: P63.3
- Recovery point model and deterministic classification only.
- No restore, replay, resume, provider dispatch, tool dispatch, project mutation, DB write, deploy, or queue mutation is enabled.
## States

- inspect_only
- resume_plan_available
- blocked
- stale
- superseded
- not_recoverable
## Checks

| Check | Status | Details |
| --- | --- | --- |
| state covered inspect_only | PASS |  |
| state covered resume_plan_available | PASS |  |
| state covered blocked | PASS |  |
| state covered stale | PASS |  |
| state covered superseded | PASS |  |
| state covered not_recoverable | PASS |  |
| fixture state inspect_only | PASS | actual inspect_only |
| fixture validates inspect_only | PASS |  |
| fixture execution disabled inspect_only | PASS |  |
| fixture state resume_plan_available | PASS | actual resume_plan_available |
| fixture validates resume_plan_available | PASS |  |
| fixture execution disabled resume_plan_available | PASS |  |
| fixture state blocked | PASS | actual blocked |
| fixture validates blocked | PASS |  |
| fixture execution disabled blocked | PASS |  |
| fixture state stale | PASS | actual stale |
| fixture validates stale | PASS |  |
| fixture execution disabled stale | PASS |  |
| fixture state superseded | PASS | actual superseded |
| fixture validates superseded | PASS |  |
| fixture execution disabled superseded | PASS |  |
| fixture state not_recoverable | PASS | actual not_recoverable |
| fixture validates not_recoverable | PASS |  |
| fixture execution disabled not_recoverable | PASS |  |
| recovery chain links children | PASS |  |
| blocked overrides resume eligibility | PASS |  |
## Failures

- None
## Reuse

- Reused P63 snapshot eligibility vocabulary.
- Matched state-machine style by keeping transitions/classification pure and side-effect free.
- No queue, activity, evidence, or phase-status helper was duplicated.
## Result

PASS (26/26)
