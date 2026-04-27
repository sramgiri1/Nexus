# CareLoop — Product Requirements Document

**Version:** 1.3
**Status:** Sprint 2 in progress — auth, reminders, and launch hardening in active build
**Bundle ID:** com.careloop.ios
**Compliance:** FTC Health Breach Notification Rule
**Clinic Integration:** PERMANENTLY OFF ROADMAP

---

## 1. Product Vision

CareLoop eliminates the chaos of coordinating aging parent care across a family. Instead of fragmented group texts, missed tasks, and duplicated effort, CareLoop gives every caregiver in a shared, real-time view of what needs to happen and who is doing it.

**One sentence:** Coordinate aging parent care without the group text chaos.

---

## 2. Problem

Adult children caring for an aging parent face a coordination problem, not a care problem:

- Tasks fall through the cracks because no one knows who did what
- Group texts get ignored or lost in noise
- Siblings feel unequal burden without visibility
- No single source of truth for the care recipient's status

---

## 3. User Personas

### Primary — The Coordinator (Admin)

- Adult child (35–55), typically the one who lives closest
- Manages most day-to-day care tasks
- Frustrated by having to chase siblings for updates
- Wants accountability without conflict

### Secondary — The Remote Sibling (Member)

- Lives further away, contributes less but wants to help
- Feels guilty, wants visibility
- Checks in periodically, needs clear tasks with deadlines

### Care Recipient

- Aging parent (65+)
- Not a direct app user — represented in the circle by name

---

## 4. Role Permissions

Every API action and UI affordance must enforce these rules.

| Action                                           | Admin | Member              |
|--------------------------------------------------|-------|---------------------|
| Create a new circle                              | yes   | yes (becomes Admin) |
| Edit circle name / recipient name                | yes   | no                  |
| Delete circle                                    | yes   | no                  |
| Join circle by entering ID (self-join as MEMBER) | yes   | yes                 |
| Remove member                                    | yes   | no                  |
| Change member role                               | yes   | no                  |
| Create task                                      | yes   | yes                 |
| Edit task (title, notes, due date, priority)     | yes   | own tasks only      |
| Reassign task to another member                  | yes   | no                  |
| Mark task DONE / IN_PROGRESS                     | yes   | yes (any task)      |
| Mark task SKIPPED                                | yes   | own tasks only      |
| Delete task                                      | yes   | own tasks only      |

**API enforcement (mutations):** Circle-scoped mutating endpoints that change a circle, member, or task must verify the requesting user's role via `CircleMember`. Return `403` if the action is not permitted. Non-member setup endpoints — `POST /auth/signup`, `POST /auth/login`, `POST /auth/social`, `POST /users`, `POST /circles`, `PATCH /users/:id/push-token`, `PATCH /users/:id/timezone`, `POST /users/:id/session`, and `POST /circles/:id/members` (self-join) — do not require an existing membership. The authenticated CareLoop user is still represented in requests by `userId` through Sprint 2 while transport remains API-key protected.

**API enforcement (reads):** GET endpoints are API-key-only in Sprint 1. The "member" label on GET rows in Section 6 is intent documentation (the data is circle-member data), not enforced at the API level. Membership enforcement on reads is a Sprint 3 task as part of the public-launch auth hardening.

**UI enforcement:** Hide or disable affordances the user cannot perform. Do not rely on API `403` as the only gate.

---

## 5. Core Features

### 5.1 Care Circles

- A Care Circle is a group of caregivers coordinating for one recipient
- Each circle has: a name, a recipient name, and a list of members
- Members have roles: Admin or Member (see Section 4 for permission matrix)
- **Self-join:** anyone with the API key and a circle ID can join that circle as Member. No invite token, no admin approval. The Admin controls access by choosing who receives the circle ID. There is no invite-and-accept flow in Sprint 1.

### 5.2 Task Management

