# P83.4 Local Validation Harness Report

## Metadata

- Phase: P83.4
- Generated at: 2026-05-19T20:19:13.527Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 04beb28
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates the P83.4 local validation harness for the generated Snake iOS workspace.
- Runs only local Swift commands inside `generated-projects/snake-ios`.
- Does not mutate existing projects, call providers/tools, start workers, write DB state, deploy, release, package, call networks, or spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| validation manifest exists | PASS |  |
| validation stays in generated root | PASS |  |
| commands are local Swift commands | PASS |  |
| forbidden actions are documented | PASS |  |
| commands avoid external/deploy tokens | PASS |  |
| game-rule assertions command passes | PASS | Building for debugging...
[0/7] Write sources
[2/7] Write SnakeIOSAppTests-entitlement.plist
[3/7] Write swift-version--1AB21518FC5DEDBE.txt
[5/13] Compiling SnakeIOSApp SnakeTypes.swift
[6/13] Compiling SnakeIOSApp Theme.swift
[7/13] Compiling SnakeIOSApp SnakeIOSApp.swift
[8/13] Compiling SnakeIOSApp GameScene.swift
[9/13] Emitting module SnakeIOSApp
[10/13] Compiling SnakeIOSApp GameState.swift
[11/15] Compiling SnakeIOSAppTests GameStateTests.swift
[12/15] Emitting module SnakeIOSAppTests
[12/15] Write Objects.LinkFileList
[13/15] Linking SnakeIOSAppTests
[14/15] Applying SnakeIOSAppTests
Build of product 'SnakeIOSAppTests' complete! (48.55s) |
| swift package build command passes | PASS | [0/1] Planning build
Building for debugging...
[0/3] Write swift-version--1AB21518FC5DEDBE.txt
Build complete! (0.12s) |
| build artifacts are ignored | PASS |  |
| package script registered | PASS |  |
| contract references P83.4 files | PASS |  |
| docs mention P83.4 validation | PASS |  |
| phase status remains valid after P83.4 | PASS |  |
## Command Results

- swift run SnakeIOSAppTests: PASS
- swift build: PASS
## Validation Commands

- npm run check:p834-local-validation-harness
- npm run check:p833-approved-local-file-creation
- npm run check:p83-execution-plan
- npm run check:os-phase-status
- git diff --check
## Known Limitations

- P83.4 validates local Swift build/test behavior only. It does not deploy, package, sign, or run on a simulator.
## Result

PASS (12/12)
