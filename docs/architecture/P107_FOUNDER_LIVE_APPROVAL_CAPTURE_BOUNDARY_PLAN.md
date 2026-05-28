# P107 Founder Live Approval Capture Boundary Plan

## P107.1 Approval Capture Contract / Schema Baseline

Status: complete

Narrow goal: define the P107 approval capture boundary contract and local schema without enabling approval capture, approval persistence, approval writes, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, or provider spend.

Scope classification: NEXUS_OS_CHANGE.

Allowed files: P107 contract, P107 plan, platform roadmap, README, P107 approval capture boundary schema module, P107.1 checker, P106.7 final checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/resultEnvelope.js, shared/reportWriter.js, shared/checkResultFormatter.js, os-roadmap/updatePhaseStatus.js, and live-ready/founderLiveApprovalRequestQueuePreview.js. Do not duplicate report writers, result envelopes, checker formatters, mode guards, redaction helpers, phase status updaters, or P106 queue preview construction.

Expected exports: P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PHASE, P107_APPROVAL_CAPTURE_BOUNDARY_STATES, P107_APPROVAL_CAPTURE_BLOCKED_FLAGS, P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE, P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS, buildFounderLiveApprovalCaptureBoundarySchema, validateFounderLiveApprovalCaptureBoundarySchema.

Command Center UX: no Command Center source change in P107.1. Future P107.4 may display approval-capture boundary state on Business Build, Agent Flow, and Live Readiness while Chat with NEXUS and Lite remain chat-only.

Theme requirements: no theme source change in P107.1. Future UX must preserve system, dark, and light themes.

Tests/checkers: npm run check:p1071-founder-live-approval-capture-boundary-contract, with P106.7 final checker updated only to accept the P107.1 handoff state.

Docs/roadmap: add P107 plan, platform roadmap section, and README progress entry.

OS phase status update: P107 in progress; P107.1 complete; current P107.1; previous P106.7; next P107.2.

Validation commands:
- npm run check:p1071-founder-live-approval-capture-boundary-contract
- npm run check:p1067-founder-live-approval-request-final
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P107.1 is schema and contract only.
- Approval decisions cannot be captured, persisted, written, or used to unlock execution.
- Runtime admission remains blocked.
- Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, and provider spend remain blocked.
- No project, CareLoop, dashboard source, or dashboard test files changed.

## P107.2 Approval Capture Model

Status: complete

Narrow goal: build deterministic local approval capture review records from P107.1 schema and P106 queue rows without capturing, persisting, writing, or unlocking execution.

Allowed files: P107 contract, P107 plan, platform roadmap, README, P107 capture model module, P107.2 checker, P107.1 checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/resultEnvelope.js, shared/reportWriter.js, shared/checkResultFormatter.js, live-ready/founderLiveApprovalCaptureBoundary.js, and live-ready/founderLiveApprovalRequestQueuePreview.js. Do not duplicate report writers, result envelopes, checker formatters, redaction helpers, phase status updaters, or P107.1 boundary constants.

Expected exports: P107_FOUNDER_LIVE_APPROVAL_CAPTURE_MODEL_PHASE, P107_APPROVAL_CAPTURE_MODEL_STATES, buildFounderLiveApprovalCaptureModel, validateFounderLiveApprovalCaptureModel.

Command Center UX: no Command Center source change in P107.2. P107.4 may render display-safe approval capture review state on Business Build, Agent Flow, and Live Readiness while Chat with NEXUS and Lite remain chat-only.

Theme requirements: no theme source change in P107.2.

Tests/checkers: add npm run check:p1072-founder-live-approval-capture-model and update P107.1 checker only to accept P107.2 handoff state.

Docs/roadmap: update P107 plan, platform roadmap, README, and OS phase status with P107.2 complete and P107.3 next.

OS phase status update: P107 in progress; P107.2 complete; current P107.2; previous P107.1; next P107.3.

