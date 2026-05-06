# Xcode Runner Architecture

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

The macOS Xcode Runner is a first-class NEXUS execution worker for iOS validation.

Its purpose is to:

- execute iOS build, test, and simulator tasks
- produce evidence for SENTINEL
- isolate Xcode-specific command execution
- avoid pretending Linux containers can run iOS simulator

The Xcode Runner is not implemented in this phase. This document only defines the architecture and contracts.

---

## Why It Exists

NEXUS already distinguishes verification evidence from agent claims. iOS validation requires Apple tooling that only runs correctly on macOS with Xcode.

Linux containers are useful later for backend and web work, but they do not replace:

- `xcodebuild`
- `xcrun simctl`
- simulator device boot and shutdown
- `xcresult` generation
- iOS UI test execution

The Xcode Runner exists so SENTINEL can rely on real iOS evidence rather than inferred or simulated claims.

---

## Responsibilities

The Xcode Runner is responsible for:

- selecting simulator device
- booting simulator
- shutting down simulator
- cleaning derived data when needed
- running `xcodebuild build`
- running `xcodebuild test`
- running unit tests
- running UI tests
- collecting `xcresult`
- collecting logs
- collecting screenshots if available
- collecting crash logs if available
- enforcing timeout
- returning structured result

---

## Supported Command Families

The runner should be limited to an allowlisted set of Xcode and simulator command families:

- `xcrun simctl list`
- `xcrun simctl boot`
- `xcrun simctl shutdown`
- `xcodebuild -scheme ... build`
- `xcodebuild -scheme ... test`
- `xcodebuild test -destination ...`
- `xcrun xcresulttool` if available

Future implementation may wrap these commands, but it should not expand beyond this family without explicit review.

---

## Forbidden

The runner must not allow:

- arbitrary shell
- deleting files outside derived data or test output
- accessing secrets
- signing or exporting release builds without approval
- changing project files unless task contract allows it
- uploading artifacts externally without approval
- running unbounded commands without timeout

The runner is an execution worker, not a general-purpose remote shell.

---

## Runner Input Shape

```json
{
  "projectId": "",
  "workspaceOrProject": "",
  "scheme": "",
  "destination": "",
  "testPlan": "",
  "configuration": "Debug",
  "timeoutSeconds": 900,
  "collectArtifacts": true,
  "allowedPaths": [],
  "artifactOutputDir": ""
}
```

### Field Notes

- `workspaceOrProject`: path to `.xcworkspace` or `.xcodeproj`
- `scheme`: required scheme name
- `destination`: explicit simulator destination string
- `testPlan`: optional test plan
- `timeoutSeconds`: hard timeout, mandatory
- `allowedPaths`: execution must stay within contract scope
- `artifactOutputDir`: explicit evidence output directory

---

## Runner Output Shape

```json
{
  "result": "PASS|FAIL|INFO",
  "runtime": "macos-xcode",
  "command": "",
  "durationMs": 0,
  "simulator": {},
  "xcresultPath": "",
  "logsPath": "",
  "screenshots": [],
  "crashLogs": [],
  "issues": [],
  "summary": "",
  "redacted": true
}
```

### Output Notes

- `result`: high-level execution outcome
- `runtime`: fixed to `macos-xcode`
- `command`: normalized command descriptor, not arbitrary transcript
- `simulator`: device metadata such as name, OS, identifier
- `issues`: parsed failures, timeouts, or setup problems
- `redacted`: confirms log and artifact output passed redaction policy

---

## Evidence Produced

The Xcode Runner should produce or reference:

- `xcodebuild` log
- `xcresult` path
- simulator and device metadata
- screenshots if available
- crash logs if available
- parsed test summary
- command metadata
- duration
- timeout status

These are evidence inputs for SENTINEL. They are not by themselves a release decision.

---

## Security

The runner should operate under these constraints:

- runner runs on macOS host or macOS CI runner
- command allowlist is mandatory
- timeout is required
- project path is locked
- output is scanned for secrets
- no raw secrets are passed to the runner
- no signing or export without approval

The runner should treat the iOS workspace as scoped input, not as unrestricted filesystem access.

---

## Integration with NEXUS

Future runtime integration should wire the Xcode Runner into:

- `sentinel.qa.simulator.run`
- `sentinel.qa.tests.execute`
- `warden.compliance.permissions.validate` when iOS permissions require runtime-aware confirmation
- `swift` execution context when runtime needs are declared as `macos-xcode`

The runner should return structured evidence that can be written as:

- `simulator_result`
- `test_result`
- `xcresult`
- `log_artifact`
- `screenshot_artifact`
- `crash_log`

---

## Failure Modes

Expected failure classes include:

- simulator unavailable
- destination mismatch
- scheme missing
- test plan missing
- timeout
- command failure
- artifact extraction failure
- redaction failure

Each should return structured `issues` rather than only raw logs.

---

## Phase Boundary

Phase 6 does not:

- implement the runner
- change dispatch
- add a macOS queue worker
- add CI configuration
- add remote execution transport
- change agent prompts

It only defines the architecture and contracts that later implementation must follow.
