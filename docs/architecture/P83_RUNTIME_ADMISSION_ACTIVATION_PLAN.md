# P83 Runtime Admission Activation Plan

P83 turns the P82 live-ready evidence into narrowly admitted local execution
steps. It starts with a new generated workspace root for the Snake iOS test
case, while existing projects and cost-bearing runtime actions remain blocked.

Contract: `contracts/os-roadmap/p83-execution-contracts.json`.

P83 must never mutate existing `projects/**` or CareLoop files unless a later
subphase explicitly allows a named project scope and records rollback,
validation, activity, and cost evidence.

## P83.1 Local Project Creation Admission

Goal: admit a new generated workspace root for the Snake iOS project without
writing files yet.

Status: complete. P83.1 adds a local admission record for
`generated-projects/snake-ios` with explicit approval, scope, rollback,
validation, activity, cost, and redaction gates. Existing project mutation, DB
writes, provider/tool/worker execution, deploy/release/export/package behavior,
network calls, auth/session/user/workspace mutation, and provider spend remain
blocked.

Validation: `npm run check:p831-local-project-creation-admission`.

## P83.2 Snake iOS Scaffold Plan

Goal: create an implementation-grade SwiftUI/SpriteKit scaffold plan for the
admitted generated workspace root.

Status: complete. P83.2 adds the SwiftUI/SpriteKit scaffold plan for
`generated-projects/snake-ios`, including the app shell, game scene, game
state, shared game types, theme module, package manifest, README, and unit test
target. It reuses the P83.1 admission record and keeps project creation, file
writes, DB writes, provider/tool/worker execution, deploy/release/export/package
behavior, network calls, and provider spend blocked until P83.3.

Validation: `npm run check:p832-snake-ios-scaffold-plan`.

## P83.3 Approved Local File Creation

Goal: create the initial Snake iOS scaffold under the admitted generated
workspace root only.

Status: planned. This subphase may write only to the admitted
`generated-projects/snake-ios` root after validation.

## P83.4 Local Validation Harness

Goal: add local validation commands and reports for the generated iOS scaffold.

Status: planned. No App Store, TestFlight, network, provider, DB, or deploy
execution is allowed.

## P83.5 Command Center Build UX

Goal: show the admitted local build state in Command Center with current state,
next action, blockers, owner, evidence, activity, and cost impact.

Status: planned. No fake runnable actions may be exposed.

## P83.6 Tests / Checkers / Docs

Goal: aggregate P83 validation coverage and keep earlier P80-P82 checks current.

Status: planned.

## P83.7 Final Validation

Goal: close the local Snake iOS activation track and document remaining blocked
runtime actions.

Status: planned.

## Reuse Check

P83 must reuse:

- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `scope-boundary/mutationBoundary.js`
- `project-registry/projectOnboarding.js`
- `project-registry/projectProfileGenerator.js`
- existing Command Center route, tab, badge, evidence, activity, and cost
  patterns
- existing P80 founder intake, P81 business build, and P82 live-ready evidence

Do not duplicate report writers, checker formatters, result envelopes,
redaction helpers, phase status updaters, route matrices, UI card/tab/status
components, or activity/evidence appenders.

## Safety Rules

P83.1 allows only an admission record. It does not create project files. P83.2
adds only a scaffold plan and keeps file writes deferred to P83.3.

Forbidden until a later explicit subphase:

- existing `projects/**` mutation
- CareLoop mutation
- DB writes or migrations
- provider calls
- tool execution
- worker execution
- deploy, release, export, or package creation
- network calls
- auth/session/user/workspace mutation
- provider spend

## Rollback

Rollback P83.1 and P83.2 by removing
`contracts/os-roadmap/p83-execution-contracts.json`,
`docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md`,
`live-ready/localProjectCreationAdmission.js`,
`ios-scaffold/snakeIosScaffoldPlan.js`,
`scripts/check-p83-execution-plan.js`,
`scripts/check-p831-local-project-creation-admission.js`, and their reports;
`scripts/check-p832-snake-ios-scaffold-plan.js`, and their reports; removing
P83 scripts from `package.json`; and returning OS phase status to P82.7 with
next phase `P83`.
