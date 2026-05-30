# P136 Secrets, Providers, and Tool Governance Plan

P136 governs secrets, provider eligibility, model access, tool contracts,
budgets, approvals, and evidence before any live external execution can be
considered. The phase is intentionally staged. P136.1 starts the contract and
safety boundary only. Later subphases own the read-only governance model,
non-runnable dry run, Command Center UX, tests, docs, and final validation.

## Subphases

- P136.1 Contract / Policy / Safety Boundary
- P136.2 Secret and Provider Model
- P136.3 Provider Dry Run
- P136.4 Provider Governance Command Center UX
- P136.5 Tests / Checkers
- P136.6 Docs / Roadmap / Status
- P136.7 Final Validation

## P136.1 Contract / Policy / Safety Boundary

Status: complete

Scope classification:
- NEXUS_OS_CHANGE

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `9bbaedf9`

Narrow goal:
- Start P136 with an implementation-grade secrets/provider/tool governance
  contract, seven-subphase split, safety boundary, checker, docs/status
  handoff, and planned-only P136.2 handoff.

Allowed files:
- `contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json`
- `docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1361-secrets-providers-tool-governance.js`
- `scripts/check-p1357-identity-tenant-roles-permissions-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P136.1, P135.7, enterprise, OS status, and phase coverage reports

Forbidden files:
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
- Create the P136 contract JSON.
- Create this P136 plan.
- Create the P136.1 checker and report.
- Update package scripts, enterprise checker, P135.7 checker, OS phase status
  checker, README, platform roadmap, enterprise roadmap, OS phase status, and
  phase index.

Expected exports, schemas, and data shapes:
- No runtime export, secret store, secret value schema, provider adapter, model
  client, tool executor, MCP server, budget ledger, approval writer, dashboard
  source, Playwright source, DB/runtime writer, or live execution path.
- Create `check:p1361-secrets-providers-tool-governance` and report.
- P136 contract records seven subphases with implementation-grade scope,
  safety, validation, and handoff fields.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not edit dashboard source or Playwright source.
- Validate UX preservation through route-wide Playwright coverage.
- Do not expose raw JSON, raw logs, raw policy dumps, raw secret references as
  primary UX, provider payloads, private IDs, mutation controls, provider call
  controls, tool execution controls, deploy controls, package controls, or
  spend controls.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through the existing route-wide Playwright suite.

Playwright tests:
- Do not edit Playwright source in this subphase.
- Run `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"` to prove UX preservation.

Checker updates:
- Add `scripts/check-p1361-secrets-providers-tool-governance.js`.
- Update `scripts/check-p1357-identity-tenant-roles-permissions-final-validation.js`
  for P136.1 handoff compatibility.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P136.1 handoff
  compatibility.
- Update `scripts/check-os-phase-status.js` so P136.1 and P136.2 are valid OS
  phase handoff IDs.

Docs/README/roadmap updates:
- Add this plan.
- Update `README.md`.
- Update `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
- Update `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`.

OS phase status update:
- P136 is in progress.
- P136.1 complete.
- Current phase P136.1.
- Previous phase P135.7.
- Next phase P136.2 planned-only.

Validation commands:
- `npm run check:p1361-secrets-providers-tool-governance`
- `npm run check:p1357-identity-tenant-roles-permissions-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P136.1 allowed files>`
- `git commit -m "chore(nexus): implement p1361 provider governance contract"`
- `git add <P136.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1361 provider governance contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source or Playwright source changes.
- No `db/**`, `local-state/runtime/**`, provider, tool, worker, deploy,
  release, export, package, or env changes.
- Secret values, provider/model calls, tool execution, MCP server startup,
  agent dispatch, DB/runtime writes, project mutation, network calls, deploy,
  release, export, package, and spend remain blocked.
- P136.2 remains planned-only.
- No stale implementation commit marker remains after the status stamp commit.

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

## Planned P136.2-P136.7 Implementation Boundaries

Each planned subphase must be implemented separately and must keep the same
forbidden paths unless its own implementation-grade plan explicitly allows a
narrow exception.

### P136.2 Secret and Provider Model

Status: planned

Narrow goal:
- Define a display-safe secret reference, provider eligibility, model access,
  tool contract, budget, approval, blocker, evidence, and next-action model
  without storing secrets or calling providers.

Allowed files:
- `shared/providerGovernanceModel.js`
- P136 contract/plan, README, platform roadmap, enterprise roadmap, OS status,
  phase index, package script, P136.2 checker, P136.1 checker handoff, and
  generated reports.

Expected exports, schemas, and data shapes:
- `PROVIDER_GOVERNANCE_MODEL_PHASE`
- `PROVIDER_GOVERNANCE_MODEL_VERSION`
- `PROVIDER_GOVERNANCE_FLAG_NAMES`
- `buildProviderGovernanceModel`
- `validateProviderGovernanceModel`
- Data must expose display-safe rows only, with all execution, network, spend,
  write, dispatch, and mutation flags false.

