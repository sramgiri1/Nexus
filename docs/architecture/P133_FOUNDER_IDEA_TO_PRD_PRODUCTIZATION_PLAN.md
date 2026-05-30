# P133 Founder Idea-to-PRD Productization Plan

## Scope Classification

NEXUS_OS_CHANGE. P133 is NEXUS OS work only. P133.1 is
contract/checker/docs/status work only. P133.2 adds a deterministic local
founder idea-to-PRD model. P133 must not modify project, generated project,
provider, tool, worker runtime, deploy, release, export, package, local runtime
state, DB, or environment files.

## P133 Subphase Split

P133 is split into seven implementation-grade subphases:

- P133.1 Contract / Policy / Safety Boundary
- P133.2 Intake and PRD Model
- P133.3 Safe PRD Preview
- P133.4 Chat and PRD Command Center UX
- P133.5 Tests / Checkers
- P133.6 Docs / Roadmap / Status
- P133.7 Final Validation

## P133.1 Contract / Policy / Safety Boundary

Status: complete
Phase: P133
Subphase: P133.1
Goal: Start P133 with an implementation-grade contract, founder workflow safety
boundary, checker, docs, status handoff, and planned-only P133.2 handoff.
Why this is needed: P132 closed store live admission execution validation.
P133 must make the founder idea-to-PRD journey implementation-grade before any
live PRD generation, agent dispatch, project mutation, DB write, provider call,
or spend is admitted.
User/operator impact: Operators get a concrete P133 execution contract showing
how founder idea intake, Q&A, feasibility, PRD drafting, and agent handoff
readiness will be built across narrow, independently commit-ready subphases.
Command Center impact: Preserve existing founder pages and repair route-wide
safety copy/test drift found during validation. Do not add P133 controls;
P133.4 owns future scoped UX changes.
Safety impact: P133.1 is contract/checker/docs/status only. It does not execute
founder Q&A, generate PRDs with providers/models, dispatch agents, create or
mutate projects, write DB/runtime state, deploy, release, export, package, use
network calls, or spend.
Cost impact: Local checkers, docs, reports, build, and tests only. No provider
spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `c1f61bfe`

Files expected to change:
- `contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json`
- `docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md`
- `scripts/check-p1331-founder-idea-to-prd-productization.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `scripts/check-p1327-founder-runtime-store-live-admission-execution.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1331-founder-idea-to-prd-productization-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/p1327-founder-runtime-store-live-admission-execution-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
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

Exact files/modules to create or update:
- Create `contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json`.
- Create `docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md`.
- Create `scripts/check-p1331-founder-idea-to-prd-productization.js`.
- Update enterprise roadmap, OS phase status, P132.7 handoff compatibility,
  route-wide Command Center safety copy/tests, package scripts, README,
  platform roadmap, and generated reports listed above.

Expected exports, schemas, and data shapes:
- No runtime exports.
- No dashboard exports.
- Command Center source/test changes are limited to route-wide safety copy and
  stale assertion repair. No P133 feature controls are added.
- Data shape: contract/status/report evidence only, including P133 subphase
  definitions, allowed/forbidden file scope, validation commands, safe handoff
  checks, and planned-only P133.2.
- No DB schema, migration file, table, query, runtime record, provider
  envelope, agent dispatch packet, raw private ID, raw report dump, or project
  data.

Reuse check:
- Reuse `shared/reportWriter.js`.
- Reuse `shared/checkResultFormatter.js`.
- Reuse existing founder-intake, business-build, and Command Center page
  boundaries as references only.
- Reuse existing enterprise roadmap checker and OS phase status checker.
- Do not duplicate report writers, checker formatters, result envelopes, mode
  guards, redaction helpers, route matrices, status helpers, UI card/tab/status
  components, or evidence/audit/activity appenders.

Command Center UX requirements:
- Preserve Chat with NEXUS as chat-focused.
- Preserve Founder Intake as structured intake display.
- Preserve Business Build as PRD/workstream display.
- Preserve Agent Flow as agent-lane display.
- Do not add P133 panels or controls in P133.1.
- Remove stale raw-payload wording from primary Evidence UX.
- Keep route-wide tests aligned with current display-safe labels.
- Primary UX must not expose raw JSON, raw logs, raw policy dumps, raw table
  names, raw report paths, internal helper IDs, internal phase labels outside OS
  Roadmap, private project IDs, or fake runnable actions.
