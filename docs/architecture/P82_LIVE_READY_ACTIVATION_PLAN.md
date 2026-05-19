# P82 Live Ready Activation Plan

P82 moves NEXUS from broad preview posture toward evidence-backed live readiness
for the founder-to-business-build path.

Contract: `contracts/os-roadmap/p82-execution-contracts.json`.

P82 does not blindly rename Preview labels. Each execution surface must become
one of:

- Ready: all required gates, evidence, cost posture, rollback, and validation are
  present.
- Needs setup: the operator can see the exact setup gap and next action.
- Blocked by policy: live action is not allowed by the current governance
  boundary.

Provider calls, tool execution, worker execution, project mutation, DB writes,
network calls, deploy, release, export, package creation,
auth/session/user/workspace mutation, and provider spend remain blocked until a
later subphase explicitly adds a governed admission record and validation.

## P82.1 Live Readiness Inventory + Activation Boundary

Goal: define P82 contracts, inventory the execution surfaces that block live
business build execution, and add validation coverage for the activation
boundary.

Status: complete. P82.1 is contract and evidence only. It does not call
providers, execute tools or workers, mutate project files, write DB state,
deploy, release, export, package, change auth/session/user/workspace state, or
spend provider budget.

Validation: `npm run check:p82-execution-plan`.

## P82.2 Provider / Tool Live Gates

Goal: add provider and tool gate profiles that explain whether provider calls
and tool execution are Ready, Need setup, or Blocked by policy.

Status: complete. P82.2 creates local readiness records for provider calls,
provider spend, read-only tool contracts, and mutation-capable tools. It does
not call providers, execute tools, mutate project files, write DB state, deploy,
or spend budget.

Validation: `npm run check:p822-provider-tool-gates`.

## P82.3 Worker Execution Gate

Goal: add a worker execution readiness gate for business build workstreams.

Status: complete. P82.3 adds a local worker readiness gate that reuses existing
worker runtime summaries and P81 business build workstreams. It does not start
workers, lease work, execute tasks, dispatch agents, mutate project files, write
DB state, deploy, or spend budget.

Validation: `npm run check:p823-worker-execution-gate`.

## P82.4 Project / DB Mutation Admission

Goal: define project mutation and DB write admission gates for live build work.

Status: complete. P82.4 adds local project and DB admission gates that reuse
the existing mutation boundary and DB readiness helpers. It does not edit
`projects/**`, write DB state, create migrations, mutate schema, or expose raw
private project IDs.

Validation: `npm run check:p824-project-db-admission`.

## P82.5 Deploy / Release Admission

Goal: define deploy, release, export, and package admission gates.

Status: planned. P82.5 must not deploy, release, export, package, publish, or
mutate environment targets.

Validation: `npm run check:p825-deploy-release-admission`.

## P82.6 Command Center Live Ready UX

Goal: replace stale preview wording in the relevant Command Center business
build surfaces with evidence-backed Ready, Needs setup, and Blocked by policy
states.

Status: planned. P82.6 must show current state, next action, blockers, disabled
reason, owner capability, evidence/activity location, and cost impact. It must
preserve System, Dark, and Light themes and avoid raw JSON, raw logs, DemoApp,
raw private project IDs, and fake runnable actions.

Validation: `npm run check:p826-command-center-live-ready-ux`, Playwright route
coverage, dashboard unit tests, and dashboard build.

## P82.7 Final Validation

Goal: close P82 after validating live readiness is accurate, governed, and
evidence-backed end to end.

Status: planned. P82.7 must not enable unsafe runtime execution without an
explicit later activation gate.

Validation: `npm run check:p827-final-validation`.

## Reuse Check

P82 must reuse:

- `shared/reportWriter.js`
- `shared/reportMetadata.js`
- `shared/resultEnvelope.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `shared/checkResultFormatter.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center route, tab, card, badge, evidence, activity, audit,
  and cost patterns
- existing route matrix and route-wide safety tests
- existing P79 live gate/admission patterns
- existing P80 founder intake helpers
- existing P81 business build PRD, workstream, and plan helpers

Do not duplicate report writers, mode guards, redaction helpers, checker
formatters, phase status updaters, result envelopes, route matrices, UI
card/tab/status components, or activity/evidence/audit appenders. If duplication
becomes unavoidable, document the reason in the relevant report and add it to
refactor candidates.

## Safety Rules

P82 subphases must stay within NEXUS OS files unless a later explicit prompt
allows project source changes.

Forbidden paths for P82.1:

- `projects/**`
- `project-roadmap/**`
- `careloop/**`
- `db/**`
- `prisma/**`
- `migrations/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `auth/**`
- `users/**`
- `rbac/**`
- `.env`
- `.env.*`

Every later live-readiness surface must require approval, capability scope,
budget/cost posture, rollback plan, activity evidence, cost evidence, redaction
check, and validation commands before it can be treated as Ready.

## Rollback

Rollback P82.1 by removing
`contracts/os-roadmap/p82-execution-contracts.json`,
`docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md`,
`scripts/check-p82-execution-plan.js`, and
`reports/p82-execution-plan-report.md`; removing
`check:p82-execution-plan` from `package.json`; removing P82.1-P82.7 from the
OS phase checker; and returning P82 in roadmap/status files to planned with
next phase `P82.1`.
