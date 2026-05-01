# CareLoop — Product Requirements Document

**Version:** 1.6
**Status:** Expanded for multi-recipient group operations and invite-based membership. Current local build now includes recurring tasks, weekly weekday selection, occurrence-vs-series recurring edits, pending invite acceptance, admin role management, recipient profiles, recipient-scoped tasks, recipient management, recipient reordering / primary reassignment, recipient-aware admin completion insights, and a two-step multi-group UX (`group list` -> `group hub` -> specific operation). The main remaining product gaps are public invite delivery/acceptance hardening, physical-device push validation, and the paid entitlement layer.
**Bundle ID:** com.careloop.ios
**Compliance:** FTC Health Breach Notification Rule
**Clinic Integration:** PERMANENTLY OFF ROADMAP

**Terminology note:** the product should speak in terms of **Groups**. The current backend/schema still uses `circle` naming internally. Until the schema is migrated, `circle` in code/API means the same thing as `group` in product UX.

---

## 1. Product Vision

CareLoop eliminates the chaos of coordinating care across a family group. Instead of fragmented group texts, missed tasks, and duplicated effort, CareLoop gives every caregiver a shared, real-time view of who needs care, what needs to happen, and who is doing it.

**One sentence:** Coordinate family care for one or more loved ones without the group text chaos.

---

## 2. Problem

Families caring for one or more loved ones face a coordination problem, not just a care problem:

- Tasks fall through the cracks because no one knows who did what
- Group texts get ignored or lost in noise
- Siblings feel unequal burden without visibility
- No single source of truth for each care recipient's status
- Families often care for more than one person at once, but current tools flatten everything into one stream

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

### Additional Caregiver / Co-Admin

- Spouse, sibling, friend, or trusted helper
- May need admin privileges even though they are not a care recipient
- Needs easy invite, acceptance, and clear role boundaries

### Care Recipient

- Aging parent, disabled adult, spouse, child, or another loved one receiving care
- Not a direct app user in v1
- Represented inside a group as a recipient profile, not a login account

---

## 4. Role Permissions

Every API action and UI affordance must enforce these rules.

| Action                                              | Admin | Member              |
|-----------------------------------------------------|-------|---------------------|
| Create a new group                                  | yes   | yes (becomes Admin) |
| Edit group settings                                 | yes   | no                  |
| Delete group                                        | yes   | no                  |
| Add / edit / remove care recipient profiles         | yes   | no                  |
| Invite caregiver                                    | yes   | no                  |
| Remove caregiver                                    | yes   | no                  |
| Promote caregiver to Admin                          | yes   | no                  |
| Demote caregiver from Admin                         | yes   | no                  |
| Switch active group                                 | yes   | yes                 |
| Create task                                         | yes   | yes                 |
| Edit task (title, notes, due date, priority)        | yes   | own tasks only      |
| Reassign task to another caregiver                  | yes   | no                  |
| Change task recipient                               | yes   | no                  |
| Mark task DONE / IN_PROGRESS                        | yes   | yes (any task)      |
| Mark task SKIPPED                                   | yes   | own tasks only      |
| Delete task                                         | yes   | own tasks only      |

**Role model:** a group can have multiple Admins. Admins are caregiver accounts, not care recipients. At least one Admin must remain in every group at all times.

**API enforcement (mutations):** Group-scoped mutating endpoints that change a group, recipient, member, invite, or task must verify the requesting user's role via `CircleMember` (legacy schema name). Return `403` if the action is not permitted. Non-member setup endpoints — `POST /auth/signup`, `POST /auth/login`, `POST /auth/social`, `POST /auth/forgot-password/request`, `POST /auth/forgot-password/verify`, `POST /auth/forgot-password/reset`, `POST /users`, `POST /circles`, `PATCH /users/:id/push-token`, `PATCH /users/:id/timezone`, and `POST /users/:id/session` — do not require an existing membership. Invite acceptance happens only after authentication.

**API enforcement (reads):** GET endpoints are API-key-only in the current local build. The "member" label on GET rows in Section 6 is intent documentation. Membership enforcement on reads must be completed before public launch.

**UI enforcement:** Hide or disable affordances the user cannot perform. Do not rely on API `403` as the only gate.

---

## 5. Core Features

### 5.1 Care Groups

- A Care Group is the top-level workspace for one family or care team.
- A group contains:
  - caregiver members
  - one or more care recipient profiles
  - tasks, reminders, events, and settings scoped to that group
- Members have roles: `ADMIN` or `MEMBER` (see Section 4).
- **User-facing language:** the app should say `Group`, not `Circle`.
- **Settings are per group:** archive window, recipient list, member roles, invite state, and future notification preferences belong to the group. Personal account data belongs to the user profile.
- **Group cap:** one CareLoop user can belong to at most **3 groups total**. The cap applies to creating a new group, accepting an invite, or joining any transitional legacy flow.

