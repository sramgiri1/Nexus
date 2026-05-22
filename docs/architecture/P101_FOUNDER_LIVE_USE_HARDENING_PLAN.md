# P101 Founder Live Use Hardening Plan

P101 hardens the founder live-use path after full Command Center enablement.
It does not enable provider/model calls, agent dispatch, worker/tool
execution, project mutation, hosted DB mutation, deploy, release, export,
package creation, network calls, or provider spend.

## Subphase Plan

### P101.1 Contract / Scope / Safety Baseline

Status: complete.

- Narrow goal: define P101 scope, safety baseline, allowed files, validation
  requirements, and future data shapes before behavior changes.
- Starting branch and expected base commit:
  `codex/nexus-e2e-phase-validation` at `e726d515`.
- Allowed files: `contracts/os-roadmap/p101-execution-contracts.json`,
  this plan, `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`,
  `scripts/check-p1011-founder-live-use-contract.js`,
  `scripts/check-os-phase-status.js`, `package.json`,
  `os-roadmap/phase-status.json`, `os-roadmap/nexus-phases.json`, and generated
  validation reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Exact files/modules created or updated: the P101 contract, this plan, platform
  roadmap, P101.1 checker, OS phase checker, package script, and OS roadmap
  status JSON.
- Expected exports, schemas, and data shapes: future P101 work must expose
  `P101_FOUNDER_LIVE_USE_PHASE`, `P101_LIVE_USE_HARDENING_STATES`,
  `P101_LIVE_USE_SAFETY_FLAGS`, and deterministic founder live-use envelopes.
- Command Center UX requirements: no UI source change in P101.1. Future P101 UX
  must show current state, next action, blockers, disabled reason, owner lane,
  evidence/activity, and cost impact without raw JSON, raw logs, raw policy
  dumps, DemoApp leakage, private IDs, or fake runnable actions.
- Dark/light/system theme requirements: no theme source change in P101.1;
  future UX must preserve all three themes.
- Playwright tests: no Playwright update in P101.1 because no UI files change.
- Checker updates: `check:p1011-founder-live-use-contract` and P101/P102 phase
  status acceptance.
- Docs/README/roadmap updates: this plan and platform roadmap section.
- OS phase status update: P101 in progress, P101.1 complete, current P101.1,
  previous P100.7, next P101.2.
- Validation commands: `npm run check:p1011-founder-live-use-contract`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: no project files changed; no provider/model call, agent
  dispatch, worker/tool execution, DB mutation, deploy, release, export,
  package, network, or spend path added; P101.2 remains planned.
- Git add/commit/push commands: stage the allowed P101.1 files, commit
  `feat(nexus): define founder live use hardening contract`, then push the
  branch.
- Final response checklist: branch, commit, changed files, implementation,
  Command Center UX impact, tests/checkers, docs/roadmap, OS status, safety,
  forbidden paths, known limitations, and next subphase.

### P101.2 Founder Live-Use Readiness Model

Status: complete.

Build a deterministic local readiness model from existing founder intake, PRD,
DB, handoff, execution admission, and Live Readiness state. It must use a
result envelope with `schemaVersion`, `currentState`, `founderLiveUseMode`,
`founderWorkflowReadiness`, `liveUseLanes`, `safetyFlags`, `nextAction`,
`blockers`, `disabledReason`, `ownerCapability`, `evidenceRefs`,
`activityLocation`, `costImpact`, and `commandCenterVisible`. Unsafe runtime
flags remain false.

- Narrow goal: create `buildFounderLiveUseReadiness` as a local model for
  founder workflow readiness and blocked execution state.
- Allowed files: `live-ready/founderLiveUseReadiness.js`,
  `scripts/check-p1012-founder-live-use-readiness-model.js`, P101 contract and
  docs, package script, OS roadmap/status files, and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected exports: `P101_FOUNDER_LIVE_USE_PHASE`,
  `P101_LIVE_USE_HARDENING_STATES`, `P101_LIVE_USE_SAFETY_FLAGS`,
  `buildFounderLiveUseReadiness`, and `validateFounderLiveUseReadiness`.
