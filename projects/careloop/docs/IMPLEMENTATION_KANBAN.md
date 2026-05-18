# CareLoop Implementation Kanban

**Last updated:** 2026-05-18

This board tracks CareLoop app work only. It mirrors the PRD implementation phases and must be updated whenever a subphase moves state.

## Done Criteria

A card can move to `Done` only when all of these are true:

- Product behavior is implemented without duplicate screens or duplicated business rules.
- Focused backend and/or Xcode tests cover the new behavior.
- `docs/PRD.md`, `docs/qa/test-runbook.md`, `docs/qa/testability-matrix.md`, and `docs/NEXUS_PROJECT_STATUS.md` are updated when scope or coverage changes.
- Demo seed/launcher data is updated if the showcase path changes.
- Changes are committed and pushed on the active CareLoop branch.

## In Progress

G4 one-command launch and optional screen-recording script validation is next locally while F5 remains blocked on physical-device APNs/TestFlight setup.

## Ready

| ID | Outcome | Code Areas | Required Tests | Demo Impact | PRD Status |
| --- | --- | --- | --- | --- | --- |
| F5 | Physical-device APNs/TestFlight validation. | Apple Developer setup; app entitlements; backend push provider. | Manual physical-device checklist. | No simulator demo dependency. | External Setup |
| G4 | One-command launch plus optional screen-recording script. | Demo launcher scripts; Xcode/simulator launch flow. | Smoke launch; launcher readiness check. | Required. Current launcher works after local DB sync but needs migration cleanup. | Partial |

## Backlog

| ID | Outcome | Code Areas | Required Tests | Demo Impact | PRD Status |
| --- | --- | --- | --- | --- | --- |
| H1 | Xcode target membership audit. | Xcode project; app/test/demo files. | Release archive inspection script. | No demo dependency. | Planned |
| H2 | Gate UI-test and demo-only hooks behind Debug/UI-test flags. | iOS app launch/session hooks. | Release build check. | No demo dependency. | Planned |
| H3 | Inspect Release archive for demo data, mock accounts, StoreKit config, and launch args. | Xcode archive; scripts. | Release hygiene automation. | No demo dependency. | Planned |
| H4 | Verify production API URL, entitlements, privacy strings, push, Sign in with Apple, and StoreKit product IDs. | Xcode config; backend environment; App Store Connect. | Release checklist plus physical-device validation. | No demo dependency. | External Setup |
| H5 | TestFlight checklist and final device validation. | TestFlight build and devices. | Manual physical-device sign-off. | No demo dependency. | External Setup |

## Done

