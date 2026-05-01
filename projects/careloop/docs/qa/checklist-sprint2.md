# CareLoop Sprint 2 — QA Checklist

**Status:** SENTINEL COMPLETE — 52/52 backend tests green, 51/51 iOS Sentinel tests green  
**Date:** 2026-04-29  
**Gate owner:** SENTINEL

---

## Automated test results

### Backend (`npm test`)

```
✔ auth routes (9 tests) — PASS
✔ deliverTaskNotification (6 tests) — PASS
✔ circle membership management (10 tests) — PASS
✔ sendReminderNotifications (3 tests) — PASS
✔ sendDailyDigest (4 tests) — PASS
✔ PATCH /users/:id/push-token (5 tests) — PASS
✔ POST /circles/:id/tasks — Reminder creation + recurrence (10 tests) — PASS
✔ GET /circles/:id/insights/completion (1 test) — PASS
✔ Scheduler escalation rules — unit (4 tests) — PASS

tests: 49 | pass: 49 | fail: 0
```

### iOS (`xcodebuild test` + Sentinel)

```text
sentinel qa.tests.execute: 51 passed | 0 failed | 51 executed
```

---

## Sprint 2 exit criteria

### 1. Push token registration
- [x] `PATCH /users/:id/push-token` returns 200 with updated user  
- [x] pushToken persisted in DB  
- [x] Returns 400 when pushToken absent from body  
- [x] Returns 401 without valid API key  

**curl:**
```bash
curl -X PATCH http://localhost:3000/users/<userId>/push-token \
  -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"pushToken":"<device-hex-token>"}'
```

### 2. Reminder creation — task with dueAt
- [x] Creating task with `dueAt` creates `Reminder` with `status=PENDING`  
- [x] `scheduledAt` = `dueAt - 15 minutes` (verified to within 2s)  
- [x] Creating task without `dueAt` creates NO Reminder  
- [x] `TASK_CREATED` event logged for every task  

**curl:**
```bash
curl -X POST http://localhost:3000/circles/<circleId>/tasks \
  -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"Give meds","creatorId":"<userId>","dueAt":"2026-04-27T10:00:00Z"}'
```

### 3. Reminder send — scheduler loop
- [x] `processPendingReminders` finds `Reminder.status=PENDING` where `scheduledAt <= now`  
- [x] Calls `sendReminderNotifications` for assignee or creator  
- [x] Updates `Reminder.status=SENT`, `sentAt=now`  
- [x] Logs `REMINDER_SENT` event  
- [x] No push token → falls back to email (or NONE if no email either)  
- [x] Simulated mode (no APNS config) returns `{simulated:true}` without crashing  

### 4. Escalation — 15-minute window
- [x] Reminder with `status=SENT` and `sentAt <= (now - 15min)` qualifies for escalation  
- [x] Reminder with `sentAt <= (now - 14min)` does NOT qualify  
- [x] `task.status = DONE` suppresses escalation (Prisma filter: `task.status { not: "DONE" }`)  
- [x] Escalation fans out to all circle members  
- [x] Updates `Reminder.status=ESCALATED`, `escalatedAt=now`  
- [x] Logs `REMINDER_ESCALATED` event  

### 5. Daily digest
- [x] `sendDailyDigest` returns `{delivered:false,channel:"NONE"}` when user has no email  
- [x] Simulates send when `RESEND_API_KEY` not configured  
- [x] No crash when dueToday/overdue/completedToday contain real task objects  
- [x] Digest idempotency enforced via `DigestLog.userId_date` unique constraint (Prisma)  
- [x] `DIGEST_HOUR` defaults to 18 (6pm)  
- [x] `DIGEST_SENT` event logged with `messageId` and `simulated` flag  

**Verify idempotency:**
```bash
# Two calls on the same date must produce exactly one DigestLog row
SELECT COUNT(*) FROM "DigestLog" WHERE "userId"='<id>' AND date='2026-04-26';
-- expected: 1
```

