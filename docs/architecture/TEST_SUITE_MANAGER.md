# TEST_SUITE_MANAGER — Architecture

## Purpose

The Test Suite Manager (P55) is a **registry and visibility layer only**. It catalogs all known test suites for NEXUS OS and active projects, surfaces them in the Command Center Test Center, and provides evidence-ready metadata for downstream qualification. It does **not** execute any tests, run any commands, call any providers, write to any database, or mutate any project files.

## Policy Constraints (P55)

| Constraint | Value |
|---|---|
| testExecutionAllowed | false |
| registryOnly | true |
| commandExecutionAllowed | false |
| providerCallsAllowed | false |
| externalNetworkCallsAllowed | false |
| dbWritesAllowed | false |
| projectMutationAllowed | false |
| commandCenterUxRequired | true |

Policy is enforced by `policy/test-suite-manager-policy.json`.

## Schema Fields

Every test suite record in the registry contains the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| suiteId | string | yes | Unique suite identifier |
| projectId | string | no | Project ID when scope is "project" |
| osScope | string | no | OS scope identifier when scope is "os" |
| scope | string | yes | "project", "os", or "cross_cutting" |
| layer | string | yes | Technical layer (backend, frontend, ios, android, db, api, ui, policy, docs, runtime, security, release, unknown) |
| tool | string | yes | Test tool (npm, playwright, xcodebuild, gradle, pytest, jest, node-script, custom, none) |
| commandPreview | string | yes | Display-only command preview. Never executed. |
| allowedInMode | array | no | Modes where this suite is allowed (display only) |
| requiresApproval | boolean | yes | Whether approval is required |
| requiresRunner | boolean | yes | Whether a specialized runner is required |
| riskLevel | string | yes | low, medium, high, or critical |
| costClass | string | yes | free, low, medium, or high |
| evidenceTypes | array | yes | Evidence type identifiers this suite produces |
| ownerAgent | string | yes | Primary owning agent |
| changedFilePatterns | array | yes | Glob patterns that trigger this suite |
| forbiddenInDemo | boolean | yes | Must not appear in Demo Mode if true |
| dataClassification | string | yes | public, demo, or private |
| executionEnabled | boolean | yes | Always false in P55 |
| status | string | no | planned, ready, active, or disabled |
| description | string | no | Human-readable description |

## OS Awareness

OS-scoped suites (scope: "os") cover NEXUS OS infrastructure layers:
- Command Center UI (playwright)
- Scope/policy boundary checks (node-script)
- Agent, skill, hook, tool, and trigger registry checks (node-script)
- Memory, trusted-context, and mesh checks (node-script)
- API/batch adapter, trigger gateway, DB, and observability checks (node-script)
- Docs, diagram, and readability checks (node-script)

OS suites have `forbiddenInDemo: false` and `dataClassification: "public"`.

## Project Awareness

Project-scoped suites (scope: "project") are tied to a specific `projectId`. They cover backend, iOS, PRD acceptance, privacy/compliance, and release readiness layers. All private project suites have `forbiddenInDemo: true` and `dataClassification: "private"`.

## Evidence-Ready Metadata Approach

The registry provides `evidenceTypes` on each suite record so that downstream agents (AUDITOR, SENTINEL, WARDEN) can plan evidence collection without triggering test execution. When a real test run occurs (in a future governed phase), the result record is linked back to the suite via `suiteId` and the `testEvidenceModel` handles redaction and audit-safe evidence storage.

## Changed-File to Test Mapping

`test-suite/changedFileTestMapper.js` maps file path patterns to suite IDs. This allows the Test Selection Preview feature in the Command Center to show which suites would be relevant for a given set of changed files, without executing anything.

## P55 Subphases

| Subphase | Title | Status |
|---|---|---|
| P55.1 | Test Registry Schema | Complete |
| P55.2 | Project Test Suites | Complete |
| P55.3 | OS Test Suites | Complete |
| P55.4 | Changed-File to Test Mapping | Complete |
| P55.5 | Test Result Evidence Model | Complete |
| P55.6 | Command Center Test Center UX | Complete |
| P55.7 | Final Validation | Complete |

P56: Quality Intelligence + Test Gap Detection is the next phase.

## Files

| File | Description |
|---|---|
| `test-suite/index.js` | Public entry point |
| `test-suite/testTypes.js` | Constants |
| `test-suite/testRegistrySchema.js` | Schema definition and validation |
| `test-suite/projectTestSuites.js` | Project-scoped suite records |
| `test-suite/osTestSuites.js` | OS-scoped suite records |
| `test-suite/testRegistry.js` | Combined registry access |
| `test-suite/changedFileTestMapper.js` | Changed-file to suite mapping |
| `test-suite/testSelectionPreview.js` | Selection preview builder |
| `test-suite/testResultSchema.js` | Result record field definitions |
| `test-suite/testEvidenceModel.js` | Evidence model and redaction |
| `policy/test-suite-manager-policy.json` | Policy constraints |
| `scripts/check-test-suite-manager.js` | P55.1 checker |
| `scripts/check-project-test-suites.js` | P55.2 checker |
| `scripts/check-os-test-suites.js` | P55.3 checker |
| `scripts/check-test-selection-preview.js` | P55.4 checker |
| `scripts/check-test-evidence-model.js` | P55.5 checker |
| `scripts/check-test-suite-manager-final.js` | P55.7 final checker |
