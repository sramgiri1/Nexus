# CareLoop Implementation Kanban

**Last updated:** 2026-05-17

This board tracks CareLoop app work only. It mirrors the PRD implementation phases and must be updated whenever a subphase moves state.

## Done Criteria

A card can move to `Done` only when all of these are true:

- Product behavior is implemented without duplicate screens or duplicated business rules.
- Focused backend and/or Xcode tests cover the new behavior.
- `docs/PRD.md`, `docs/qa/test-runbook.md`, `docs/qa/testability-matrix.md`, and `docs/NEXUS_PROJECT_STATUS.md` are updated when scope or coverage changes.
- Demo seed/launcher data is updated if the showcase path changes.
- Changes are committed and pushed on the active CareLoop branch.

## In Progress

No active implementation card. Next implementation should start with `B4`.

## Ready

| ID | Outcome | Code Areas | Required Tests | Demo Impact | PRD Status |
| --- | --- | --- | --- | --- | --- |
| B4 | Organizer grants and revokes receiver access after caregiver acceptance. | Backend recipient access routes; iOS People & Access access sheet; caregiver scoped dashboards/tasks/insights. | Backend grant/revoke scope tests; iOS UI grant/revoke flow proving visibility changes. | Add demo state showing scoped caregiver access. | Planned |
| B5 | Invite edge cases show clear errors and block invalid joins. | Backend invitation routes; iOS pending invite cards/error copy. | Wrong-user, expired-link, fourth-circle-limit, already-member backend tests plus at least one iOS UI error fixture. | Optional demo only if investor walkthrough needs failure-state proof. | Planned |

## Backlog

| ID | Outcome | Code Areas | Required Tests | Demo Impact | PRD Status |
| --- | --- | --- | --- | --- | --- |
| C1 | Polish add/edit/reorder/remove receiver lifecycle. | Backend receiver routes; iOS Care Receiver Management. | Backend lifecycle tests; iOS UI add/edit/reorder/remove tests. | Update demo receivers if management flows affect showcase. | Planned |
| C2 | Make direct invite vs proxy activation decision path explicit. | Backend receiver activation; iOS receiver management activation sheets. | Backend activation decision tests; iOS UI direct-vs-proxy fixture. | Demo can show direct and proxy activation examples. | Planned |
| C3 | Capture explicit authorization attestation for proxy activation. | Backend consent fields/events; iOS proxy attestation form. | Backend consent persistence/audit tests; iOS UI attestation required-state test. | Include proxy-attested receiver in demo if useful. | Planned |
| C4 | Block task creation until receiver accepts or is proxy activated. | Backend task create policy; iOS New Task and Task Detail blocked states. | Backend task-create rejection tests; iOS UI blocked create test. | Demo should include an invited receiver with task creation blocked. | Planned |
| C5 | Handle receiver removal/delete blocked states safely. | Backend delete rules; iOS destructive confirmations and blocked-state copy. | Backend delete/block tests; iOS UI delete confirmation and blocked delete tests. | Optional. | Planned |
| D1 | Verify StoreKit product metadata and local purchase fixtures. | iOS StoreKit config/paywall; backend entitlement metadata. | StoreKit local tests; iOS paywall metadata tests. | Demo paywall product labels must match. | Planned |
| D2 | Harden restore purchases and entitlement refresh. | iOS paywall/account restore; backend entitlement refresh. | iOS restore UI tests; backend entitlement refresh tests. | Demo can show restore entry only. | Planned |
| D3 | Cover expired, revoked, billing retry, and refund states. | Backend entitlement states; iOS paywall/locks. | Backend entitlement tests; iOS UI state fixtures. | Demo already has expired/revoked concepts; refresh as needed. | Planned |
| D4 | Enforce free-one-receiver rule across add receiver, recurrence, insights, and caregiver limits. | Backend entitlement policy; iOS locks across receiver/task/insight/access surfaces. | Cross-surface backend tests; iOS UI lock tests. | Demo should show free vs premium contrast. | Planned |
| D5 | Prepare server-side App Store transaction verification. | Backend billing adapter; environment config; docs. | Adapter unit tests with signed fixture responses; release checklist. | No local demo dependency. | Planned |
| E1 | Receiver adherence summary. | Backend insights aggregation; iOS Insights. | Backend aggregation tests; iOS report fixture. | Demo reports should show useful adherence numbers. | Planned |
| E2 | Missed and overdue task trends. | Backend insights aggregation; iOS charts/cards. | Backend trend tests; iOS report fixture. | Demo reports should include missed/overdue contrast. | Planned |
| E3 | Caregiver activity and load distribution. | Backend insights aggregation; iOS charts/cards. | Backend load tests; iOS report fixture. | Demo should show multiple caregiver activity. | Planned |
| E4 | Escalation history and response timing. | Backend reminder/event aggregation; iOS reports. | Backend escalation report tests; iOS report fixture. | Demo can show escalation history. | Planned |
| E5 | Free/locked/premium insight states with clear upgrade value. | Backend entitlement policy; iOS Insights/paywall links. | Backend entitlement tests; iOS locked/premium report tests. | Demo should include locked and premium report examples. | Planned |
| F1 | Reminder preference UX and backend persistence. | Backend user notification prefs; iOS Settings. | Backend preference tests; iOS settings UI test. | Optional. | Planned |
| F2 | Simulator deep-link coverage for pending, wrong-circle, and completed tasks. | iOS AppState/deep link routing; task screens. | Xcode UI deep-link tests. | Demo deep links stay stable. | Planned |
| F3 | Snooze mutation and rescheduled reminder visibility. | Backend reminder routes; iOS Task Detail. | Backend snooze tests; Xcode UI snooze state test. | Demo can show snoozed reminder. | Planned |
| F4 | Escalation timeline and notification fanout verification. | Backend reminder scheduler/events; iOS Task Detail/activity. | Backend fanout tests; iOS timeline fixture. | Demo can show escalation trail. | Planned |
| F5 | Physical-device APNs/TestFlight validation. | Apple Developer setup; app entitlements; backend push provider. | Manual physical-device checklist. | No simulator demo dependency. | External Setup |
| G1 | Maintain four realistic Care Circles with distinct use cases. | Demo seed script and readiness checks. | Demo readiness script; smoke launch. | Required. | Partial |
| G2 | Multiple personas per circle with roles and access scopes. | Demo seed script and launcher profiles. | Demo readiness script; focused UI fixture checks. | Required. | Partial |
| G3 | Mixed task states, history, comments, reminders, premium, expired, and locked states. | Demo seed script. | Demo readiness script. | Required. | Partial |
| G4 | One-command launch plus optional screen-recording script. | Demo launcher scripts; Xcode/simulator launch flow. | Smoke launch; launcher readiness check. | Required. Current launcher works after local DB sync but needs migration cleanup. | Partial |
| G5 | Demo readiness validation fails if fixtures drift from PRD. | Demo readiness scripts and docs. | Demo readiness script. | Required. | Partial |
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

## Blocked / External Setup

| ID | Blocker | Needed From Owner |
| --- | --- | --- |
| D5/H4 | App Store Connect products, subscription IDs, sandbox testers, and transaction verification credentials. | Apple Developer/App Store Connect setup. |
| F5/H5 | APNs delivery, push entitlement, notification tap, and TestFlight validation. | Apple Developer account, device, and TestFlight build. |
| H4 | Google/Facebook/Apple real auth redirect URIs and credentials. | Provider app credentials and callback URLs. |