- Tasks have: title, notes, due date, priority (Low / Normal / High / Urgent), status, assignee
- Status flow: `PENDING → IN_PROGRESS → DONE` (or `SKIPPED`)
- Any member can create and complete tasks; reassignment is Admin-only
- Overdue tasks (dueAt < now, status != DONE) are highlighted in red

### 5.3 Reminder Escalation

**Scheduler ownership:** `node-cron` job inside the API process. One job per server instance. Not distributed — acceptable for Sprint 1 scale.

**Timezone source:** Stored on the `User` record as an IANA timezone string (e.g. `America/New_York`). **Capture mechanism:** iOS auto-detects `TimeZone.current.identifier` at onboarding and immediately calls `PATCH /users/:id/timezone`. No user-facing picker in Sprint 1. **Fallback:** if auto-detect returns empty, default to `America/New_York`. Used for digest scheduling only. Reminder offsets (15 min before due) are always UTC-relative.

**Reminder creation:** When a task is saved with a `dueAt`, a `Reminder` record is created with `scheduledAt = dueAt - 15 minutes`. Cron polls every minute for reminders where `scheduledAt <= now AND status = PENDING`.

**Escalation logic:**

1. Cron fires reminder → send push (if `pushToken` exists) → mark `Reminder.status = SENT`, set `sentAt`
2. Cron checks again 15 minutes later: if task still not `DONE` → escalate
3. Escalation: push to all circle members + email via Resend → mark `Reminder.status = ESCALATED`, set `escalatedAt`

**Push-to-email fallback:** If a member has no `pushToken`, skip push and send email directly. If Resend fails, log the error and mark `Reminder.status = FAILED` — no retry in Sprint 1.

**Idempotency:** Cron checks `Reminder.status` before sending. A reminder with `status != PENDING` is skipped. Prevents double-sends on process restart.

### 5.4 Daily Digest

**Schedule:** Cron runs at the top of every hour. For each user, if their local hour (per stored timezone) equals 18 (6pm), send digest.

**Content:** Tasks due today (not done), overdue tasks, tasks completed today with assignee name.

**Delivery:** Resend email, plain HTML. If Resend fails, log and skip — no retry in Sprint 1.

