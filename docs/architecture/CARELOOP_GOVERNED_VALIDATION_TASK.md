# CareLoop Governed Validation Task

## Purpose

P28-LOCAL creates the first governed CareLoop task through NEXUS. A SHEPHERD execution plan
is produced for the CareLoop backend, routed through identity, agent context, traffic plane,
state machine, and local write boundary. No source files are mutated, no commands are executed,
no providers are called.

## Why This Phase Follows CareLoop Inventory

P27-LOCAL confirmed CareLoop backend is `READY_FOR_VALIDATION` and iOS is
`READY_FOR_XCODE_INVENTORY`. P27 recommended SHEPHERD with capability `orchestration.plan_flow`
as the next task. P28 materializes that recommendation as a governed, typed task contract that
enters the NEXUS runtime path.

## First Governed CareLoop Task

The task contract at `contracts/careloop/backend-validation-task-contract.json` specifies:

- Title: "Create CareLoop backend validation plan through NEXUS"
- Source agent: NEXUS
- Target agent: SHEPHERD
- Capability: `orchestration.plan_flow`
- Risk level: medium
- `mutationAllowed: false`
- `buildExecutionAllowed: false`
- `providerCallsAllowed: false`
- `networkCallsAllowed: false`

The task is added to `local-state/runtime/tasks.json` and transitions through
`queued -> running -> implementation_done` via the local state machine.

## What SHEPHERD Creates

The validation plan artifact at `reports/careloop-validation-plan.json` contains:

- Backend readiness status from P27 snapshot
- Observed backend scripts and structure (no source content)
- Three safe next checks — all `executionNow: false`
- Required future evidence list
- Blocked-now list (no mutation, install, test, DB, provider, or network)
- Recommended next task: "Classify CareLoop backend validation commands for controlled execution"

## No Source Mutation

No CareLoop source files are read deeply, modified, or executed. The validation plan references
the P27 inventory snapshot only (scripts list, directory presence). Schema content, source code,
.env, and node_modules are not accessed.

## No Build or Test Execution

No `npm install`, `npm test`, `prisma migrate`, or `xcodebuild` commands are run. All three
safe next checks in the plan have `executionNow: false` and are deferred to future governed
phases after command allowlist decisions are made.

## No Provider, Network, DB, or API

All provider, network, database, and API server flags are false throughout the plan, task
contract, and runtime records.

## Local Task, Evidence, Audit, and Runtime Records

The following records are written to the local NEXUS runtime:

| Record | File | Details |
|---|---|---|
| Task record | `local-state/runtime/tasks.json` | `taskType: validation_planning`, abstract project ID |
| Evidence | `local-state/runtime/evidence.jsonl` | `type: validation_planning_completed`, `redacted: true` |
| Audit | `local-state/runtime/audit.jsonl` | `eventType: validation_plan_created`, `redacted: true` |
| Runtime event | `local-state/runtime/events.jsonl` | `eventType: governed_validation_planning_completed`, `redacted: true` |

All runtime records use abstract identifiers (`private-project-01`) to satisfy the local write
boundary. Private project names do not appear in runtime files.

## How This Proves CareLoop Can Enter the NEXUS Governed Path

The task transitions `queued -> running -> implementation_done` via the local state machine,
using `validateLocalTaskTransition` from `local-state/stateTransitionGuard.js`. The transition
is validated against the state machine before committing. This proves the CareLoop work item
can move through the NEXUS governed execution path without bypassing contracts, evidence, or
audit requirements.

## Reports

- `reports/careloop-validation-plan.md` — human-readable governed validation plan
- `reports/careloop-validation-plan.json` — structured plan for NEXUS consumption
- `contracts/careloop/backend-validation-task-contract.json` — typed task contract

## P29 Status

P29-LOCAL classified CareLoop backend package scripts by execution safety without executing
any command. The AUDITOR `verification.code_quality_gate` task produced a machine-readable
command classification report. Recommended first execution: `test` in P30.

## Next Phase

P30-LOCAL will execute the `test` script through the controlled local execution path after
verifying dependency availability and confirming the command is in the NEXUS command allowlist.

## Public / Demo Surfaces

Public and demo mode surfaces remain DemoApp-only. CareLoop is not referenced in:
- `README.md` public sections
- Dashboard demo data
- Demo artifacts
- `docs/architecture/AGENTIC_OS_ARCHITECTURE.md` public sections
- Any public-facing dashboard surface
