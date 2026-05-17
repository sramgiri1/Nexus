# CareLoop Testability Matrix

**Last updated:** 2026-05-17

This matrix is the working contract for phase-by-phase implementation. Each phase must update the relevant rows before it is considered complete.

| Screen / flow | Automated today | Simulator manual | Physical-device only | Missing coverage entirely |
|---|---|---|---|---|
| Onboarding welcome / reset session | `CareLoopUITests.test_launchesIntoOnboardingWhenSessionIsReset`; onboarding model tests | Visual polish, copy review, small-screen pass | None | Full sign-up form UI journey with backend stub |
| Email auth / create account / sign in | Backend auth route tests; keychain/session unit tests | Login, logout, forgot-password happy path against local API | Real email reset delivery | Social provider callback UI journeys |
| Social auth: Google, Facebook, Apple | Backend provider normalization and production fallback rejection | OAuth start URL copy and error-state review | Real provider redirects and Apple capability validation | End-to-end Google/Facebook/Apple sign-in automation |
| Circle directory | `test_circleDirectoryShowsSeparateCreateAndJoinActions` | Empty state, account sheet, multiple-circle state | None | Create/join form submission UI automation |
| Multi-circle role switching | Backend multi-circle role/visibility E2E; `AppStateRoleTests.test_userRole_recalculatesWhenSameUserSwitchesCircles` | Switching active circle and verifying role labels/tasks | None | Multi-simulator concurrent account switching |
| Create family circle | Backend create-circle tests; first receiver draft-state test | Create circle with first care receiver against local API | None | UI automation from onboarding into created circle |
| Pending invites / join circle | Backend invite accept/decline/expiry tests | Pending invite cards, expired invite states | Email link open into app | Universal-link invite acceptance automation |
| Organizer dashboard | `test_organizerHomeShowsReceiverCardsAndQuickActions` | Multi-receiver density, empty task state, archive state | None | Delete circle UI scenarios |
| Caregiver dashboard | `test_caregiverHomeShowsScopedDashboard` | Scoped receiver empty state, no-access state | None | Caregiver task creation UI automation |
| Care receiver home | `test_receiverHomeShowsNextDueTaskExperience`; `test_receiverCanCompleteNextTaskFromHome` | No upcoming task state, completed-state copy | None | Error state when completion API fails |
| Task board: organizer/caregiver | `test_organizerPendingTaskDeepLinkOpensTaskBoard`; wrong-circle deep-link test | Filters, sections, detail navigation | None | Create recurring task UI automation |
| Personal task board: care receiver | `test_receiverPendingTaskDeepLinkOpensPersonalBoard`; model and backend recipient completion tests | Highlight behavior, done-row labels | Real push deep-link open | UI automation for "I've done this" from board |
| New task / recurrence | Backend recurrence tests; weekday recurrence model tests | Date picker, assignee picker, premium lock copy | Notification scheduling on real device | Full create recurring task -> complete -> next occurrence UI journey |
| Task detail / comments / snooze | `test_taskDetailCanSnoozeReminder`; Model tests; backend hidden comment mutation tests | Comment add/delete, detail status controls, snooze copy | None | UI automation for comments and task detail status changes |
| People and access | `test_organizerCanOpenPeopleAndAccess`; backend access grant/revoke tests | Invite caregiver sheet, access toggles, role changes | Real invite email delivery | UI automation for invite caregiver and grant receiver access |
| Care receiver management | `test_organizerCanOpenCareReceiverManagement`; backend add/reorder/delete/proxy tests | Add/edit/reorder/proxy activate sheets | Consent/legal review on real device | UI automation for invite receiver and proxy activation |
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