**Idempotency:** Store `DigestLog { userId, date }` (date = YYYY-MM-DD in user's timezone). Skip if record already exists for today.

### 5.5 Push Notifications

- Task reminders (15 min before due)
- Escalation alerts (task overdue, sent to all circle members)
- Task assignment notifications (when Admin assigns a task)
- Requires APNs — gated on Apple Developer account

### 5.6 Authentication

- **Email/password auth is active in Sprint 2.**
- Users can create a CareLoop account with `name`, `email`, and `password`.
- Users can log in with email/password.
- Users can recover access through a 6-digit forgot-password flow (request code, verify code, set new password).
- Users can also authenticate with Google, Facebook, or Apple through CareLoop-owned OAuth start/callback routes that redirect back into the iOS app via `careloop://auth`.
- Social sign-in maps to a first-party CareLoop `User` plus a linked `AuthIdentity` record per provider.
- Transport auth remains `x-api-key` through Sprint 2. Account auth determines which CareLoop user is loaded in-app; bearer-token enforcement remains a Sprint 3 hardening step.
- **Local/dev mode:** social sign-in may complete via provider-returned profile payload while provider credentials are still being finalized. Production mode must validate provider tokens or callback exchanges before identity creation.

---

## 6. API Contract

**Base URL (dev):** `http://localhost:3000`

**Base URL (prod):** TBD — pending deployment

**Auth:** `x-api-key` header required on all endpoints except `/health`

**Content-Type:** `application/json`

### Standard Error Shape

```json
{ "error": "string" }
```

| Status | Meaning                                        |
|--------|------------------------------------------------|
| 400    | Validation failure — missing or invalid field  |
| 401    | Missing or invalid x-api-key                   |
| 403    | Action not permitted for this user's role      |
| 404    | Resource not found                             |
| 409    | Conflict (e.g. user already a member)          |
| 500    | Internal server error                          |

---

### Health

| Method | Endpoint  | Auth |
|--------|-----------|------|
| GET    | /health   | None |

**Response 200:**

```json
{ "status": "ok" }
```

---

### Users

| Method | Endpoint                    | Auth | Role |
|--------|-----------------------------|------|------|
| POST   | /auth/signup                | key  | any  |
| POST   | /auth/login                 | key  | any  |
| POST   | /auth/social                | key  | any  |
| POST   | /auth/forgot-password/request | key | any |
| POST   | /auth/forgot-password/verify  | key | any |
| POST   | /auth/forgot-password/reset   | key | any |
| POST   | /users                      | key  | any  |
| GET    | /users/:id                  | key  | any  |
| PATCH  | /users/:id/push-token       | key  | any  |
| PATCH  | /users/:id/timezone         | key  | any  |
| POST   | /users/:id/session          | key  | any  |

**POST /auth/signup — body:**

```json
{ "email": "string", "name": "string", "password": "string (min 8)", "phone": "string?" }
```

**POST /auth/signup — response 201:**

```json
{
  "method": "PASSWORD",
  "user": { "id": "string", "email": "string", "name": "string", "memberships": [] }
}
```

**POST /auth/login — body:**

```json
{ "email": "string", "password": "string" }
```

**POST /auth/login — response 200:** same shape as signup.

**POST /auth/social — body:**

```json
{
  "provider": "GOOGLE|FACEBOOK|APPLE",
  "idToken": "string?",
  "accessToken": "string?",
  "providerUserId": "string?",
  "email": "string?",
  "name": "string?"
}
```

**POST /auth/social — behavior:**

- Validates provider token when available
- Links to an existing CareLoop user by provider identity first, then by email
- Creates a new CareLoop user on first sign-in if no linked user exists

**POST /auth/social — response 200:**

```json
{
  "method": "GOOGLE|FACEBOOK|APPLE",
  "user": { "id": "string", "email": "string", "name": "string", "memberships": [] }
}
```

**POST /auth/forgot-password/request — body:**

```json
{ "email": "string" }
```

**POST /auth/forgot-password/request — response 200:**

```json
{ "sent": true, "expiresInMinutes": 10 }
```

**POST /auth/forgot-password/verify — body:**

```json
{ "email": "string", "code": "string (6 digits)" }
```

**POST /auth/forgot-password/verify — response 200:**

```json
{ "verified": true }
```

**POST /auth/forgot-password/reset — body:**

```json
{ "email": "string", "code": "string (6 digits)", "password": "string (min 8)" }
```

**POST /auth/forgot-password/reset — response 200:**

```json
{ "reset": true }
```

**POST /users — body:**

```json
{ "email": "string (required, unique)", "name": "string (required)", "phone": "string?" }
```

**POST /users — response 201:**

```json
{ "id": "string", "email": "string", "name": "string", "phone": "string|null", "createdAt": "ISO8601" }
```

**POST /users — errors:** `400` if email/name missing; `409` if email already exists.

**GET /users/:id — response 200:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "phone": "string|null",
  "memberships": [{
    "id": "string",
    "circleId": "string",
    "role": "ADMIN|MEMBER",
    "circle": { "id": "string", "name": "string", "recipientName": "string" }
  }]
}
```

**Sprint 3 launch rule for `GET /users/:id`:** once bearer-token auth is enabled, this endpoint becomes authenticated and self-only. The authenticated CareLoop user may fetch only their own profile and memberships. No admin cross-user profile read path is introduced in v1.

**PATCH /users/:id/push-token — body:** `{ "pushToken": "string" }`

**PATCH /users/:id/timezone — body:** `{ "timezone": "string (IANA)" }`

Both PATCH endpoints return the updated user object.

**POST /users/:id/session — body:** `{ "circleId": "string?" }` (if omitted, resolved from first membership)

**POST /users/:id/session — response 200:** `{ "logged": true }` if a new `APP_SESSION` event was recorded; `{ "logged": false }` if already logged today.

---

### Care Circles

| Method | Endpoint                            | Auth | Role            |
|--------|-------------------------------------|------|-----------------|
| POST   | /circles                            | key  | any             |
| GET    | /circles/:id                        | key  | key only (S1)   |
| PATCH  | /circles/:id                        | key  | admin           |
| DELETE | /circles/:id                        | key  | admin           |
| POST   | /circles/:id/members                | key  | any (self-join) |
| DELETE | /circles/:id/members/:memberId      | key  | admin           |
| PATCH  | /circles/:id/members/:memberId/role | key  | admin           |

**POST /circles — body:**

```json
{ "name": "string (required)", "recipientName": "string (required)", "creatorId": "string (required)" }
```

Creator is automatically added as Admin. Response 201 returns full circle object (see GET response).

**GET /circles/:id — response 200:**

```json
{
  "id": "string",
  "name": "string",
  "recipientName": "string",
  "members": [{
    "id": "string",
    "role": "ADMIN|MEMBER",
    "userId": "string",
    "user": { "id": "string", "name": "string", "email": "string" }
  }],
  "tasks": []
}
```

**POST /circles/:id/members — body:**

```json
{ "userId": "string (required)" }
```

Self-join is the active join path in Sprint 1-2. The joining user is always added as `MEMBER`. There is no admin-approved invite flow and no role override in this endpoint.

**POST /circles/:id/members — response 201:**

```json
{
  "id": "string",
  "circleId": "string",
  "userId": "string",
  "role": "MEMBER",
  "joinedAt": "ISO8601"
}
```

**POST /circles/:id/members — errors:** `404` if user or circle not found; `409` if user is already a member.

**PATCH /circles/:id/members/:memberId/role — body:** `{ "role": "ADMIN|MEMBER" }`

Errors: `403` if requester is not Admin; `404` if member not found; `400` if last Admin tries to demote themselves.

---

### Tasks

| Method | Endpoint                                  | Auth | Role                |
|--------|-------------------------------------------|------|---------------------|
| POST   | /circles/:circleId/tasks                  | key  | member              |
| GET    | /circles/:circleId/tasks                  | key  | member              |
| PATCH  | /circles/:circleId/tasks/:taskId          | key  | member (limited)    |
| DELETE | /circles/:circleId/tasks/:taskId          | key  | member (own)/admin  |

**POST /circles/:circleId/tasks — body:**

```json
{
  "title": "string (required, max 200 chars)",
  "notes": "string? (max 1000 chars)",
  "dueAt": "ISO8601?",
  "priority": "LOW | NORMAL | HIGH | URGENT (default: NORMAL)",
  "creatorId": "string (required)",
  "assigneeId": "string?"
}
```

If `dueAt` is set, a `Reminder` is created at `dueAt - 15 minutes`. Response 201 returns full task object.

**GET /circles/:circleId/tasks — response 200:**

```json
[{
  "id": "string",
  "title": "string",
  "notes": "string|null",
  "dueAt": "ISO8601|null",
  "status": "PENDING|IN_PROGRESS|DONE|SKIPPED",
  "priority": "LOW|NORMAL|HIGH|URGENT",
  "circleId": "string",
  "creatorId": "string",
  "assigneeId": "string|null",
  "assignee": { "id": "string", "name": "string" },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}]
