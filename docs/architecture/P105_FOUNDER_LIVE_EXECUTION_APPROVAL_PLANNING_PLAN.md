# P105 Founder Live Execution Approval Planning Plan

## P105.1 Approval Planning Contract / Schema Baseline

Phase: P105
Subphase: P105.1
Status: complete
Scope classification: NEXUS_OS_CHANGE

Goal: define the local approval-planning contract and schema for future governed live execution approvals without enabling approval capture, runtime admission, execution, mutation, deploy, network, or spend authority.

Why this is needed: P104 defines the execution boundary. P105 defines what a governed approval plan must prove before a later phase can consider live execution.

User/operator impact: operators can see the required approval gates, blocked runtime transitions, evidence refs, validation commands, owner capability, disabled reason, and cost posture before any execution path is introduced.

Command Center impact: no UI source change in P105.1. Future P105.4 must render approval-planning state on Business Build, Agent Flow, and Live Readiness while Chat with NEXUS and Lite remain chat-only.

Safety impact: approvals cannot unlock execution. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package creation, network calls, and provider spend remain blocked.

Cost impact: local schema, checker, docs, and reports only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.

Project/OS scope: NEXUS OS only.

Files expected to change:
- `contracts/os-roadmap/p105-founder-live-execution-approval-planning-contracts.json`
- `docs/architecture/P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PLANNING_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `live-ready/founderLiveExecutionApprovalPlanning.js`
- `scripts/check-p1051-founder-live-execution-approval-planning-contract.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1051-founder-live-execution-approval-planning-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Expected exports, schemas, and data shapes:
- `P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PHASE`
- `P105_EXECUTION_APPROVAL_STATES`
- `P105_EXECUTION_APPROVAL_BLOCKED_FLAGS`
- `P105_EXECUTION_APPROVAL_REQUIRED_GATES`
- `P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS`
- `buildFounderLiveExecutionApprovalPlanningSchema`
- `validateFounderLiveExecutionApprovalPlanningSchema`
- Result envelope with `schemaVersion`, `currentState`, `sourceBoundaryPhase`, `approvalPlanShape`, `approvalGateShape`, `runtimeTransitionShape`, `requiredGates`, `forbiddenActions`, `approvalGateCount`, `nextAction`, `blockers`, `disabledReason`, `ownerCapability`, `evidenceRefs`, `activityLocation`, `costImpact`, `commandCenterVisible`, and all approval/runtime/execution flags false.

Safety rules:
- Do not capture approvals.
- Do not persist approval writes.
- Do not unlock execution from approval state.
- Do not dispatch agents or run workers/tools.
- Do not mutate project source or hosted DB state.
- Do not deploy, release, export, package, use network calls, or spend.
- Do not expose raw private IDs, unprocessed data dumps, or fake runnable actions.

Reuse check:
- Reuse `shared/resultEnvelope.js` for schema result envelopes.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js` for checker output.
- Reuse P104 execution boundary blocked flags and evidence lists from `live-ready/founderLiveExecutionBoundarySchema.js`.
- Do not duplicate report writers, result envelopes, redaction helpers, checker formatters, phase status updaters, or dashboard card systems.

UX update:
- No Command Center source update in P105.1.
- Future UX belongs on Business Build, Agent Flow, and Live Readiness.
- Chat with NEXUS and Lite remain chat-only.

Dark/light/system theme requirements:
- No theme source change in P105.1.
- Future P105 UX must preserve existing system, dark, and light theme behavior.

Playwright tests:
- No Playwright change in P105.1 because no UI files change.
- P105.4 must add focused Command Center route coverage.

Checker updates:
- Add `check:p1051-founder-live-execution-approval-planning-contract`.
- Update `check:os-phase-status` to recognize P105.1-P105.7.

Docs/README/roadmap:
- Add this P105 plan.
- Update README latest status.
- Update platform roadmap with P105.1 complete and P105.2 next.

OS phase status update:
- P105 in progress.
- P105.1 complete.
- P105.2-P105.7 planned.
- Current phase P105.1, previous P104.7, next P105.2.

Validation commands:
- `npm run check:p1051-founder-live-execution-approval-planning-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks:
- Confirm P105.1 is schema and contract only.
- Confirm approvals cannot unlock execution.
- Confirm no project files changed.
- Confirm no Command Center chat or Lite clutter was added.
- Confirm no raw private IDs, unprocessed data dumps, fake runnable actions, or unsafe authority.

Git add/commit/push commands:
- `git add <allowed P105.1 files>`
- `git commit -m "feat(nexus): define founder live approval planning"`
- `git commit -m "chore(nexus): stamp p105 approval planning status"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers
- Docs/README/roadmap updates
- OS phase status update
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

## P105.2 Approval Plan Model

Status: planned

Narrow goal: build deterministic local approval-plan records from P104 execution-boundary records without approval capture or execution.

Expected scope: local model, model checker, contract/status/docs updates, and reports only.

Validation commands: to be defined in the P105.2 subphase plan before implementation.

## P105.3 Dry-Run Review Packet

Status: planned

Narrow goal: create a display-safe review packet that summarizes approval gates and blocked runtime transitions without submitting approvals.

Expected scope: local packet builder, checker, contract/status/docs updates, and reports only.

Validation commands: to be defined in the P105.3 subphase plan before implementation.

## P105.4 Command Center Approval Planning UX

Status: planned

Narrow goal: render approval-planning state on the relevant founder pages without approval or execution controls.

Expected UX: Business Build, Agent Flow, and Live Readiness show current state, next action, blockers, disabled reason, owner capability, evidence/activity, validation commands, and cost impact. Chat with NEXUS and Lite remain chat-only.

Validation commands: include focused Playwright route coverage and dashboard build.

## P105.5 Tests / Checkers

Status: planned

Narrow goal: aggregate P105 checker and route-safety coverage without changing runtime behavior.

Validation commands: include aggregate checker, retained focused Playwright coverage, OS phase status, phase validation coverage, and diff check.

## P105.6 Docs / Roadmap

Status: planned

Narrow goal: close P105 docs, README, platform roadmap, and phase status evidence without behavior changes.

Validation commands: include docs checker, OS phase status, phase validation coverage, and diff check.

## P105.7 Final Validation

Status: planned

Narrow goal: run final P105 validation, close the parent phase, stamp commits, and hand off to the next planned phase.

Validation commands: include final checker, all P105 checkers, focused Playwright coverage, dashboard build, OS phase status, phase validation coverage, and diff check.
