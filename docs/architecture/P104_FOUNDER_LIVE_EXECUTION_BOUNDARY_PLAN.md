# P104 Founder Live Execution Boundary Plan

## Scope

P104 keeps founder-facing NEXUS usable while preparing the next governed
execution boundary. It must not enable provider/model calls, agent dispatch,
worker/tool execution, project source mutation, hosted DB mutation, deploy,
release, export, package creation, network calls, or provider spend.

## P104.1 Chat Surface Consolidation

Status: complete.

- Narrow goal: make `/command-center` and `/command-center/lite` a clean
  Chat with NEXUS surface. The route keeps the thread, founder message input,
  Send, Reset, prompt starters, answered/missing count, and short planning-only
  note.
- Starting branch and expected base commit:
  `codex/nexus-e2e-phase-validation` at `8fa8fafe`.
- Allowed files: Command Center page, Command Center stylesheet, route tests,
  P104 contract, P104 plan, platform roadmap, README, P104.1 checker, OS phase
  checker, package script, OS phase JSON, and generated reports.
- Forbidden files: `projects/**`, `careloop/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, `.env*`.
- Exact files/modules to create or update:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/styles-command-center-v2.css`, `dashboard/tests/routes.spec.js`,
  `contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json`,
  `docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md`,
  `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`, `README.md`,
  `scripts/check-p1041-chat-surface-consolidation.js`,
  `scripts/check-os-phase-status.js`, `package.json`,
  `os-roadmap/phase-status.json`, and `os-roadmap/nexus-phases.json`.
- Expected exports, schemas, and data shapes: no new runtime exports. The Chat
  route is the display shape: thread turns, founder composer, prompt starters,
  answered/missing count, and local-only planning note.
- Command Center UX requirements: Chat must not render PRD readiness, PRD
  review, DB workflow, Business Build DB, live handoff, execution admission,
  live-use review, founder live handoff, work admission, persistence controls,
  agent flow, or task board cards. Those remain on the corresponding pages.
- Dark/light/system theme requirements: preserve the existing theme switcher
  behavior and add only layout CSS for the chat-only route.
- Playwright tests: update route tests for interactive chat, chat-only absence,
  dedicated DB/Business Build/Agent Flow/Live Readiness coverage, and full
  Command Center demo leakage safety.
- Checker updates: add `npm run check:p1041-chat-surface-consolidation` and
  allow P104.1-P104.7 in `check:os-phase-status`.
- Docs/README/roadmap: record P104.1 complete, P104 in progress, and P104.2
  next.
- OS phase status: P104 in progress, P104.1 complete, current P104.1, previous
  P103.7, next P104.2.
- Validation commands:
  `npm run check:p1041-chat-surface-consolidation`,
  `cd dashboard && npx playwright test tests/routes.spec.js --grep "Command Center Lite route renders interactive founder chat|Command Center Lite route stays chat-only|Founder DB workflow appears in Business Build and DB Runtime|Business Build DB CRUD state appears in Business Build, Agent Flow, and DB Runtime|Founder live work admission appears across founder routes|full Command Center demo leakage safety"`,
  `cd dashboard && npm run build`, `npm run check:os-phase-status`,
  `npm run check:phase-validation-coverage`, and `git diff --check`.
- Final safety checks: no project files changed; no provider/model calls; no
  dispatch; no worker/tool execution; no project mutation; no hosted DB
  mutation; no deploy/release/export/package; no network calls; no spend; no
  raw private IDs; no raw JSON/log/policy dumps; no full Command Center demo
  leakage; no fake
  runnable actions.
- Git add/commit/push commands: stage only allowed P104.1 OS files, commit,
  stamp the real commit hash in phase status, rerun checks, commit status
  stamp, and push `codex/nexus-e2e-phase-validation`.
- Final response checklist: branch, commit hash, files changed, chat UX
  cleanup, Command Center UX impact, tests/checkers/build results,
  docs/roadmap updates, OS phase status, safety confirmations, forbidden path
  confirmation, known limitations, and next subphase.

## P104.2 Execution Boundary Schema

Status: complete.

- Narrow goal: define local execution-boundary records, required evidence,
  approval predicates, forbidden actions, and blocked execution flags without
  enabling execution.
- Starting branch and expected base commit:
  `codex/nexus-e2e-phase-validation` at `57797990`.
