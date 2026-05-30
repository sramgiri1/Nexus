# P138 Project Workspace Mutation and Build Pipeline Plan

P138 defines the path from scoped agent work orders to governed project
workspace change planning. It does not enable live project mutation in P138.1.
The runtime must own project boundary resolution, path policy, approval gates,
evidence/activity/audit references, rollback planning, and cost policy before
any later subphase can apply a patch or run a project command.

P138 is staged:

- P138.1 Contract / Policy / Safety Boundary
- P138.2 Workspace Mutation Model
- P138.3 Patch and Build Preview
- P138.4 Project Build Command Center UX
- P138.5 Tests / Checkers
- P138.6 Docs / Roadmap / Status
- P138.7 Final Validation

## P138.1 Contract / Policy / Safety Boundary

Status: complete

Narrow goal:
- Start P138 with an implementation-grade project workspace mutation and build
  pipeline contract, seven-subphase split, project-boundary safety policy,
  checker, docs/status handoff, and planned-only P138.2 handoff.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `0497036f`

Allowed files:
- `contracts/os-roadmap/p138-project-workspace-mutation-build-pipeline-contracts.json`
- `docs/architecture/P138_PROJECT_WORKSPACE_MUTATION_BUILD_PIPELINE_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1381-project-workspace-mutation-build-pipeline.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P138.1, enterprise, OS status, and phase coverage reports

Forbidden files:
- `projects/**`
- `generated-projects/**`
- `careloop/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules created or updated:
- Add P138 contract JSON.
- Add this P138 plan.
- Add P138.1 checker and report.
- Update enterprise and OS phase checkers.
- Update README, platform roadmap, enterprise roadmap, package script, OS phase
  status, phase index, and generated reports.

Expected exports, schemas, and data shapes:
- P138.1 is contract-only and adds no runtime exports or schemas.
- Future P138 model shape: selected project profile, project boundary,
  allowed/forbidden path globs, change intent, patch plan, build plan, test
  plan, rollback plan, approval gate, evidence references, activity
  references, audit references, owner agent/capability, next action, blockers,
  disabled reason, cost impact, Command Center visibility, and blocked safety
  flags.
- Forbidden future packet contents: raw project/private IDs, raw JSON, raw
  logs, raw policy dumps, raw registry dumps, raw patch dumps, raw diff dumps,
  secret values, direct mutation controls, build execution controls, deploy
  controls, package controls, and spend controls.

Command Center UX requirements:
- Preserve existing Command Center UX in P138.1.
- P138.4 owns future project build UX changes.
- No DemoApp surface, raw IDs, raw JSON, raw logs, raw policy dumps, raw
  registry dumps, raw patch dumps, raw diff dumps, fake runnable actions,
  project mutation controls, build execution controls, deploy controls, package
  controls, or spend controls in primary UX.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate with existing route-wide Command Center Playwright coverage.

Playwright tests:
- No Playwright source update in P138.1 because no dashboard source changes.
- Run existing route-wide Command Center coverage.
- P138.4 must add focused project build UX coverage if dashboard source changes.

Checker updates:
- Add `check:p1381-project-workspace-mutation-build-pipeline`.
- Update enterprise readiness checker for P138.1 active state.
- Update OS phase status checker for P138.1/P138.2 handoff IDs.

Docs/README/roadmap updates:
- Add this plan.
- Update README current implementation notes.
- Update platform and enterprise roadmaps.
- Update P138 OS phase status/index.

OS phase status update:
- P138 in progress.
- P138.1 complete.
- Current phase is P138.1.
- Previous phase is P137.7.
- Next phase is P138.2 planned-only.

Validation commands:
- `npm run check:p1381-project-workspace-mutation-build-pipeline`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:
- No forbidden paths changed.
- No project mutation, patch application, build/test execution, rollback
  execution, DB/runtime writes, provider/model calls, tool execution, MCP
  startup, agent dispatch, deploy, release, export, package, network calls, or
  spend.
- No project/private raw IDs, raw JSON, raw logs, raw policy dumps, raw registry
  dumps, raw patch dumps, raw diff dumps, DemoApp leakage, stale labels, fake
  runnable actions, or unsafe positive claims.
- P138.2 remains planned-only.
- No stale implementation commit marker remains after status stamp.

Git add/commit/push commands:
- `git add <P138.1 allowed files>`
- `git commit -m "chore(nexus): implement p1381 project workspace mutation build pipeline"`
- `git add <P138.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1381 project workspace mutation build pipeline"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX preservation
- Tests/checkers run
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/report records
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

## P138.2 Workspace Mutation Model

Status: complete

Narrow goal:
- Define the read-only project workspace mutation model with project boundary,
  allowed/forbidden path globs, patch plan, build/test plan, rollback plan,
  approval gate, evidence, and cost posture without writing project files.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `1e9edfbd`

Allowed files:
- `shared/projectWorkspaceMutationModel.js`
- `scripts/check-p1382-project-workspace-mutation-build-pipeline.js`
- `scripts/check-p1381-project-workspace-mutation-build-pipeline.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P138 contract, plan, README, platform roadmap, enterprise roadmap, phase
  status, phase index, package script, and generated P138.2, P138.1,
  enterprise, OS status, and phase coverage reports

Forbidden files:
- `projects/**`, `generated-projects/**`, `careloop/**`, `dashboard/src/**`,
  `dashboard/tests/**`, `db/**`, `local-state/runtime/**`, `providers/**`,
  `tools/**`, `worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`,
  `packages/**`, `.env*`

Exact files/modules to create or update:
- Add `shared/projectWorkspaceMutationModel.js`.
- Add `scripts/check-p1382-project-workspace-mutation-build-pipeline.js`.
- Update P138 contract, plan, README, platform roadmap, enterprise roadmap, OS
  phase status, phase index, package script, checker handoffs, and reports.

Expected exports, schemas, and data shapes:
- `PROJECT_WORKSPACE_MUTATION_PHASE`
- `PROJECT_WORKSPACE_MUTATION_VERSION`
- `buildProjectWorkspaceMutationModel`
- `validateProjectWorkspaceMutationModel`
- `buildProjectWorkspaceMutationEnvelope`
- Data shape: selected project profile, project boundary, allowed/forbidden path
  globs, change intent, patch plan, build plan, test plan, rollback plan,
  approval gate, evidence refs, activity refs, audit refs, owner capability,
  next action, blockers, disabled reason, cost impact, visibility, and blocked
  safety flags.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not edit dashboard source in P138.2.
- P138.4 owns model-to-UX wiring.

Dark/light/system theme requirements:
- Preserve System, Dark, and Light themes.
- Validate through existing route-wide Playwright coverage.

Playwright tests:
- No Playwright source update unless dashboard source changes.
- Run existing route-wide Command Center coverage.

Checker updates:
- Add P138.2 model checker.
- Update P138.1 and enterprise/OS handoff checkers.

Docs/README/roadmap updates:
- Update P138 plan and roadmap/status docs for P138.2 only.

OS phase status update:
- P138 in progress.
- P138.2 complete.
- Current phase is P138.2.
- Previous phase is P138.1.
- Next phase is P138.3 planned-only.

Validation commands:
- `npm run check:p1382-project-workspace-mutation-build-pipeline`
- `npm run check:p1381-project-workspace-mutation-build-pipeline`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:
- No project files changed.
- No patch application, build/test execution, rollback execution, provider/model
  calls, tool execution, agent dispatch, DB/runtime writes, deploy, release,
  export, package, network calls, or spend.
- P138.3 remains planned-only.

Git add/commit/push commands:
- `git add <P138.2 allowed files>`
- `git commit -m "chore(nexus): implement p1382 project workspace mutation build pipeline"`
- `git add <P138.2 status stamp files>`
- `git commit -m "chore(nexus): stamp p1382 project workspace mutation build pipeline"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch, commit, files changed, implementation, UX, tests/checkers,
  dashboard validation, docs/status, reports, safety, forbidden paths,
  limitations, and next subphase.

## P138.3 Patch and Build Preview

Status: complete

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `950d8d2c`

Narrow goal:
- Build a non-runnable patch/build preview from the P138.2 model showing
  display-safe candidate changes, validation commands, rollback plan, blockers,
  disabled reason, and zero-spend posture without applying patches or running
  project commands.

Allowed files:
- `shared/projectPatchBuildPreview.js`, P138 contract/plan/docs/status, package,
  P138.1/P138.2/P138.3/enterprise/OS checkers, and generated reports.

Forbidden files:
- `projects/**`, `generated-projects/**`, `careloop/**`, `db/**`,
  `local-state/runtime/**`, `providers/**`, `tools/**`, `worker-runtime/**`,
  `deploy/**`, `release/**`, `exports/**`, `packages/**`, `.env*`

Expected exports, schemas, and data shapes:
- `PROJECT_PATCH_BUILD_PREVIEW_PHASE`
- `PROJECT_PATCH_BUILD_PREVIEW_VERSION`
- `PROJECT_PATCH_BUILD_PREVIEW_SAFETY_FLAG_NAMES`
- `buildProjectPatchBuildPreview`
- `validateProjectPatchBuildPreview`
- `buildProjectPatchBuildPreviewEnvelope`
- Preview-only envelope with source model phase, redacted change summaries, path
  classifications, build/test command summaries, rollback summary, approval
  gate, blockers, disabled reason, owner, evidence/activity/audit refs, cost
  impact, redaction summary, and blocked execution flags.

Command Center UX requirements:
- Preserve existing UX.
- Do not edit dashboard source in P138.3.

Tests/checkers, docs, status, validation, git, and final checks:
- Add focused P138.3 checker, update handoffs, update docs/status/reports, run
  the P138 validation command set, commit, stamp, push, and leave P138.4
  planned-only.

Validation commands:
- `npm run check:p1383-project-workspace-mutation-build-pipeline`
- `npm run check:p1382-project-workspace-mutation-build-pipeline`
- `npm run check:p1381-project-workspace-mutation-build-pipeline`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

OS phase status update:
- P138 is in progress through P138.3.
- P138.3 is complete.
- Current subphase: P138.3.
- Previous subphase: P138.2.
- Next subphase: P138.4 planned-only.

Known limitations:
- P138.3 is non-runnable preview work only.
- It does not apply patches, mutate projects, run project builds/tests, execute
  rollback, write DB/runtime state, call providers/models, execute tools, start
  MCP servers, dispatch agents, deploy, release, export, package, use network
  calls, or spend.

## P138.4 Project Build Command Center UX

Status: complete

Narrow goal:
- Expose the P138.3 preview in the relevant Command Center project/build surface
  with clean founder-operator state, next action, blockers, owner,
  evidence/activity, disabled reason, and cost impact.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `7f7cd7f4`

Allowed files:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/data/commandCenterTabs.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- P138 contract/plan/docs/status, package, P138.1-P138.4/enterprise/OS
  checkers, and generated reports.

Forbidden files:
- Project roots, DB/runtime state, provider/tool/worker/deploy/release/export
  paths, package creation paths, and env files.

Expected exports, schemas, and data shapes:
- `projectPatchBuildPreview` in the Business Build view model.
- `ProjectPatchBuildPreviewCard` in Command Center V2.
- `BUSINESS_BUILD_TABS.projectBuild`.
- Display-safe Command Center data only: labels, summary rows, state badges,
  source model phase, preview row count, build/test/rollback summaries,
  path-boundary summaries, next action, blockers, disabled reason,
  owner/capability, evidence/activity labels, and cost impact.

Command Center UX requirements:
- Business Build overview shows the project build preview.
- Business Build has a focused Project Build tab.
- Agent Flow shows the same preview in agent context.
- Preserve route-wide navigation, System/Dark/Light themes, no DemoApp leakage,
  no raw IDs, no raw JSON/log/policy/registry/patch/diff dumps, no fake runnable
  actions, and no project mutation/build execution controls.

Tests/checkers, docs, status, validation, git, and final checks:
- Added Playwright coverage for the project build UX on Business Build and
  Agent Flow.
- Added `check:p1384-project-workspace-mutation-build-pipeline`.
- Updated P138.1-P138.3, enterprise, and OS handoff checkers.
- Updated P138 contract, README, platform roadmap, enterprise roadmap, OS
  phase status, phase index, and generated reports.

OS phase status update:
- P138 is in progress through P138.5.
- P138.4 is complete.
- Current subphase: P138.4.
- Previous subphase: P138.3.
- Later handoff: P138.5 is complete; P138.6 planned-only.

Validation commands:
- `npm run check:p1384-project-workspace-mutation-build-pipeline`
- `npm run check:p1383-project-workspace-mutation-build-pipeline`
- `npm run check:p1382-project-workspace-mutation-build-pipeline`
- `npm run check:p1381-project-workspace-mutation-build-pipeline`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Known limitations:
- P138.4 is Command Center UX only.
- It does not apply patches, mutate projects, run builds/tests, execute
  rollbacks, write DB/runtime state, call providers/models, execute tools, start
  MCP servers, dispatch agents, deploy, release, export, package, use network
  calls, or spend.
- P138.5 is complete; P138.6 remains planned-only.

## P138.5 Tests / Checkers

Status: complete

Narrow goal:
- Aggregate P138.1-P138.4 checker coverage, reports, Command Center UX
  validation, safety wording, allowed/forbidden path enforcement, and enterprise
  handoff compatibility.

Allowed files:
- P138 aggregate checker/report, P138 contract/plan/docs/status, package,
  prior P138 checkers, enterprise/OS checkers, and generated reports.

Forbidden files:
- Project roots, DB/runtime state, provider/tool/worker/deploy/release/export
  paths, package creation paths, dashboard source unless explicitly required by
  changed tests, and env files.

Expected exports, schemas, and data shapes:
- Checker/report aggregation only. No new runtime exports.

Command Center UX requirements:
- Preserve Command Center UX and validate existing route-wide safety coverage.

Reuse check:
- Reused `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Reused existing P138 model, preview, dashboard display model, route-wide
  tests, and enterprise/OS status checkers.
- No duplicate report writer, result envelope, redaction helper, mode guard,
  route matrix, or Command Center card/tab helper was added.

Tests/checkers:
- Added `scripts/check-p1385-project-workspace-mutation-build-pipeline.js`.
- Updated P138.1-P138.4 and enterprise/OS checkers for the P138.5 handoff.
- Validated existing Playwright Project Build preview coverage and route-wide
  Command Center safety checks.

Docs/roadmap/status:
- README, platform roadmap, enterprise roadmap, P138 contract, phase status,
  phase index, and generated reports record P138.5 as complete.
- P138.6 remains planned-only next.

OS phase status update:
- P138 is in progress through P138.5.
- P138.5 is complete.
- Current subphase: P138.5.
- Previous subphase: P138.4.
- Next subphase: P138.6 planned-only.

Validation commands:
- `npm run check:p1385-project-workspace-mutation-build-pipeline`
- `npm run check:p1384-project-workspace-mutation-build-pipeline`
- `npm run check:p1383-project-workspace-mutation-build-pipeline`
- `npm run check:p1382-project-workspace-mutation-build-pipeline`
- `npm run check:p1381-project-workspace-mutation-build-pipeline`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Known limitations:
- P138.5 is validation-only.
- It does not mutate project files, apply patches, run builds/tests, execute
  rollbacks, write DB/runtime state, call providers/models, execute tools, start
  MCP servers, dispatch agents, deploy, release, export, package, use network
  calls, or spend.
- P138.6 remains planned-only.

## P138.6 Docs / Roadmap / Status

Status: planned

Narrow goal:
- Close P138 documentation, README, platform roadmap, enterprise roadmap, OS
  phase status, phase index, checker handoff, and report evidence through
  P138.6.

Allowed files:
- P138 docs/status/checker/report files only.

Forbidden files:
- Project roots, DB/runtime state, provider/tool/worker/deploy/release/export
  paths, package creation paths, dashboard source/tests unless explicitly
  required by a docs/status UI data change, and env files.

Expected exports, schemas, and data shapes:
- Docs/status/report updates only. No new runtime exports.

Command Center UX requirements:
- Preserve Command Center UX. Keep founder-facing pages free of raw internals.

Tests/checkers, docs, status, validation, git, and final checks:
- Add docs/status closure checker, update handoffs, run the P138 validation
  command set, commit, stamp, push, and leave P138.7 planned-only.

## P138.7 Final Validation

Status: planned

Narrow goal:
- Finalize P138 with prior report verification, checker compatibility,
  docs/status closure, route-wide Command Center safety, and planned-only P139
  handoff.

Allowed files:
- P138 final checker/report, P138 contract/plan/docs/status, package,
  enterprise/OS checkers, phase coverage report, and generated reports.

Forbidden files:
- Project roots, DB/runtime state, provider/tool/worker/deploy/release/export
  paths, package creation paths, dashboard source/tests unless explicitly
  required by final validation, and env files.

Expected exports, schemas, and data shapes:
- Final validation only. No new runtime exports.

Command Center UX requirements:
- Preserve Command Center UX and validate route-wide navigation, themes, no
  DemoApp leakage, no raw internals, and no fake runnable actions.

Tests/checkers, docs, status, validation, git, and final checks:
- Add final validation checker, verify P138.1-P138.6 PASS reports, run the P138
  validation command set, commit, stamp, push, and hand off to P139 planned-only.