### 5.1.1 Care recipients inside a group

- A group can include multiple people receiving care.
- Care recipients are profiles inside the group, not login accounts.
- A recipient profile should include:
  - full name
  - relationship / label (for example `Mom`, `Dad`, `Grandma`, `Neighbor`)
  - optional avatar / initials
  - optional non-clinical descriptor for clarity (`Primary contact`, `Lives at home`, etc.)
- The group dashboard should show each recipient as a distinct card or row with:
  - due today count
  - overdue count
  - completed today count
  - latest upcoming task
- v1 should support small-family multi-recipient coordination cleanly. The UX should be optimized for roughly **1–5 care recipients per group** even if backend storage is not hard-capped there initially.

### 5.1.2 Group membership and invitations

- Users do not become members of a group merely because an Admin typed their email.
- Admin creates an **invite** addressed to a specific email address (phone-based invite can be added later, but email is the required v1 path).
- Invite status lifecycle:
  - `PENDING`
  - `ACCEPTED`
  - `REVOKED`
  - `EXPIRED`
- Invite flow:
  1. Admin sends invite.
  2. Invitee receives a link or code.
  3. Invitee installs the app or opens it.
  4. Invitee signs up or logs in with the invited email (or a linked provider account resolving to that email).
  5. App shows pending invites.
  6. Invitee accepts.
  7. Membership is created as `MEMBER`.
- Admin can revoke a pending invite before acceptance.
- If the invitee already belongs to 3 groups, acceptance must fail with a clear error until they leave another group.
- **Legacy direct join by group ID** may remain in local/dev builds temporarily, but it is not the intended public product flow.

### 5.1.3 Multi-group operations

- A user has one **active group** at a time in the app session.
- After authentication, users should first land on a **group list** screen that shows all current memberships plus pending invites.
- Opening a group from that list should take the user to a **group hub** screen, not directly into a sub-surface. The hub should expose explicit operations such as:
  - task board
  - members / invites
  - care recipients
  - group settings
  - admin insights
- Dashboard, recipient list, task list, member list, group settings, and new task creation are always scoped to the active group.
- Joining a second or third group does not remove access to existing groups.
- Creating or accepting a fourth group must fail with a clear product error explaining the 3-group limit.
- Switching groups must reload recipients, tasks, members, permissions, and settings before the user continues working.
- The app should persist the most recently used active group across relaunch.
- Push/deep-link task opens must switch into the task's owning group before presenting that task.
- Task creation is never global. A task is always created in the active group.
- Returning from an active group back to the group list should be a first-class affordance in the nav chrome.

### 5.2 Task Management

- Tasks have:
  - title
  - notes
  - due date
  - priority (`LOW / NORMAL / HIGH / URGENT`)
  - status
  - assignee
  - owning group
  - target care recipient
  - recurrence configuration (optional)
- Every task should belong to exactly one group.
- Every care task should belong to exactly one recipient profile. If non-recipient operational tasks are needed later, they should use an explicit `GENERAL` scope rather than omitting recipient context silently.
- Status flow: `PENDING → IN_PROGRESS → DONE` (or `SKIPPED`)
- Any member can create and complete tasks; reassignment and recipient changes are Admin-only.
- Overdue tasks (`dueAt < now`, `status != DONE`) are highlighted in red.
- Completed and skipped tasks remain visible in a `Completed` section until the group's `archiveAfterDays` window expires. After that they are archived server-side and excluded from the main task feed.
- The dashboard must support:
  - all-recipient view
  - per-recipient filtered task view
  - recipient-aware counts and status summaries

### 5.2.1 Recurring tasks

- Recurring care work is a core product requirement. Examples:
  - daily medication reminders
  - weekly grocery runs
  - every-Monday physical therapy transport
  - every-2-weeks refill pickup
- Recurrence should support:
  - daily
  - weekly
  - selected weekdays
  - monthly
  - custom interval (for example every `N` days or weeks)
- Product behavior:
  - user creates a recurring task template
  - each due occurrence is tracked as its own task instance / completion record
  - completing one occurrence must not mark the entire series complete forever
  - editing one occurrence and editing the whole series must be distinct actions
  - skipping one occurrence must not cancel future occurrences unless the admin explicitly pauses or ends the series
- Recurring tasks should remain visible in the normal task list as concrete upcoming instances, not only as abstract templates.
- Recurring tasks are part of the free collaborative core because recurring care is central to the product's value.

### 5.2.2 Admin completion insights

- Admins should be able to see whether care work is actually getting done over time.
- Each group should expose an Admin-only completion insights view or dashboard module.
- Minimum insight charts:
  - tasks completed per day over the last 7 / 30 days
  - completion rate by recipient
  - overdue vs completed trend
  - top active caregivers by completed task count