- Allowed files: schema module, P104.2 checker, P104.1 compatibility checker,
  P104 contract, P104 plan, platform roadmap, README, package script, OS phase
  JSON, and generated reports.
- Forbidden files: `projects/**`, `careloop/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, `.env*`.
- Exact files/modules to create or update:
  `live-ready/founderLiveExecutionBoundarySchema.js`,
  `scripts/check-p1042-founder-live-execution-boundary-schema.js`,
  `scripts/check-p1041-chat-surface-consolidation.js`,
  `contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json`,
  `docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md`,
  `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`, `README.md`,
  `package.json`, `os-roadmap/phase-status.json`, and
  `os-roadmap/nexus-phases.json`.
- Expected exports, schemas, and data shapes:
  `P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_SCHEMA_PHASE`,
  `P104_EXECUTION_BOUNDARY_STATES`,
  `P104_EXECUTION_BOUNDARY_BLOCKED_FLAGS`,
  `P104_EXECUTION_BOUNDARY_REQUIRED_EVIDENCE`,
  `P104_EXECUTION_BOUNDARY_FORBIDDEN_ACTIONS`,
  `buildFounderLiveExecutionBoundarySchema`, and
  `validateFounderLiveExecutionBoundarySchema`. The envelope includes
  boundary and lane record shapes, required evidence, approval predicates,
  forbidden actions, blocked flags, next action, blockers, disabled reason,
  owner, evidence/activity, cost impact, and `commandCenterVisible: false`.
- Command Center UX requirements: no UI source change in P104.2. P104.4 must
  use this schema on non-chat pages without raw dumps, private IDs, or runnable
  execution controls.
- Dark/light/system theme requirements: no theme source change.
- Playwright tests: none in P104.2 because no UI files change.
- Checker updates:
  `npm run check:p1042-founder-live-execution-boundary-schema`; keep P104.1
  checker forward-compatible with later P104 subphases.
- Docs/README/roadmap: record P104.2 complete and P104.3 next.
- OS phase status: P104 in progress, P104.2 complete, current P104.2,
  previous P104.1, next P104.3.
- Validation commands:
  `npm run check:p1042-founder-live-execution-boundary-schema`,
  `npm run check:p1041-chat-surface-consolidation`,
  `npm run check:os-phase-status`,
  `npm run check:phase-validation-coverage`, and `git diff --check`.
- Final safety checks: schema-only; all execution flags false; no provider/model
  calls; no dispatch; no worker/tool execution; no project mutation; no hosted
  DB mutation; no deploy/release/export/package; no network calls; no spend;
  no project files changed; P104.3 remains planned.
- Git add/commit/push commands: stage only allowed P104.2 OS files, commit,
  stamp the real commit hash in phase status, rerun checks, commit status
  stamp, and push `codex/nexus-e2e-phase-validation`.
- Final response checklist: branch, commit hash, files changed, schema exports,
  tests/checkers, docs/roadmap, OS status, safety confirmations, forbidden path
  confirmation, known limitations, and next subphase.

## P104.3 Execution Boundary Model

Status: complete.

Build deterministic local execution-boundary state from P103 work admissions.

- Narrow goal: assemble local execution-boundary rows from P103 work admissions
  and P104.2 schema without approval or execution authority.
- Starting branch and expected base commit:
  `codex/nexus-e2e-phase-validation` at `ab055283`.
- Allowed files: boundary model module, P104.3 checker, P104.2 compatibility
  checker, P104 contract, P104 plan, platform roadmap, README, package script,
  OS phase JSON, and generated reports.
- Forbidden files: `projects/**`, `careloop/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, `.env*`.
- Exact files/modules to create or update:
  `live-ready/founderLiveExecutionBoundaryModel.js`,
  `scripts/check-p1043-founder-live-execution-boundary-model.js`,
  `scripts/check-p1042-founder-live-execution-boundary-schema.js`,
  `contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json`,
  `docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md`,
  `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`, `README.md`,
  `package.json`, `os-roadmap/phase-status.json`, and
  `os-roadmap/nexus-phases.json`.
- Expected exports, schemas, and data shapes:
  `P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_MODEL_PHASE`,
  `P104_EXECUTION_BOUNDARY_MODEL_STATES`,
  `buildFounderLiveExecutionBoundaryModel`, and
  `validateFounderLiveExecutionBoundaryModel`. The envelope includes
  source schema/work admission phases, founder context, readiness counts,
  boundary rows, required evidence, next action, blockers, disabled reason,
  owner, evidence/activity, cost impact, and all execution flags false.
- Command Center UX requirements: no UI source change in P104.3. P104.4 must
  render these rows on non-chat pages without runnable execution controls.
- Dark/light/system theme requirements: no theme source change.
- Playwright tests: none in P104.3 because no UI files change.
- Checker updates:
  `npm run check:p1043-founder-live-execution-boundary-model`; keep P104.2
  checker forward-compatible with later P104 subphases.
- Docs/README/roadmap: record P104.3 complete and P104.4 next.
- OS phase status: P104 in progress, P104.3 complete, current P104.3,
  previous P104.2, next P104.4.
- Validation commands:
  `npm run check:p1043-founder-live-execution-boundary-model`,
  `npm run check:p1042-founder-live-execution-boundary-schema`,
  `npm run check:os-phase-status`,
  `npm run check:phase-validation-coverage`, and `git diff --check`.
- Final safety checks: model-only; all execution flags false; no provider/model
  calls; no dispatch; no worker/tool execution; no project mutation; no hosted
  DB mutation; no deploy/release/export/package; no network calls; no spend;
  no project files changed; P104.4 remains planned.

## P104.4 Execution Boundary Command Center UX

Status: complete.

Render execution-boundary readiness on appropriate non-chat pages without
runnable controls.

- Narrow goal: render the P104.3 execution-boundary model on Business Build,
  Agent Flow, and Live Readiness while keeping Chat with NEXUS and Lite
  chat-only.
- Starting branch and expected base commit:
  `codex/nexus-e2e-phase-validation` at `22a0ad6f`.
- Allowed files: Business Build dashboard data, Command Center page, route
  tests, P104.4 checker, P104.3 compatibility checker, P104 contract, P104
  plan, platform roadmap, README, package script, OS phase JSON, and generated
  reports.
- Forbidden files: `projects/**`, `careloop/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, `.env*`.
- Exact files/modules to create or update:
  `dashboard/src/data/businessBuild.js`,
  `dashboard/src/pages/CommandCenterV2.jsx`, `dashboard/tests/routes.spec.js`,
  `scripts/check-p1044-founder-live-execution-boundary-ux.js`,
  `scripts/check-p1043-founder-live-execution-boundary-model.js`,
  `contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json`,
  `docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md`,
  `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`, `README.md`,
  `package.json`, `os-roadmap/phase-status.json`, and
  `os-roadmap/nexus-phases.json`.
- Expected exports, schemas, and data shapes:
  `buildFounderLiveExecutionBoundaryDisplayModel`. The Business Build view
  model exposes `founderLiveExecutionBoundary` with display-safe state,
  founder idea, boundary counts, next action, blockers, disabled reason,
  owner, evidence, activity, cost, boundary rows, and safety rows. The display
  shape intentionally omits raw boundary IDs and source admission IDs.
- Command Center UX requirements: add `FounderLiveExecutionBoundaryCard` to
  Business Build, Agent Flow, and Live Readiness. It shows what changed, current
  state, next action, blockers, disabled reason, owner capability, evidence,
  activity, cost impact, validation command, and blocked safety posture. It
  must not render on Chat with NEXUS or Lite.
- Dark/light/system theme requirements: preserve existing theme behavior and
  verify the card under dark, light, and system modes.
- Playwright tests: add focused route coverage for Business Build, Agent Flow,
  and Live Readiness plus absence on Chat/Lite.
- Checker updates:
  `npm run check:p1044-founder-live-execution-boundary-ux`; keep P104.3 checker
  forward-compatible with later P104 subphases.
- Docs/README/roadmap: record P104.4 complete and P104.5 next.
- OS phase status: P104 in progress, P104.4 complete, current P104.4, previous
  P104.3, next P104.5.
- Validation commands:
  `npm run check:p1044-founder-live-execution-boundary-ux`,
  `npm run check:p1043-founder-live-execution-boundary-model`,
  `cd dashboard && npx playwright test tests/routes.spec.js --grep "Founder live execution boundary appears on non-chat founder routes|Command Center Lite route stays chat-only"`,
  `cd dashboard && npm run build`, `npm run check:os-phase-status`,
  `npm run check:phase-validation-coverage`, and `git diff --check`.
- Final safety checks: no project files changed; no provider/model calls; no
  dispatch; no worker/tool execution; no project mutation; no hosted DB
  mutation; no deploy/release/export/package; no network calls; no spend; no
  raw private IDs; no raw boundary IDs in primary UX; no raw JSON/log/policy
  dumps; no fake runnable actions.
- Git add/commit/push commands: stage only allowed P104.4 OS files, commit,
  stamp the real commit hash in phase status, rerun checks, commit status
  stamp, and push `codex/nexus-e2e-phase-validation`.
- Final response checklist: branch, commit hash, files changed, Command Center
  UX impact, tests/checkers/build results, docs/roadmap updates, OS phase
  status, safety confirmations, forbidden path confirmation, known limitations,
  and next subphase.

## P104.5 Execution Boundary Tests / Checkers

Status: complete.

Add aggregate checker and Playwright coverage for P104 behavior.

- Narrow goal: add aggregate validation proving P104.1-P104.5 stay coherent
  across chat cleanup, schema, model, non-chat UX, route tests, reports, and OS
  phase status.
- Starting branch and expected base commit:
  `codex/nexus-e2e-phase-validation` at `b3d55342`.
- Allowed files: route tests, P104.5 aggregate checker, P104.4 compatibility
  checker, P104 contract, P104 plan, platform roadmap, README, package script,
  OS phase JSON, and generated reports.
- Forbidden files: `projects/**`, `careloop/**`, `providers/**`, `tools/**`,
  `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, `.env*`.
- Exact files/modules to create or update: `dashboard/tests/routes.spec.js`,
  `scripts/check-p1045-founder-live-execution-boundary-aggregate.js`,
  `scripts/check-p1044-founder-live-execution-boundary-ux.js`,
  `contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json`,
  `docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md`,
  `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`, `README.md`,
  `package.json`, `os-roadmap/phase-status.json`, and
  `os-roadmap/nexus-phases.json`.
- Expected exports, schemas, and data shapes: no new runtime exports. The
  checker validates existing P104 check scripts, reports, route tests,
  browser-safe display data, Command Center route placement, OS status, docs,
  and safety wording.
- Command Center UX requirements: preserve current UX. Chat and Lite remain
  chat-only; Business Build, Agent Flow, and Live Readiness keep the Founder
  Live Execution Boundary card.
- Dark/light/system theme requirements: no theme source change. P104.4 coverage
  continues to verify the boundary card under dark, light, and system modes.
- Playwright tests: add `P104 execution boundary route safety stays coherent`,
  covering boundary absence on Chat/Lite and presence on Business Build, Agent
  Flow, and Live Readiness.
- Checker updates:
  `npm run check:p1045-founder-live-execution-boundary-aggregate`; keep P104.4
  checker forward-compatible with later P104 subphases.
- Docs/README/roadmap: record P104.5 complete and P104.6 next.
- OS phase status: P104 in progress, P104.5 complete, current P104.5, previous
  P104.4, next P104.6.
- Validation commands:
  `npm run check:p1045-founder-live-execution-boundary-aggregate`,
  `npm run check:p1044-founder-live-execution-boundary-ux`,
  `cd dashboard && npx playwright test tests/routes.spec.js --grep "P104 execution boundary route safety stays coherent|Founder live execution boundary appears on non-chat founder routes|Command Center Lite route stays chat-only"`,
  `cd dashboard && npm run build`, `npm run check:os-phase-status`,
  `npm run check:phase-validation-coverage`, and `git diff --check`.
- Final safety checks: validation-only; no project files changed; no
  provider/model calls; no dispatch; no worker/tool execution; no project
  mutation; no hosted DB mutation; no deploy/release/export/package; no network
  calls; no spend; no raw IDs; no raw dumps; no fake runnable actions.
- Git add/commit/push commands: stage only allowed P104.5 OS files, commit,
  stamp the real commit hash in phase status, rerun checks, commit status
  stamp, and push `codex/nexus-e2e-phase-validation`.
- Final response checklist: branch, commit hash, files changed, aggregate
  checker, Playwright/build/checker results, docs/roadmap updates, OS phase
  status, safety confirmations, forbidden path confirmation, known limitations,
  and next subphase.

## P104.6 Docs / Roadmap

Status: planned.

Document the full P104 execution boundary and update status evidence.

## P104.7 Final Validation

Status: planned.

Run final P104 validation, close the parent phase, stamp commits, and hand off
to P105 planned.

## Rollback Plan

Revert the P104.1 commit. P103 remains complete, and P104 can return to
planned without touching project files.