| ID | Outcome | Evidence |
| --- | --- | --- |
| P1-P8 | Receiver-scoped premium planning, gates, request flow, purchase UI, expired/revoked states, and demo foundation. | Tracked in `docs/PREMIUM_PHASE_PLAN.md`, `docs/NEXUS_PROJECT_STATUS.md`, and premium test-runner suites. |
| A1-A6 | Task Detail policy, edit mode, delete confirmation, inactive receiver blocking, escalation visibility, and docs/test refresh. | Xcode task-detail UI/unit coverage and commits through `a9e2af1`. |
| B1 | Pending invite visibility plus organizer resend/revoke controls. | Backend `backend:circles` coverage and Xcode UI pending-invite tests; commit `e8b35cf`. |
| B2 | Direct care receiver invite acceptance and declined/expired disabled states. | Xcode UI `test_careReceiverCanAcceptPendingInviteFromDirectory`; commit `7d29930`. |
| B3 | Caregiver invite acceptance with no receiver access by default. | Backend `caregiver invitation acceptance grants no receiver access by default`; Xcode UI `test_caregiverAcceptsInviteWithNoReceiverAccessByDefault`. |
| B4 | Organizer grants and revokes receiver access after caregiver acceptance. | Backend `lets organizers grant and revoke caregiver receiver access`; Xcode UI `test_organizerCanGrantAndRevokeCaregiverReceiverAccess`. |
| B5 | Invite edge cases show clear errors and block invalid joins. | Backend wrong-user, expired-link, fourth-circle-limit, and already-member acceptance tests; Xcode UI `test_inviteEdgeStatesDisableResponseActions`. |
| C1 | Add/edit/reorder/remove receiver lifecycle polish. | Backend receiver lifecycle tests for detail update, reorder, active-task delete blocking, last-receiver protection, and primary promotion; Xcode UI `test_organizerCanAddEditAndRemoveCareReceiverLocally` plus premium-gate coverage. |
| C2 | Direct invite vs proxy activation decision path. | Backend activation conflict tests for direct-joined and proxy-active receivers; Xcode UI `test_organizerChoosesReceiverActivationPath` plus receiver-management regression trio. |
| C3 | Explicit authorization attestation for proxy activation. | Backend attestation-required and audit-payload tests; Xcode UI `test_organizerChoosesReceiverActivationPath` verifies the proxy action stays disabled until attestation is checked. |
| C4 | Block task creation until direct acceptance or proxy activation. | Backend inactive-receiver task-create rejection test; Xcode UI `test_newTaskBlocksInactiveCareReceiverUntilActivation` verifies New Task explains the blocked state and keeps Add disabled. |
| C5 | Receiver removal confirmation and blocked delete states. | Backend receiver-delete regression tests; Xcode UI `test_organizerCanAddEditAndRemoveCareReceiverLocally` confirms destructive removal and `test_organizerSeesBlockedCareReceiverRemovalReason` verifies task-preservation copy. |
| D1 | StoreKit product metadata and local purchase fixtures. | Centralized iOS product metadata, paywall fallback prices aligned to `CareLoop.storekit`, backend unsupported App Store product rejection, backend entitlement metadata regression, and `xcodebuild build-for-testing` after StoreKit parity unit-test additions. |
| D2 | Restore purchases and entitlement refresh hardening. | Shared iOS receiver entitlement sync helper for purchase/restore, management restore CTA syncs restored active transactions to the selected receiver, `xcodebuild build-for-testing`, and focused Xcode UI `test_organizerCanManagePremiumReceiverPlan`. |
| D3 | Expired, revoked, billing retry, and refund states. | Added backend/iOS receiver entitlement states for billing retry and refunded, kept locked-but-visible policy centralized in entitlement capabilities, added Prisma migration, backend entitlement regressions, iOS model coverage, and focused Xcode UI `test_organizerSeesPremiumBillingAndRefundStates`. |
| D4 | Free-one-receiver policy across add receiver, recurrence, insights, and caregiver limits. | Backend now requires an active premium receiver before accepting add-receiver premium intent, existing entitlement capability gates continue to enforce recurrence/insights/caregiver access, and focused backend plus Xcode UI coverage prove the cross-surface free-vs-premium contrast. |
| D5 | Server-side App Store transaction verification readiness. | Added App Store Server API transaction adapter, optional fail-closed entitlement verification behind `APP_STORE_SERVER_API_ENABLED`, signed transaction fixture tests, route misconfiguration regression, and README/runbook credential documentation. |
| E1 | Receiver adherence summary. | Extended the existing completion insights contract with receiver-scoped adherence summaries, displayed adherence cards in organizer insights and caregiver activity, and validated with backend aggregation tests plus focused Xcode model/UI coverage. |
| E2 | Missed and overdue task trends. | Added daily due/completed/missed trend data to the existing completion insights contract, displayed a missed-trend Insights chart, and validated with backend aggregation tests plus focused Xcode model/UI coverage. |
| E3 | Caregiver activity and load distribution. | Added organizer-only caregiver load distribution to the existing completion insights contract, displayed active/overdue/completed/total assigned work, and validated caregiver privacy with backend access regressions plus focused Xcode model/UI coverage. |
| E4 | Escalation history and response timing. | Added organizer-only escalation history and average response timing to the existing completion insights contract, displayed recent escalated tasks in Insights, and validated caregiver privacy with backend access regressions plus focused Xcode model/UI coverage. |
| E5 | Free/locked/premium insight states with clear upgrade value. | Clarified premium, selected locked-receiver, and all-recipient locked states in the existing Insights screen, added a premium report value preview, and kept upgrade CTAs receiver-scoped. |
| F1 | Reminder preference UX and backend persistence. | Persisted task assignment, escalation, and daily digest notification toggles through the existing Settings and user-preferences route, made digest delivery respect `notifDigest`, and validated backend delivery gates plus Settings UI automation. |
| F2 | Simulator deep-link coverage for pending, wrong-circle, and completed tasks. | Added organizer and care receiver UI coverage for pending task deep links, completed task deep links, and wrong-circle guards; focused Xcode UI deep-link suite passed with 6 tests. |
| F3 | Snooze mutation and rescheduled reminder visibility. | Backend snooze regressions now assert `scheduledAt` and `snoozedUntil` move to the requested future window, and Task Detail shows the rescheduled reminder time with escalation paused copy; focused backend and Xcode UI tests passed. |
| F4 | Escalation timeline and notification fanout verification. | Scheduler escalation payloads now store non-PII delivery summaries, user-disabled escalation alerts are blocked without failing the reminder, organizer Activity shows escalation timeline entries, and focused backend/Xcode UI tests plus `xcodebuild build-for-testing` passed. |
| G1 | Four realistic Care Circles with distinct use cases. | CareLoop-local demo readiness now enforces aging parent, post-surgery, postpartum/newborn, and memory-care scenarios; direct seed validation emitted 4 circles and 5 care receivers. |
| G2 | Multiple personas per circle with roles and access scopes. | Demo readiness now enforces organizer, care receiver, and caregiver launch profiles plus caregiver receiver-access grants across scenarios. |
| G3 | Mixed task states, history, reminders, premium, expired, and locked states. | Demo readiness now enforces pending, in-progress, done, skipped, snoozed, escalated, comment/history, premium request, active premium, manual premium, and expired premium states. |
| G5 | Demo readiness validation fails if fixtures drift from the PRD. | Added CareLoop-local `npm run check:demo-showcase` / `npm run check:careloop-demo-readiness` guard for four scenarios, launch personas, mixed task/reminder/premium states, safe local emails, StoreKit product parity, and one-command launcher contract; direct seed validation emitted 4 circles, 4 launch profiles, 23 tasks, and 5 care receivers. |

## Blocked / External Setup

| ID | Blocker | Needed From Owner |
| --- | --- | --- |
| D5/H4 | App Store Connect products, subscription IDs, sandbox testers, and transaction verification credentials. | Apple Developer/App Store Connect setup. |
| F5/H5 | APNs delivery, push entitlement, notification tap, and TestFlight validation. | Apple Developer account, device, and TestFlight build. |
| H4 | Google/Facebook/Apple real auth redirect URIs and credentials. | Provider app credentials and callback URLs. |