Validation commands:
- npm run check:p1072-founder-live-approval-capture-model
- npm run check:p1071-founder-live-approval-capture-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P107.2 is local model only.
- Approval capture, persistence, writes, execution unlock, and runtime admission remain blocked.
- Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, and provider spend remain blocked.
- No project, CareLoop, dashboard source, or dashboard test files changed.

## P107.3 Capture Audit Preview

Status: complete

Narrow goal: assemble a local display-safe approval capture audit preview without writable approvals, persistence, runtime actions, or mutations.

Allowed files: P107 contract, P107 plan, platform roadmap, README, P107 capture audit preview module, P107.3 checker, P107.1/P107.2 checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/resultEnvelope.js, shared/reportWriter.js, shared/checkResultFormatter.js, live-ready/founderLiveApprovalCaptureBoundary.js, and live-ready/founderLiveApprovalCaptureModel.js. Do not duplicate report writers, result envelopes, checker formatters, redaction helpers, phase status updaters, or P107.2 record construction.

Expected exports: P107_FOUNDER_LIVE_APPROVAL_CAPTURE_AUDIT_PREVIEW_PHASE, P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES, buildFounderLiveApprovalCaptureAuditPreview, validateFounderLiveApprovalCaptureAuditPreview.

Command Center UX: no Command Center source change in P107.3. P107.4 may render display-safe capture audit preview on Business Build, Agent Flow, and Live Readiness while Chat with NEXUS and Lite remain chat-only.

Theme requirements: no theme source change in P107.3.

Tests/checkers: add npm run check:p1073-founder-live-approval-capture-audit-preview and update P107.1/P107.2 checkers only to accept P107.3 handoff state.

Docs/roadmap: update P107 plan, platform roadmap, README, and OS phase status with P107.3 complete and P107.4 next.

OS phase status update: P107 in progress; P107.3 complete; current P107.3; previous P107.2; next P107.4.

Validation commands:
- npm run check:p1073-founder-live-approval-capture-audit-preview
- npm run check:p1072-founder-live-approval-capture-model
- npm run check:p1071-founder-live-approval-capture-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P107.3 is local audit preview only.
- Approval capture, persistence, writes, execution unlock, and runtime admission remain blocked.
- Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, and provider spend remain blocked.
- No project, CareLoop, dashboard source, or dashboard test files changed.

## P107.4 Command Center Capture Boundary UX

Status: complete

Narrow goal: render approval capture boundary state on Business Build, Agent Flow, and Live Readiness without capture controls, execution controls, raw data dumps, private IDs, DemoApp leakage, or fake runnable actions.

Allowed files: P107 contract, P107 plan, platform roadmap, README, dashboard Business Build data model, Command Center page, focused route tests, P107.4 checker, P107.3 checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse existing dashboard card/page-summary/grid/safety-row patterns, buildBusinessBuildViewModel, focused routes.spec.js safety tests, shared/reportWriter.js, shared/checkResultFormatter.js, and P107.3 audit preview semantics. Do not duplicate report writers, route matrices, mode guards, redaction helpers, or unrelated UI card systems.

Expected exports/data: buildFounderLiveApprovalCaptureBoundaryDisplayModel on dashboard data; founderLiveApprovalCaptureBoundary inside buildBusinessBuildViewModel; FounderLiveApprovalCaptureBoundaryCard in CommandCenterV2.

Command Center UX: render the approval capture boundary card on Business Build, Agent Flow, and Live Readiness only. The card must show current state, next action, blockers, disabled reason, owner capability, evidence/activity location, cost impact, audit rows, and blocked safety rows. Chat with NEXUS and Lite remain chat-only/clean.

Theme requirements: focused Playwright coverage must verify the card in dark, light, and system themes on Business Build.

Tests/checkers: add npm run check:p1074-command-center-approval-capture-boundary-ux; focused Playwright route coverage; dashboard build; prior P107 checkers.

