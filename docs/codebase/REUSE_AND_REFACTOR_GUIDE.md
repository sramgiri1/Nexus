# Reuse and Refactor Guide

## P41.7.2 audit summary

P41.7.2 adds an audit-only duplicate pattern inventory. It introduces
`codebase/reuseAudit.js`, `codebase/refactorCandidates.js`,
`scripts/check-reuse-audit.js`, `policy/reuse-audit-policy.json`,
`reports/reuse-audit.json`, and `reports/reuse-audit-report.md`.

The audit identifies repeated patterns and recommends future shared helpers. It
does not perform refactors or change runtime behavior.

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
