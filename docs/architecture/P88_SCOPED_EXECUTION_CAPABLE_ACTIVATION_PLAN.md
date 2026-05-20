# P88 Scoped Execution-Capable Activation Plan

P88 moves NEXUS from explicit live unlock readiness toward scoped, local-only
activation. It is not a broad live switch. Each subphase must define one narrow
activation lane, reuse existing NEXUS OS helpers, preserve Command Center UX, and
validate that unsafe runtime surfaces remain blocked unless a later subphase
explicitly scopes them.

## Safety Rules

- NEXUS OS changes only.
- Do not modify `projects/**`, `careloop/**`, generated app `Sources/Tests`,
  `providers/**`, `tools/**`, `worker-runtime/**`, DB/prisma/migrations,
  deploy/release/export/package roots, or `.env*`.
- Do not enable provider/model calls, agent dispatch, tool execution, worker
  execution, project mutation, DB writes, deploy, release, export, package
  creation, network calls, or provider spend unless that exact lane is scoped and
  validated in its own subphase.
- Do not expose DemoApp in full Command Center.
- Do not expose raw private project IDs.
- Do not invent fake working actions.

## P88.1 Scoped Activation Profile / Contract

P88.1 is complete. It adds a scoped execution-capable activation profile that
reuses P87 explicit live activation, local agent dispatch admission, and
generated workspace admission helpers. It defines local-only future activation
lanes, required gates, evidence, blockers, disabled reason, owner, activity,
cost posture, and validation commands. Every runtime flag remains false.

Validation:

- `npm run check:p881-scoped-execution-activation-profile`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.1 is profile-only. It does not wire or run an executor,
dispatch agents, call providers/models, execute tools/workers, mutate projects,
write DB state, use network calls, deploy, release, export, package, or spend.

## P88.2 Local Activation Request Model

P88.2 is complete. It adds local-only activation request records that reuse the
P88.1 scoped activation profile and P86 operator approval queue helpers. Each
request records requested operations, forbidden operations, required evidence,
missing evidence, blockers, disabled reason, owner, validation commands,
activity, and cost posture. Requests cannot execute, activate, dispatch agents,
write files, call providers, or spend.

Validation:

- `npm run check:p882-local-activation-request-model`
- `npm run check:p881-scoped-execution-activation-profile`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.2 is request-model only. It does not wire or run an
executor, dispatch agents, execute tools/workers, mutate projects, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## P88.3 Local Executor Admission

P88.3 is complete. It adds local executor admission records that reuse the P88.2
local activation request model. Each admission records executor state, allowed
future operations, forbidden operations, required evidence, missing evidence,
rollback, post-run review, disabled reason, validation commands, activity, and
cost posture. The executor cannot run, and no executor module is imported,
wired, or executed.

Validation:

- `npm run check:p883-local-executor-admission`
- `npm run check:p882-local-activation-request-model`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.3 is executor admission only. It does not run an executor,
dispatch agents, execute tools/workers, mutate projects, call providers/models,
write DB state, use network calls, deploy, release, export, package, or spend.

## P88.4 Command Center Scoped Activation UX

P88.4 is complete. Live Readiness now includes a Scoped Activation tab that
shows P88 activation/request/executor admission state with current state, next
action, blockers, disabled reason, owner, evidence, activity, and cost posture.
The tab is display-only and does not expose runnable actions.

Validation:

- `npm run check:p884-command-center-scoped-activation-ux`
- `npm run check:p883-local-executor-admission`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Live Ready route renders evidence-backed activation labels without runnable actions"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.4 is UX only. It does not run an executor, dispatch
agents, execute tools/workers, mutate projects, call providers/models, write DB
state, use network calls, deploy, release, export, package, or spend.

## P88.5 Tests / Checkers

P88.5 is complete. It aggregates P88.1-P88.4 scripts, reports, package scripts,
docs, roadmap/status records, Command Center scoped activation coverage,
Playwright coverage, and safety posture.

Validation:

- `npm run check:p885-tests-checkers-docs`
- `npm run check:p884-command-center-scoped-activation-ux`
- `npm run check:p883-local-executor-admission`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Live Ready route renders evidence-backed activation labels without runnable actions"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.5 is validation aggregation only. It does not run an
executor, dispatch agents, execute tools/workers, mutate projects, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## P88.6 Docs / Roadmap

P88.6 is complete. It closes P88 documentation, roadmap, contract, and status
evidence before final validation. It adds a docs/roadmap checker, records P88.6
as a complete NEXUS OS subphase, and keeps P88.7 as the final validation
handoff.

Validation:

- `npm run check:p886-docs-roadmap`
- `npm run check:p885-tests-checkers-docs`
- `npm run check:p884-command-center-scoped-activation-ux`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Live Ready route renders evidence-backed activation labels without runnable actions"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.6 is docs and roadmap closure only. It does not run an
executor, dispatch agents, execute tools/workers, mutate projects, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## P88.7 Final Validation

P88.7 is complete. It finalizes P88 evidence validation, closes the parent P88
status, preserves Command Center scoped activation UX, and creates P89 as the
next planned scoped handoff. P88 remains an activation readiness and admission
evidence phase; it does not enable runtime execution.

Validation:

- `npm run check:p887-final-validation`
- `npm run check:p886-docs-roadmap`
- `npm run check:p885-tests-checkers-docs`
- `npm run check:p884-command-center-scoped-activation-ux`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Live Ready route renders evidence-backed activation labels without runnable actions"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.7 is final validation only. It does not run an executor,
dispatch agents, execute tools/workers, mutate projects, call providers/models,
write DB state, use network calls, deploy, release, export, package, or spend.

## Next Phase

P89 is next. It must be planned as a narrow, local-only enterprise-readiness
handoff before any runtime execution lane can be considered.