Command Center UX requirements:
- Preserve UX; no dashboard source changes until P136.4.

Tests/checkers and validation:
- Add `check:p1362-secret-provider-model`.
- Run P136.2, P136.1, enterprise, OS status, phase coverage, dashboard build,
  unit, route-wide Playwright, and `git diff --check`.

### P136.3 Provider Dry Run

Status: planned

Narrow goal:
- Create a non-runnable provider/tool dry-run decision packet that explains
  eligibility, blockers, approval needs, budget impact, evidence, and next
  action without calling any provider or executing any tool.

Allowed files:
- `shared/providerGovernanceDryRun.js`
- P136 contract/plan, docs, status, package, P136.3 checker, P136.2 checker
  handoff, and generated reports.

Expected exports, schemas, and data shapes:
- `PROVIDER_GOVERNANCE_DRY_RUN_PHASE`
- `buildProviderGovernanceDryRun`
- `validateProviderGovernanceDryRun`
- No provider payloads and no executable command.

Command Center UX requirements:
- Preserve UX; no dashboard source changes until P136.4.

Tests/checkers and validation:
- Add `check:p1363-provider-dry-run`.
- Run P136.3, P136.2, enterprise, OS status, phase coverage, dashboard build,
  unit, route-wide Playwright, and `git diff --check`.

### P136.4 Provider Governance Command Center UX

Status: planned

Narrow goal:
- Surface provider/tool governance state in Command Center with current state,
  blockers, disabled reason, owner, evidence/activity locations, cost impact,
  and next action while keeping all actions review-only.

Allowed files:
- `dashboard/src/data/providerGovernanceReadiness.js`
- `dashboard/src/data/commandCenterTabs.js`
- `dashboard/src/data/commandCenterRoutes.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- P136 contract/plan, docs, status, package, P136.4 checker, P136.3 checker
  handoff, and generated reports.

Expected exports, schemas, and data shapes:
- `providerGovernanceReadiness`
- `providerGovernanceSummary`
- Primary UX data must be display-safe and must not expose raw secret/provider
  payloads or raw private IDs.

Command Center UX requirements:
- Show what changed, current state, next action, blockers, disabled reason,
  owner capability, evidence/activity location, and cost impact.
- Preserve System, Dark, and Light themes.
- Preserve route-wide navigation and no DemoApp leakage.

Tests/checkers and validation:
- Add `check:p1364-provider-governance-command-center-ux`.
- Add/extend Playwright assertions for Provider Governance while preserving
  route-wide safety coverage.

### P136.5 Tests / Checkers

Status: planned

Narrow goal:
- Aggregate P136 checker and Playwright coverage across contract, model, dry
  run, UX, docs, status, safety boundaries, and forbidden paths without adding
  runtime authority.

Allowed files:
- P136 aggregate checker, route-wide Playwright assertions when needed, P136
  contract/plan, docs, status, package, checker handoffs, and generated reports.

Expected exports, schemas, and data shapes:
- Checker/report evidence only. No runtime exports.

Command Center UX requirements:
- Preserve P136.4 UX and route-wide safety tests.

Tests/checkers and validation:
- Add `check:p1365-secrets-providers-tool-governance-tests-checkers`.
- Run P136.5, P136.4, enterprise, OS status, phase coverage, dashboard build,
  unit, route-wide Playwright, and `git diff --check`.

### P136.6 Docs / Roadmap / Status

Status: planned

Narrow goal:
- Close P136 docs, README, roadmap, phase status, reports, checker handoffs,
  and final-validation preparation without changing runtime behavior.

Allowed files:
- P136 docs/status/checker/report files only; no dashboard, DB, provider, tool,
  worker, deploy, export, package, env, or project files.

Expected exports, schemas, and data shapes:
- Docs, roadmap, status, and report evidence only. No runtime exports.

Command Center UX requirements:
- Preserve P136.4 UX; no dashboard source changes.

Tests/checkers and validation:
- Add `check:p1366-secrets-providers-tool-governance-docs-roadmap`.
- Run P136.6, P136.5, enterprise, OS status, phase coverage, dashboard build,
  unit, route-wide Playwright, and `git diff --check`.

### P136.7 Final Validation

Status: planned

Narrow goal:
- Close P136 with final validation evidence, prior report verification,
  checker compatibility, docs/roadmap/status closure, route-wide Command
  Center safety, and planned-only P137 handoff.

Allowed files:
- P136 final validation checker, P136 contract/plan, docs, status, package,
  prior P136 checker handoffs, enterprise/OS checkers, and generated reports.

Expected exports, schemas, and data shapes:
- Final validation evidence only. No runtime exports.

Command Center UX requirements:
- Preserve P136.4 review-only Provider Governance UX and validate route-wide
  safety.

Tests/checkers and validation:
- Add `check:p1367-secrets-providers-tool-governance-final-validation`.
- Run full P136 checker chain, enterprise, OS status, phase coverage,
  dashboard build, unit, route-wide Playwright, and `git diff --check`.
