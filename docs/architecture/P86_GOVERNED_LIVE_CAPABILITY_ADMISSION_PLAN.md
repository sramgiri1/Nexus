# P86 Governed Live Capability Admission Plan

P86 moves NEXUS from local founder planning toward live capability admission by
making every unlock explicit, evidence-backed, and independently testable.

P86 does not broadly enable provider/model calls, agent dispatch, tool
execution, worker execution, project mutation, DB writes, deploy, release,
export, package creation, or provider spend. Each live action remains blocked
until a later subphase explicitly scopes and validates it.

## P86.1 Schema / Policy / Contract

Goal: define the governed live capability admission inventory.

Status: complete. P86.1 adds `governedLiveCapabilityAdmission`, a result
envelope that reuses existing provider/tool, worker, project/DB, deploy/release,
local project creation, and founder task-board admission gates. It produces
display-safe capability rows with owner, state, next action, blockers, evidence,
activity location, cost impact, and all runtime flags set to false.

Validation: `npm run check:p861-live-capability-admission`.

## P86.2 Capability State Resolver

Goal: resolve P86.1 capability rows into operator-facing activation states.

Status: planned. P86.2 should create deterministic state resolution without
executing runtime actions.

## P86.3 Operator Approval Queue

Goal: add local approval queue records with expiry, rollback, and validation
requirements.

Status: planned. P86.3 should remain local and non-executing.

## P86.4 Command Center UX

Goal: show governed live capability state in Command Center.

Status: planned. P86.4 should preserve dark, light, and system themes, avoid raw
IDs, and avoid fake runnable actions.

## P86.5 Activation Dry Run

Goal: add activation intent dry-run records.

Status: planned. P86.5 should preview activation requirements without enabling
providers, agents, tools, workers, project mutation, DB writes, deploy, package,
or spend.

## P86.6 Tests / Docs / Roadmap

Goal: aggregate P86 validation evidence.

Status: planned.

## P86.7 Final Validation

Goal: close P86 and hand off to the next explicitly scoped live activation
phase.

Status: planned.

## Reuse Check

P86 must reuse:

- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/redaction.js` when display redaction is needed
- `os-roadmap/updatePhaseStatus.js` when phase updates are scripted
- existing `live-ready/*Admission.js` gates
- existing Command Center tabs/cards/badges when UX begins
- existing evidence/audit/activity helpers when records are introduced

P86 must not duplicate report writers, mode guards, redaction helpers, check
formatters, phase status updaters, route matrices, UI status components, or
evidence/activity appenders.

## Safety Boundary

P86.1 is admission inventory only. It does not call providers, dispatch agents,
execute tools or workers, create or mutate project files, write DB state, make
network calls, deploy, release, export, package, or spend.
