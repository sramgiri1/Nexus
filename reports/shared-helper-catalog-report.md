# NEXUS Shared Helper Catalog Report

## Metadata

- Generated at: 2026-05-14T14:02:04.719Z
- Validation branch: docs/shared-helper-catalog-refactor-plan
- Validation HEAD: 113db67
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Catalog Summary

- Helpers cataloged: 15
- Existing helpers: 4
- Planned helpers: 8
- Future helpers: 2
- High-risk helpers: 4

## Refactor Candidate Plan

- Total candidates: 12
- Low risk: 4
- Medium risk: 3
- High risk: 5
- First candidates: 4
- Do not refactor yet: 5

## First Safe Candidates

- Extract shared report writer (shared/reportWriter.js)
- Extract check result formatter (shared/checkResultFormatter.js)
- Reuse Command Center route matrix in tests (dashboard/src/data/commandCenterRoutes.js)
- Extract docs link checker helper (shared/docsLinkChecker.js)

## High-Risk Deferred

- Defer mode guard extraction
- Defer redaction helper extraction
- Defer safe file boundary extraction
- Defer local-state write guard extraction
- Defer state machine wrappers

## Checks

- Modules: PASS
- Exports: PASS
- Shared helper catalog: PASS
- Refactor candidate plan: PASS
- Docs: PASS
- Policy: PASS
- OS phase status: PASS
- No forbidden changes: PASS
- Formatting/readability: PASS

## Failures

- None

## Result

PASS