- No provider/model call, autonomous Q&A, PRD generation execution, agent
  dispatch, project mutation, DB write, runtime write, deploy, release, export,
  package, network, or spend controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Run route-wide Command Center coverage without editing dashboard files.

Tests to add/update/remove:
- Add `check:p1331-founder-idea-to-prd-productization`.
- Update `check:enterprise-readiness-roadmap` for active P133.1.
- Update `check:os-phase-status` for P133 subphase handoff IDs.
- Update P132.7 checker for P133.1 handoff compatibility.
- Update route-wide Command Center tests for current display-safe labels.
- Run OS phase status and phase validation coverage.
- Run dashboard build, unit tests, and Command Center route-wide Playwright
  coverage without changing dashboard source/tests.
- Remove no tests.

Checker updates:
- Validate P133 contract/subphase split.
- Validate P133.1 allowed/forbidden files, validation commands, docs, status,
  reports, P133.2 planned-only handoff, and safe wording.
- Validate P132.7 remains complete and safely hands off into active P133.
- Validate forbidden paths remain unchanged.

Docs to update:
- This P133 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

Reports to regenerate:
- P133.1 report.
- Enterprise readiness roadmap report.
- P132.7 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P133 in progress.
- P133.1 complete.
- Current phase P133.1.
- Previous phase P132.7.
- Next phase P133.2 planned-only.

Known risks:
- Founder workflow wording can imply live autonomous execution. P133.1 keeps all
  provider calls, PRD generation execution, agent dispatch, project mutation,
  DB/runtime writes, deploy/release/export/package, network calls, and spend
  blocked.
- Starting P133 can accidentally implement P133.2 early. P133.1 records P133.2
  as planned-only.

Rollback plan:
- Revert only the P133.1 implementation and stamp commits. P132.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1331-founder-idea-to-prd-productization`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:p1327-founder-runtime-store-live-admission-execution`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P133.1 allowed files>`
- `git commit -m "chore(nexus): implement p1331 idea to prd contract"`
- `git add <P133.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1331 idea to prd contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- Dashboard source/test changes are limited to
  `dashboard/src/pages/CommandCenterV2.jsx` and `dashboard/tests/routes.spec.js`
  for route-wide safety copy/test drift.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- Founder Q&A execution, provider/model PRD generation, agent dispatch, project
  mutation, DB/runtime writes, deploy, release, export, package, network calls,
  and spend remain blocked.
- P133.2 remains planned-only.
- No stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P133.2 Intake and PRD Model

Status: complete
Phase: P133
Subphase: P133.2
Goal: Define the deterministic founder intake and PRD model for structured Q&A,
feasibility, readiness, blockers, evidence, and safe local state.
Why this is needed: The founder workflow needs one reliable model before safe
PRD preview and Command Center chat/PRD UX can become useful.
User/operator impact: Operators can inspect what NEXUS understands about the
idea, which founder answers are missing, whether feasibility is ready for
review, and which PRD fields are ready for the next safe preview phase.
Command Center impact: Preserve existing Command Center UX in P133.2. The model
is Command Center visible, but P133.4 owns rendering changes. Existing
route-wide Playwright coverage remains the UX safety guard.
Safety impact: P133.2 is a deterministic local model only. It does not execute
autonomous Q&A, call providers/models, generate PRDs with providers/models,
dispatch agents, create or mutate projects, write DB/runtime state, use network
calls, deploy, release, export, package, or spend.
Cost impact: Local deterministic modeling and validation only. No provider
spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `ce53b7f8`

Files expected to change:
- `live-ready/founderIdeaToPrdModel.js`
- `scripts/check-p1332-founder-idea-to-prd-model.js`
- `scripts/check-p1331-founder-idea-to-prd-productization.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-p1327-founder-runtime-store-live-admission-execution.js`
- `contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json`
- `docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `reports/p1332-founder-idea-to-prd-model-report.md`
- `reports/p1331-founder-idea-to-prd-productization-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/p1327-founder-runtime-store-live-admission-execution-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
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

Exact files/modules to create or update:
- Create `live-ready/founderIdeaToPrdModel.js`.
- Create `scripts/check-p1332-founder-idea-to-prd-model.js`.
- Update P133.1, P132.7, and enterprise roadmap checkers for P133.2 handoff
  compatibility.
