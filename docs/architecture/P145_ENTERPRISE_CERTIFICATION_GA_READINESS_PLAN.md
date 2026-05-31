# P145 Enterprise Certification and GA Readiness Plan

P145 is the enterprise GA gate for NEXUS OS. It validates readiness evidence,
security posture, load and recovery rehearsal boundaries, and release signoff
without issuing certification, signing attestations, running scans, executing
load or recovery actions, mutating projects, writing DB/runtime state, calling
providers, using network calls, or spending.

## P145.1 Contract / Policy / Safety Boundary

Status: complete

Scope classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit: `540e2284`

Narrow goal: Start P145 with enterprise certification, security review, load
readiness, recovery readiness, and release signoff contracts plus blocked
authority flags, checker coverage, docs/status handoff, and planned-only P145.2
next.

Allowed files:
- `package.json`
- `contracts/os-roadmap/p145-enterprise-certification-ga-readiness-contracts.json`
- `scripts/check-p1451-enterprise-certification-ga-readiness.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `dashboard/tests/routes.spec.js`
- `docs/architecture/P145_ENTERPRISE_CERTIFICATION_GA_READINESS_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `reports/p1451-enterprise-certification-ga-readiness-report.md`
- `reports/p1447-billing-metering-customer-operations-final-validation-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `generated-projects/**`
- private project roots
- `dashboard/src/**`
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
- certification issuers, attestation signers, scanners, load runners, recovery
  executors, release/deploy/export/package executors, provider/model callers,
  agent dispatchers, project mutation paths, or spend paths

Expected exports, schemas, and data shapes:
- No runtime exports.
- No DB schema or migration.
- Contract-only data shapes:
  - `certificationGateShape`
  - `securityReviewShape`
  - `loadReadinessShape`
  - `recoveryReadinessShape`
  - `releaseSignoffShape`
- All authority flags remain false.

Command Center UX requirements:
- OS Roadmap shows P145.1 complete/current, P144.7 previous, and P145.2
  planned-only next.
- Primary UX must not expose raw JSON, raw logs, raw policy dumps, raw private
  project IDs, executable payloads, or fake runnable enterprise GA actions.
- Existing founder workflow pages remain useful and unchanged.

Dark/light/system theme requirements:
- Preserve System, Dark, and Light themes.
- Preserve route-wide navigation and theme switcher behavior.

Playwright tests:
- Add P145.1 OS Roadmap coverage.
- Preserve route-wide Command Center safety coverage.

Checker updates:
- Add `scripts/check-p1451-enterprise-certification-ga-readiness.js`.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P145.1 active
  state compatibility.

Docs / README / roadmap updates:
- This plan file.
- README.
- NEXUS platform roadmap.
- Enterprise readiness roadmap.
- OS roadmap JSON.
- OS phase status JSON.

OS phase status update:
- P144 and P144.7 remain complete.
- P145 is in progress.
- P145.1 is complete.
- P145.2 remains planned-only.
- Current: P145.1; previous: P144.7; next: P145.2.

Validation commands:
- `npm run check:p1451-enterprise-certification-ga-readiness`
- `npm run check:p1447-billing-metering-customer-operations-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "P145.1"`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:
- No project, CareLoop, generated project, DB/runtime, provider, tool, worker,
  deploy, release, export, package, or env files changed.
- No certification issuance, attestation signing, security scan execution, load
  execution, recovery execution, restore, failover, DB/runtime write,
  provider/model call, tool execution, agent dispatch, project mutation, network
  call, deploy/release/export/package action, or spend enabled.
- No raw private IDs, raw JSON, raw logs, raw policy dumps, raw certification
  payloads, raw attestation payloads, raw scan payloads, raw load payloads, raw
  recovery payloads, or fake runnable GA actions in primary UX.

Git add / commit / push:
- `git add <allowed P145.1 files>`
- `git commit -m "feat(nexus): add p1451 enterprise ga readiness contract"`
- Stamp commit hash after implementation.
- `git commit -m "chore(nexus): stamp p1451 enterprise ga readiness contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known limitations:
- P145.1 is contract/policy/safety-boundary work only.
- P145.2-P145.7 remain planned-only.
- It does not enable certification issuance, attestation signing, security scan
  execution, load execution, recovery execution, restore, failover, DB/runtime
  writes, provider/model calls, tool execution, agent dispatch, project
  mutation, deploy/release/export/package actions, network calls, or spend.
