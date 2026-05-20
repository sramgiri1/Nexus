# P87 Explicit Live Activation Unlocks Plan

P87 turns P86 live admission evidence into explicit unlock contracts. It does
not introduce a broad live-mode switch. Every live lane must be scoped,
validated, and closed in its own subphase before execution can be considered.

Provider/model calls, agent dispatch, tool execution, worker execution, project
creation, project mutation, DB writes, network calls, deploy, release, export,
package creation, and provider spend remain blocked unless a later P87 subphase
explicitly allows one narrow lane.

## P87.1 Explicit Activation Contract

Goal: define the contract data shape for explicit live activation lanes.

Status: complete. P87.1 adds `explicitLiveActivationContract`, reusing P86
activation dry-run records to produce display-safe activation lanes with owner,
state, required gates, required evidence, blockers, next action, disabled
reason, rollback requirement, validation commands, evidence, activity, cost
impact, and all runtime flags set to false.

Validation: `npm run check:p871-explicit-live-activation-contract`.

## P87.2 Secret / Provider Readiness

Goal: validate redacted secret and provider profile readiness without provider
calls or spend.

Status: complete. P87.2 adds `secretProviderReadiness`, a redacted readiness
envelope for provider call and spend lanes. It records secret-reference,
provider-policy, budget, approval, redaction, activity, cost, rollback, and
validation requirements while confirming no `.env` files are read and no
provider/model calls or spend occur.

Validation: `npm run check:p872-secret-provider-readiness`.

## P87.3 Local Agent Dispatch Admission

Goal: define local agent dispatch admission without dispatching agents.

Status: complete. P87.3 adds `localAgentDispatchAdmission`, reusing founder
agent plan admission, task-board admission, and secret/provider readiness
helpers. It records local dispatch lanes, scoped context packet shape, required
before-dispatch gates, blockers, validation commands, evidence, activity, cost,
and disabled reasons while all dispatch and execution flags remain false.

Validation: `npm run check:p873-local-agent-dispatch-admission`.

## P87.4 Generated Project Workspace Admission

Goal: define generated project workspace admission without project source
mutation.

Status: complete. P87.4 adds `generatedProjectWorkspaceAdmission`, reusing
local project creation admission and local agent dispatch admission helpers. It
records generated workspace boundaries, allowed future root, forbidden roots,
required gates, blockers, next action, disabled reason, owner, evidence,
activity, and cost posture while project creation, project mutation, generated
app `Sources/Tests` mutation, DB writes, deploy, package, network calls, and
spend remain disabled.

Validation: `npm run check:p874-generated-project-workspace-admission`.

## P87.5 Command Center Live Unlock UX

Goal: expose explicit live unlock state in Command Center without runnable
actions.

Status: complete. P87.5 adds a Live Unlocks tab to Command Center Live
Readiness. The tab shows P87.1-P87.4 unlock lanes with current state, next
action, blockers, disabled reason, owner, evidence, activity, and cost posture
while exposing no runnable actions.

Validation: `npm run check:p875-command-center-live-unlock-ux`.

## P87.6 Tests / Docs / Roadmap

Goal: aggregate P87 validation evidence.

Status: complete. P87.6 adds `check:p876-tests-docs-roadmap`, an aggregation
checker for P87.1-P87.5 scripts, reports, package scripts, docs,
roadmap/status records, Command Center Live Unlocks coverage, and safety
posture.

Validation: `npm run check:p876-tests-docs-roadmap`.

## P87.7 Final Validation

Goal: close P87 and hand off to the next scoped phase.

Status: planned.

## Reuse Check

P87 must reuse:

- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/redaction.js` when display redaction is needed
- `os-roadmap/updatePhaseStatus.js` when phase updates are scripted
- existing P86 governed live admission, approval queue, and activation dry-run
  records
- existing Command Center Live Readiness tabs/cards/badges when UX begins
- existing evidence/audit/activity/cost helpers when records are introduced

P87 must not duplicate report writers, mode guards, redaction helpers, check
formatters, phase status updaters, route matrices, UI status components, or
evidence/activity appenders.

## Safety Boundary

P87.1 is contract-only. It does not call providers, dispatch agents, execute
tools or workers, create or mutate project files, write DB state, make network
calls, deploy, release, export, package, or spend.
