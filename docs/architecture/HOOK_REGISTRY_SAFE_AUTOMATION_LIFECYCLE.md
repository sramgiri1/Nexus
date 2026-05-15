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

## P51.4 - Loop-Risk Detector

P51.4 adds loop-risk detection for future hook enablement decisions. The
detector is metadata-only and checks for unsafe recursion patterns before any
runtime exists.

Detected risks include:

- self-triggering hooks
- two-hook cycles
- validation and repair loops without bounded retries
- missing cooldowns
- missing kill switches
- non-fail-closed definitions
- broad-scope hooks without approval requirements

High and critical loop risks produce a `BLOCK` decision. Low-risk findings can
warn without enabling execution.

## P51.5 - Kill Switch and Safe Disable Model

P51.5 defines global, project-level, and hook-level kill switch metadata. The
model makes disable and re-enable flows preview-only:

- global kill switch: blocks all hook previews for emergency shutdown
- project kill switch: blocks hooks for one project scope
- hook kill switch: blocks a single hook definition

Kill switch decisions win over all other readiness states. Re-enabling requires
review metadata and remains preview-only in P51; no state files are modified by
the kill switch model.

## Next Subphase

P51.6 adds a read-only Command Center Hooks registry view.
