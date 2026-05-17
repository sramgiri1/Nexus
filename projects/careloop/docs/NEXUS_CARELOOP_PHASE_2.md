# NEXUS CareLoop Phase 2

## Purpose

Start CareLoop Phase 2 as a governed NEXUS project mission for product hardening, validation readiness, privacy review, test coverage, and release preparation.

## Goals

- Review the PRD and current local status before source mutation.
- Define validation, privacy, iOS, and release readiness gates.
- Select safe implementation candidates for a later controlled source mutation phase.
- Keep provider calls, tool execution, DB writes, deployment, and project mutation disabled.

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

- PRD gap review
- Backend validation readiness
- Privacy and safety review
- iOS validation readiness
- Test gap proposal
- Release readiness outline

## Not Enabled Yet

- CareLoop source mutation
- Prisma migrations or DB writes
- Provider/tool/MCP execution
- iOS/Xcode execution
- Deployment or release execution

## Next Platform Dependencies

- P63 recovery snapshots
- P64 provider/tool dispatch through governance
- P67 controlled source mutation expansion
- P69/P70 release and deploy monitoring
