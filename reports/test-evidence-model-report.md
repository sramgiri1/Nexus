# Test Evidence Model Report

## Metadata

- Generated at: 2026-05-16T01:51:42.535Z
- Phase: P55.5
- Validation branch: arch/test-suite-manager-project-os
- Validation HEAD: 9a4b0e4

## Schema Fields

| Field | Type | Required | Description |
|---|---|---|---|
| resultId | string | yes | Unique result record identifier. |
| suiteId | string | yes | Suite that produced this result. |
| projectId | string | no | Project ID for project-scoped suites. |
| osScope | string | no | OS scope for OS-scoped suites. |
| runMode | string | yes | How this result was produced: preview, controlled, external, or imported. |
| status | string | yes | Result status. |
| commandPreview | string | yes | Display-only command preview. Never executed by this module. |
| startedAt | string | no | ISO timestamp when run started (if available). |
| finishedAt | string | no | ISO timestamp when run finished (if available). |
| durationMs | number | no | Duration in milliseconds (if available). |
| evidenceType | string | yes | Type of evidence this result represents. |
| redacted | boolean | yes | Always true — raw output is never stored. |
| sourceReportPath | string | no | Path to the source report file if available. |
| linkedTaskId | string | no | Linked task ID if this result is tied to a task. |
| linkedAgentId | string | no | Linked agent ID that produced this result. |
| correlationId | string | no | Correlation ID for tracing across systems. |

## Sample Record

- resultId: result-os-command-center-route-tests-1778896302513-1
- suiteId: os-command-center-route-tests
- runMode: preview
- status: not_run
- redacted: true
- evidenceType: playwright-report

## Sample Evidence Preview

- evidenceId: ev-result-os-command-center-route-tests-1778896302513-1
- redacted: true
- safetyNote: Raw output is redacted. Only metadata and status are visible.

## Checks

- Schema fields defined: PASS
- createTestResultRecord works: PASS
- validateTestResultRecord passes: PASS
- redacted always true: PASS
- createTestEvidencePreview works: PASS
- validateTestEvidencePreview passes: PASS
- summarizeTestEvidence works: PASS

## Failures

- None

## Result

PASS
