# P142 Admin Operations and Runtime Settings Plan

P142 gives enterprise operators a governed admin operations boundary for
settings, feature gates, maintenance controls, and runtime state. The phase
does not make those controls live until their own subphases define and validate
safe, display-first behavior.

Safety boundary for all P142 subphases:

- Do not mutate admin settings, toggle features, roll out features, execute
  maintenance, schedule maintenance, mutate runtime state, write DB/runtime
  state, handle credentials, read secrets, export audits, expose raw logs, or
  expose raw runtime state unless a later subphase explicitly permits it.
- Do not call providers/models, execute tools, start MCP servers, dispatch
  agents, mutate projects, deploy, release, export, package, use network calls,
  or spend.
- Do not expose raw JSON, raw logs, raw policy dumps, raw admin payloads, raw
  private project IDs, or fake runnable admin actions in primary UX.
- Preserve System, Dark, and Light themes.
- Preserve full Command Center route-wide safety coverage and keep demo surfaces
  out of full Command Center.

Reuse rule for all P142 subphases:

- Reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
  `os-roadmap/updatePhaseStatus.js` patterns when status helper automation is
  needed, existing dashboard route/card/tab/status patterns, and existing
  evidence/audit/activity helpers.
- Do not duplicate report writers, checker formatters, redaction helpers, mode
  guards, result envelopes, phase status updaters, route matrices, UI
  components, or evidence/audit/activity appenders.

## P142.1 Contract / Policy / Safety Boundary

Status: complete

Narrow goal: Start P142 with an implementation-grade admin operations and
runtime settings contract, seven-subphase split, safety boundary, checker,
docs/status handoff, and planned-only P142.2 handoff.

Starting branch and expected base commit:

- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `18087b39`

Allowed files:

