# P106 Founder Live Approval Request Boundary Plan

## P106.1 Approval Request Contract / Schema Baseline

Status: complete

Narrow goal: define the P106 approval request boundary contract and local schema without enabling approval request submission, approval capture, approval persistence, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, or provider spend.

Scope classification: NEXUS_OS_CHANGE.

Allowed files: P106 contract, P106 plan, platform roadmap, README, P106 approval request boundary schema module, P106.1 checker, P105.7 final checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/resultEnvelope.js, shared/reportWriter.js, shared/checkResultFormatter.js, os-roadmap/updatePhaseStatus.js, and live-ready/founderLiveExecutionApprovalPlanning.js. Do not duplicate report writers, result envelopes, checker formatters, mode guards, redaction helpers, or phase status updaters.

Expected exports: P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PHASE, P106_APPROVAL_REQUEST_BOUNDARY_STATES, P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS, P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE, P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS, buildFounderLiveApprovalRequestBoundarySchema, validateFounderLiveApprovalRequestBoundarySchema.

Command Center UX: no Command Center source change in P106.1. Future P106.4 may display approval-request boundary state on Business Build, Agent Flow, and Live Readiness while Chat with NEXUS and Lite remain chat-only.

Theme requirements: no theme source change in P106.1. Future UX must preserve system, dark, and light themes.

Tests/checkers: npm run check:p1061-founder-live-approval-request-boundary-contract, with P105.7 final checker updated only to accept the P106.1 handoff state.

Docs/roadmap: add P106 plan, platform roadmap section, and README progress entry.

OS phase status update: P106 in progress; P106.1 complete; current P106.1; previous P105.7; next P106.2.

Validation commands:
- npm run check:p1061-founder-live-approval-request-boundary-contract
- npm run check:p1057-founder-live-execution-approval-final
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P106.1 is schema and contract only.
- Approval requests cannot be submitted, captured, persisted, or used to unlock execution.
- Runtime admission remains blocked.
- Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, and provider spend remain blocked.
- No project, CareLoop, dashboard source, or dashboard test files changed.

## P106.2 Approval Request Model

Status: complete

Narrow goal: build deterministic local approval request records from P105 review packets without submitting, capturing, persisting, or unlocking execution.

Allowed files: P106 contract, P106 plan, platform roadmap, README, P106 approval request model module, P106.2 checker, P106.1 checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/resultEnvelope.js, shared/reportWriter.js, shared/checkResultFormatter.js, live-ready/founderLiveApprovalRequestBoundary.js, and live-ready/founderLiveExecutionApprovalReviewPacket.js. Do not duplicate report writers, result envelopes, checker formatters, mode guards, redaction helpers, phase status updaters, approval boundary constants, or P105 review-packet construction.

Expected exports: P106_FOUNDER_LIVE_APPROVAL_REQUEST_MODEL_PHASE, P106_APPROVAL_REQUEST_MODEL_STATES, buildFounderLiveApprovalRequestModel, validateFounderLiveApprovalRequestModel.

Command Center UX: no Command Center source change in P106.2. P106.4 may render the display-safe approval request state on Business Build, Agent Flow, and Live Readiness while Chat with NEXUS and Lite remain chat-only.

Theme requirements: no theme source change in P106.2. Future UX must preserve system, dark, and light themes.

Tests/checkers: npm run check:p1062-founder-live-approval-request-model; update P106.1 checker only to accept P106.2 handoff state.

Docs/roadmap: update P106 plan, platform roadmap, README, and OS phase status with P106.2 complete and P106.3 next.

OS phase status update: P106 in progress; P106.2 complete; current P106.2; previous P106.1; next P106.3.

Validation commands:
- npm run check:p1062-founder-live-approval-request-model
- npm run check:p1061-founder-live-approval-request-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P106.2 is local model only.
- Approval request submission, capture, persistence, and writes remain blocked.
- Approval requests cannot unlock execution or runtime admission.
- Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, and provider spend remain blocked.
- P106.3 remains planned.
- No project, CareLoop, dashboard source, or dashboard test files changed.

## P106.3 Request Queue Preview

Status: planned

Narrow goal: assemble a local display-safe approval request queue preview without writable approvals or runtime actions.

Validation commands: include preview checker, prior P106 checkers, OS phase status, phase validation coverage, and diff check.

## P106.4 Command Center Approval Request UX

Status: planned

Narrow goal: render approval request boundary state on Business Build, Agent Flow, and Live Readiness without approval controls, execution controls, raw data dumps, private IDs, DemoApp leakage, or fake runnable actions.

Validation commands: include focused Playwright route coverage, dashboard build, prior P106 checkers, OS phase status, phase validation coverage, and diff check.

## P106.5 Tests / Checkers

Status: planned

Narrow goal: aggregate P106 checker and route-safety coverage without changing runtime behavior.

Validation commands: include aggregate checker, retained focused Playwright coverage, dashboard build, OS phase status, phase validation coverage, and diff check.

## P106.6 Docs / Roadmap

Status: planned

Narrow goal: close P106 docs, README, platform roadmap, and phase status evidence without behavior changes.

Validation commands: include docs checker, OS phase status, phase validation coverage, and diff check.

## P106.7 Final Validation

Status: planned

Narrow goal: run final P106 validation, close the parent phase, stamp commits, and hand off to the next planned phase.

Validation commands: include final checker, all P106 checkers, focused Playwright coverage, dashboard build, OS phase status, phase validation coverage, and diff check.
