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

Status: planned.

Define the local execution-boundary records and approval predicates that future
phases can validate without granting live execution authority.

## P104.3 Execution Boundary Model

Status: planned.

Build deterministic local execution-boundary state from P103 work admissions.

## P104.4 Execution Boundary Command Center UX

Status: planned.

Render execution-boundary readiness on appropriate non-chat pages without
runnable controls.

## P104.5 Tests / Checkers

Status: planned.

Add aggregate checker and Playwright coverage for P104 behavior.

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
