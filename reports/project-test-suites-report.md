# Project Test Suites Report

## Metadata

- Generated at: 2026-05-17T12:07:41.623Z
- Phase: P55.2
- Validation branch: project/careloop-phase-2-nexus-start
- Validation HEAD: 70a7105

## Summary

- Total suites: 13
- Execution enabled: false (always)
- Project IDs: careloop
- By layer: {"backend":5,"runtime":1,"ios":4,"policy":2,"release":1}
- By status: {"ready":9,"planned":4}

## Suite Records (Preview Only)

| Suite ID | Layer | Tool | Risk | Status |
|---|---|---|---|---|
| careloop-backend-validation | backend | npm | medium | ready |
| careloop-smoke-gate | runtime | custom | medium | ready |
| careloop-backend-auth | backend | node-script | medium | ready |
| careloop-backend-circles | backend | node-script | medium | ready |
| careloop-backend-reminders | backend | node-script | high | ready |
| careloop-backend-scale-isolation | backend | node-script | high | ready |
| careloop-ios-readiness | ios | custom | high | planned |
| careloop-ios-onboarding | ios | custom | medium | ready |
| careloop-ios-personas | ios | custom | medium | ready |
| careloop-ios-reminders | ios | custom | high | ready |
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