- Command Center UX requirements: no UI route change in P101.2. P101.4 must
  render this model without raw JSON, raw logs, raw policy dumps, private IDs,
  DemoApp leakage, or runnable execution controls.
- Dark/light/system theme requirements: no theme source change.
- Playwright tests: none in P101.2 because no UI files changed.
- Checker updates: `npm run check:p1012-founder-live-use-readiness-model`.
- Docs/roadmap: this plan and platform roadmap record P101.2 complete and
  P101.3 next.
- OS phase status: P101 in progress, P101.2 complete, current P101.2, previous
  P101.1, next P101.3.
- Validation commands: `npm run check:p1012-founder-live-use-readiness-model`,
  `npm run check:p1011-founder-live-use-contract`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: model is deterministic/local; all unsafe runtime flags
  are false; no project files changed.

### P101.3 Founder Live-Use Review Packet

Status: complete.

Create a display-safe review packet and operator checklist from the P101.2
model. The packet must stay local, founder-readable, and free of raw logs, raw
JSON, private IDs, provider calls, dispatch, worker execution, and project
mutation.

- Narrow goal: convert P101.2 readiness into a founder/operator checklist and
  lane review packet.
- Allowed files: `live-ready/founderLiveUseReviewPacket.js`,
  `scripts/check-p1013-founder-live-use-review-packet.js`, forward-compatible
  P101.1/P101.2 checkers, P101 contract/docs, package script, OS roadmap/status
  files, and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected exports: `P101_FOUNDER_LIVE_USE_REVIEW_PACKET_PHASE`,
  `buildFounderLiveUseReviewPacket`, and
  `validateFounderLiveUseReviewPacket`.
- Command Center UX requirements: no UI route change in P101.3. P101.4 must
  render this packet using existing Command Center components without raw JSON,
  raw logs, raw policy dumps, private IDs, DemoApp leakage, or runnable
  execution controls.
- Dark/light/system theme requirements: no theme source change.
- Playwright tests: none in P101.3 because no UI files changed.
- Checker updates: `npm run check:p1013-founder-live-use-review-packet`, with
  P101.1/P101.2 checkers kept forward-compatible after phase advancement.
- Docs/roadmap: this plan and platform roadmap record P101.3 complete and
  P101.4 next.
- OS phase status: P101 in progress, P101.3 complete, current P101.3, previous
  P101.2, next P101.4.
- Validation commands: `npm run check:p1013-founder-live-use-review-packet`,
  `npm run check:p1012-founder-live-use-readiness-model`,
  `npm run check:p1011-founder-live-use-contract`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: packet is display-safe; no project files changed; no
  runnable actions are exposed.

### P101.4 Command Center Live-Use UX

Status: complete.

Wire the readiness and review packet into founder-facing Command Center pages
using existing cards, tabs, badges, route data, and theme behavior. Add focused
Playwright coverage for the changed routes. The UX must show useful current
state and next action, not fake working controls.

- Narrow goal: render founder live-use readiness and review packet on Lite,
  Business Build, Agent Flow, and Live Readiness.
- Allowed files: `dashboard/src/data/businessBuild.js`,
  `dashboard/src/pages/CommandCenterV2.jsx`, `dashboard/tests/routes.spec.js`,
  `scripts/check-p1014-command-center-founder-live-use-ux.js`,
  forward-compatible P101 checkers, P101 contract/docs, package script, OS
  roadmap/status files, and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected view model shape: `founderLiveUseReadiness` and
  `founderLiveUseReview` with current state, next action, blockers, disabled
  reason, owner capability, evidence, activity, cost, checklist, lane rows,
  safety rows, and runtime flags false.
- Command Center UX requirements: show founder live-use readiness without raw
  JSON, raw logs, raw policy dumps, private IDs, DemoApp leakage, or runnable
  execution controls.
- Dark/light/system theme requirements: existing theme controls are preserved.
- Playwright tests: `cd dashboard && npx playwright test tests/routes.spec.js
  --grep "Founder live use"`.