Docs/roadmap: update P107 plan, platform roadmap, README, and OS phase status with P107.4 complete and P107.5 next.

OS phase status update: P107 in progress; P107.4 complete; current P107.4; previous P107.3; next P107.5.

Validation commands:
- npm run check:p1074-command-center-approval-capture-boundary-ux
- cd dashboard && npx playwright test tests/routes.spec.js --grep "Founder live approval capture boundary appears on non-chat founder routes"
- cd dashboard && npm run build
- npm run check:p1073-founder-live-approval-capture-audit-preview
- npm run check:p1072-founder-live-approval-capture-model
- npm run check:p1071-founder-live-approval-capture-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P107.4 is display-only.
- Chat with NEXUS and Lite stay clean/chat-only.
- No capture controls, execution controls, raw dumps, private IDs, DemoApp, or fake runnable actions are exposed.
- Approval capture, persistence, writes, execution unlock, and runtime admission remain blocked.
- No project or CareLoop files changed.

## P107.5 Tests / Checkers

Status: complete

Narrow goal: aggregate P107 checker and route-safety coverage without changing runtime behavior.

Allowed files: P107 contract, P107 plan, platform roadmap, README, P107.5 aggregate checker, P107.1/P107.4 checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/reportWriter.js, shared/checkResultFormatter.js, buildBusinessBuildViewModel, existing P107 reports, and focused routes.spec.js coverage. Do not duplicate report writers, route matrices, UI cards, redaction helpers, or checker formatters.

Expected data: reports/p1075-founder-live-approval-capture-validation-report.md with aggregate checks for P107.1-P107.4 scripts, reports, route coverage, Command Center capture boundary UX, phase status, forbidden file scope, safety wording, and non-runnable posture.

Command Center UX: no Command Center source change in P107.5. Preserve P107.4 capture boundary placement and chat-only boundaries.

Theme requirements: no theme source change in P107.5. Retain P107.4 focused dark/light/system route coverage.

Tests/checkers: add npm run check:p1075-founder-live-approval-capture-validation; rerun P107.4 checker, focused Playwright route coverage, dashboard build, prior P107 checkers, OS phase status, phase validation coverage, and diff check.

Docs/roadmap: update P107 plan, platform roadmap, README, and OS phase status with P107.5 complete and P107.6 next.

OS phase status update: P107 in progress; P107.5 complete; current P107.5; previous P107.4; next P107.6.

Validation commands:
- npm run check:p1075-founder-live-approval-capture-validation
- npm run check:p1074-command-center-approval-capture-boundary-ux
- cd dashboard && npx playwright test tests/routes.spec.js --grep "Founder live approval capture boundary appears on non-chat founder routes"
- cd dashboard && npm run build
- npm run check:p1073-founder-live-approval-capture-audit-preview
- npm run check:p1072-founder-live-approval-capture-model
- npm run check:p1071-founder-live-approval-capture-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P107.5 is validation only.
- P107.4 UX is preserved without new runtime behavior.
- Approval capture, persistence, writes, execution unlock, and runtime admission remain blocked.
- No project, CareLoop, dashboard source, or dashboard test files changed.

## P107.6 Docs / Roadmap

Status: planned

Narrow goal: close P107 docs, README, platform roadmap, and phase status evidence without behavior changes.

Allowed files: P107 contract, P107 plan, platform roadmap, README, P107.6 docs checker, P107.1/P107.5 checker handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/reportWriter.js, shared/checkResultFormatter.js, existing P107 reports, README/platform roadmap wording, and OS phase status updates. Do not duplicate report writers, phase status updaters, route matrices, UI cards, or redaction helpers.

Expected data: reports/p1076-founder-live-approval-capture-docs-report.md with docs closure checks for P107 plan, contract, README, platform roadmap, blocked safety wording, Command Center placement, phase status, and forbidden file scope.