- These charts should be scoped to the active group and, where relevant, filterable by recipient.
- This is not just vanity analytics; it helps the organizer identify whether coordination is working and where follow-through is slipping.

### 5.3 Reminder Escalation

**Scheduler ownership:** `node-cron` job inside the API process. One job per server instance. Not distributed — acceptable for Sprint 1 scale.

**Timezone source:** Stored on the `User` record as an IANA timezone string (e.g. `America/New_York`). **Capture mechanism:** iOS auto-detects `TimeZone.current.identifier` at onboarding and immediately calls `PATCH /users/:id/timezone`. No user-facing picker in Sprint 1. **Fallback:** if auto-detect returns empty, default to `America/New_York`. Used for digest scheduling only. Reminder offsets (15 min before due) are always UTC-relative.

**Reminder creation:** When a task is saved with a `dueAt`, a `Reminder` record is created with `scheduledAt = dueAt - 15 minutes`. Cron polls every minute for reminders where `scheduledAt <= now AND status = PENDING`.

**Escalation logic:**

1. Cron fires reminder → send push (if `pushToken` exists) → mark `Reminder.status = SENT`, set `sentAt`
2. Cron checks again 15 minutes later: if task still not `DONE` → escalate
3. Escalation: push to all group members + email via Resend → mark `Reminder.status = ESCALATED`, set `escalatedAt`

**Push-to-email fallback:** If a member has no `pushToken`, skip push and send email directly. If Resend fails, log the error and mark `Reminder.status = FAILED` — no retry in Sprint 1.

**Idempotency:** Cron checks `Reminder.status` before sending. A reminder with `status != PENDING` is skipped. Prevents double-sends on process restart.

### 5.4 Daily Digest

**Schedule:** Cron runs at the top of every hour. For each user, if their local hour (per stored timezone) equals 18 (6pm), send digest.

**Content:** Tasks due today (not done), overdue tasks, and tasks completed today, grouped by care recipient with assignee name.

**Delivery:** Resend email, plain HTML. If Resend fails, log and skip — no retry in Sprint 1.

**Idempotency:** Store `DigestLog { userId, date }` (date = YYYY-MM-DD in user's timezone). Skip if record already exists for today.

### 5.5 Push Notifications

- Task reminders (15 min before due)
- Escalation alerts (task overdue, sent to all group members)
- Task assignment notifications (when Admin assigns a task)
- Invite notifications (when a caregiver is invited to a group)
- Requires APNs — gated on Apple Developer account

### 5.6 Authentication

- **Email/password auth is active in Sprint 2.**
- Users can create a CareLoop account with `name`, `email`, and `password`.
- Users can log in with email/password.
- Users can recover access through a 6-digit forgot-password flow (request code, verify code, set new password).
- Password reset codes expire after 10 minutes and are single-use. Issuing a new reset request invalidates any prior unconsumed reset code for that user.
- Forgot-password request is enumeration-safe: if the email is unknown, the API still returns `{ "sent": true }` without revealing whether an account exists.
- Users can also authenticate with Google, Facebook, or Apple through CareLoop-owned OAuth start/callback routes that redirect back into the iOS app via `careloop://auth`.
- Social sign-in maps to a first-party CareLoop `User` plus a linked `AuthIdentity` record per provider.
- After authentication, the app should check for pending invites matching the authenticated email identity and surface them before sending the user into normal group selection.
- Transport auth remains `x-api-key` in the current local build. Account auth determines which CareLoop user is loaded in-app; bearer-token enforcement must land before public launch.
- **Local/dev mode:** social sign-in may complete via provider-returned profile payload while provider credentials are still being finalized. Production mode must validate provider tokens or callback exchanges before identity creation.
- **Session restore (current implementation):** the iOS app persists `userId` and last attached `circleId`. On relaunch, it restores that circle if possible; otherwise it falls back to the user's first membership.

---

## 6. API Contract

**Base URL (dev):** `http://localhost:3000`

**Base URL (prod):** TBD — pending deployment

**Auth:** `x-api-key` header required on all endpoints except `/health`, `GET /auth/oauth/:provider/start`, and `GET|POST /auth/oauth/:provider/callback`

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
| GET    | /auth/oauth/:provider/start | none | any  |
| GET    | /auth/oauth/:provider/callback | none | any |
| POST   | /auth/oauth/:provider/callback | none | any |
| POST   | /auth/forgot-password/request | key | any |
| POST   | /auth/forgot-password/verify  | key | any |
| POST   | /auth/forgot-password/reset   | key | any |
| POST   | /users                      | key  | any  |
| GET    | /users/by-email             | key  | any  |
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
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "phone": "string|null",
    "identities": [],
    "memberships": []
  }
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
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "phone": "string|null",
    "identities": [{
      "id": "string",
      "provider": "GOOGLE|FACEBOOK|APPLE",
      "providerUserId": "string",
      "providerEmail": "string|null",
      "providerName": "string|null"
    }],
    "memberships": []
  }
}
```

**GET /auth/oauth/:provider/start — behavior:** public redirect endpoint that constructs the upstream Google/Facebook/Apple authorization URL, signs OAuth state, and includes the app callback scheme (for example `careloop://auth`) in the eventual return path.