- `package.json`
- `contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json`
- `scripts/check-p1421-admin-operations-runtime-settings.js`
- `scripts/check-p1417-security-privacy-compliance-controls-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `dashboard/tests/routes.spec.js`
- `docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `reports/p1421-admin-operations-runtime-settings-report.md`
- `reports/p1417-security-privacy-compliance-controls-final-validation-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:

- `projects/**`
- `generated-projects/**`
- private project roots
- `dashboard/src/**`
- `dashboard/tests/** except dashboard/tests/routes.spec.js`
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

- Create `contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json`
- Create `scripts/check-p1421-admin-operations-runtime-settings.js`
- Create `docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md`
- Update the P141.7 final checker and enterprise roadmap checker for P142.1
  handoff compatibility
- Update route-wide Playwright OS Roadmap assertions for the P142.1 handoff
- Update README, platform roadmap, enterprise roadmap, OS phase status, phase
  index, and generated reports

Expected exports, schemas, and data shapes:

- Runtime exports: none
- DB schemas or migrations: none
- Contract-only shapes:
  - `adminSettingsPolicyShape`
  - `featureGateShape`
  - `maintenanceControlShape`
  - `runtimeOperationalStateShape`
  - `adminAuditSurfaceShape`
  - `authorityFlags`

Command Center UX requirements:

- Preserve the existing Command Center UX.
- P142.1 does not edit dashboard source, labels, routes, controls, or theme
  behavior.
- P142.1 may update route-wide Playwright assertions to follow the current OS
  Roadmap handoff.
- P142.4 owns the future scoped Settings/Admin Operations UX.
- Primary UX must not show raw JSON, raw logs, raw policy dumps, internal phase
  labels outside OS Roadmap, demo surfaces outside demo mode, raw private project IDs,
  mutation buttons, or fake runnable admin actions.

Dark/light/system theme requirements:

- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate with existing route-wide Command Center coverage.

Playwright tests:

- Reuse route-wide Command Center safety coverage.
- Reuse OS Roadmap coverage.
- Only `dashboard/tests/routes.spec.js` may change for stale OS Roadmap
  assertions in P142.1.

Checker updates:

- Add `check:p1421-admin-operations-runtime-settings`.
- Update P141.7 final checker to accept P142.1 handoff.
- Update enterprise readiness checker to accept P142.1 active state.

Docs/README/roadmap updates:

- Update this plan.
- Update README.
- Update `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.
- Update `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- Update `os-roadmap/nexus-phases.json`.
- Update `os-roadmap/phase-status.json`.

OS phase status update:

- P141 and P141.7 stay complete.
- P142 is `in_progress`.
- P142.1 is `complete`.
- P142.2 was `planned` at P142.1 completion and has since advanced through
  model-only validation.
- Current phase at P142.1 completion was P142.1, previous was P141.7, next was
  P142.2.

Validation commands:

- `npm run check:p1421-admin-operations-runtime-settings`
- `npm run check:p1417-security-privacy-compliance-controls-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "OS Roadmap|Command Center route-wide UX"`
- `git diff --check`

Final safety checks:

- No project files changed.
- No dashboard source changed, and only route-wide Playwright assertions changed.
- No DB/runtime, provider, tool, worker, deploy, release, export, package, or
  env files changed.
- No setting mutation, feature toggle, feature rollout, maintenance execution,
  maintenance scheduling, runtime state mutation, DB/runtime write, credential
  handling, secret read, audit export, raw log exposure, raw state exposure,
  provider/model call, tool execution, MCP startup, agent dispatch, project
  mutation, deploy, release, export, package, network call, or spend path.
- P142.2 was planned-only at P142.1 completion and now has its own completed
  model-only record.
- No stale placeholder commit marker remains after the stamp commit.

Git add/commit/push commands:

- `git add <P142.1 allowed files>`
- `git commit -m "chore(nexus): implement p1421 admin settings contract"`
- stamp the implementation commit hash
- `git add <P142.1 stamp files and refreshed reports>`
- `git commit -m "chore(nexus): stamp p1421 admin settings contract"`
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

## P142.2 Settings Model

Status: complete

Narrow goal: Create a read-only admin operations settings model from the P142.1
shapes without enabling settings mutation, feature toggles, maintenance
execution, DB/runtime writes, or provider/tool/project authority.

Allowed files: `shared/adminOperationsRuntimeSettingsModel.js`, P142 contract,
P142.2 checker, P142.1 checker handoff, enterprise roadmap checker,
`dashboard/tests/routes.spec.js` for stale OS Roadmap assertions only, P142
plan, README, platform roadmap, enterprise roadmap, OS phase status, phase
index, generated reports, and package script.

Forbidden files: `projects/**`, `generated-projects/**`, private project roots,
`dashboard/src/**`, `dashboard/tests/**` except `dashboard/tests/routes.spec.js`,
`db/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Expected data shape: read-only settings model rows with display name, current
state, disabled reason, owner capability, next action, blockers, evidence refs,
cost impact, and all authority flags false. P142.2 exports builders and
validators for admin settings policy rows, feature gate rows, maintenance
control rows, runtime operational state rows, admin audit surface rows, the
aggregate model, and result envelope.

Command Center UX: no primary UX source change. P142.2 model is not rendered
directly in primary Command Center UX. P142.4 owns UX.

Tests/checkers: add P142.2 checker, update P142.1 checker handoff, update
enterprise checker, and run existing route-wide coverage.

Validation: P142.2 checker, P142.1 checker, enterprise roadmap, OS phase
status, phase validation coverage, dashboard build/unit, route-wide Playwright,
and `git diff --check`.

Result: complete as read-only model work. P142.3 Admin Dry Run is planned-only
next. No settings mutation, feature toggle, maintenance execution, runtime
write, audit export, provider/model call, tool execution, agent dispatch,
project mutation, deploy, release, export, package, network call, or spend
authority is enabled.

## P142.3 Admin Dry Run

Status: complete

Narrow goal: Create a non-runnable admin operations dry run that previews
setting, feature gate, and maintenance intent with every mutation and execution
path disabled.

Allowed files: contract, model/dry-run helper, P142.3 checker, P142 plan,
README, platform roadmap, enterprise roadmap, OS phase status, phase index,
generated reports, and package script.

Forbidden files: project files, dashboard source/tests unless required for
existing dry-run evidence, DB/runtime implementation, providers, tools,
worker-runtime, deploy/release/export/package folders, and env files.

Expected data shape: dry-run result envelope with safe preview rows, blocked
actions, disabled reasons, owner capability, evidence/activity labels, audit
labels, cost impact, redaction summary, zero write/execution/spend counts, null
executable payloads, and all safety flags false.

Command Center UX: no primary UX source change. P142.3 dry run is not rendered
directly in primary Command Center UX. P142.4 owns admin settings UX.

Tests/checkers: add P142.3 checker, update P142.2 handoff, update enterprise
checker, and run route-wide safety coverage.

Validation: P142.3 checker, P142.2 checker, enterprise roadmap, OS phase
status, phase validation coverage, dashboard build/unit, route-wide Playwright,
and `git diff --check`.

Result: complete as non-runnable dry-run work. P142.4 Settings Command Center UX
is planned-only next. No admin setting mutation, feature toggle, feature
rollout, maintenance execution, maintenance scheduling, runtime state mutation,
DB/runtime write, audit export, raw log exposure, raw state exposure,
credential handling, secret read, provider/model call, tool execution, MCP
startup, agent dispatch, project mutation, deploy, release, export, package,
network call, or spend authority is enabled.

## P142.4 Settings Command Center UX

Status: complete

Narrow goal: Surface display-safe admin operations and runtime settings state in
Command Center with current state, blockers, disabled reason, owner capability,
next action, evidence/activity location, and cost impact.

Allowed files: scoped dashboard data/page files, route tests, contract, P142.4
checker, P142 plan, README, platform roadmap, enterprise roadmap, OS phase
status, phase index, generated reports, and package script.

Forbidden files: project files, DB/runtime implementation, providers, tools,
worker-runtime, deploy/release/export/package folders, env files, and unrelated
dashboard pages.

Expected data shape: display-safe Command Center view model for admin settings,
feature gates, maintenance controls, runtime state, blockers, evidence/activity
labels, disabled reason, owner, next action, and cost impact.

Command Center UX: show what changed, current state, next action, blockers,
disabled reason, owner capability, evidence/activity location, and cost impact.
No raw JSON, raw logs, raw policy dumps, raw private IDs, mutation buttons, or
fake runnable admin actions.

Tests/checkers: add P142.4 checker and Playwright coverage for the scoped admin
settings UX plus route-wide safety tests.

Validation: P142.4 checker, P142.3 checker, enterprise roadmap, OS phase
status, phase validation coverage, dashboard build/unit, scoped Playwright,
route-wide Playwright, and `git diff --check`.

Result: complete as display-only Settings Command Center UX. The page now shows
admin settings, feature gates, maintenance controls, runtime state, audit
surfaces, dry-run summary, evidence/activity locations, disabled reasons,
owners, next action, and zero-spend cost posture. P142.5 Tests / Checkers is
planned-only next. No admin setting mutation, feature toggle, feature rollout,
maintenance execution, maintenance scheduling, runtime state mutation,
DB/runtime write, audit export, raw log exposure, raw state exposure,
credential handling, secret read, provider/model call, tool execution, MCP
startup, agent dispatch, project mutation, deploy, release, export, package,
network call, or spend authority is enabled.

## P142.5 Tests / Checkers

Status: planned

Narrow goal: Harden P142 checker and Playwright coverage across contract, model,
dry run, Command Center UX, docs, status, and forbidden authority claims.

Allowed files: P142 checkers, route tests if labels/states changed, contract,
P142 plan, README, platform roadmap, enterprise roadmap, OS phase status, phase
index, generated reports, and package script.

Forbidden files: project files, unrelated dashboard pages, DB/runtime
implementation, providers, tools, worker-runtime, deploy/release/export/package
folders, and env files.

Expected data shape: aggregate validation report over P142.1-P142.4 evidence,
route assertions, docs/status, and safety wording.

Command Center UX: preserve P142.4 UX and route-wide navigation/theme behavior.

Tests/checkers: add P142.5 aggregate checker, update P142.4 handoff, update
enterprise checker, and update/remove obsolete route assertions if labels or
states changed.

Validation: P142.5 checker, P142.4 checker, enterprise roadmap, OS phase
status, phase validation coverage, dashboard build/unit, route-wide Playwright,
and `git diff --check`.

## P142.6 Docs / Roadmap / Status

Status: planned

Narrow goal: Close P142 docs, README, roadmap, OS phase status, checker
handoff, and report freshness while keeping P142.7 final validation
planned-only.

Allowed files: contract, P142 docs, README, platform roadmap, enterprise
roadmap, OS phase status, phase index, P142.6 checker, P142.5 checker handoff,
enterprise checker, generated reports, and package script.

Forbidden files: project files, dashboard source/tests, DB/runtime
implementation, providers, tools, worker-runtime, deploy/release/export/package
folders, and env files.

Expected data shape: docs/status/checker-only updates. No runtime export, DB
schema, dashboard source, Playwright source, or live execution.

Command Center UX: preserve current Command Center UX and no stale labels.

Tests/checkers: add P142.6 docs/status checker, update P142.5 handoff, update
enterprise checker, and rerun route-wide coverage.

Validation: P142.6 checker, P142.5 checker, enterprise roadmap, OS phase
status, phase validation coverage, dashboard build/unit, route-wide Playwright,
and `git diff --check`.

## P142.7 Final Validation

Status: planned

Narrow goal: Close P142 with final validation evidence, prior report
verification, P142 complete status, and safe planned-only P143 handoff.

Allowed files: contract, P142 docs, README, platform roadmap, enterprise
roadmap, OS phase status, phase index, P142.7 checker, P142.6 checker handoff,
enterprise checker, generated reports, and package script.

Forbidden files: project files, dashboard source/tests unless final validation
must update stale labels, DB/runtime implementation, providers, tools,
worker-runtime, deploy/release/export/package folders, and env files.

Expected data shape: final validation report and closed status metadata only.
No settings mutation, feature toggle, maintenance execution, runtime write,
audit export, provider/model call, agent dispatch, project mutation, deploy,
release, export, package, network call, or spend authority.

Command Center UX: preserve display-safe admin operations UX and verify no raw
dump, demo leakage, private ID exposure, or fake runnable action.

Tests/checkers: add P142.7 final validation checker, update P142.6 handoff,
update enterprise checker, and run full route-wide safety coverage.

Validation: P142.7 checker, P142.6 checker, P142.5 checker, enterprise
roadmap, OS phase status, phase validation coverage, dashboard build/unit,
route-wide Playwright, and `git diff --check`.
