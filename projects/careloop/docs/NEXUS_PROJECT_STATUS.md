# NEXUS Project Status - CareLoop

- Project: CareLoop
- Active phase: CARELOOP-P3-PREMIUM
- Mission: CareLoop Premium Receiver-Scoped Monetization
- Status: Premium subphases P1-P8, post-premium Phase A, Phase B invite flow, Phase C receiver management polish, Phase D1-D5 StoreKit/billing/free-policy hardening, and Phase E1-E2 reports/insights implemented and validation complete on the active branch
- Next action: Start Phase E3 caregiver activity and load distribution; configure external App Store Connect products, sandbox testers, APNs, and social-auth credentials for release validation
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
- Post-premium Phase B is complete. Pending invitation visibility now includes explicit organizer resend/revoke controls for caregiver and care receiver invite management, direct care receiver acceptance routes into the receiver home, caregiver invite acceptance lands with no receiver access by default, organizers can grant/revoke caregiver receiver access from People & Access, declined/revoked/expired invite states disable response actions with clear copy, and invalid acceptance attempts return clear errors for wrong-user, expired-link, fourth-circle-limit, and already-member cases.
- Phase C1 is complete: Care Receiver Management now has UI-testable organizer add/edit/remove receiver lifecycle coverage, and backend lifecycle rules cover receiver detail updates, reorder, active-task removal blocking, last-receiver protection, and primary receiver promotion after deletion.
- Phase C2 is complete: Care Receiver Management now presents one explicit activation decision path for direct receiver invite vs proxy authorization, backend routes prevent conflicting direct/proxy activation states, and proxy-active receivers no longer show activation actions.
- Phase C3 is complete: proxy activation now requires explicit organizer authorization attestation in the API and iOS UI, persists attester/timestamp/reference audit fields, and records only non-PII consent-reference presence in activity payloads.
- Phase C4 is complete: backend task creation remains blocked until receiver activation, and New Task now surfaces a clear inactive-receiver blocked state instead of hiding inactive receivers behind an empty picker.
- Phase C5 is complete: Care Receiver Management now requires destructive confirmation before receiver removal and surfaces backend-aligned blocked-delete copy when active tasks require preservation.
- Phase D1 is complete: StoreKit product metadata is centralized in iOS, paywall fallback prices now match the local StoreKit fixture, and backend entitlement sync rejects unsupported App Store product IDs.
- Phase D2 is complete: purchase and restore now share the same receiver entitlement sync helper, Receiver Premium Management restores active App Store transactions back to the selected care receiver, and the restore CTA makes the receiver-scoped sync explicit.
- Phase D3 is complete: billing retry and refunded receiver entitlement states are represented in backend, Prisma, iOS models, and organizer UI as locked-but-visible states that preserve history while blocking new premium actions.
- Phase D4 is complete: backend add-receiver policy now requires an active premium receiver instead of trusting client intent alone, while recurrence, insights, and caregiver limits remain enforced through shared entitlement capabilities and covered by focused regression tests.
- Phase D5 is complete: backend App Store Server API transaction verification is ready behind explicit environment configuration, entitlement sync fails closed when verification is enabled but credentials are missing, and local/demo mode remains deterministic with strict product/transaction identity checks.
- Phase E1 is complete: receiver adherence summaries now extend the existing completion insights contract with scheduled due tasks, completed tasks, on-time completions, late completions, missed tasks, completion rate, and on-time rate, with organizer Insights and caregiver Activity surfaces reusing the same payload.
- Phase E2 is complete: daily due/completed/missed trend data now extends the same completion insights contract, and organizer Insights shows a missed-trend chart plus plain-language summary without adding a duplicate reporting endpoint.
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
- `scripts/careloop-test-runner.sh backend:circles` passed after Phase B pending-invite resend/revoke backend coverage.
- Focused Xcode UI tests `CareLoopUITests/test_organizerCanOpenPeopleAndAccess`, `CareLoopUITests/test_organizerCanResendAndRevokePendingCaregiverInvite`, and `CareLoopUITests/test_organizerCanOpenCareReceiverManagement` passed after Phase B pending-invite controls.
- Focused Xcode UI test `CareLoopUITests/test_careReceiverCanAcceptPendingInviteFromDirectory` passed after Phase B direct receiver invite acceptance.
- Backend `caregiver invitation acceptance grants no receiver access by default` and Xcode UI `CareLoopUITests/test_caregiverAcceptsInviteWithNoReceiverAccessByDefault` passed after Phase B caregiver no-access default join.
- Backend `lets organizers grant and revoke caregiver receiver access` and Xcode UI `CareLoopUITests/test_organizerCanGrantAndRevokeCaregiverReceiverAccess` passed after Phase B organizer grant/revoke access coverage.
- Backend invitation edge-case tests and Xcode UI `CareLoopUITests/test_inviteEdgeStatesDisableResponseActions` passed after Phase B invalid-invite coverage.
- Backend receiver lifecycle tests passed after Phase C1 receiver-management coverage.
- Focused Xcode UI tests `CareLoopUITests/test_addSecondReceiverShowsPremiumGateBeforeForm` and `CareLoopUITests/test_organizerCanAddEditAndRemoveCareReceiverLocally` passed after Phase C1 receiver lifecycle polish.
- Backend receiver activation conflict tests passed after Phase C2 activation-path coverage.
- Focused Xcode UI tests `CareLoopUITests/test_organizerChoosesReceiverActivationPath`, `CareLoopUITests/test_organizerCanAddEditAndRemoveCareReceiverLocally`, and `CareLoopUITests/test_addSecondReceiverShowsPremiumGateBeforeForm` passed after Phase C2 activation-path polish.
- Backend receiver attestation tests passed after Phase C3 proxy authorization coverage.
- Focused Xcode UI test `CareLoopUITests/test_organizerChoosesReceiverActivationPath` passed after Phase C3 attestation-required UI coverage.
- Backend inactive-receiver task-creation test passed after Phase C4.
- Focused Xcode UI test `CareLoopUITests/test_newTaskBlocksInactiveCareReceiverUntilActivation` passed after Phase C4 New Task blocked-state coverage.
- Backend receiver delete regression tests passed after Phase C5.
- Focused Xcode UI tests `CareLoopUITests/test_organizerCanAddEditAndRemoveCareReceiverLocally` and `CareLoopUITests/test_organizerSeesBlockedCareReceiverRemovalReason` passed after Phase C5 receiver removal confirmation and blocked-state coverage.
- Backend entitlement metadata test `validates premium entitlement sync source and App Store transaction identity` passed after Phase D1 unsupported product validation.
- `xcodebuild build-for-testing` passed after Phase D1 StoreKit metadata/parity unit-test additions. Focused unit execution for `CareLoopTests/SubscriptionManagerProductIdTests` was blocked by simulator launch denial (`FBSOpenApplicationServiceErrorDomain Code=1`), not a compile or assertion failure.
- `xcodebuild build-for-testing` passed after Phase D2 receiver restore sync refactor.
- Focused Xcode UI test `CareLoopUITests/test_organizerCanManagePremiumReceiverPlan` passed after Phase D2 restore CTA and receiver-scoped sync changes.
- Backend premium entitlement regression passed 123 tests after Phase D3 billing retry/refunded state coverage.
- `xcodebuild build-for-testing` passed after Phase D3 billing/refund entitlement model changes.
- Focused Xcode model/UI tests `CareRecipientPremiumTests/test_careRecipient_exposesBillingRetryAndRefundedPremiumAsLockedButVisible` and `CareLoopUITests/test_organizerSeesPremiumBillingAndRefundStates` passed after Phase D3.
- Backend cross-surface premium/free policy regression passed 124 tests after Phase D4 add-receiver entitlement enforcement.
- `xcodebuild build-for-testing` passed after Phase D4 free-plan UI alignment.
- Focused Xcode UI tests `test_organizerCanOpenCareReceiverManagement`, `test_addSecondReceiverShowsPremiumGateBeforeForm`, and `test_insightsLockFreeReceiverBehindPremiumUpgrade` passed after Phase D4.
- Backend App Store Server API adapter and entitlement fail-closed regression passed 130 tests after Phase D5.
- Backend insights aggregation, `xcodebuild build-for-testing`, `CareLoopTests/CompletionInsightModelTests`, and `CareLoopUITests/test_insightsLockFreeReceiverBehindPremiumUpgrade` passed after Phase E1 receiver adherence reporting.
- Backend insights trend aggregation, `xcodebuild build-for-testing`, `CareLoopTests/CompletionInsightModelTests`, `CareLoopUITests/test_insightsShowAdherenceAndMissedTrendForPremiumReceiver`, and `CareLoopUITests/test_insightsLockFreeReceiverBehindPremiumUpgrade` passed after Phase E2 missed/overdue trend reporting.
- Full Xcode regression passed on iPhone 17 Pro simulator.
- Backend `npm test` previously passed with expanded reminder/snooze/escalation, 50-user, and multi-role coverage.

## Remaining Blockers

- App Store Connect subscription products, server API credentials, and sandbox testers are not configured in this local repo.
- Physical-device/TestFlight validation for APNs delivery, notification tap, universal links, and OS permission prompts.
- Real Google/Facebook/Apple auth credentials and redirect URI configuration.
- StoreKit sandbox purchase/restore and App Store entitlement verification.
- UI automation for circle/member destructive delete flows, full invite email delivery, advanced recurrence variants, and empty/error/offline states.