```

**PATCH — patchable fields by role:**

| Field                                | Admin | Member         |
|--------------------------------------|-------|----------------|
| status                               | yes   | yes            |
| title, notes, dueAt, priority        | yes   | own tasks only |
| assigneeId                           | yes   | no             |

Errors: `403` if Member tries to edit another user's task or reassign; `404` if task not found in circle.

---

### Events

| Method | Endpoint                      | Auth | Role   |
|--------|-------------------------------|------|--------|
| GET    | /circles/:circleId/events     | key  | member |

Sprint 1: internal/audit use only. Not exposed in iOS app.

**Response 200:**

```json
[{
  "id": "string",
  "type": "string",
  "payload": {},
  "actorId": "string|null",
  "createdAt": "ISO8601"
}]
```

---

## 7. Data Model (Summary)

```text
User → CircleMember → CareCircle
CareCircle → Task → Reminder
CareCircle → Event
User → DigestLog
```

Key constraints:

- A user can belong to multiple circles
- A circle has exactly one recipient (by name, not a User record)
- Task notes are limited to 1000 characters — no structured health fields in schema
- No clinic integration, no medical records, no diagnosis data

---

## 8. Compliance Boundary

**Rule:** Health content in task notes is prohibited by UI disclaimer. There is no active sanitization or NLP filtering.

**Accepted risk:** A user may type health-related free text into the notes field despite the disclaimer. This is an accepted operational risk for Sprint 1. The schema stores no structured health fields, so no PHI is collected by design. Free-text notes are general-purpose strings — the same risk exists in any notes app.

**Policy:** If a support request or incident reveals systematic health data storage in notes, the response is:

1. Notify affected users per FTC requirements
2. Purge the notes column for affected records
3. Ship NLP sanitization in the next release

This policy must be documented in `docs/incident-response.md` before public launch.

---

## 9. iOS App (SwiftUI, iOS 16+)

### Screens

1. **Onboarding** — fork: Create a Circle (Admin) or Join a Circle (enter ID)
2. **Task List** — all tasks for active circle, pull-to-refresh, tap to complete. Swipe trailing: delete (own/admin). Swipe leading: skip (own/admin). Tap row: Task Detail
3. **Task Detail / Edit** — full task fields read-only; Edit button unlocks title, notes, due date, priority (own tasks for Member, any for Admin). Status picker (DONE/IN_PROGRESS/PENDING/SKIPPED with role rules). Admin assignee picker. Delete with confirmation
4. **New Task** — title, notes (with health disclaimer), due date picker, priority selector. Admin sees assignee picker
5. **Member List** — circle members with name, email, and role badge (sheet)
6. **Circle Settings** — edit circle name and recipient name (Admin only, sheet)
7. **Settings** — account info, circle info, circle ID to share (Admin only), sign out

### Navigation

- Tab bar: Tasks | Settings
- Push (NavigationLink): Task Detail
- Sheet: New Task, Member List (people icon), Circle Settings (gear icon, admin only)

---

## 10. Success Metrics and Required Analytics Events

Sprint 1 measurable metrics require corresponding events logged to the `Event` table. Later-sprint activation metrics add their own event requirements when those features ship.

**Sprint 1 measurable metrics**

| Metric                        | Target (Day 30) | Required Event                       |
|-------------------------------|-----------------|--------------------------------------|
| Care circles created          | 10              | `CIRCLE_CREATED`                     |
| Tasks created per circle/week | 5+              | `TASK_CREATED`                       |
| Task completion rate          | >70%            | `TASK_COMPLETED`                     |
| D7 retention                  | >50%            | `APP_SESSION` (one per user per day) |

**Sprint 2 activation metrics**

| Metric               | Target (Day 30) | Required Event         |
|----------------------|-----------------|------------------------|
| Reminder escalations | <20% of tasks   | `REMINDER_ESCALATED`   |

**Implementation rule:** Every route that triggers a metric-backed action in the currently active sprint must call `log_event` before returning.

**D7 retention definition:** User made at least one API call on Day 0 and at least one on Day 7 (±1 day). Measured via `APP_SESSION` events.

**APP_SESSION capture:** iOS calls `POST /users/:id/session` (body: `{ "circleId": "string" }`) on every app foreground via `scenePhase == .active`. The API deduplicates per user per UTC calendar day — at most one `APP_SESSION` event is logged per user per day. Response: `{ "logged": true|false }`.

**Deferred metric:** Daily digest open rate target remains `>40%`, but it is not measurable in Sprint 1.

**DIGEST_OPENED capture (deferred):** Resend open tracking pixel will be enabled on digest emails in the digest scheduler sprint. Resend will send a webhook to `POST /webhooks/resend` when the pixel fires. `DigestLog` will store the Resend `messageId` (field: `messageId String?`) for correlation once webhook support is implemented. That schema addition and webhook endpoint are both deferred and are not part of Sprint 1. `DIGEST_OPENED` is therefore not logged in Sprint 1.

---

## 11. Scope by Sprint

**Permanently out of scope (all sprints):** Clinic/EHR integration, medication tracking, in-app payments, Android, web app.

**Sprint 1 — Core Coordination:** circle creation/join, task CRUD with role enforcement, session restore, analytics events `CIRCLE_CREATED / TASK_CREATED / TASK_COMPLETED / APP_SESSION`, manual QA checklist, seed/reset flow. All iOS screens complete (onboarding, task list, task detail/edit, new task with assignee picker, member list, circle settings, settings).

**Sprint 2 — Reminders, Digests, Push:** `node-cron` scheduler, reminder at `dueAt - 15m`, escalation, 6pm daily digest via Resend, APNs push end-to-end (reminder + escalation + assignment), `DigestLog.messageId` for digest correlation, push-to-email fallback. Deferred: digest open tracking webhook, retry logic.

**Sprint 3 — Public Launch Hardening:** per-user bearer tokens replacing shared API key, invite-based join replacing plain circle-ID self-join, membership enforcement on all GET endpoints, admin member-management UX (promote/demote/remove/invite), privacy policy live, `incident-response.md` complete, production env separation, TestFlight/App Store submission. Post-launch deferrals: distributed scheduler, user-facing activity feed, DIGEST_OPENED webhook, retry logic.

Full exit criteria and test plan per sprint: see `docs/sprint-plan.md`.

---

## 12. Decisions Locked

- **Circle creation:** Onboarding supports both create (user becomes Admin) and join (enter circle ID)
- **Health content in notes:** Prohibited via UI disclaimer. No active sanitization. Accepted risk documented in Section 8
- **Event log:** Internal/audit only in Sprint 1. Not exposed in iOS app
- **Circle ID sharing:** Admin copies and shares manually (v1)
- **Multiple recipients per circle:** No — one recipient per circle (v1)
- **Digest format:** Plain HTML via Resend
- **Scheduler:** `node-cron` in-process. Single instance. No distribution in Sprint 1
- **Timezone:** IANA string stored on User. Auto-detected from device at onboarding via `TimeZone.current.identifier`. Default fallback: `America/New_York`. Digest uses stored timezone; reminders use UTC
- **Auth:** Static API key (`x-api-key` header). Role enforcement via `CircleMember` lookup per mutating request. Read endpoints (GET) are API-key-only in Sprint 1 — no membership check on reads
- **Self-join:** Anyone with API key + circle ID can join as Member. No invite token, no admin approval. Sprint 2+ for proper invite flow
- **APP_SESSION:** iOS triggers `POST /users/:id/session` on every foreground (`scenePhase == .active`). One event per user per UTC day
- **DIGEST_OPENED:** Via Resend open tracking webhook. Implementation deferred to digest scheduler sprint. Not tracked in Sprint 1
- **Auth migration:** CareLoop account auth (Sprint 2) + x-api-key transport → bearer-token auth and transport hardening (Sprint 3)
- **Invite flow:** self-join by circle ID (Sprint 1–2) → admin-created invite token, redemption after auth (Sprint 3). Direct self-join disabled in production at Sprint 3
- **Read enforcement:** GET endpoints are API-key-only (Sprint 1–2) → authenticated + membership-checked (Sprint 3)
- **User profile reads:** `GET /users/:id` stays unchanged in Sprint 1–2 and becomes authenticated + self-only in Sprint 3
- **User identity field:** `AuthIdentity` records link each CareLoop user to Google/Facebook/Apple identities in Sprint 2; backend OAuth start/callback routes own provider configuration and code exchange, while bearer-token identity hardening lands in Sprint 3
- **DigestLog correlation:** `messageId String?` added to `DigestLog` in Sprint 2 to store Resend email ID for DIGEST_OPENED tracking
- **Operational analytics:** PostHog added at start of external beta testing (not Sprint 1)
- **Error tracking:** Sentry added at start of external beta testing (not Sprint 1)
- **Hosting:** Railway preferred, Render acceptable. Separate local / staging / production env values required before beta

---

## 13. Technology Stack

Full decision doc: `docs/tech-stack.md`

| Layer                 | Decision                                           | Sprint        |
|-----------------------|----------------------------------------------------|---------------|
| Database              | Supabase Postgres                                  | 1             |
| ORM / schema          | Prisma                                             | 1             |
| API server            | Fastify (Node.js)                                  | 1             |
| Hosting               | Railway (preferred) or Render                      | 1             |
| Email                 | Resend                                             | 1             |
| Push                  | APNs directly                                      | 2             |
| Background jobs       | `node-cron` in-process                             | 2             |
| Auth                  | `x-api-key` → Supabase Auth magic link/OTP         | 1→3           |
| Operational analytics | PostHog                                            | external beta |
| Error tracking        | Sentry                                             | external beta |

**Architecture constraints:**

- Prisma is the single schema source of truth — no business logic in Supabase Edge Functions or database triggers
- Supabase handles identity; Fastify handles circle/task permissions (`CircleMember.role`)
- Keep current Fastify REST structure — do not replace with Supabase client-side table access
- Use direct APNs (not Firebase Cloud Messaging) — iOS-only product
- No file storage product until attachments are a product requirement

---

## 14. Sprint Plan

**3 sprints × 2 weeks = 6 weeks to public launch.** Solo founder + AI. Scope is frozen.

Full plan with exit criteria, API changes, and test cases: `docs/sprint-plan.md`

### Sprint 1 — Core Coordination Complete

Exit criteria (all must pass before Sprint 2 begins):

1. User can create a circle or self-join an existing one
2. Admin can assign and reassign tasks from the app
3. Member can complete any task; can edit/skip/delete only their own
4. App survives relaunch and restores session/circle state
5. Role-based mutation rules return correct `401/403/404/409` responses

### Sprint 2 — Reminders, Digests, and Push

Exit criteria:

1. Task with `dueAt` creates a reminder and sends at the correct time
2. Overdue task escalates correctly (push + email to all circle members)
3. Assignment notification sends when admin assigns or reassigns
4. User with timezone set receives one digest at 6pm local time
5. Digest sends are idempotent per user/day
6. No push token triggers email fallback per PRD rules

### Sprint 3 — Public Launch Hardening

Exit criteria:

1. Brand-new public user can authenticate, accept an invite, join only authorized circles, and use the app without developer setup
2. Non-members cannot read circle data
3. Removed users lose access immediately
4. Reminders, digests, and assignment notifications work in the production path
5. `incident-response.md` complete; privacy policy live; release checklist passed
6. TestFlight / App Store submission ready

### Agent Ownership

| Domain             | Owner                                                                    |
|--------------------|--------------------------------------------------------------------------|
| Sprint gating      | SHEPHERD — documented process owner / human-in-the-loop lane for now; nothing moves to the next sprint without SHEPHERD sign-off |
| Compliance/privacy | WARDEN — documented process owner / human-in-the-loop lane for now; nothing touching user data ships without WARDEN review |
| Tester feedback    | RELAY — documented process owner / human-in-the-loop lane for now; clusters bugs and routes product decisions to ATLAS and SENTINEL |