**GET|POST /auth/oauth/:provider/callback — behavior:** public provider callback endpoint. Accepts query-string callbacks for Google/Facebook and `form_post` callbacks for Apple, exchanges the provider code, and redirects back into the iOS app via `careloop://auth?...`.

**POST /auth/forgot-password/request — body:**

```json
{ "email": "string" }
```

**POST /auth/forgot-password/request — response 200:**

```json
{ "sent": true, "expiresInMinutes": 10 }
```

**Local/dev note:** when email delivery is not configured and the app is not in production mode, the response may also include a temporary `debugCode` to support simulator testing of the verify/reset screens.

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
  "identities": [{
    "id": "string",
    "provider": "GOOGLE|FACEBOOK|APPLE",
    "providerUserId": "string",
    "providerEmail": "string|null",
    "providerName": "string|null"
  }],
  "memberships": [{
    "id": "string",
    "circleId": "string",
    "role": "ADMIN|MEMBER",
    "circle": {
      "id": "string",
      "name": "string",
      "recipients": [{ "id": "string", "name": "string" }],
      "archiveAfterDays": 7
    }
  }]
}
```

**GET /users/by-email — query:** `?email=<normalized-email>`

**GET /users/by-email — note:** internal/dev helper endpoint used for local diagnostics and older setup flows. Not required for the main iOS auth path.

**Public-launch rule for `GET /users/:id`:** once bearer-token auth is enabled, this endpoint becomes authenticated and self-only. The authenticated CareLoop user may fetch only their own profile and memberships. No admin cross-user profile read path is introduced in v1.

**PATCH /users/:id/push-token — body:** `{ "pushToken": "string" }`

**PATCH /users/:id/timezone — body:** `{ "timezone": "string (IANA)" }`

Both PATCH endpoints return the updated user object.

**POST /users/:id/session — body:** `{ "circleId": "string?" }` (if omitted, resolved from first membership)

**POST /users/:id/session — response 200:** `{ "logged": true }` if a new `APP_SESSION` event was recorded; `{ "logged": false }` if already logged today.

---

### Care Groups (legacy API paths still use `/circles`)

| Method | Endpoint                                 | Auth | Role          |
|--------|------------------------------------------|------|---------------|
| POST   | /circles                                 | key  | any           |
| GET    | /circles/:id                             | key  | member        |
| PATCH  | /circles/:id                             | key  | admin         |
| DELETE | /circles/:id                             | key  | admin         |
| POST   | /circles/:id/recipients                  | key  | admin         |
| PATCH  | /circles/:id/recipients/:recipientId     | key  | admin         |
| DELETE | /circles/:id/recipients/:recipientId     | key  | admin         |
| POST   | /circles/:id/invitations                 | key  | admin         |
| POST   | /invitations/:inviteId/accept            | key  | authenticated |
| DELETE | /circles/:id/invitations/:inviteId       | key  | admin         |
| DELETE | /circles/:id/members/:memberId           | key  | admin         |
| PATCH  | /circles/:id/members/:memberId/role      | key  | admin         |

**POST /circles — body:**

```json
{
  "name": "string (required)",
  "firstRecipientName": "string (required)",
  "creatorId": "string (required)",
  "archiveAfterDays": "number? (default: 7, min: 1, max: 30)"
}
```

Creator is automatically added as Admin. Creating a fourth group for the same user must return a clear `400` limit error. Response 201 returns full group object (see GET response).

**GET /circles/:id — response 200:**

```json
{
  "id": "string",
  "name": "string",
  "archiveAfterDays": 7,
  "recipients": [{
    "id": "string",
    "name": "string",
    "label": "Mom",
    "isPrimary": true
  }],
  "members": [{
    "id": "string",
    "role": "ADMIN|MEMBER",
    "userId": "string",
    "user": { "id": "string", "name": "string", "email": "string" }
  }],
  "pendingInvites": [{
    "id": "string",
    "email": "string",
    "role": "MEMBER|ADMIN",
    "status": "PENDING|ACCEPTED|REVOKED|EXPIRED",
    "expiresAt": "ISO8601"
  }],
  "tasks": []
}
```

**POST /circles/:id/recipients — body:**

```json
{ "name": "string (required)", "label": "string?", "isPrimary": "boolean?" }
```

Adds another care recipient profile inside the group.

**POST /circles/:id/invitations — body:**

```json
{
  "userId": "admin-user-id",
  "email": "string (required)",
  "role": "MEMBER|ADMIN (default MEMBER)"
}
```

Creates a pending invite. Admin may invite another caregiver directly as `ADMIN` if desired. Invite acceptance, not invite creation, creates the membership row.

**POST /circles/:id/invitations — response 201:**

```json
{
  "id": "string",
  "circleId": "string",
  "email": "string",
  "role": "MEMBER|ADMIN",
  "status": "PENDING",
  "expiresAt": "ISO8601"
}
```

**POST /invitations/:inviteId/accept — body:**

```json
{ "userId": "authenticated-user-id" }
```

Creates the membership when the authenticated user's email matches the invited email and the invite is still pending.

**POST /invitations/:inviteId/accept — response 201:**

```json
{
  "id": "string",
  "circleId": "string",
  "userId": "string",
  "role": "MEMBER|ADMIN",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

**Invite acceptance errors:** `400` if user already belongs to 3 groups; `403` if invite email does not match authenticated identity; `404` if invite not found; `409` if already accepted.

**DELETE /circles/:id/members/:memberId — errors:** `400` if attempting to remove the last remaining admin; `404` if member not found.

**PATCH /circles/:id — body:**

```json
{
  "name": "string?",
  "archiveAfterDays": "number? (min: 1, max: 30)"
}
```

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
  "assigneeId": "string?",
  "recipientId": "string (required)",
  "recurrence": {
    "frequency": "NONE|DAILY|WEEKLY|MONTHLY|CUSTOM",
    "interval": "number?",
    "weekdays": ["MON","TUE","WED","THU","FRI","SAT","SUN"],
    "endsAt": "ISO8601?"
  }
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
  "recipientId": "string",
  "creatorId": "string",
  "assigneeId": "string|null",
  "recurrence": {
    "frequency": "NONE|DAILY|WEEKLY|MONTHLY|CUSTOM",
    "interval": 1,
    "weekdays": ["MON","WED","FRI"],
    "endsAt": "ISO8601|null"
  },
  "seriesId": "string|null",
  "completedAt": "ISO8601|null",
  "archivedAt": "ISO8601|null",
  "recipient": { "id": "string", "name": "string", "label": "string|null" },
  "assignee": { "id": "string", "name": "string" },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}]