- Checker updates: `npm run check:p1014-command-center-founder-live-use-ux`.
- Docs/roadmap: this plan and platform roadmap record P101.4 complete and
  P101.5 next.
- OS phase status: P101 in progress, P101.4 complete, current P101.4, previous
  P101.3, next P101.5.
- Validation commands: `npm run check:p1014-command-center-founder-live-use-ux`,
  focused Playwright, dashboard build, prior P101 checks,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: no runnable live actions, no DemoApp leakage, no raw
  private IDs, and route-wide safety remains intact.

### P101.5 Tests / Checkers

Status: complete.

Aggregate P101.1 through P101.4 validation with package scripts, reports,
focused route coverage, OS phase status, and phase validation coverage.

- Narrow goal: aggregate P101.1 through P101.4 evidence in one checker.
- Allowed files: `scripts/check-p1015-founder-live-use-validation.js`,
  forward-compatible P101 checkers, P101 contract/docs, package script, OS
  roadmap/status files, and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected report shape: confirms P101 package scripts, reports, route tests,
  docs, Command Center wiring, status, and safety checks.
- Command Center UX requirements: no new UX; preserve P101.4.
- Dark/light/system theme requirements: preserve existing theme behavior.
- Playwright tests: focused founder live-use route coverage and DemoApp safety
  coverage are tracked.
- Checker updates: `npm run check:p1015-founder-live-use-validation`.
- Docs/roadmap: this plan and platform roadmap record P101.5 complete and
  P101.6 next.
- OS phase status: P101 in progress, P101.5 complete, current P101.5, previous
  P101.4, next P101.6.
- Validation commands: P101.5 aggregate checker, P101.1-P101.4 checkers,
  focused Playwright, dashboard build, OS phase status, coverage, and
  whitespace.
- Final safety checks: all prior P101 checks pass; route-wide safety remains;
  no project files changed.

### P101.6 Docs / Roadmap

Status: complete.

Update founder-facing README/PRD/docs and roadmap entries so the live-use
hardening state is accurate and no stale preview/live labels remain for P101.

- Narrow goal: document founder live-use hardening state, operator flow,
  limitations, and next handoff.
- Allowed files: `README.md`, `docs/usage/COMMAND_CENTER_GUIDE.md`,
  this plan, `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`,
  P101 checker scripts, P101 contract, package script, OS roadmap/status files,
  and generated reports.
- Forbidden files: `projects/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, and `.env*`.
- Expected report shape: confirms README, Command Center guide, this plan,
  platform roadmap, OS status, P101.5 evidence, and P101.7 handoff are aligned.
- Command Center UX requirements: no source UX change. Docs describe the
  existing Lite, Business Build, Agent Flow, and Live Readiness readiness cards.
- Dark/light/system theme requirements: no theme source change; docs confirm
  existing theme behavior remains in scope.
- Playwright tests: no new tests because no UI source changes in P101.6;
  P101.4/P101.5 route coverage remains the active route evidence.
- Checker updates: `npm run check:p1016-founder-live-use-docs-roadmap`.
- Docs/roadmap: README, Command Center guide, this plan, and platform roadmap
  record P101.6 complete and P101.7 next.
- OS phase status: P101 in progress, P101.6 complete, current P101.6, previous
  P101.5, next P101.7.
- Validation commands: `npm run check:p1016-founder-live-use-docs-roadmap`,
  `npm run check:p1015-founder-live-use-validation`,
  `npm run check:os-phase-status`, `npm run check:phase-validation-coverage`,
  and `git diff --check`.
- Final safety checks: docs do not imply execution is enabled; no project files
  changed; unsafe execution remains blocked.

### P101.7 Final Validation

Status: planned.

Close P101 with final validation, phase-status closure, Command Center evidence,
dashboard build/page checks, and a P102 planned handoff.

## Rollback Plan

Revert only the P101.1 commit for this subphase. That removes the P101 contract
baseline, P101.1 checker, docs, and phase-status handoff while preserving all
completed P100 work and avoiding project source changes.
