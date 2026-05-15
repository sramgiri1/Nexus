# Hook Registry + Safe Automation Lifecycle

## Purpose

P51 creates a governed hook registry and safe automation lifecycle model for
NEXUS. Hooks are registry and readiness metadata only in this phase.

## Safety Posture

- Hook execution is not enabled.
- Automatic execution is not enabled.
- Scheduler, cron, webhook, provider, tool, MCP, worker, DB write, and project
  mutation paths are not enabled.
- Every hook defaults to disabled.
- Every hook must fail closed.
- Every hook must define scope, owner, trigger, limits, evidence, cost policy
  placeholder, and kill switch metadata.

## P51.1 - Hook Registry Schema

P51.1 defines the hook registry schema, disabled seed registry, initial policy,
checker, and report.

Required hook metadata includes:

- hook ID and label
- owner agent
- scope and optional project ID
- trigger type and trigger source
- enabled state, always false in P51
- allowed and forbidden modes
- data classification
- rate and retry limits
- cost policy placeholder
- required evidence and approvals
- allowed and forbidden actions
- kill switch ID
- fail-closed behavior
- version and status

Seed hooks are disabled templates only:

- Test Failure Classification
- PRD Change Test Gap Proposal
- Validation Pass Evidence Update
- Repeated Failure Escalation
- Docs Drift Reminder

## P51.2 - Trigger Definition Model

P51.2 adds trigger definitions and trigger contracts for safe previewing. The
model documents manual and planned trigger types without activating schedulers,
webhooks, file watchers, workers, provider calls, or external network listeners.

Supported trigger definitions are:

- Manual Preview
- Schedule Placeholder
- File Change Placeholder
- Validation Result Placeholder
- PRD Change Placeholder
- Activity Event Placeholder
- External Webhook Placeholder

Every trigger contract is dry-run only. Trigger previews return a decision,
required evidence, and safety notes, but `wouldExecute` remains false.

## P51.3 - Rate Limits, Retry Limits, and Runtime Guard Model

P51.3 defines limit profiles and guard decisions for future hook execution.
The model is decision-only and does not run hooks.

Guard decisions include:

- `ALLOW_DRY_RUN`
- `BLOCK_DISABLED`
- `BLOCK_RATE_LIMIT`
- `BLOCK_RETRY_LIMIT`
- `REQUIRE_APPROVAL`
- `FAIL_CLOSED`

Seed hooks keep `maxRunsPerDay`, `maxRetries`, `maxRuntimeSeconds`, and cost
limits at zero, so they remain blocked. A synthetic enabled sample may be used
by the checker to prove the dry-run decision path, but the registry itself does
not enable any hook.

## Next Subphase

P51.4 adds loop-risk detection to block unsafe automation cycles before any
future runtime can enable hooks.