```

`GET /circles/:circleId/tasks` returns active and completed tasks for that circle, but excludes tasks with `archivedAt != null`.

**PATCH — patchable fields by role:**

| Field                                | Admin | Member         |
|--------------------------------------|-------|----------------|
| status                               | yes   | yes            |
| title, notes, dueAt, priority        | yes   | own tasks only |
| assigneeId                           | yes   | no             |
| recipientId                          | yes   | no             |

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
User → AuthIdentity
User → PasswordResetCode
User → CircleMember → CareGroup
CareGroup → CareRecipient
CareGroup → GroupInvite
CareGroup (archiveAfterDays) → TaskSeries
TaskSeries → TaskOccurrence (recipientId, completedAt, archivedAt) → Reminder
CareGroup → Event
User → DigestLog (messageId)
```

Key constraints:

- A user can belong to at most 3 groups
- A group can contain multiple care recipients
- Recurring tasks should be modeled as a series/template plus individual occurrences for completion history
- Group invites are accepted after auth; invite creation alone does not create a membership
- A user can have zero or more linked social identities (`AuthIdentity`) and zero or more password reset codes (`PasswordResetCode`)
- Completed/skipped tasks are soft-retained in the main product until `archivedAt` is set by the scheduler
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

1. **Authentication** — login, sign up, and forgot-password flows for email/password; Google/Facebook/Apple provider entry points route through backend-owned OAuth start/callback
2. **Invite Resolution** — after auth, show pending group invites for the authenticated email and let the user accept or decline
3. **Group Setup** — if no accepted invite exists, user can create a new group with `group name` + `first care recipient`
4. **Group Dashboard** — default landing inside an active group. Shows recipient cards, due/overdue/completed summaries, and shortcuts into recipient-scoped tasks. Admins also see completion charts here or from an adjacent insights surface
5. **Recipient Task List** — tasks for active group, filterable by recipient and split into `Active` and `Completed`
6. **Task Detail** — opens editable; task fields and status are separate sections. `Save` persists title, notes, due date, priority, assignee, recipient, recurrence, and status, then returns to the task list
7. **New Task** — title, notes (with health disclaimer), due date picker, priority selector, recipient picker, recurrence controls, and assignee picker. Admin sees reassignment controls
8. **Member List** — caregiver members with name, email, and role badge. Admins can invite, remove, and promote members from this screen
9. **Recipient Management** — add, rename, reorder, or remove care recipients inside the active group (Admin only)
10. **Admin Insights** — per-group completion charts, recipient trends, and caregiver completion activity (Admin only)
11. **Group Settings** — edit group name and `archiveAfterDays`, manage invite state, and future group-level notification preferences (Admin only)
12. **Settings** — account info, active group info, all groups, sign out
13. **Multi-group switching** — one active group at a time. The app includes a group list as the authenticated root plus a per-group hub for explicit operations before the user drills into tasks, members, settings, or insights

