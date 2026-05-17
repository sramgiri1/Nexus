# NEXUS Project Status - CareLoop

- Project: CareLoop
- Active phase: CARELOOP-P2
- Mission: CareLoop Phase 2
- Status: Implementation and validation in progress
- Next action: Continue remaining UI automation and external device/provider validation
- Mutation: enabled only through local governed coding workflow
- Provider calls: disabled
- Tool execution: local test/build execution enabled by operator request
- DB writes: local test database only
- Deployment: disabled

CareLoop project progress is tracked in project-roadmap files and Command Center Projects. It is not part of the NEXUS OS Roadmap.

## Current Progress

- PRD decisions have been captured for users, personas, circles, care receivers, invites, roles, task visibility, reminders, snooze, escalation, premium limits, and pay-per-care-receiver monetization.
- Backend implementation and tests cover auth, circle/invite/member lifecycle, care receiver activation, scoped visibility, recurring tasks, reminder scheduling, snooze, escalation, notification simulation, premium entitlement rules, delete scenarios, 50-user simulation, and multi-circle/multi-role isolation.
- iOS implementation and tests cover onboarding contracts, circle directory, organizer/caregiver/care receiver dashboards, task deep links, receiver completion, task detail snooze, paywall entry, and role recalculation.
- Visual QA pass completed for circle directory, organizer home, caregiver home, and care receiver home.
- Focused test runner exists at `scripts/careloop-test-runner.sh`.

## Validation

- `scripts/careloop-test-runner.sh smoke` passed.
- Full Xcode regression passed on iPhone 17 Pro simulator.
- Backend `npm test` previously passed with expanded reminder/snooze/escalation, 50-user, and multi-role coverage.

## Remaining Blockers

- Physical-device/TestFlight validation for APNs delivery, notification tap, universal links, and OS permission prompts.
- Real Google/Facebook/Apple auth credentials and redirect URI configuration.
- StoreKit sandbox purchase/restore and App Store entitlement verification.
- UI automation for destructive delete flows, full invite email delivery, create recurring task form submission, and empty/error/offline states.
