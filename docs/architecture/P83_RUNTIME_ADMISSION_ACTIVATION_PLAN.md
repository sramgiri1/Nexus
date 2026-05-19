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

Status: complete. P83.3 creates the initial Swift package scaffold under
`generated-projects/snake-ios` only. The scaffold includes a SwiftUI root view,
SpriteKit game scene, deterministic game-state model, shared game types, theme,
package manifest, README, and local unit tests for movement, scoring,
collisions, reverse-direction safety, and restart.

Validation: `npm run check:p833-approved-local-file-creation`,
`cd generated-projects/snake-ios && swift run SnakeIOSAppTests`, and
`cd generated-projects/snake-ios && swift build`.

## P83.4 Local Validation Harness

Goal: add local validation commands and reports for the generated iOS scaffold.

Status: complete. P83.4 adds the local validation manifest and checker for the
generated Snake iOS workspace. The harness runs `swift run SnakeIOSAppTests` and
`swift build` inside `generated-projects/snake-ios`, records report evidence,
and keeps App Store, TestFlight, network, provider, DB, worker, deploy, release,
package, and spend actions blocked.

Validation: `npm run check:p834-local-validation-harness`.

## P83.5 Command Center Build UX

Goal: show the admitted local build state in Command Center with current state,
next action, blockers, owner, evidence, activity, and cost impact.

Status: complete. P83.5 adds the generated Snake iOS local build state to the
existing Live Readiness activation rows. Command Center now shows that the
generated build is local-build validated, links the P83.4 evidence, names the
owner capability, states the next action, and keeps simulator launch, signing,
deploy, release, package creation, provider calls, worker dispatch, DB writes,
network calls, and spend disabled.

Validation: `npm run check:p835-command-center-build-ux` and
`cd dashboard && npx playwright test tests/routes.spec.js --grep "Live Ready"`.

## P83.6 Tests / Checkers / Docs

Goal: aggregate P83 validation coverage and keep earlier P80-P82 checks current.

Status: complete. P83.6 aggregates P83.1-P83.5 scripts, reports, docs,
roadmap status, OS phase status, and Command Center coverage into one
validation checker. It does not add new runtime behavior.

Validation: `npm run check:p836-tests-checkers-docs`.

## P83.7 Final Validation

Goal: close the local Snake iOS activation track and document remaining blocked
runtime actions.

Status: complete. P83.7 closes the local Snake iOS activation track. The final
validation confirms local project admission, scaffold planning, generated file
creation, local validation, Command Center build UX, tests/checkers/docs
aggregation, and remaining blocked runtime actions.

Validation: `npm run check:p837-final-validation`.

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