### Navigation

- Tab bar: Tasks | Settings
- Active group selector in the top bar
- Dashboard -> recipient task list -> task detail
- Sheet or push: New Task, Member List, Recipient Management, Admin Insights, Group Settings
- Active group state must be visible in the main experience and used as the scope for all task CRUD.

---

## 10. Success Metrics and Required Analytics Events

Sprint 1 measurable metrics require corresponding events logged to the `Event` table. Later-sprint activation metrics add their own event requirements when those features ship.

**Sprint 1 measurable metrics**

| Metric                        | Target (Day 30) | Required Event                       |
|-------------------------------|-----------------|--------------------------------------|
| Care groups created           | 10              | `CIRCLE_CREATED`                     |
| Tasks created per group/week  | 5+              | `TASK_CREATED`                       |
| Task completion rate          | >70%            | `TASK_COMPLETED`                     |
| D7 retention                  | >50%            | `APP_SESSION` (one per user per day) |

**Sprint 2 activation metrics**

| Metric               | Target (Day 30) | Required Event         |
|----------------------|-----------------|------------------------|
| Reminder escalations | <20% of tasks   | `REMINDER_ESCALATED`   |

**Sprint 3 activation metrics**

| Metric                     | Target (Day 30) | Required Event         |
|----------------------------|-----------------|------------------------|
| Invite acceptance rate     | >60%            | `INVITE_ACCEPTED`      |
| Multi-recipient groups     | >30% of groups  | `RECIPIENT_CREATED`    |
| Weekly active groups/user  | >1.3            | `APP_SESSION` + group context |
| Recurring task adoption    | >25% of active groups | `TASK_SERIES_CREATED` |

**Implementation rule:** Every route that triggers a metric-backed action in the currently active sprint must call `log_event` before returning.

**D7 retention definition:** User made at least one API call on Day 0 and at least one on Day 7 (±1 day). Measured via `APP_SESSION` events.

**APP_SESSION capture:** iOS calls `POST /users/:id/session` (body: `{ "circleId": "string" }`, legacy field name) on every app foreground via `scenePhase == .active`. The API deduplicates per user per UTC calendar day — at most one `APP_SESSION` event is logged per user per day. The event should carry the active group context.

**Deferred metric:** Daily digest open rate target remains `>40%`, but it is not measurable in Sprint 1.

**DIGEST_OPENED capture (deferred):** Resend open tracking pixel will be enabled on digest emails in the digest scheduler sprint. Resend will send a webhook to `POST /webhooks/resend` when the pixel fires. `DigestLog` will store the Resend `messageId` (field: `messageId String?`) for correlation once webhook support is implemented. That schema addition and webhook endpoint are both deferred and are not part of Sprint 1. `DIGEST_OPENED` is therefore not logged in Sprint 1.

### 10.1 Monetization metrics

These metrics become required once subscriptions are enabled:

| Metric                           | Target (Day 60) | Required Event              |
|----------------------------------|-----------------|-----------------------------|
| Trial start rate (admins)        | >40%            | `TRIAL_STARTED`             |
| Trial-to-paid conversion         | >15%            | `SUBSCRIPTION_STARTED`      |
| Monthly paid group retention     | >85%            | `SUBSCRIPTION_RENEWED`      |
| Group invite acceptance on paid  | >60%            | `INVITE_ACCEPTED`           |
| Admin insights weekly usage      | >35% of paid groups | `INSIGHTS_VIEWED`      |

### 10.2 Pricing and entitlements

**Business model:** `free tier + paid tier + introductory free trial`.

This product should not use per-caregiver billing. The natural buyer is the primary organizer of a family group. One paid subscription should unlock premium features for the whole group.

**Free tier — CareLoop Basic**

- 1 group
- 1 care recipient in that group
- unlimited invited caregivers in that group
- core auth, invite acceptance, task viewing, task completion, and basic task creation
- recurring task creation and completion
- basic reminders
- fixed archive retention default

**Paid tier — CareLoop Plus**

- up to 3 groups
- multiple care recipients per group
- group dashboard with recipient-level views
- advanced admin controls
- admin completion charts and caregiver performance insights
- configurable archive retention
- escalation reminders
- daily digest
- future premium reporting/export surfaces

**Trial**

