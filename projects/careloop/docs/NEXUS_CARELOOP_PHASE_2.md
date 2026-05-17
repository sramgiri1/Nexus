# NEXUS CareLoop Phase 2

## Purpose

Track CareLoop Phase 2 as a governed NEXUS project mission for product hardening, validation readiness, privacy review, test coverage, and release preparation.

## Goals

- Keep the PRD and local implementation aligned as source changes land.
- Maintain validation, privacy, iOS, and release readiness gates.
- Implement remaining product gaps in small phases with tests updated each phase.
- Keep external provider calls, production DB writes, deployment, and release execution disabled until explicitly configured.

## Task Plan

- Phase 2 Product Brief: SHEPHERD + PRISM, NEXUS — Summarize Phase 2 goals, dependencies, and operator handoff points.
- PRD Gap Review: PRISM + AUDITOR — Compare the current PRD and local status against Phase 2 goals.
- Backend Validation Readiness: SENTINEL + AUDITOR — Confirm backend test suite baseline and next test gaps without running tests.
- Privacy and Safety Review: WARDEN + AUDITOR — Review privacy constraints, notes risk, public/demo separation, and secrets boundary.
- iOS Validation Readiness: SWIFT + SENTINEL — Prepare iOS validation plan without running xcodebuild.
- Test Gap Proposal: AUDITOR + SENTINEL — Use existing Test Suite Manager and Quality Intelligence outputs to identify Phase 2 test gaps.
- Controlled Implementation Candidate Selection: CORE + NEXUS — Identify safe first implementation candidates for later controlled source mutation.
- Release Readiness Outline: NEXUS + AUDITOR, WARDEN — Define what CareLoop needs before release/deploy phases.

## Readiness Gates

- PRD gap review: updated with owner decisions for personas, roles, circles, invites, care receiver activation, task visibility, reminders, escalation, and monetization.
- Backend validation readiness: active; focused suites and full backend regression exist.
- Privacy and safety review: partially complete; no clinic/EMR integration and external provider setup remains blocked.
- iOS validation readiness: active; Xcode simulator suite runs locally.
- Test gap proposal: active; `testability-matrix.md` and `test-runbook.md` define automated, simulator manual, physical-device, and missing coverage.
- Release readiness outline: blocked by external provider, StoreKit, APNs, TestFlight, and destructive-flow UI coverage.

## Implemented Since Mission Start

- Backend auth, circle/invite/member lifecycle, care receiver activation, scoped task visibility, recurring tasks, reminders, snooze, escalation, premium entitlement rules, delete scenarios, 50-user simulation, and multi-circle/multi-role isolation.
- iOS onboarding contracts, circle directory, organizer/caregiver/care receiver dashboards, task deep links, receiver completion, task detail snooze, paywall entry, and role recalculation.
- Visual QA for primary persona screens with simulator screenshots under `projects/careloop/docs/qa/screenshots/`.
- Focused test runner at `scripts/careloop-test-runner.sh` and Nexus suite metadata for targeted test selection.

## Current Test Commands

- `scripts/careloop-test-runner.sh smoke`
- `scripts/careloop-test-runner.sh full`
- `scripts/careloop-test-runner.sh backend:auth`
- `scripts/careloop-test-runner.sh backend:circles`
- `scripts/careloop-test-runner.sh backend:reminders`
- `scripts/careloop-test-runner.sh backend:scale`
- `scripts/careloop-test-runner.sh ios:onboarding`
- `scripts/careloop-test-runner.sh ios:personas`
- `scripts/careloop-test-runner.sh ios:tasks`
- `scripts/careloop-test-runner.sh ios:reminders`
- `scripts/careloop-test-runner.sh ios:payments`

## Still Not Enabled

- Prisma migrations or DB writes
- Deployment or release execution
- Production provider calls
- StoreKit sandbox purchase/restore without Apple setup
- APNs physical-device delivery without Apple setup
- Real social-auth provider redirects without credentials

## Next Platform Dependencies

- P69/P70 release and deploy monitoring
- Provider credential governance for Google/Facebook/Apple auth, APNs, Resend, and StoreKit.
- Test evidence ingestion for focused CareLoop suite results.