Command Center UX: no Command Center source change in P107.6. Preserve P107.4 capture boundary placement and chat-only boundaries.

Theme requirements: no theme source change in P107.6.

Tests/checkers: add npm run check:p1076-founder-live-approval-capture-docs; rerun P107.5/P107.4/prior checkers, OS phase status, phase validation coverage, and diff check.

Docs/roadmap: close P107 plan, platform roadmap, README, and OS phase status with P107.6 complete and P107.7 next.

OS phase status update: P107 in progress; P107.6 complete; current P107.6; previous P107.5; next P107.7.

Validation commands:
- npm run check:p1076-founder-live-approval-capture-docs
- npm run check:p1075-founder-live-approval-capture-validation
- npm run check:p1074-command-center-approval-capture-boundary-ux
- npm run check:p1073-founder-live-approval-capture-audit-preview
- npm run check:p1072-founder-live-approval-capture-model
- npm run check:p1071-founder-live-approval-capture-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P107.6 is docs/checker only.
- Docs do not overstate approval capture/persistence or execution readiness.
- Approval capture, persistence, writes, execution unlock, and runtime admission remain blocked.
- No project, CareLoop, dashboard source, or dashboard test files changed.

## P107.7 Final Validation

Status: planned

Narrow goal: run final P107 validation, close the parent phase, stamp commits, and hand off to the next planned phase.

Allowed files: P107 contract, P107 plan, platform roadmap, README, P107.7 final checker, P107.1/P107.6/check-os-phase-status handoff compatibility, package script, OS phase status files, and generated validation reports.

Forbidden files: projects/**, careloop/**, dashboard/src/**, dashboard/tests/**, providers/**, tools/**, worker-runtime/**, deploy/**, release/**, exports/**, packages/**, .env*.

Reuse check: reuse shared/reportWriter.js, shared/checkResultFormatter.js, buildBusinessBuildViewModel, existing P107 reports, focused routes.spec.js coverage, and OS phase status files. Do not duplicate report writers, phase status updaters, route matrices, UI cards, redaction helpers, or checker formatters.

Expected data: reports/p1077-founder-live-approval-capture-final-report.md with final checks for P107 scripts, prior reports, contract closure, Command Center capture UX retention, route safety, phase status, commit stamping, raw/private ID avoidance, raw dump avoidance, DemoApp absence, and blocked live authority.

Command Center UX: no Command Center source change in P107.7. Preserve P107.4 capture boundary card and chat-only boundaries.

Theme requirements: no theme source change in P107.7. Retain P107.4 focused dark/light/system route coverage.

Tests/checkers: add npm run check:p1077-founder-live-approval-capture-final; rerun all P107 checkers, focused Playwright route coverage, dashboard build, OS phase status, phase validation coverage, and diff check.

Docs/roadmap: close P107 plan, platform roadmap, README, and OS phase status with P107 and P107.7 complete and P108 next.

OS phase status update: P107 complete; P107.7 complete; current P107.7; previous P107.6; next P108.

Validation commands:
- npm run check:p1077-founder-live-approval-capture-final
- npm run check:p1076-founder-live-approval-capture-docs
- npm run check:p1075-founder-live-approval-capture-validation
- npm run check:p1074-command-center-approval-capture-boundary-ux
- cd dashboard && npx playwright test tests/routes.spec.js --grep "Founder live approval capture boundary appears on non-chat founder routes"
- cd dashboard && npm run build
- npm run check:p1073-founder-live-approval-capture-audit-preview
- npm run check:p1072-founder-live-approval-capture-model
- npm run check:p1071-founder-live-approval-capture-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check

Final safety checks:
- P107.7 is validation/status/docs only.
- Approval capture, persistence, writes, execution unlock, and runtime admission remain blocked.
- Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package action, network call, and provider spend remain blocked.
- P108 is planned only.
- No project, CareLoop, dashboard source, or dashboard test files changed.