- 14-day free trial of CareLoop Plus
- Trial should start when an organizer creates their first group or activates a premium feature path, not merely when the app is installed
- Trial applies to the organizer account and unlocks Plus features for the organizer's group(s)

**Who pays**

- The paying customer is the organizer / Admin
- Invited caregivers should not be forced through a paywall just to join, view tasks, or complete tasks
- A paid entitlement should unlock the relevant premium features for all members of the covered group

**Downgrade rules**

- When trial or subscription ends, do not lock users out of their data
- Keep existing groups readable
- Keep invited caregivers able to log in, view tasks, and complete tasks
- Freeze only premium creation/management actions until billing resumes
- If the account exceeds free-tier limits on downgrade, existing data remains visible but the user cannot add more premium resources until they upgrade again or reduce usage

**Purchase mechanics**

- iOS monetization should use App Store in-app purchase via StoreKit 2
- Subscription types:
  - monthly auto-renewing
  - annual auto-renewing
- Entitlements must be stored server-side and mapped to group access, not only device-local receipt state
- Restore purchases must be supported

**Paywall strategy**

- Do not paywall invite acceptance
- Do not paywall task completion
- Do not paywall the basic collaborative loop
- Paywall additional complexity, automation, and multi-group / multi-recipient management

**CEO decision:** launch the core product with a generous free collaborative loop and monetize the organizer's need for scale, automation, and multi-recipient coordination. Growth depends on low-friction family participation; revenue should come from the coordinator who needs the system most.

---

## 11. Scope by Sprint

**Permanently out of scope (all sprints):** Clinic/EHR integration, medication tracking, Android, web app.

**Sprint 1 — Core Coordination:** initial single-recipient circle creation/join, task CRUD with role enforcement, session restore, analytics events `CIRCLE_CREATED / TASK_CREATED / TASK_COMPLETED / APP_SESSION`, manual QA checklist, seed/reset flow.

**Sprint 2 — Auth, Reminders, Push, and Multi-group Foundations:** `node-cron` scheduler, reminder at `dueAt - 15m`, escalation, 6pm daily digest via Resend, APNs push end-to-end (reminder + escalation + assignment), `DigestLog.messageId` for digest correlation, push-to-email fallback, CareLoop email/password auth, backend-owned Google/Facebook/Apple OAuth entry, forgot-password flow, group list + group hub multi-group UX, completed-task retention (`archiveAfterDays`) and auto-archiving.

**Sprint 3 — Group Model Upgrade:** multiple care recipients per group, group dashboard, recipient-scoped tasks, recurring task series + occurrences, invite creation and acceptance flow, group-scoped settings, admin invite/remove/promote, and enforced 3-group membership cap.

**Sprint 4 — Public Launch Hardening and Monetization:** per-user bearer tokens replacing shared API key, membership enforcement on all GET endpoints, privacy policy live, `incident-response.md` complete, production env separation, TestFlight/App Store submission, StoreKit 2 subscriptions, 14-day trial, server-side entitlement sync, group-level premium unlocks, admin insights charts, and launch QA for the full invite-based onboarding path. Post-launch deferrals: distributed scheduler, user-facing activity feed, DIGEST_OPENED webhook, retry logic.

Full exit criteria and test plan per sprint: see `docs/sprint-plan.md`.

---

## 12. Decisions Locked

