# P103 Founder Live Work Admission Plan

P103 turns P102 founder live handoff artifacts into governed local work
admission records for operator review. It does not enable provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
deploy, release, export, package creation, network calls, or provider spend.

## Subphase Plan

### P103.1 Contract / Scope / Safety Baseline

Status: complete.

- Narrow goal: define P103 founder live work admission scope, safety baseline,
  subphase split, expected local data shapes, validation requirements, and
  roadmap handoff before behavior changes.
- Starting branch and expected base commit:
  `codex/nexus-e2e-phase-validation` at `5411b099`.
- Allowed files:
  `contracts/os-roadmap/p103-founder-live-work-admission-contracts.json`,
  this plan, `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`,
  `scripts/check-p1031-founder-live-work-admission-contract.js`,
  `scripts/check-os-phase-status.js`, `package.json`,
  `os-roadmap/phase-status.json`, `os-roadmap/nexus-phases.json`, and generated
  validation reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Exact files/modules created or updated: the P103 contract, this plan,
  platform roadmap, P103.1 checker, OS phase checker, package script, and OS
  roadmap/status JSON.
- Expected exports, schemas, and data shapes: future P103 work must expose
  `P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE`,
  `P103_WORK_ADMISSION_STATES`, `P103_WORK_ADMISSION_SAFETY_FLAGS`, and local
  work admission envelopes with source handoff phase, admitted/blocked counts,
  work admissions, approval boundary, next action, blockers, disabled reason,
  owner capability, evidence/activity, cost impact, Command Center visibility,
  and unsafe runtime flags false.
- Command Center UX requirements: no UI source change in P103.1. Future P103 UX
  must show work admission state, current state, next action, blockers,
  disabled reason, owner capability, evidence/activity, cost impact, and
  validation commands without raw JSON, raw logs, raw policy dumps, raw private
  IDs, demo leakage, or runnable execution controls.
- Dark/light/system theme requirements: no theme source change in P103.1;
  future UX must preserve all three themes.
- Playwright tests: no Playwright update in P103.1 because no UI files change.
  P103.4 must add focused route coverage.
- Checker updates: `check:p1031-founder-live-work-admission-contract` and
  P103/P104 phase status acceptance.
- Docs/README/roadmap updates: this plan and platform roadmap section.
- OS phase status update: P103 in progress, P103.1 complete, current P103.1,
  previous P102.7, next P103.2, P104 planned placeholder.
- Validation commands: `npm run check:p1031-founder-live-work-admission-contract`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: no project files changed; no provider/model call, agent
  dispatch, worker/tool execution, DB mutation, deploy, release, export,
  package, network, or spend path added; P103.2 remains planned.
- Git add/commit/push commands: stage the allowed P103.1 files, commit
  `feat(nexus): define founder live work admission contract`, then push the
  branch.
- Final response checklist: branch, commit, changed files, implementation,
  Command Center UX impact, tests/checkers, docs/roadmap, OS status, safety,
  forbidden paths, known limitations, and next subphase.

### P103.2 Work Admission Model

Status: complete.

Build a deterministic local work-admission model from P102 handoff manifest and
work-order rows. The model must produce display-safe admission records only and
must keep all provider, dispatch, worker, tool, project, DB, deploy, package,
network, and spend flags blocked.

- Narrow goal: create `buildFounderLiveWorkAdmission` as the local admission
  model for source handoff state, work admission rows, evidence requirements,
  validation commands, approval boundary, blockers, evidence/activity, and cost
  posture.
- Allowed files: `live-ready/founderLiveWorkAdmission.js`,
  `scripts/check-p1032-founder-live-work-admission-model.js`,
  forward-compatible P103.1 checker, P103 contract/docs, package script, OS
  roadmap/status files, and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected exports: `P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE`,
  `P103_WORK_ADMISSION_STATES`, `P103_WORK_ADMISSION_SAFETY_FLAGS`,
  `buildFounderLiveWorkAdmission`, and
  `validateFounderLiveWorkAdmission`.
- Command Center UX requirements: no UI route change in P103.2. P103.4 must
  render this model without raw JSON, raw logs, raw policy dumps, raw private
  IDs, demo leakage, or runnable execution controls.
- Dark/light/system theme requirements: no theme source change.
- Playwright tests: none in P103.2 because no UI files changed.
- Checker updates: `npm run check:p1032-founder-live-work-admission-model`.
- Docs/roadmap: this plan and platform roadmap record P103.2 complete and
  P103.3 next.
- OS phase status: P103 in progress, P103.2 complete, current P103.2, previous
  P103.1, next P103.3.
- Validation commands: `npm run check:p1032-founder-live-work-admission-model`,
  `npm run check:p1031-founder-live-work-admission-contract`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: model is deterministic/local; all unsafe runtime flags
  are false; no project files changed.

### P103.3 Approval Evidence Envelope

Status: complete.

Add a local approval/evidence envelope over P103.2 work admission records. The
envelope can describe missing evidence, approval state, rollback expectations,
and validation requirements, but cannot approve or execute work.

- Narrow goal: create a non-runnable approval evidence envelope over P103.2
  work admission rows with approval gates, review questions, missing evidence,
  validation commands, blockers, and cost posture.
