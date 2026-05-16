# Project Test Suites Report

## Metadata

- Generated at: 2026-05-16T01:47:28.370Z
- Phase: P55.2
- Validation branch: arch/test-suite-manager-project-os
- Validation HEAD: 632a20f

## Summary

- Total suites: 5
- Execution enabled: false (always)
- Project IDs: careloop
- By layer: {"backend":1,"ios":1,"policy":2,"release":1}
- By status: {"ready":1,"planned":4}

## Suite Records (Preview Only)

| Suite ID | Layer | Tool | Risk | Status |
|---|---|---|---|---|
| careloop-backend-validation | backend | npm | medium | ready |
| careloop-ios-readiness | ios | xcodebuild | high | planned |
| careloop-prd-acceptance | policy | none | medium | planned |
| careloop-privacy-compliance | policy | none | high | planned |
| careloop-release-readiness | release | none | critical | planned |

## Checks

- buildProjectTestSuites returns suites: PASS
- No suite has executionEnabled true: PASS
- All private suites have forbiddenInDemo true: PASS
- commandPreview strings present (display only): PASS
- Suite validation: PASS

## Failures

- None

## Result

PASS
