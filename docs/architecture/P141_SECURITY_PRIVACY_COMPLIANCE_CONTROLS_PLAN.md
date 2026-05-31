# P141 Security, Privacy, and Compliance Controls Plan

## Phase Contract

P141 makes security posture, privacy boundaries, compliance evidence, policy
enforcement, and data handling controls explicit and testable before NEXUS can
claim enterprise readiness for live founder or operator use.

P141 is split into seven independently committable subphases:

- P141.1 Contract / Policy / Safety Boundary
- P141.2 Control Model
- P141.3 Compliance Preview
- P141.4 Compliance Command Center UX
- P141.5 Tests / Checkers
- P141.6 Docs / Roadmap / Status
- P141.7 Final Validation

## P141.1 Contract / Policy / Safety Boundary

Status: complete

Scope classification: NEXUS_OS_CHANGE.

Starting branch and base: `codex/nexus-e2e-phase-validation` at `28c34a71`.

Narrow goal: Start P141 with a security, privacy, compliance, policy,
evidence, and data-handling control contract while all runtime authority
remains blocked.

Allowed files:

- `package.json`
- `contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json`
- `scripts/check-p1411-security-privacy-compliance-controls.js`
- `scripts/check-p1407-backup-recovery-dr-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- P141.1, P140.7, enterprise readiness, OS status, and phase validation
  reports.

Forbidden files:

- `projects/**`
- `generated-projects/**`
- private project roots
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

- `contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json`
  defines P141.1-P141.7, control shapes, authority flags, safety rules, reuse
  checks, validation commands, docs/status updates, and final response
  checklist.
- `scripts/check-p1411-security-privacy-compliance-controls.js` validates the
  P141.1 contract, safety boundary, docs/status handoff, and existing
  Command Center coverage.
- P140.7, enterprise readiness, and OS status checkers accept the P141.1
  current state and P141.2 planned-only handoff.
- README, platform roadmap, enterprise roadmap, phase index, and phase status
  record P141.1 complete, P141 in progress, and P141.2 planned-only next.

Expected exports, schemas, and data shapes:

- No runtime exports added.
- No DB schema or migration added.
- Contract-only shapes:
  `securityControlShape`, `privacyBoundaryShape`,
  `complianceEvidenceShape`, `policyEnforcementShape`,
  `dataHandlingControlShape`, and `authorityFlags`.
- Every authority flag remains false.

Command Center UX requirements:

- Preserve existing Command Center UX.
- Reuse Compliance, Auth Governance, Safety Center, Evidence, and route-wide
  Playwright coverage as evidence only.
- Do not edit dashboard source or Playwright source in P141.1.
- Primary UX must not show dump-style internal payloads, internal phase labels
  outside OS Roadmap, demo surfaces in full Command Center, or raw private IDs.

Dark/light/system theme requirements:

- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through existing route-wide Command Center coverage.

Safety rules:

- Do not handle credentials, read secret values, expose raw data, certify
  compliance, sign legal attestations, export audits, export raw logs, create
  compliance packages, write DB/runtime state, run live CRUD, call
  providers/models, execute tools, start MCP servers, dispatch agents, mutate
  projects, deploy, release, export, package, use network calls, or spend.
- Do not add enforcement runtime, override runtime, approval writers, data
  exporters, compliance package builders, credential readers, or policy
  mutation paths.
- Do not expose raw private IDs, dump-style internal payloads, credential
  references as primary identifiers, or runnable compliance/security actions in
  primary UX.

Reuse check:

- Reuse `shared/reportWriter.js`.
- Reuse `shared/checkResultFormatter.js`.
- Reuse `policy/security-boundary-policy.json` as evidence only.
- Reuse `dashboard/src/data/complianceReadiness.js` as display-only evidence
  only.
- Reuse existing Auth Governance, Safety Center, Evidence, and route-wide
  tests.
- Do not duplicate report writers, checker formatters, redaction helpers, mode
  guards, result envelopes, route matrices, UI cards/tabs/status components, or
  activity/evidence/audit appenders.

Playwright tests:

- Reuse existing Compliance route coverage.
- Reuse existing Auth Governance route coverage.
- Reuse existing Safety Center and route-wide Command Center coverage.
- No Playwright source changes in P141.1.

Checker updates:

- Add `scripts/check-p1411-security-privacy-compliance-controls.js`.
- Update `scripts/check-p1407-backup-recovery-dr-final-validation.js` for
  P141.1 handoff compatibility.
- Update `scripts/check-enterprise-readiness-roadmap.js` for P141.1 handoff
  compatibility.
- Update `scripts/check-os-phase-status.js` so P141.1 and P141.2 are valid OS
  phase handoff IDs.

Docs / README / roadmap updates:

- `README.md` records P141.1 complete.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md` records P141.1 complete and
  P141.2 planned-only next.
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md` records P141.1
  complete and P141.2 as the next executable subphase.
- `os-roadmap/nexus-phases.json` and `os-roadmap/phase-status.json` record
  P141 in progress, P141.1 complete, previous P140.7, and next P141.2.

Reports to regenerate:

- `reports/p1411-security-privacy-compliance-controls-report.md`
- `reports/p1407-backup-recovery-dr-final-validation-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update:

- P141 in progress.
- P141.1 complete.
- Current phase/subphase is P141.1.
- Previous phase/subphase is P140.7.
- Next phase/subphase is P141.2 planned-only.

Known risks:

- P141.1 must not be misread as live compliance enforcement, certification,
  legal attestation, credential handling, raw data access, or audit export.
- Existing Command Center compliance/security routes are reused as evidence
  only; P141.4 owns future P141-specific UX changes.

Rollback plan:

- Revert the P141.1 implementation commit and stamp commit.
- Rerun P140.7, enterprise readiness, OS phase status, phase validation
  coverage, dashboard build/unit, focused Compliance/Auth/Safety Playwright,
  route-wide Playwright, and `git diff --check`.

Validation commands:

- `npm run check:p1411-security-privacy-compliance-controls`
- `npm run check:p1407-backup-recovery-dr-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Compliance|Auth Governance|safety center|Command Center route-wide UX"`
- `git diff --check`

Git commands:

- `git add <P141.1 allowed files>`
- `git commit -m "chore(nexus): implement p1411 security compliance contract"`
- `git add <P141.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1411 security compliance contract"`
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

## P141.2 Control Model

Status: planned

P141.2 must create a read-only security/privacy/compliance control model under
its own implementation-grade plan. It must not enable credential handling, raw
data exposure, runtime enforcement, certification, legal attestation, audit
export, raw log export, compliance package creation, DB/runtime writes, live
CRUD, provider/model calls, tool execution, MCP startup, agent dispatch,
project mutation, deploy, release, export, package, network calls, or spend.

## P141.3 Compliance Preview

Status: planned

P141.3 must create a display-safe compliance/security/privacy preview only. It
must not create runnable certification, attestation, audit export, raw log
export, policy enforcement, package creation, DB/runtime writes, provider/model
calls, tool execution, agent dispatch, project mutation, network calls, or
spend.

## P141.4 Compliance Command Center UX

Status: planned

P141.4 owns any future Command Center UX changes for P141-specific control
readiness. It must preserve dark/light/system themes, route-wide navigation,
no demo surface leakage, no raw dump exposure, and no runnable
compliance/security controls.

## P141.5 Tests / Checkers

Status: planned

P141.5 must harden P141 checker coverage, Playwright coverage, route-wide
safety, and stale assertion cleanup without enabling runtime authority.

## P141.6 Docs / Roadmap / Status

Status: planned

P141.6 must close docs, roadmap, phase status, and report freshness for P141
without enabling runtime authority.

## P141.7 Final Validation

Status: planned

P141.7 must close P141 with final validation and P142 planned-only handoff.