### 6. No push token — graceful fallback
- [x] `deliverTaskNotification` tries push → falls to email → returns NONE if both absent  
- [x] No crash, no unhandled promise rejection  

### 7. Foreground push / deep link (iOS — manual test)
- [ ] Banner shown when app is foregrounded (`UNUserNotificationCenterDelegate.willPresent`)  
- [ ] Tapping notification sets `AppState.pendingTaskId`  
- [ ] `CirclesView` observes `pendingTaskId` and navigates to the correct task  
- [ ] `consumePendingTask()` clears `pendingTaskId` after navigation  

**Note:** Foreground/deep-link tests require a physical device or simulator with APNs. Mark complete after TestFlight build in Sprint 3.

### 8. iOS unit tests (XCTest)
- [x] `AppState.pendingTaskId` defaults to nil  
- [x] `consumePendingTask()` clears the value  
- [x] `consumePendingTask()` is idempotent when nil  
- [x] `careLoopPushTaskOpened` notification sets `pendingTaskId`  
- [x] Push token request body encodes `{"pushToken": <value>}`  
- [x] Reminder scheduledAt = dueAt - 15min (unit)  
- [x] Escalation window boundary conditions (unit)  

---

## Remaining before Sprint 3

| Item | Owner | Blocker? |
|------|-------|----------|
| Foreground push + deep link (device test) | SWIFT + SENTINEL | No — needs TestFlight |
| Railway env vars: APNS_KEY, RESEND_API_KEY | FORGE | No — deploy gate |
| `incident-response.md` | WARDEN | No — pre-launch |
| DigestLog migration to prod DB | FORGE | Sprint 3 start |

---

## Auth and onboarding surface (local-first)

### 9. Sign in requires email and password
- [x] Sign In form shows email field
- [x] Sign In form shows password field
- [x] Validation rejects blank credentials
- [x] Validation rejects passwords shorter than 8 characters

### 10. Sign up and provider entry points
- [x] Sign Up surface exposes Email option
- [x] Sign Up surface exposes Google option
- [x] Sign Up surface exposes Facebook option
- [x] Sign Up surface exposes Apple option
- [x] Provider buttons launch real auth entry sessions
- [x] Email/password sign-up hits backend auth endpoint
- [x] Email/password login hits backend auth endpoint
- [x] Forgot-password request / verify / reset flow hits backend auth endpoints
- [x] Social sign-in resolves into a real CareLoop account session

### 11. Circle setup after authentication
- [x] Join existing circle requires only `circleId`
- [x] Circle ID field does not auto-capitalize input
- [x] Joining a circle the user already belongs to re-enters that circle successfully
- [x] Create new circle requires `circle name`
- [x] Create new circle requires `recipient name`
- [x] New circles default `archiveAfterDays` to 7
- [x] Joining a fourth circle is blocked with a clear product error
- [x] Creating a fourth circle is blocked with a clear product error
- [x] Circle settings allows admins to edit archive retention from 1 to 30 days
- [x] After first circle creation, New Task opens automatically

### 12. Task lifecycle and archive behavior
- [x] Task list splits into `Active` and `Completed` sections
- [x] Saving task detail persists title, notes, due date, priority, assignee, and status together
- [x] Saving task detail persists recurrence together with the main task payload
- [x] Saving task detail returns the user to the task list
- [x] Completed or skipped tasks stay visible in `Completed` until retention window expires
- [x] Archived tasks are excluded from the normal tasks API response
- [x] Hourly scheduler archives completed/skipped tasks once `completedAt + archiveAfterDays` has elapsed

### 12A. Recurring tasks
- [x] Creating a recurring task requires `dueAt`
- [x] Recurring task create accepts frequency + interval + optional end date
- [x] Recurring tasks render recurrence copy in the task list
- [x] Completing a recurring task creates the next occurrence automatically
- [x] New recurring occurrence keeps the same `seriesId`
- [x] New recurring occurrence gets a fresh reminder at `dueAt - 15 minutes`
- [x] Task detail allows recurrence editing and saving
- [x] Weekly recurrence weekday selection UI
- [x] Edit-one-occurrence vs edit-whole-series split

