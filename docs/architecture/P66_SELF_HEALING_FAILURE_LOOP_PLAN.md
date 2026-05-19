# P66 Self-Healing Failure Loop

P66 prepares governed self-healing foundations without enabling source
mutation, project mutation, provider upload, provider dispatch, tool
execution, code execution, worker execution, automatic retry, DB writes,
deploy, release, external network calls, or provider spend.

Execution contract: `contracts/os-roadmap/p66-execution-contracts.json`.

## Scope

- NEXUS OS only.
- No `projects/**` edits.
- No source mutation, project mutation, provider upload, provider dispatch,
  tool execution, code execution, worker execution, automatic retry, DB writes,
  deploy, release, external network calls, or provider spend.
- No raw JSON, raw logs, raw policy dumps, raw private IDs, fake runnable
  repair actions, or DemoApp outside demo mode in primary UX.

## Required Reuse

P66 must reuse existing helpers before adding new ones:

- `docs/architecture/RETRY_AND_DEAD_LETTER_MODEL.md`
- `docs/architecture/RECOVERY_AND_ROLLBACK_MODEL.md`
- `docs/architecture/INCIDENT_RESPONSE_MODEL.md`
- `worker-runtime/retryTimeoutModel.js`
- `worker-runtime/deadLetterQueue.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center cards, tabs, badges, and route tests

## Subphases

### P66.1 Execution Contract + Safety Split

Create this implementation-grade contract, checker, docs, reports, and phase
status handoff. No self-healing behavior changes.

Status: complete. P66.1 defines the implementation-grade self-healing split and
validation rules while source mutation, project mutation, provider upload,
provider dispatch, tool execution, worker execution, automatic retry, DB writes,
deploy, release, network calls, and provider spend remain disabled.

### P66.2 Failure Classification Contract

Define display-safe failure-class records and validation. Records must show
failure class, severity, source surface, owner capability, evidence refs,
activity refs, and disabled recovery posture.

Status: complete. P66.2 adds display-safe failure classification records that
reuse shared redaction and result envelope helpers. Classifications expose
failure class, severity, source surface, owner capability, current state,
blocked recovery posture, approval requirement, evidence/activity refs, cost
impact, and next action while recovery execution, automatic retry, source
mutation, project mutation, provider/tool execution, DB writes, deploy,
release, network calls, and provider spend remain disabled.

### P66.3 Recovery Plan Preview

Build read-only recovery plan previews for known failure classes. Plans must not
read or mutate project source files.

Status: complete. P66.3 adds preview-only recovery plans built from display-safe
failure classifications and existing retry timeout preview helpers. Plans expose
proposed recovery steps, retry preview, approval requirement, blockers,
evidence/activity refs, cost impact, disabled reason, and next action while
recovery execution, automatic retry, source mutation, project mutation,
provider/tool execution, DB writes, deploy, release, network calls, and provider
spend remain disabled.

### P66.4 Healing Gate + Loop Guard

Add safety, approval, retry, loop, and cost gates for recovery proposals. Gates
must block policy, safety, secret, budget, verification, and ambiguous failures.

Status: complete. P66.4 adds preview-only healing safety gates and loop guards
for recovery plans. Gates expose blocked or review-ready decisions, approval
evidence state, cost approval state, loop guard state, blockers,
evidence/activity refs, disabled reason, and next action while recovery
execution, automatic retry, source mutation, project mutation, provider/tool
execution, DB writes, deploy, release, network calls, and provider spend remain
disabled.

### P66.5 Command Center Self-Healing UX

Expose self-healing readiness and disabled recovery state in Command Center
without enabling runnable repair actions.

Status: complete. P66.5 exposes self-healing readiness on the Command Center
Recovery route with display-only cards for failure class, current state,
proposed recovery, blockers, disabled reason, owner capability,
evidence/activity location, cost impact, and next action. Recovery execution,
automatic retry, source mutation, project mutation, provider/tool execution, DB
writes, deploy, release, network calls, and provider spend remain disabled.

### P66.6 Tests / Checkers / Docs

Aggregate P66 checker coverage and docs before final validation.

Status: planned.

### P66.7 Final Validation

Aggregate checks, close P66, and hand off to P67.

Status: planned.

## Command Center Requirements

Future P66 UX must preserve System, Dark, and Light themes and show:

- failure class
- current state
- proposed recovery
- blockers
- disabled action reason
- owner capability
- evidence/activity location
- cost impact
- next action

Primary UX must not show raw JSON, raw logs, raw policy dumps, internal phase
labels outside OS Roadmap, DemoApp outside demo mode, raw private project IDs,
or fake runnable repair actions.

## Status

P66 is in progress. P66.1 is a contract-only foundation; real self-healing
execution requires later explicit phases and fresh validation.
