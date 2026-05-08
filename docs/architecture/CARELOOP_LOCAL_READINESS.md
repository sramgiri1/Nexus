# CareLoop Local Readiness

## Purpose

P27-LOCAL produces a NEXUS-readable readiness snapshot of the CareLoop backend and iOS projects.
This snapshot is the foundation for the first governed CareLoop validation task. No code is
mutated, built, tested, or executed in this phase.

## Why This Phase Follows the Private Project Boundary

P26-LOCAL created the `local-private` mode boundary and enforced that public/demo mode blocks all
private project access. P27-LOCAL uses that boundary to safely read the CareLoop project
structure and produce a readiness snapshot that NEXUS can use to plan the next governed task.

Without the P26 boundary, this phase would have no enforcement mechanism to prevent private
project data from leaking into public surfaces.

## Mode Requirement

This phase runs only under `NEXUS_MODE=local-private` or `test`. In `public` or `demo` mode,
all CareLoop access is denied and the inventory returns error results.

## What Is Inspected

The inventory reads the following from `projects/careloop` and `projects/careloop-ios`:

- Path existence
- package.json — name, script names, dependency names (no source code)
- Directory presence: src, test/tests, prisma, docs
- prisma/schema.prisma — presence only, no content
- Config file presence: tsconfig, eslint, prettier, vitest, jest, lockfiles
- iOS project markers: .xcodeproj, .xcworkspace, Package.swift, Podfile, project.yml
- iOS source and test directory presence
- Info.plist presence by filename only

## What Is Not Inspected

- Source file contents
- .env or .env.local contents
- node_modules
- .git internals
- Schema content (prisma/schema.prisma is detected but not read)
- Any private business descriptions or product details

## Backend Inventory

The backend inventory module at `careloop-readiness/careloopInventory.js` exports:

- `inventoryCareLoopBackend(options)` — full inventory result
- `readPackageSummary(relativePath)` — package.json name/scripts/dependencies only
- `detectCareLoopBackendStructure(root)` — directory structure detection
- `summarizeCareLoopBackendInventory(inventory)` — human-readable summary

## iOS Inventory

The iOS inventory module at `careloop-readiness/careloopIosInventory.js` exports:

- `inventoryCareLoopIos(options)` — full inventory result
- `detectCareLoopIosStructure(root)` — Xcode project markers and directories
- `summarizeCareLoopIosInventory(inventory)` — human-readable summary

## Readiness Snapshot

The readiness module at `careloop-readiness/careloopReadiness.js` combines both inventories into
a structured snapshot with:

- Backend readiness status: `READY_FOR_VALIDATION`, `NEEDS_SETUP`, or `MISSING`
- iOS readiness status: `READY_FOR_XCODE_INVENTORY`, `NEEDS_SETUP`, or `MISSING`
- Overall status: `READY_FOR_NEXT_GOVERNED_TASK`, `NEEDS_SETUP`, or `BLOCKED`
- Recommended next task — always read-only or validation-planning, never mutation
- Safety flags — all false: providerCalls, projectMutation, buildExecuted, testExecuted, dbAccess, apiServer

## Evidence and Audit Records

The inventory CLI appends safe, redacted evidence and audit records to the local runtime files:

- `local-state/runtime/evidence.jsonl`
- `local-state/runtime/audit.jsonl`

Records contain:

- `type: "private_project_inventory"` or `eventType: "private_project_inventory_completed"`
- `redacted: true`
- `classification: "internal"`
- Generic status fields (no source code, no private business details)

## Reports

The inventory CLI writes:

- `reports/careloop-readiness-report.md` — human-readable readiness summary
- `reports/careloop-inventory.json` — structured snapshot for NEXUS consumption

Reports do not contain source code, .env content, or private business details.

## Running the Inventory

```bash
NEXUS_MODE=local-private npm run careloop:inventory
npm run check:careloop-readiness
```

## P28 Status

P28-LOCAL (CareLoop First Governed Validation Task) is complete. A SHEPHERD validation plan
was created for the CareLoop backend without source mutation, build/test execution, or
provider/network/DB calls. The task contract (`contracts/careloop/backend-validation-task-contract.json`)
and validation plan (`reports/careloop-validation-plan.json`) were produced and the task
transitioned through `queued -> running -> implementation_done` in the local state machine.

## Next Phase

The next phase classifies CareLoop backend validation commands for controlled execution
(P29). The AUDITOR `verification.code_quality_gate` task will determine which backend
scripts are safe to run under the NEXUS command allowlist.

## Public / Demo Surfaces

Public and demo mode surfaces remain DemoApp-only. CareLoop is not referenced in:

- README.md public sections
- dashboard demo data
- demo artifacts
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md public sections
