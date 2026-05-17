# NEXUS Project Status - CareLoop

- Project: CareLoop
- Active phase: CARELOOP-P3-PREMIUM
- Mission: CareLoop Premium Receiver-Scoped Monetization
- Status: Implementation and validation in progress
- Next action: Execute premium subphase P8 demo and StoreKit hardening with tests, docs, commit, and push
- Mutation: enabled only through local governed coding workflow
- Provider calls: disabled
- Tool execution: local test/build execution enabled by operator request
- DB writes: local test database only
- Deployment: disabled

CareLoop project progress is tracked in project-roadmap files and Command Center Projects. It is not part of the NEXUS OS Roadmap.

## Current Progress

- PRD decisions have been captured for users, personas, circles, care receivers, invites, roles, task visibility, reminders, snooze, escalation, premium limits, and pay-per-care-receiver monetization.
- Premium planning has been split into receiver-scoped subphases in `projects/careloop/docs/PREMIUM_PHASE_PLAN.md`.
- Premium P1 is complete: PRD contracts, Nexus status, Command Center visibility, and automated docs/test metadata validation.
- Premium P2 is complete: receiver plan badges now appear in organizer/caregiver dashboard contexts, Care Receiver Management exposes plan status and upgrade action, and Care Receiver persona sees badge-only plan state.
- Premium P3 is complete: adding a second care receiver is blocked on the free path, requires an explicit premium add-receiver intent, and the iOS management screen gates the add form behind an upgrade choice.
- Premium P4 is complete: caregivers can request receiver-scoped premium from locked recurring-task states, duplicates are blocked server-side, organizer summaries collapse recent requests by receiver, and caregivers never receive a purchase CTA.
- Premium P5 is complete: organizer Care Receiver Management now surfaces collapsed receiver-scoped upgrade request summaries with count/latest requester context and no direct-purchase behavior.
- Premium P6 is complete: receiver-scoped purchase success, unlocked-feature confirmation, App Store plan management, restore entry, and above-fold organizer management entry are implemented with UI coverage.
- Premium P7 is complete: expired receiver entitlements keep existing care data visible while recurring tasks, premium insights, and additional caregiver access remain blocked; iOS now labels expired/revoked plan states explicitly.
- Backend implementation and tests cover auth, circle/invite/member lifecycle, care receiver activation, scoped visibility, recurring tasks, reminder scheduling, snooze, escalation, notification simulation, premium entitlement rules, delete scenarios, 50-user simulation, and multi-circle/multi-role isolation.
- iOS implementation and tests cover onboarding contracts, circle directory, organizer/caregiver/care receiver dashboards, task deep links, receiver completion, task detail snooze, paywall entry, and role recalculation.
- Visual QA pass completed for circle directory, organizer home, caregiver home, and care receiver home.
- Focused test runner exists at `scripts/careloop-test-runner.sh`.

## Validation

- `scripts/careloop-test-runner.sh smoke` passed.
- `npm run check:careloop-premium-phase-plan` is the P1 docs/contract gate.
- `scripts/careloop-test-runner.sh ios:personas` passed after P2 receiver plan visibility changes.
- `scripts/careloop-test-runner.sh ios:payments` passed after P2 premium/paywall entry changes.
- `scripts/careloop-test-runner.sh backend:circles` passed after P3 second-receiver gate changes.
- `scripts/careloop-test-runner.sh ios:personas` passed after P3 add-receiver gate UI coverage.
- `scripts/careloop-test-runner.sh backend:circles` passed after P4 caregiver upgrade request API coverage.
- `scripts/careloop-test-runner.sh ios:payments` passed after P4 caregiver request/no-purchase UI coverage.
- Focused Xcode UI test `CareLoopUITests/test_organizerCanOpenCareReceiverManagement` passed after P5 organizer request visibility changes.
- `scripts/careloop-test-runner.sh ios:personas` passed after P5 organizer request visibility changes.
- Focused Xcode UI tests `CareLoopUITests/test_organizerCanOpenReceiverPremiumPaywall` and `CareLoopUITests/test_organizerCanManagePremiumReceiverPlan` passed after P6 success/management changes.
- `scripts/careloop-test-runner.sh ios:payments` passed after P6 success/management changes.
- `scripts/careloop-test-runner.sh backend:circles` passed after P7 expired-entitlement enforcement coverage.
- `scripts/careloop-test-runner.sh ios:payments` passed after P7 expired Premium model/copy coverage.
- Full Xcode regression passed on iPhone 17 Pro simulator.
- Backend `npm test` previously passed with expanded reminder/snooze/escalation, 50-user, and multi-role coverage.

## Remaining Blockers

- Premium P8 demo and StoreKit hardening is not complete yet.
- Physical-device/TestFlight validation for APNs delivery, notification tap, universal links, and OS permission prompts.
- Real Google/Facebook/Apple auth credentials and redirect URI configuration.
- StoreKit sandbox purchase/restore and App Store entitlement verification.
- UI automation for destructive delete flows, full invite email delivery, create recurring task form submission, and empty/error/offline states.