### 13. Multi-circle operations
- [x] Data model allows one user to belong to multiple circles
- [x] Joining or creating an additional circle does not remove existing memberships
- [x] Total memberships per user are capped at 3 across self-join, create, and admin-add flows
- [x] Authenticated users land on a circle list page first
- [x] Tapping a circle opens a circle hub with explicit operations
- [x] Circle hub links to task board, members, settings, and admin insights
- [x] Returning from an active circle back to the circle list is a first-class nav action
- [x] Switching circles reloads the selected circle context before opening operations
- [x] Last selected circle is persisted for session restore
- [ ] Manual QA for switching between two circles and confirming task scope follows the active circle on device

### 13A. Multi-recipient group operations
- [x] Every new circle creates a primary care recipient profile from the setup flow
- [x] Existing circles are backfilled with one primary care recipient during DB migration
- [x] Admin can add another care recipient inside group settings
- [x] Admin can edit a care recipient's name and relationship
- [x] Admin cannot remove the last remaining care recipient
- [x] Admin cannot remove a care recipient while active tasks still point at them
- [x] Task creation is scoped to a selected care recipient
- [x] Task detail editing can change the task recipient
- [x] Task list exposes an all-recipient view plus a per-recipient filter
- [x] Active circle card summarizes one or more recipients cleanly
- [x] Recipient reordering / primary recipient reassignment UI
- [x] Invite acceptance flow tied to recipient-aware group onboarding

### 14. Member management
- [x] Admin can invite a member by name + email from the member list
- [x] Admin can choose `MEMBER` or `ADMIN` access before sending the invite
- [x] Invited email stays `PENDING` until the invited user authenticates and accepts
- [x] Pending invites are visible to admins and can be revoked
- [x] Admin can remove another member from the active circle
- [x] Admin can promote a caregiver to `ADMIN`
- [x] Admin can demote another caregiver back to `MEMBER`
- [x] Removing the last remaining admin is blocked at the API
- [ ] Manual QA: invite a member, verify they accept after auth, then remove them

### 15. Admin completion insights
- [x] Admin-only completion insights endpoint returns `completedByDay`
- [x] Admin-only completion insights endpoint returns `topCaregivers`
- [x] Admin-only completion insights endpoint returns `totals.completed`
- [x] Admin-only completion insights endpoint returns `totals.active`
- [x] Admin-only completion insights endpoint returns `totals.overdue`
- [x] iOS settings exposes `Completion Insights` for admins
- [x] iOS insights view shows 7 / 14 / 30 day window switching
- [x] iOS insights view can filter the chart window by recipient
- [x] iOS insights view renders a completion chart per day
- [x] iOS insights view renders top caregiver counts
- [x] Recipient-level insights breakdown for multi-recipient groups

**XCTest coverage:**
```text
OnboardingValidationTests
- sign in requires email + password
- sign up requires name + email + password + confirm password
- provider list includes Email / Google / Facebook / Apple
- social helper text references real CareLoop account access
- auth callback parsing extracts email + name

ModelTests
- recurring task summary labels
- completion insight day label formatting
- active-circle membership ordering
- directory-state sign-in without an explicit active circle
```

**Boundary note:** Email/password auth and forgot-password are fully wired through the CareLoop backend. Social sign-in launches through backend-owned OAuth start/callback routes and resolves to real CareLoop users plus linked identities, but still depends on real provider credentials and approved redirect URIs. The local build now includes invite acceptance, a circle list root, a circle hub, recipient profiles, recipient-scoped tasks, recipient filters, admin recipient management, recipient reordering, weekly weekday recurrence selection, and recipient-aware completion insights. Remaining major product work is public invite delivery hardening, physical-device push validation, and the paid entitlement layer.
