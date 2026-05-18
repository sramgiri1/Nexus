# CareLoop Testability Matrix

**Last updated:** 2026-05-17

This matrix is the working contract for phase-by-phase implementation. Each phase must update the relevant rows before it is considered complete.

Runnable suite groups are documented in `test-runbook.md` and exposed through `scripts/careloop-test-runner.sh`.

| Screen / flow | Automated today | Simulator manual | Physical-device only | Missing coverage entirely |
|---|---|---|---|---|
| Onboarding welcome / reset session | `CareLoopUITests.test_launchesIntoOnboardingWhenSessionIsReset`; onboarding model tests | Visual polish, copy review, small-screen pass | None | Full sign-up form UI journey with backend stub |
| Email auth / create account / sign in | Backend auth route tests; keychain/session unit tests | Login, logout, forgot-password happy path against local API | Real email reset delivery | Social provider callback UI journeys |
| Social auth: Google, Facebook, Apple | Backend provider normalization and production fallback rejection | OAuth start URL copy and error-state review | Real provider redirects and Apple capability validation | End-to-end Google/Facebook/Apple sign-in automation |
| Circle directory | `test_circleDirectoryShowsSeparateCreateAndJoinActions` | Empty state, account sheet, multiple-circle state | None | Create/join form submission UI automation |
| Multi-circle role switching | Backend multi-circle role/visibility E2E; `AppStateRoleTests.test_userRole_recalculatesWhenSameUserSwitchesCircles` | Switching active circle and verifying role labels/tasks | None | Multi-simulator concurrent account switching |
| Create family circle | Backend create-circle tests; first receiver draft-state test | Create circle with first care receiver against local API | None | UI automation from onboarding into created circle |
| Pending invites / join circle | `test_careReceiverCanAcceptPendingInviteFromDirectory`; `test_caregiverAcceptsInviteWithNoReceiverAccessByDefault`; `test_inviteEdgeStatesDisableResponseActions`; backend invite accept/decline/expiry/no-access/wrong-user/fourth-circle/already-member tests | Pending invite cards and local error toast copy | Email link open into app | Universal-link invite acceptance automation |
| Organizer dashboard | `test_organizerHomeShowsReceiverCardsAndQuickActions` | Multi-receiver density, empty task state, archive state | None | Delete circle UI scenarios |
| Caregiver dashboard | `test_caregiverHomeShowsScopedDashboard`; `test_caregiverAcceptsInviteWithNoReceiverAccessByDefault` | Scoped receiver empty state, no-access state | None | Caregiver task creation UI automation |
| Care receiver home | `test_receiverHomeShowsNextDueTaskExperience`; `test_receiverCanCompleteNextTaskFromHome` | No upcoming task state, completed-state copy | None | Error state when completion API fails |
| Task board: organizer/caregiver | `test_organizerPendingTaskDeepLinkOpensTaskBoard`; `test_organizerCanCreateRecurringTaskForPremiumReceiver`; wrong-circle deep-link test | Filters, sections, detail navigation | None | Caregiver task creation UI automation |
| Personal task board: care receiver | `test_receiverPendingTaskDeepLinkOpensPersonalBoard`; model and backend recipient completion tests | Highlight behavior, done-row labels | Real push deep-link open | UI automation for "I've done this" from board |
| New task / recurrence | Backend recurrence tests; weekday recurrence model tests; `test_organizerCanCreateRecurringTaskForPremiumReceiver`; `test_completingRecurringTaskCreatesNextOccurrence` | Date picker, assignee picker, premium lock copy | Notification scheduling on real device | Advanced recurrence UI variants beyond daily |
| Task detail / comments / snooze | `TaskDetailPresentationTests`; `test_organizerCanEditTaskTitleFromDetail`; `test_organizerCanCancelAndConfirmTaskDeleteFromDetail`; `test_taskDetailBlocksActionsForInvitedReceiver`; `test_taskDetailShowsEscalationStateForOverdueTask`; `test_taskDetailCanSnoozeReminder`; `test_taskDetailCanChangeStatusToDone`; `test_taskCommentsCanBeAddedAndDeleted`; backend hidden comment mutation tests | Snooze destructive/edge-state copy | None | Comment editing is not in current scope |
| People and access | `test_organizerCanOpenPeopleAndAccess`; `test_organizerCanResendAndRevokePendingCaregiverInvite`; `test_organizerCanGrantAndRevokeCaregiverReceiverAccess`; backend invite resend/revoke and access grant/revoke tests | Invite caregiver sheet, role changes, edge-state copy | Real invite email delivery | UI automation for role promotion/demotion and remove-member confirmation |
| Care receiver management | `test_organizerCanOpenCareReceiverManagement`; `test_addSecondReceiverShowsPremiumGateBeforeForm`; `test_organizerCanAddEditAndRemoveCareReceiverLocally`; backend invite resend/revoke, add/edit/reorder/delete/proxy tests | Reorder gestures, proxy activate sheet copy, receiver invite resend/revoke | Consent/legal review on real device | UI automation for invite receiver and proxy activation |
| Insights / activity | `test_caregiverCanOpenReceiverProgress`; `test_insightsLockFreeReceiverBehindPremiumUpgrade`; backend insights tests | Date windows, empty-state charts | None | Organizer insights drill-down UI automation |
| Premium paywall / purchase | `test_organizerCanOpenReceiverPremiumPaywall`; StoreKit unit coverage; backend entitlement source/transaction validation | Paywall layout, entitlement states | Sandbox purchase, restore, refund/revoke | Server-side App Store receipt verification automation |
| Settings / account | Keychain logout/session tests | Notification preference toggles, sign out, account data | Push permission prompt | Settings UI automation |
| Push reminders / snooze / deep links | Backend payload/snooze/escalation tests; AppState deep-link tests; focused UI deep-link and snooze tests | Foreground banner copy in simulator when possible | APNs delivery, tap banner, highlight task | TestFlight end-to-end reminder run |
| Delete circle / member / receiver | Backend delete circle/member/receiver tests | Destructive confirmation copy and navigation after delete | None | UI automation for delete circle and blocked delete states |

## Gates

- **Automated today** must include XCTest or backend coverage that can run locally without third-party credentials.
- **Simulator manual** must be executable on `iPhone 17 Pro` simulator with local API or UI fixtures.
- **Physical-device only** is limited to Apple/OS capabilities that cannot be proven in simulator, such as APNs delivery, Sign in with Apple entitlements, StoreKit sandbox purchase, and universal links.
- **Missing coverage entirely** is the backlog for the next implementation phases. New production behavior should not move forward without adding at least one automated or simulator-manual row.