- **Group creation:** Onboarding supports both create (user becomes Admin) and accept-invite entry. Raw circle-ID join is transitional only
- **Multi-group membership:** Allowed, capped at 3 total groups per user
- **Active group model:** A user works in one active group at a time. Dashboard, recipients, tasks, members, and settings are scoped to the active group
- **Health content in notes:** Prohibited via UI disclaimer. No active sanitization. Accepted risk documented in Section 8
- **Event log:** Internal/audit only in Sprint 1. Not exposed in iOS app
- **Invite flow:** Admin sends invite; invitee accepts only after authentication. Membership is created on acceptance, not on invite creation
- **Multiple recipients per group:** Yes — required for v1 public product
- **Recurring tasks:** Core product feature, not paywalled
- **Recurring task model:** series/template + occurrence history, not one mutable row that overwrites prior completions
- **Admin insights:** group-level completion charts are Admin-only and belong in Plus
- **Pricing model:** free collaborative core + paid organizer subscription
- **Trial:** 14-day introductory trial for CareLoop Plus
- **Billing unit:** one organizer subscription unlocks premium features for the whole group; no per-caregiver seat pricing
- **Free-tier philosophy:** invite acceptance, task viewing, and task completion must remain usable without payment
- **Completed task lifecycle:** DONE and SKIPPED tasks remain in the active group's `Completed` section until `archiveAfterDays` elapses; hourly scheduler archives them after that window
- **Archive retention range:** default 7 days; admin-configurable per group from 1 to 30 days
- **Digest format:** Plain HTML via Resend
- **Scheduler:** `node-cron` in-process. Single instance. No distribution in Sprint 1
- **Timezone:** IANA string stored on User. Auto-detected from device at onboarding via `TimeZone.current.identifier`. Default fallback: `America/New_York`. Digest uses stored timezone; reminders use UTC
- **Auth:** Static API key transport remains a temporary implementation detail until bearer-token hardening. Role enforcement comes from group membership
- **Self-join:** Not a public product flow. Legacy direct join may exist temporarily for local/dev, but shipped product should prefer invite acceptance
- **APP_SESSION:** iOS triggers `POST /users/:id/session` on every foreground (`scenePhase == .active`). One event per user per UTC day
- **DIGEST_OPENED:** Via Resend open tracking webhook. Implementation deferred to digest scheduler sprint. Not tracked in Sprint 1
- **Auth migration:** CareLoop account auth + OAuth providers first; bearer-token auth and transport hardening lands before public launch
- **Read enforcement:** GET endpoints become authenticated + membership-checked before public launch
- **User profile reads:** `GET /users/:id` becomes authenticated + self-only before public launch
- **User identity field:** `AuthIdentity` records link each CareLoop user to Google/Facebook/Apple identities; backend OAuth start/callback routes own provider configuration and code exchange, while bearer-token identity hardening lands before public launch
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
| Auth                  | CareLoop account auth + provider OAuth → bearer tokens | 2→4       |
| Billing               | StoreKit 2 + server entitlement sync               | 4             |
| Operational analytics | PostHog                                            | external beta |
| Error tracking        | Sentry                                             | external beta |

**Architecture constraints:**

- Prisma is the single schema source of truth — no business logic in Supabase Edge Functions or database triggers
- Fastify owns group, invite, recipient, task, and permission logic (`CircleMember.role`)
- Billing entitlements must be enforced server-side at the group level, not trusted from device state alone
- Keep current Fastify REST structure — do not replace with Supabase client-side table access
- Use direct APNs (not Firebase Cloud Messaging) — iOS-only product
- No file storage product until attachments are a product requirement

---

## 14. Sprint Plan

**4 sprints × 2 weeks = 8 weeks to public launch.** Scope includes multi-recipient groups, invite acceptance, and monetization readiness before public release.

Full plan with exit criteria, API changes, and test cases: `docs/sprint-plan.md`

### Sprint 1 — Core Coordination Complete

Exit criteria (all must pass before Sprint 2 begins):

1. User can create a circle or self-join an existing one
2. Admin can assign and reassign tasks from the app
3. Member can complete any task; can edit/skip/delete only their own
4. App survives relaunch and restores session/circle state
5. Role-based mutation rules return correct `401/403/404/409` responses

### Sprint 2 — Auth, Reminders, Digests, and Push Foundations

Exit criteria:

1. Task with `dueAt` creates a reminder and sends at the correct time
2. Overdue task escalates correctly (push + email to all active-group members)
3. Assignment notification sends when admin assigns or reassigns
4. User with timezone set receives one digest at 6pm local time
5. Digest sends are idempotent per user/day
6. No push token triggers email fallback per PRD rules

### Sprint 3 — Multi-recipient Groups and Invite Acceptance

Exit criteria:

1. A group can contain multiple care recipient profiles and show them clearly on a dashboard
2. Every care task belongs to a recipient and can be filtered by recipient
3. Recurring task series create future occurrences correctly without losing completion history
4. Admin can invite a caregiver by email, and the invitee joins only after authentication and acceptance
5. Admin can remove a caregiver and promote another caregiver to Admin
6. Users cannot belong to more than 3 groups
7. Group settings are scoped per group and stored independently

### Sprint 4 — Public Launch Hardening and Monetization

Exit criteria:

1. Brand-new public user can authenticate, accept an invite, join only authorized groups, and use the app without developer setup
2. Non-members cannot read group data
3. Removed users lose access immediately
4. Reminders, digests, assignment notifications, and invite acceptance work in the production path
5. Admin completion charts render correct group-level and recipient-level trends
6. StoreKit 2 subscriptions, trial start, restore purchase, and server-side entitlement sync work correctly
7. `incident-response.md` complete; privacy policy live; release checklist passed
8. TestFlight / App Store submission ready

### Agent Ownership

| Domain             | Owner                                                                    |
|--------------------|--------------------------------------------------------------------------|
| Sprint gating      | SHEPHERD — documented process owner / human-in-the-loop lane for now; nothing moves to the next sprint without SHEPHERD sign-off |
| Compliance/privacy | WARDEN — documented process owner / human-in-the-loop lane for now; nothing touching user data ships without WARDEN review |
| Tester feedback    | RELAY — documented process owner / human-in-the-loop lane for now; clusters bugs and routes product decisions to ATLAS and SENTINEL |
