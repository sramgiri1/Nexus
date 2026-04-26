# CareLoop — 3-Sprint Delivery Plan

**Sprints:** 3 × 2 weeks  
**Capacity:** Solo founder + AI  
**Public launch:** End of Sprint 3  
**Status:** Sprint 2 in progress

---

## Sprint 1 — Core Coordination Complete

**Goal:** Finish the real day-to-day coordination product before adding automations.

**Scope:**

- Finalize the core user journey: create circle, join circle, create task, view tasks, complete tasks, resume session
- Complete task-management behavior to match the PRD role model:
  - Members can complete any task
  - Members can edit, skip, and delete only their own tasks
  - Admins can edit any task and reassign tasks
- Add missing iOS screens/flows:
  - Task detail / edit
  - Skip / delete own task
  - Admin assignee picker and reassign flow
  - Admin circle settings (edit circle name, recipient name)
  - Basic member list display so assignment is usable
- Keep Sprint-1-style access model:
  - Shared app API key
  - Self-join by circle ID
  - GET routes API-key-only (no membership enforcement)
- Emit required analytics events: `CIRCLE_CREATED`, `TASK_CREATED`, `TASK_COMPLETED`, `APP_SESSION`
- Add basic manual QA support:
  - Repeatable seed/reset flow for local testing
  - Written test checklist for onboarding, join, task CRUD, and role restrictions

**Exit criteria:**

- A user can create a circle or self-join an existing one
- An admin can assign and reassign tasks from the app
- A member can complete any task and edit/skip/delete only their own
- The app survives relaunch and restores session/circle state
- Role-based mutation rules return correct `401/403/404/409` responses

---

## Sprint 2 — Reminders, Digests, and Push

**Goal:** Deliver the automation features that make CareLoop materially better than group text.

**Operating rule:** Build Sprint 2 to feature-complete locally before paying for deployment or Apple infrastructure. Treat Railway deploy, APNs, and live email verification as late-stage validation work inside the sprint, not prerequisites to begin coding.

**Scope:**

- Implement background scheduler using `node-cron` inside the API process
- Build reminder processing:
  - Create reminder at `dueAt - 15m`
  - Send scheduled reminder
  - Re-check 15 minutes later
  - Escalate if still not `DONE`
  - Update `Reminder.status`, `sentAt`, and `escalatedAt`
- Build daily digest delivery:
  - 6pm per-user local timezone
  - Due today, overdue, completed today
  - Plain HTML via Resend
  - Idempotent send using `DigestLog`
- Wire push end-to-end:
  - iOS notification permission request
  - APNs device token registration
  - Upload token to backend
  - Backend push sender for reminder, escalation, and task assignment notifications
  - If Apple infrastructure is not yet provisioned, complete the code paths locally with clear mock/stub verification points
- Implement fallback rules:
  - No push token → send email where PRD requires fallback
  - Resend failure → mark failed, no retry in Sprint 2
- Add missing data plumbing:
  - `DigestLog.messageId` for outbound digest correlation
  - Minimal delivery metadata for push/email tracing
- Keep digest-open tracking deferred — do not block Sprint 2 on webhook analytics
- Keep paid external verification deferred until the local feature set is stable

**Exit criteria:**

- A task with `dueAt` creates a reminder and sends at the correct time
- An overdue task escalates correctly
- Assignment notifications send when an admin assigns or reassigns
- A user with timezone set receives one digest at 6pm local time
- Digest sends are idempotent per user/day
- Push missing or failing falls back per PRD rules

**Deferred verification inside Sprint 2:**

- Railway deploy and deployed migration verification
- Live APNs delivery
- Live Resend delivery verification
- Apple Developer account and APNs key provisioning

---

## Sprint 3 — Public Launch Hardening

**Goal:** Replace private-build shortcuts with launch-grade access control, admin controls, and release readiness.

**Scope:**

- Replace shared `x-api-key` with per-user auth:
  - Supabase Auth with email magic link / OTP for iOS sign-in
  - Backend validates bearer JWT tokens
  - App traffic stops using shared API key
- Replace self-join by plain circle ID with launch-safe invite flow:
  - Admin creates invite link/token
  - Invited user redeems token after auth
  - Invite creates membership as `MEMBER`
  - Disable direct public self-join in production
- Enforce membership on all read endpoints:
  - `GET /circles/:id`
  - `GET /circles/:circleId/tasks`
  - `GET /circles/:circleId/events`
- Add final admin/member-management UX:
  - Promote/demote member
  - Remove member
  - Generate/share invite
  - Admin settings polish
- Finish launch readiness:
  - Privacy policy live
  - `incident-response.md` completed and shipped
  - Production env separation and config audit
  - Release checklist and smoke test pass
  - TestFlight / App Store submission readiness
- Clarify launch-time auth and reads:
  - Bearer-token auth starts here
  - Membership-checked reads start here
  - `GET /users/:id` becomes authenticated and self-only here
- Post-launch deferrals (explicitly out of Sprint 3):
  - Digest open tracking webhook
  - Retry logic
  - Distributed scheduler
  - User-facing activity feed

**Exit criteria:**

- A brand-new public user can authenticate, accept an invite, join only authorized circles, and use the app without developer setup
- Non-members cannot read circle data
- Removed users lose access
- Reminders, digests, and assignment notifications work in the production path
- Compliance docs and release checklist are complete

---

## Public API Changes by Sprint

**Sprint 1:** No breaking API change. iOS must begin using existing task patch/delete and circle patch/member-management routes already in the backend.

**Sprint 2:** Add non-user-facing scheduler modules and delivery services. Add `DigestLog.messageId`. No new public mobile endpoint required if push token upload stays on the existing user route.

**Sprint 3:**
- Replace `x-api-key` mobile auth with `Authorization: Bearer <supabase_jwt>`
- Add invite endpoints: `POST /circles/:id/invites` (admin-only), `POST /invites/redeem` (authenticated)
- Deprecate production use of `POST /circles/:id/members` self-join
- Change read routes from API-key-only to authenticated + membership-checked
- Make `GET /users/:id` authenticated and self-only

---

## Test Plan

**Sprint 1:** Create circle, join circle, restore session. Member edit/skip/delete own task only. Admin reassign/edit any task. Unauthorized and role-forbidden mutations return correct status codes.

**Sprint 2:** Reminder created only when `dueAt` exists. Reminder scheduler is idempotent. Done-before-escalation suppresses escalation. No push token triggers fallback path. Digest sends once per local day and timezone is respected.

**Sprint 3:** Unauthenticated requests fail. Non-member reads fail. Invite redeem works once only. Removed member loses access immediately. Production-path smoke test from sign-in to task completion passes. Full manual regression on at least one simulator and one physical device.

---

## Assumptions

- Sprint length: 2 weeks, fixed
- Capacity: solo founder + AI — no additional engineer bandwidth assumed
- Stack: iOS SwiftUI, Fastify + Prisma, PostgreSQL/Supabase, Resend, APNs
- Public launch by Sprint 3 is realistic only if scope is frozen to this plan
- `DIGEST_OPENED` tracking is post-launch unless Sprint 3 finishes early
- `SHEPHERD`, `WARDEN`, and `RELAY` are process ownership roles used in founder workflow; runner wiring is deferred
- EHR/clinic, medication tracking, web, Android, AI features: permanently out of scope for v1