- Update package scripts, P133 contract, docs, roadmap, OS phase status, and
  generated reports listed above.

Expected exports, schemas, and data shapes:
- `P133_FOUNDER_IDEA_TO_PRD_MODEL_PHASE`
- `P133_FOUNDATION_PRD_FIELDS`
- `P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS`
- `buildFounderIdeaToPrdModel(input)`
- `validateFounderIdeaToPrdModel(envelope)`
- Data shape: result envelope with `schemaVersion`, `currentState`,
  `modelMode`, `intake`, `question`, `comprehension`, `prdReadiness`,
  `feasibility`, `localState`, `allowedLocalOperations`,
  `forbiddenOperations`, `safetyFlags`, `nextAction`, `blockers`,
  `disabledReason`, `ownerCapability`, `evidenceRefs`, `activityLocation`,
  `costImpact`, and `commandCenterVisible`.
- No DB schema, migration, table, query, runtime write, provider envelope,
  agent dispatch packet, raw private ID, raw report dump, or project data.

Reuse check:
- Reuse `founder-intake/founderIntakeSession.js`.
- Reuse `founder-intake/founderIntakeQuestions.js`.
- Reuse `founder-intake/founderIntakeComprehension.js`.
- Reuse `business-build/businessBuildPrdSchema.js`.
- Reuse `shared/resultEnvelope.js`, `shared/reportWriter.js`, and
  `shared/checkResultFormatter.js`.
- Do not duplicate report writers, checker formatters, result envelopes, mode
  guards, redaction helpers, route matrices, status helpers, UI card/tab/status
  components, or evidence/audit/activity appenders.

Command Center UX requirements:
- No Command Center source changes in P133.2.
- Preserve Chat with NEXUS, Founder Intake, Business Build, Agent Flow,
  route-wide navigation, and display-safe labels.
- Preserve no DemoApp leakage, no raw JSON/log/policy dumps, no raw private
  project IDs, and no fake runnable actions.
- Preserve route-wide Playwright coverage as the P133.2 UX guard.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Run dashboard build, unit tests, and route-wide Playwright coverage without
  editing dashboard source/tests.

Tests to add/update/remove:
- Add `check:p1332-founder-idea-to-prd-model`.
- Update P133.1 checker for P133.2 handoff compatibility.
- Update enterprise roadmap checker for P133.2.
- Update P132.7 checker for safe P133 progress.
- Preserve existing route-wide Command Center Playwright tests; add no
  dashboard tests because no dashboard UX is changed in this subphase.
- Remove no tests.

Checker updates:
- Validate the P133.2 model envelope and validator.
- Validate reuse of founder intake, Q&A, comprehension, and Business Build PRD
  helpers.
- Validate P133.2 allowed/forbidden files, validation commands, docs, status,
  reports, P133.3 planned-only handoff, and safe wording.
- Validate P133.1, P132.7, and enterprise roadmap checkers remain compatible.

Docs to update:
- This P133 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

Reports to regenerate:
- P133.2 report.
- P133.1 report.
- Enterprise readiness roadmap report.
- P132.7 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P133 in progress.
- P133.2 complete.
- Current phase P133.2.
- Previous phase P133.1.
- Next phase P133.3 planned-only.

Known risks:
- The model can be mistaken for live PRD generation. P133.2 keeps PRD preview
  and all execution paths blocked.
- Rebuilding intake or PRD helpers would create drift. P133.2 composes the
  existing founder intake and Business Build PRD helpers.

Rollback plan:
- Revert only the P133.2 implementation and stamp commits. P133.1 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1332-founder-idea-to-prd-model`
- `npm run check:p1331-founder-idea-to-prd-productization`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:p1327-founder-runtime-store-live-admission-execution`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P133.2 allowed files>`
- `git commit -m "chore(nexus): implement p1332 idea to prd model"`
- `git add <P133.2 status stamp files>`
- `git commit -m "chore(nexus): stamp p1332 idea to prd model"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- Autonomous Q&A execution, provider/model PRD generation, agent dispatch,
  project mutation, DB/runtime writes, deploy, release, export, package,
  network calls, and spend remain blocked.
- P133.3 remains planned-only.
- No stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.
