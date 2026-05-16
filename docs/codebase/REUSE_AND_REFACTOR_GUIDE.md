# Reuse and Refactor Guide

## P41.7.2 audit summary

P41.7.2 adds an audit-only duplicate pattern inventory. It introduces
`codebase/reuseAudit.js`, `codebase/refactorCandidates.js`,
`scripts/check-reuse-audit.js`, `policy/reuse-audit-policy.json`,
`reports/reuse-audit.json`, and `reports/reuse-audit-report.md`.

The audit identifies repeated patterns and recommends future shared helpers. It
does not perform refactors or change runtime behavior.

## P41.7.3 shared helper catalog

P41.7.3 turns the audit into a concrete catalog and candidate plan:

- [Shared Helper Catalog](SHARED_HELPER_CATALOG.md)
- [Refactor Candidate Plan](REFACTOR_CANDIDATE_PLAN.md)
- [Shared Helper Adoption Guide](SHARED_HELPER_ADOPTION_GUIDE.md)

Use these after the [Code Documentation Standard](CODE_DOCUMENTATION_STANDARD.md),
[Module Registry](MODULE_REGISTRY.md), and [Phase Module Index](PHASE_MODULE_INDEX.md).
The intended order is documentation standard, module registry, phase module
index, reuse audit, shared helper catalog, refactor candidate plan, and adoption
guide.

## Reuse-First Rule

Before adding a new helper, check whether the repo already has a module for:

- policy loading
- report writing
- redaction
- mode guards
- route metadata
- runtime snapshot normalization

## Avoid Duplicate Implementations

Do not duplicate:

- policy loaders
- report writers
- redaction helpers
- mode guards
- checker output formatters
- runtime snapshot helpers

## Duplicate Categories From P41.7.2

The first reuse audit tracks these recurring categories:

- policy loading/parsing
- mode guards and local-private checks
- report metadata and report writers
- checker PASS/FAIL formatting
- redaction helpers
- safe response envelopes
- safe file read helpers
- runtime snapshot helpers
- action request/result envelopes
- action store patterns
- evidence/audit/runtime append patterns
- dashboard source badges
- dashboard action state labels
- route matrices and page metadata
- public/private/demo boundary checks
- phase status and roadmap updates

## Safe Helper Candidates

The audit marks these as safe near-term candidates for a future refactor phase:

- shared report metadata writer
- policy JSON loader
- mode guard helper
- checker result formatter
- redaction helper
- route and status label helper

## Safe Refactor Candidates

Reasonable refactor targets include:

- duplicated route metadata helpers
- repeated markdown report metadata blocks
- repeated snapshot-summary formatting
- repeated Command Center label mapping

## Risky Refactor Boundaries

Do not refactor high-risk runtime or security paths without a dedicated phase,
explicit validation plan, and rollback posture. This includes:

- local-state write boundary
- state machine transitions
- runtime traffic plane decisions
- controlled command runner
- orchestrator, runner, and loop
- security boundary logic
- provider/tool execution

## High-Risk Areas

Do not casually refactor:

- `orchestrator/loop.js`
- `orchestrator/runner.js`
- state-machine modules
- provider/tool execution
- project mutation logic
- local-state write boundary
- security and public/private boundary layers

These areas are correctness-sensitive and can break multiple validation phases at once.

P41.7.2 is audit-only. Any extraction of helpers must happen in a later scoped
phase after the candidate has been validated against the affected checkers.

P41.7.3 is also planning-only. It defines the catalog and plan, but broad
refactors remain blocked until a future scoped refactor phase.

## P41.7.3A Tab Foundation Reuse Rule

New Command Center tab work should reuse:

- `CommandTabs` for accessible tab list and tab panel behavior
- `commandCenterTabs.js` for tab labels, IDs, and future page tab plans
- `ScopeSwitcher` for Portfolio / Project / NEXUS OS scope display
- `ProjectSwitcher` for safe active-project display

Do not create page-local tab components unless a future phase explicitly
documents why the shared tab system is insufficient.

## P56.8 Shared Utility Foundation

P56.8 adds the first concrete shared utility foundation:

- [Shared Utilities](SHARED_UTILITIES.md)
- [Module Ownership](MODULE_OWNERSHIP.md)
- [Dependency Rules](DEPENDENCY_RULES.md)
- [Design System](DESIGN_SYSTEM.md)
- [Testing Strategy](TESTING_STRATEGY.md)

These utilities are available for future phases, but P56.8 does not broadly
refactor historical checkers or runtime modules. Future phases should reuse the
new helpers for result envelopes, report metadata, report writing, mode guards,
redaction, checker formatting, and phase-status updates.

If an older checker keeps phase-local report writing for now, record it as a
refactor candidate rather than rewriting unrelated code during feature phases.
