# NEXUS Reuse Audit Report

## Metadata

- Generated at: 2026-05-14T13:41:05.743Z
- Validation branch: docs/reuse-audit-duplicate-pattern-inventory
- Validation HEAD: e0026e4
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.7.2 - Reuse Audit + Duplicate Pattern Inventory

## Summary

- Areas scanned: 15
- Patterns found: 16
- High-priority candidates: 6
- Medium-priority candidates: 9
- Low-priority candidates: 1
- Safe refactors recommended: 8
- Risky refactors deferred: 1

## Duplicate Pattern Inventory

| Pattern | Category | Occurrences | Priority | Recommended shared module | Do now? | Notes |
| --- | --- | ---: | --- | --- | --- | --- |
| Repeated policy JSON loading and parsing | policy | 20 | high | shared/policyLoader.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated local-private and mode guard checks | safety | 20 | high | shared/modeGuards.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated report metadata and Validation HEAD wording | reporting | 20 | high | shared/reportWriter.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated checker PASS/FAIL formatting | checking | 20 | high | shared/checkResultFormatter.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated redaction and safe payload shaping | safety | 20 | high | shared/redaction.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated safe response envelope handling | api | 20 | medium | local-api/safeResponse.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated safe local file read helpers | state | 20 | medium | local-state/safeFileReader.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated runtime snapshot normalization | state | 20 | medium | local-state/runtimeSnapshot.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated action request and result envelopes | actions | 20 | medium | shared/actionResult.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated append-only action store patterns | actions | 20 | medium | local-state/actionStore.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated evidence, audit, and runtime append flows | evidence | 20 | medium | local-state/appendRuntimeRecord.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated dashboard source badge rendering and labels | dashboard | 3 | low | dashboard/src/data/sourceLabels.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated dashboard action state labels | dashboard | 20 | medium | dashboard/src/data/actionStateLabels.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated route matrices and page metadata | dashboard | 4 | medium | dashboard/src/data/commandCenterRoutes.js | no | Audit-only subphase. No refactor in P41.7.2. |
| Repeated public/private/demo boundary checks | safety | 20 | high | shared/boundaryGuards.js | no | High-risk boundary. Requires a dedicated refactor phase and validation plan. |
| Repeated phase status and roadmap update patterns | roadmap | 14 | medium | os-roadmap/phaseStatusWriter.js | no | Audit-only subphase. No refactor in P41.7.2. |

## Refactor Candidate Plan

### Safe Near-Term Helper Candidates

- Repeated policy JSON loading and parsing (shared/policyLoader.js)
- Repeated report metadata and Validation HEAD wording (shared/reportWriter.js)
- Repeated checker PASS/FAIL formatting (shared/checkResultFormatter.js)
- Repeated local-private and mode guard checks (shared/modeGuards.js)
- Repeated redaction and safe payload shaping (shared/redaction.js)
- Repeated dashboard action state labels (dashboard/src/data/actionStateLabels.js)
- Repeated route matrices and page metadata (dashboard/src/data/commandCenterRoutes.js)
- Repeated phase status and roadmap update patterns (os-roadmap/phaseStatusWriter.js)

### Medium-Risk Later Candidates

- Repeated local-private and mode guard checks (shared/modeGuards.js)
- Repeated redaction and safe payload shaping (shared/redaction.js)
- Repeated safe response envelope handling (local-api/safeResponse.js)
- Repeated safe local file read helpers (local-state/safeFileReader.js)
- Repeated runtime snapshot normalization (local-state/runtimeSnapshot.js)
- Repeated action request and result envelopes (shared/actionResult.js)
- Repeated append-only action store patterns (local-state/actionStore.js)
- Repeated evidence, audit, and runtime append flows (local-state/appendRuntimeRecord.js)
- Repeated dashboard source badge rendering and labels (dashboard/src/data/sourceLabels.js)

### High-Risk Deferred Candidates

- Repeated public/private/demo boundary checks (shared/boundaryGuards.js)
- local-state write boundary (dedicated future refactor phase)
- state machine transitions (dedicated future refactor phase)
- runtime traffic plane decisions (dedicated future refactor phase)
- controlled command runner (dedicated future refactor phase)
- orchestrator/runner/loop (dedicated future refactor phase)
- security boundary logic (dedicated future refactor phase)

## Explicit Non-Goals

- no runtime behavior changed
- no action bridge rewrite
- no local API behavior change
- no DB behavior change
- no project source mutation

## Next Phase

P41.7.3 - Shared Helper Catalog + Refactor Candidate Plan
