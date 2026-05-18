# NEXUS Project Status - CareLoop

- Project: CareLoop
- Active phase: CARELOOP-P3-PREMIUM
- Mission: CareLoop Premium Receiver-Scoped Monetization
- Status: Premium subphases P1-P8 and post-premium Phase A implemented and validation complete on the active branch
- Next action: Configure external App Store Connect products, sandbox testers, APNs, and social-auth credentials for release validation
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
- Premium P8 is complete: the existing `npm run careloop:demo` room launcher now has premium/free/expired/request-pending showcase data, local StoreKit product configuration, and demo readiness validation.
- Reminder/recurrence hardening is in progress: premium recurring task creation, recurring completion/next occurrence, task detail status changes, comment add/delete, and task detail snooze are now covered through focused Xcode UI automation.
- Post-premium Phase A is complete. A shared Task Detail presentation policy now centralizes task status, overdue/escalated display state, role permissions, inactive-receiver blocking, and recurring-premium blocking for Task Detail and Task Board surfaces.
- Phase A edit-task subphase is complete: Task Detail now opens in a view-first mode, exposes an explicit organizer `Edit` action for content changes, and keeps status/comment actions available without making every field editable by default.
- Phase A delete-task subphase is complete: Task Detail now uses an alert-based destructive confirmation, supports cancel/confirm behavior in UI-test fixtures, and removes deleted tasks from the local task board state.
- Phase A blocked-state subphase is complete: Task Detail now resolves the actual task care receiver before applying inactive-receiver policy, displays a blocked-action card for invited receivers, and hides edit/status/comment/snooze/delete actions until the receiver accepts or is proxy activated.
- Phase A escalation-visibility subphase is complete: Task Detail now surfaces overdue/escalated state from the shared Task Detail policy and keeps actionable status/snooze controls visible for escalated tasks.
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
- `npm run check:careloop-demo-readiness` passed after P8 demo/StoreKit contract updates.
- `scripts/careloop-test-runner.sh docs:demo` passed after P8 demo/StoreKit contract updates.
- Backend task suite passed after reminder/recurrence hardening UI coverage.
- Focused Xcode task suite passed with recurring creation, recurring completion/next-occurrence, task detail status, comment add/delete, and snooze UI coverage.
- Focused Xcode unit test `CareLoopTests/TaskDetailPresentationTests` passed for the shared Task Detail state model.
- Focused Xcode UI tests for recurring completion, task detail status, and comments add/delete passed after the shared Task Detail policy integration.
- Focused Xcode UI test `CareLoopUITests/test_organizerCanEditTaskTitleFromDetail` passed for organizer task-title editing from Task Detail.
- Focused Xcode UI test `CareLoopUITests/test_organizerCanCancelAndConfirmTaskDeleteFromDetail` passed for Task Detail delete cancel/confirm behavior.
- Focused Xcode UI test `CareLoopUITests/test_taskDetailBlocksActionsForInvitedReceiver` passed for inactive receiver task-action blocking.
- Focused Xcode UI test `CareLoopUITests/test_taskDetailShowsEscalationStateForOverdueTask` passed for Task Detail escalation visibility.
- Full Xcode regression passed on iPhone 17 Pro simulator.
- Backend `npm test` previously passed with expanded reminder/snooze/escalation, 50-user, and multi-role coverage.

## Remaining Blockers

- App Store Connect subscription products and sandbox testers are not configured in this local repo.
- Physical-device/TestFlight validation for APNs delivery, notification tap, universal links, and OS permission prompts.
- Real Google/Facebook/Apple auth credentials and redirect URI configuration.
- StoreKit sandbox purchase/restore and App Store entitlement verification.
- UI automation for circle/member/receiver destructive delete flows, full invite email delivery, advanced recurrence variants, and empty/error/offline states.
