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

## Next Subphase

P51.2 adds trigger definition and trigger contract metadata. Planned trigger
types remain non-executable.
