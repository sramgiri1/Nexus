# P84 Governed Founder Runtime Admission Plan

P84 moves the founder-to-business workflow from preview wording toward governed
live-local runtime admission. It does not make provider/model calls, dispatch
agents, mutate projects, write DB state, deploy, release, export, package, call
networks, mutate auth/session/user/workspace state, or spend provider budget.

Contract: `contracts/os-roadmap/p84-execution-contracts.json`.

## P84.1 Founder Runtime Admission Contract

Goal: define local founder runtime admission for deterministic Q&A, local PRD
drafting, and local workstream planning.

Status: complete. P84.1 adds a founder runtime admission record with approval,
scope, redaction, activity, cost, rollback, and validation gates. When gates are
present, local deterministic founder intake, Q&A, PRD draft, workstream planning,
and generated workspace planning may be treated as admitted local runtime. It
keeps provider/model calls, tool execution, worker execution, agent dispatch,
project mutation, DB writes, network calls, deploy, release, export, package
creation, auth/session/user/workspace mutation, and provider spend blocked.

Validation: `npm run check:p841-founder-runtime-admission`.

## P84.2 Live-Local Q&A to PRD Envelope

Goal: compose existing P80 founder intake and P81 PRD helpers into a local
runtime envelope and expose it through a focused Command Center Lite surface.

Status: complete. P84.2 adds the local founder runtime envelope that combines
founder Q&A, PRD readiness, and agent workstream planning without provider/model
calls or project mutation. It also makes the primary Command Center experience a
founder-facing Lite surface: chat with NEXUS, local PRD readiness, graphical
agent flow, next action, disabled reasons, owner capability, evidence/activity
location, and cost impact. Advanced OS/admin routes remain registered and
directly addressable, but they are removed from the primary founder sidebar.

Validation: `npm run check:p842-command-center-lite`.

## P84.3 Agent Plan Admission Preview

Goal: admit local agent/workstream planning without dispatching agents.

Status: complete. P84.3 adds a local founder agent plan admission envelope
that reuses the P81 business build workstream planner and P82 worker execution
gate. It records each owner capability, prerequisite, blocker, disabled reason,
evidence/activity location, and cost impact while keeping provider/model calls,
agent dispatch, tool execution, worker execution, project creation, project
mutation, DB writes, network calls, deploy, release, export, package creation,
and provider spend disabled.

Validation: `npm run check:p843-agent-plan-admission-preview`.

## P84.4 Command Center Runtime UX

Goal: expose governed founder runtime admission in Command Center.

Status: complete. P84.4 surfaces founder Q&A to PRD runtime admission and
founder agent plan admission in the existing Live Readiness route. The route now
shows founder runtime current state, next action, disabled reason, owner
capability, evidence/activity location, and cost impact through the same
evidence-backed readiness rows used by provider, tool, worker, project, DB,
deploy, release, export, package, and spend gates.

Validation: `npm run check:p844-command-center-runtime-ux`.

## P84.5 Validation Aggregation

Goal: aggregate P84 validation coverage.

Status: complete. P84.5 adds a dedicated P84 aggregation checker that verifies
P84.1-P84.4 scripts, reports, phase status, Command Center runtime visibility,
coverage evidence, and non-execution safety posture.

Validation: `npm run check:p845-validation-aggregation`.

## P84.6 Docs / Roadmap

Goal: finalize P84 docs and roadmap evidence.

Status: complete. P84.6 finalizes the P84 documentation and roadmap evidence
after founder runtime admission, Command Center Lite, agent plan admission,
Live Readiness runtime UX, and validation aggregation are complete.

Validation: `npm run check:p846-docs-roadmap`.

## P84.7 Final Validation

Goal: close P84 governed founder runtime admission.

Status: planned.

## Reuse Check

P84 must reuse:

- `founder-intake/founderIntakeSchema.js`
- `founder-intake/founderIntakeSession.js`
- `founder-intake/founderIntakeQuestions.js`
- `business-build/businessBuildPrdSchema.js`
- `business-build/businessBuildWorkstreams.js`
- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- existing live-ready gate patterns
- existing Command Center readiness rows and route tests

Do not duplicate report writers, checker formatters, result envelopes, redaction
helpers, phase status updaters, route matrices, UI card/tab/status components,
or activity/evidence appenders.

## Safety Rules

P84.1 admits local deterministic founder runtime planning only. P84.2 exposes
that admission through Command Center Lite and keeps execution blocked. P84.3
admits local agent/workstream planning records while leaving dispatch and worker
execution blocked.

Still forbidden:

- provider/model calls
- tool execution
- worker execution
- agent dispatch
- existing project mutation
- DB writes or migrations
- network calls
- deploy, release, export, or package creation
- auth/session/user/workspace mutation
- provider spend

## Rollback

Rollback P84.1 by removing
`contracts/os-roadmap/p84-execution-contracts.json`,
`docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md`,
`live-ready/founderRuntimeAdmission.js`,
`live-ready/founderAgentPlanAdmission.js`,
`scripts/check-p84-execution-plan.js`,
`scripts/check-p841-founder-runtime-admission.js`, and their reports; removing
P84 scripts from `package.json`; and returning OS phase status to P83.7 with
next phase `P84`.
