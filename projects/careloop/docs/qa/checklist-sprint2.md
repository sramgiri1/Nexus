# CareLoop Sprint 2 — QA Checklist

**Status:** SENTINEL COMPLETE — 28/28 backend tests green  
**Date:** 2026-04-26  
**Gate owner:** SENTINEL

---

## Automated test results (node --test)

```
✔ deliverTaskNotification (6 tests) — PASS
✔ sendReminderNotifications (3 tests) — PASS  
✔ sendDailyDigest (4 tests) — PASS
✔ PATCH /users/:id/push-token (5 tests) — PASS
✔ POST /circles/:id/tasks — Reminder creation (6 tests) — PASS
✔ Scheduler escalation rules — unit (4 tests) — PASS

tests: 28 | pass: 28 | fail: 0 | duration: ~234ms
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

### 10. Join Circle requires password confirmation
- [x] Join Circle form shows password field
- [x] Join Circle form shows re-enter password field
- [x] Validation requires matching passwords

### 11. Create Circle requires password confirmation
- [x] Create Circle form shows password field
- [x] Create Circle form shows re-enter password field
- [x] Validation requires matching passwords

### 12. Create account entry points
- [x] Create Circle surface exposes Email option
- [x] Create Circle surface exposes Google option
- [x] Create Circle surface exposes Facebook option
- [x] Create Circle surface exposes Apple option
- [x] Provider buttons launch real auth entry sessions
- [x] Email/password sign-up hits backend auth endpoint
- [x] Email/password login hits backend auth endpoint
- [x] Forgot-password request / verify / reset flow hits backend auth endpoints
- [x] Social sign-in resolves into a real CareLoop account session

**XCTest coverage:**
```text
OnboardingValidationTests
- sign in requires email + password
- join requires matching passwords
- create requires matching passwords
- provider list includes Email / Google / Facebook / Apple
- social helper text references real CareLoop account access
- auth callback parsing extracts email + name
```

**Boundary note:** Email/password auth and forgot-password are now fully wired through the CareLoop backend. Social sign-in resolves to real CareLoop users and linked identities. Production completion for Google/Facebook/Apple still depends on final provider credentials and callback configuration.