- Allowed files: `live-ready/founderLiveWorkAdmissionApprovalEnvelope.js`,
  `scripts/check-p1033-founder-live-work-admission-approval-envelope.js`,
  forward-compatible P103.2 checker, P103 contract/docs, package script, OS
  roadmap/status files, and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected exports: `P103_FOUNDER_LIVE_WORK_ADMISSION_APPROVAL_PHASE`,
  `P103_WORK_ADMISSION_APPROVAL_STATES`,
  `buildFounderLiveWorkAdmissionApprovalEnvelope`, and
  `validateFounderLiveWorkAdmissionApprovalEnvelope`.
- Command Center UX requirements: no UI route change in P103.3. P103.4 must
  render approval gates without raw JSON, raw logs, raw policy dumps, raw
  private IDs, demo leakage, or approval/execution controls.
- Dark/light/system theme requirements: no theme source change.
- Playwright tests: none in P103.3 because no UI files changed.
- Checker updates:
  `npm run check:p1033-founder-live-work-admission-approval-envelope`.
- Docs/roadmap: this plan and platform roadmap record P103.3 complete and
  P103.4 next.
- OS phase status: P103 in progress, P103.3 complete, current P103.3, previous
  P103.2, next P103.4.
- Validation commands:
  `npm run check:p1033-founder-live-work-admission-approval-envelope`,
  `npm run check:p1032-founder-live-work-admission-model`,
  `npm run check:p1031-founder-live-work-admission-contract`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: envelope is deterministic/local; approval and execution
  remain blocked; no project files changed.

### P103.4 Command Center Work Admission UX

Status: complete.

Expose P103 work admission in founder-facing Command Center routes. The UX must
show useful founder/operator state, next action, blockers, owner lane, disabled
reason, evidence/activity, validation command, and cost posture without raw
JSON/log dumps, private raw IDs, demo leakage, or runnable controls.

- Narrow goal: render Founder Live Work Admission in Command Center Lite,
  Business Build, Agent Flow, and Live Readiness using display-safe admission
  and approval-envelope view models.
- Allowed files: `dashboard/src/data/businessBuild.js`,
  `dashboard/src/pages/CommandCenterV2.jsx`, `dashboard/tests/routes.spec.js`,
  `scripts/check-p1034-command-center-founder-live-work-admission-ux.js`,
  forward-compatible P103.3 checker, P103 contract/docs, package script, OS
  roadmap/status files, and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected data shapes: `founderLiveWorkAdmission` and
  `founderLiveWorkAdmissionApproval` view models with work admissions,
  approval gates, blockers, disabled reason, owner capability, evidence,
  activity, cost, validation commands, and all action counts blocked.
- Command Center UX requirements: show state, next action, blockers, disabled
  reason, owner, evidence/activity, cost impact, validation commands, and
  approval gates without raw JSON, raw logs, raw policy dumps, raw private IDs,
  demo leakage, approval controls, or execution controls.
- Dark/light/system theme requirements: preserve existing theme variables; no
  theme source changes.
- Playwright tests: focused route coverage for Founder live work admission
  across Lite, Business Build, Agent Flow, and Live Readiness; retain route-wide
  demo leakage safety.
- Checker updates:
  `npm run check:p1034-command-center-founder-live-work-admission-ux`.
- Docs/roadmap: this plan and platform roadmap record P103.4 complete and
  P103.5 next.
- OS phase status: P103 in progress, P103.4 complete, current P103.4, previous
  P103.3, next P103.5.
- Validation commands:
  `npm run check:p1034-command-center-founder-live-work-admission-ux`,
  focused Playwright route coverage, `cd dashboard && npm run build`,
  `npm run check:p1033-founder-live-work-admission-approval-envelope`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: no approval/execution controls added; no project files
  changed; no raw IDs, raw dumps, or unsafe runnable action text in primary UX.

### P103.5 Tests / Checkers / Aggregate Validation

Status: planned.

Aggregate P103.1 through P103.4 coverage, including contract, model, approval
envelope, Command Center UX, Playwright route safety, OS phase status, phase
validation coverage, and blocked execution assertions.

Validation: `npm run check:p1035-founder-live-work-admission-validation`.

### P103.6 Docs / Roadmap

Status: planned.

Update README, Command Center guide, this plan, platform roadmap, phase status,
and generated reports with founder live work admission behavior and remaining
safety boundaries.

Validation: `npm run check:p1036-founder-live-work-admission-docs-roadmap`.

### P103.7 Final Validation

Status: planned.

Run final P103 validation, close the parent phase, stamp real commits, confirm
no forbidden paths changed, and hand off to P104 planned.

Validation: `npm run check:p1037-founder-live-work-admission-final`.

## Safety Boundary

P103 is local work admission only. It may define and display records that show
what work could be admitted for operator review. It must not dispatch agents,
execute tools/workers, mutate project files, write hosted DB state, deploy,
release, export, package, use network calls, or spend provider budget.

## Rollback Plan

Revert the P103 subphase commit being reviewed. P102 remains complete and the
existing founder live handoff artifacts remain available because P103 adds only
new NEXUS OS contracts, models, checks, docs, status, and display-safe UX in
later subphases.
