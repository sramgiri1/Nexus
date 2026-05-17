# CareLoop — Product Requirements Document

**Version:** 1.7
**Status:** Rebased to the current product definition for family-centered Care Circles, explicit care receiver consent and proxy activation, receiver-scoped caregiver access, and per-care-receiver premium entitlements. Current local code partially implements this model but still diverges in visibility rules, entitlement scope, and some receiver flows. This document is now the source of product truth for the next implementation phase.
**Bundle ID:** com.careloop.ios
**Compliance:** FTC Health Breach Notification Rule
**Clinic Integration:** PERMANENTLY OFF ROADMAP

**Terminology note:** the product should speak in terms of **Care Circle**, **Care Organizer**, **Caregiver**, and **Care Receiver**. The current backend/schema still uses `circle`, `ADMIN`, `MEMBER`, and `RECIPIENT` internally. Until the schema is migrated, those internal names refer to the product terms above.

---

## 1. Product Vision

CareLoop helps a family coordinate caregiving tasks and reminders for one loved one inside a shared Care Circle, while still supporting more than one care receiver inside the same family when needed. The product is designed to reduce chaos, improve accountability, and give families a calmer operating system for care.

**One sentence:** Coordinate family caregiving tasks and reminders for one loved one.

---

## 2. Problem

Families caring for a loved one face a coordination problem, not just a care problem:

- Tasks fall through the cracks because nobody knows who owns what
- Group texts create noise instead of reliable follow-through
- Family members feel guilt, resentment, or unequal burden without visibility
- Care receivers need consent, dignity, and clarity about who is helping them
- Families that support more than one loved one need structure, but not a clinical workflow tool

---

## 3. User Personas

### Primary buyer — The Family Decision Unit

- In this phase, multiple family members jointly decide whether CareLoop is worth paying for
- The product is family-first, not clinic-first
- A paid decision is usually made around one specific care receiver's needs

### Primary product owner — The Care Organizer

- Main family organizer for a Care Circle
- Creates the circle, invites care receivers and caregivers, and controls who can access whom
- Needs visibility across all care receivers and all tasks in the circle
- Wants accountability without turning the product into surveillance or conflict

### Core participant — The Caregiver

- Family member, spouse, sibling, friend, or trusted helper
- Helps with tasks inside the scope of one or more explicitly assigned care receivers
- Needs clarity, reminders, and enough context to help effectively
- Is not the main coordination layer; the Care Organizer is

### Active participant — The Care Receiver

- Adult receiving care who can participate directly in their own workflow
- Has their own CareLoop account when they use the app directly
- In this phase, sees only their own directly assigned tasks and can mark them done
- Does not create tasks, invite others, or manage the circle
- Must be **18 years or older** in this phase

### Proxy-authorized support relationship

- Not a separate visible product role
- Used when a care receiver cannot or will not operate the app directly
- A Care Organizer may attest that they have consent and/or external legal authorization to act on that receiver's behalf
- Proxy activation is a product/legal relationship recorded by CareLoop, not a new role in the UI

---

## 4. Role And Access Matrix

Every API action, screen, and empty state must enforce these product rules.

### 4.1 Product role mapping

| Product term | Internal role | Meaning |
|--------------|---------------|---------|
| Care Organizer | `ADMIN` | Full-circle coordinator with visibility across all care receivers and all tasks |
| Caregiver | `MEMBER` | Supporting participant with explicit receiver-by-receiver access |
| Care Receiver | `RECIPIENT` | Adult receiving care; sees only their own direct task flow in this phase |

### 4.2 Visibility rules

| Visibility / access rule | Care Organizer | Caregiver | Care Receiver |
|--------------------------|----------------|-----------|---------------|
| See all care receivers in a Care Circle | yes | only if explicitly granted | no |
| See who has access to a care receiver | yes | no | yes, for themselves as a basic consent right |
| See tasks assigned to themselves | yes | yes | yes |
| See tasks assigned directly to a care receiver they support | yes | yes | only if assigned to self |
| See tasks assigned to another caregiver | yes | no | no |
| See receiver-level counts / progress | yes | yes, only for receivers they support | limited personal task flow only |
| See other care receivers in the same Care Circle | yes | only if explicitly granted | no |

### 4.3 Action rules

| Action | Care Organizer | Caregiver | Care Receiver |
|--------|----------------|-----------|---------------|
| Create a Care Circle | yes | yes (becomes organizer) | no |
| Edit circle settings | yes | no | no |
| Delete circle | yes | no | no |
| Leave circle | no if last organizer; otherwise by transfer/removal flow | yes | yes |
| Add / invite / activate care receivers | yes | no | no |
| Invite caregivers | yes | no | no |
| Decide caregiver access to specific care receivers | yes | no | no |
| Promote caregiver to organizer | yes | no | no |
| Create task | yes | yes, within granted receiver scope | no |
| Assign task | yes | yes, within granted receiver scope | no |
| Edit or reassign any task | yes | no | no |
| Edit or reassign a task they created | yes | yes | no |
| Complete own assigned task | yes | yes | yes |
| Complete another caregiver's assigned task | yes | no | no |
| Purchase premium for a care receiver | yes | no | no |

### 4.4 Consent and authorization rules

- A Care Circle may be created before the first care receiver joins.
- No tasks may be created for a care receiver until that receiver is **active**.
- A care receiver becomes active in one of two ways:
  - direct acceptance through their own account
  - authorized proxy activation recorded by a Care Organizer with attested consent and/or external authorization
- Both a Care Organizer and the Care Receiver should be able to revoke a support relationship, with an audit trail.
- Every caregiver enters the circle with **no care receiver access by default**. A Care Organizer must grant access explicitly.

**API enforcement (mutations):** circle-scoped mutations must verify role through `CircleMember` plus receiver-level access rules where relevant. Public auth bootstrap endpoints remain unauthenticated. Product-specific receiver consent and proxy activation rules require additional contract work before full implementation.

**API enforcement (reads):** GET endpoints require authenticated bearer tokens. Circle-scoped reads must enforce both membership and receiver-level visibility, not just circle membership.

**UI enforcement:** hide or disable affordances the user cannot perform. Do not rely on API `403` as the only gate.

---

## 5. Core Features

### 5.1 Care Circles

- A Care Circle is the top-level workspace for **one family**.
- A Care Circle may include one or more care receivers.
- A Care Circle contains:
  - Care Organizers
  - Caregivers
  - one or more care receiver records
  - receiver-scoped tasks, reminders, insights, access rules, and settings
- **User-facing language:** the app should say `Care Circle`, not `Group`.
- **Settings are per circle:** archive window, care receiver list, caregiver access, invite state, and future notification preferences belong to the circle. Personal account data belongs to the user profile.
- **Multi-circle model:** one CareLoop user may belong to up to **3 Care Circles total**, mainly to support separate family branches or households.

### 5.1.1 Care receivers inside a Care Circle

- Every Care Circle should be centered around at least one care receiver.
- A Care Circle can include multiple people receiving care.
- Each care receiver may:
  - use the app directly with their own account
  - start as a draft profile and activate later
  - be activated by proxy with recorded authorization
- Each logged-in Care Receiver account maps to exactly **one** care receiver profile inside the circle.
- A care receiver record should include:
  - full name
  - family relationship / label (for example `Mom`, `Dad`, `Grandma`)
  - activation state (`draft`, `invited`, `active`, `proxy-active`)
  - access list and consent metadata
  - premium entitlement status
- The Care Circle dashboard should show each active receiver as a distinct card or row with:
  - due today count
  - overdue count
  - completed today count
  - latest upcoming task
- v1 should support small-family multi-receiver coordination cleanly. The UX should be optimized for roughly **1–5 care receivers per Care Circle** even if backend storage is not hard-capped there initially.

### 5.1.2 Membership, consent, and caregiver access

- Users do not become members of a Care Circle merely because a Care Organizer typed their email.
- Care Organizer creates an invite addressed to a specific email address.
- Invite status lifecycle:
  - `PENDING`
  - `ACCEPTED`
  - `REVOKED`
  - `EXPIRED`
- Care receiver activation flow:
  1. Care Organizer creates the Care Circle.
  2. Care Organizer adds or invites the first care receiver.
  3. That care receiver becomes active either by direct acceptance or by authorized proxy activation.
  4. Only after activation can tasks be created for that receiver.
- Caregiver access flow:
  1. Care Organizer invites caregiver into the Care Circle.
  2. Caregiver joins the circle with no receiver access.
  3. Care Organizer explicitly grants access to one, many, or all care receivers in that circle.
- If a caregiver is restricted from a care receiver, they should see **nothing at all** about that receiver or those tasks.
- Receivers should be able to see who has access to them as a basic consent right, not a premium feature.
- If the invitee already belongs to 3 Care Circles, acceptance must fail with a clear error until they leave another one.

### 5.1.3 Multi-circle operations

- A user has one **active Care Circle** at a time in the app session.
- After authentication, organizers and caregivers should first land on a **Care Circle list** screen that shows memberships plus pending invites.
- Opening a Care Circle from that list should take the user to a **Care Circle dashboard** screen, not directly into a sub-surface. The dashboard should expose explicit operations such as:
  - task board
  - caregivers and access
  - care receivers
  - circle settings
  - organizer insights
- Dashboard, receiver list, task list, caregiver access, and settings are always scoped to the active Care Circle.
- Joining a second or third Care Circle does not remove access to existing ones.
- Creating or accepting a fourth Care Circle must fail with a clear product error explaining the 3-circle limit.
- Switching circles must reload care receivers, tasks, members, permissions, and settings before the user continues working.
- The app should persist the most recently used active Care Circle across relaunch.
- Push/deep-link task opens must switch into the task's owning Care Circle before presenting that task.

### 5.2 Task Management

- Tasks have:
  - title
  - notes
  - due date
  - priority (`LOW / NORMAL / HIGH / URGENT`)
  - status
  - assignee
  - owning Care Circle
  - target care receiver
  - recurrence configuration (optional)
- Every task should belong to exactly one Care Circle.
- Every task should belong to exactly one care receiver.
- Tasks may be created only for care receivers who are `active` or `proxy-active`.
- Status flow: `PENDING → IN_PROGRESS → DONE` (or `SKIPPED`)
- Care Organizers and Caregivers can create tasks.
- Care Receivers cannot create tasks in this phase.
- Care Organizers can assign tasks across any receiver in the circle.
- Caregivers can assign tasks only inside the scope of receivers they support, and only to:
  - themselves
  - the care receiver
  - another caregiver who also supports that receiver
- Caregivers can edit or reassign only tasks they created.
- A caregiver cannot directly complete another caregiver's assigned task.
- Overdue tasks (`dueAt < now`, `status != DONE`) are highlighted in red.
- Completed and skipped tasks remain visible in a `Completed` section until the Care Circle's `archiveAfterDays` window expires. After that they are archived server-side and excluded from the main task feed.
- Visibility rules for tasks:
  - tasks assigned to a caregiver are visible to the Care Organizer and the assigned caregiver only
  - other caregivers do not see them
  - the care receiver does not see them
  - tasks assigned directly to a care receiver are visible to the Care Organizer, caregivers who support that receiver, and that care receiver
- The dashboard must support:
  - receiver cards
  - per-receiver filtered task views
  - receiver-aware counts and status summaries

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
- Basic one-time tasks and basic reminders belong in the free tier.
- Advanced recurrence belongs to the premium entitlement scope for that care receiver.

### 5.2.2 Organizer completion insights

- Care Organizers should be able to see whether care work is actually getting done over time.
- Each Care Circle should expose an organizer-only insights view or dashboard module.
- Minimum insight charts:
  - tasks completed per day over the last 7 / 30 days
  - completion rate by care receiver
  - overdue vs completed trend
  - top active caregivers by completed task count
- These charts should be scoped to the active circle and, where relevant, filterable by care receiver.
- This is not just vanity analytics; it helps the organizer identify whether coordination is working and where follow-through is slipping.
- Premium insights should only unlock inside the scope of the paid care receiver entitlement.

### 5.3 Reminder Escalation

**Scheduler ownership:** `node-cron` job inside the API process. One job per server instance. Not distributed — acceptable for Sprint 1 scale.

**Timezone source:** Stored on the `User` record as an IANA timezone string (e.g. `America/New_York`). **Capture mechanism:** iOS auto-detects `TimeZone.current.identifier` at onboarding and immediately calls `PATCH /users/:id/timezone`. No user-facing picker in Sprint 1. **Fallback:** if auto-detect returns empty, default to `America/New_York`. Used for digest scheduling only. Reminder offsets (15 min before due) are always UTC-relative.

**Reminder creation:** When a task is saved with a `dueAt`, a `Reminder` record is created with `scheduledAt = dueAt - 15 minutes`. Cron polls every minute for reminders where `scheduledAt <= now AND status = PENDING`.

**Escalation logic:**

1. Cron fires reminder to the assigned person first
2. Cron checks again after the escalation window if task still not `DONE`
3. Escalation notifies the Care Organizer and the relevant supporting caregivers for that care receiver
4. Reassignment remains under organizer control; escalation is awareness, not automatic takeover

**Push-to-email fallback:** If the targeted user has no `pushToken`, skip push and send email directly. If Resend fails, log and mark `Reminder.status = FAILED` — no retry in Sprint 1.

**Idempotency:** Cron checks `Reminder.status` before sending. A reminder with `status != PENDING` is skipped. Prevents double-sends on process restart.

### 5.4 Daily Digest

**Schedule:** Cron runs at the top of every hour. For each user, if their local hour (per stored timezone) equals 18 (6pm), send digest.

**Content:** Tasks due today (not done), overdue tasks, and tasks completed today, grouped by care receiver within that user's visibility scope.

**Delivery:** Resend email, plain HTML. If Resend fails, log and skip — no retry in Sprint 1.

**Idempotency:** Store `DigestLog { userId, date }` (date = YYYY-MM-DD in user's timezone). Skip if record already exists for today.

### 5.5 Push Notifications

- Task reminders (15 min before due)
- Escalation alerts (task overdue, sent to the Care Organizer and relevant supporting caregivers)
- Task assignment notifications
- Invite notifications
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
- After authentication, the app should check for pending invites matching the authenticated email identity and surface them before sending the user into normal circle selection.
- Transport auth is bearer-token based in the current local build. Account auth issues a first-party CareLoop access token, and all protected reads/mutations execute in the authenticated user context.
- Signing out revokes the current bearer-token version server-side and clears local Keychain/session state in the iOS app.
- **Local/dev mode:** social sign-in may complete via provider-returned profile payload while provider credentials are still being finalized. Production mode must validate provider tokens or callback exchanges before identity creation.
- **Session restore (current implementation):** the iOS app persists `userId` and last attached `circleId`. On relaunch:
  - organizers and caregivers restore into their last active Care Circle if possible
  - care receivers restore into their own personal care flow

---

## 6. API Contract

**Base URL (dev):** `http://localhost:3000`

**Base URL (prod):** TBD — pending deployment

**Auth:** `Authorization: Bearer <accessToken>` required on all protected endpoints. Public endpoints are `/health`, `POST /auth/signup`, `POST /auth/login`, `POST /auth/social`, `POST /auth/forgot-password/request`, `POST /auth/forgot-password/verify`, `POST /auth/forgot-password/reset`, `GET /auth/oauth/:provider/start`, and `GET|POST /auth/oauth/:provider/callback`.

**Content-Type:** `application/json`

### Standard Error Shape

```json
{ "error": "string" }
```

| Status | Meaning                                        |
|--------|------------------------------------------------|
| 400    | Validation failure — missing or invalid field  |
| 401    | Missing or invalid bearer token                |
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
| POST   | /auth/signup                | none | any  |
| POST   | /auth/login                 | none | any  |
| POST   | /auth/social                | none | any  |
| POST   | /auth/logout                | bearer | authenticated |
| GET    | /auth/oauth/:provider/start | none | any  |
| GET    | /auth/oauth/:provider/callback | none | any |
| POST   | /auth/oauth/:provider/callback | none | any |
| POST   | /auth/forgot-password/request | none | any |
| POST   | /auth/forgot-password/verify  | none | any |
| POST   | /auth/forgot-password/reset   | none | any |
| POST   | /users                      | bearer | authenticated  |
| GET    | /users/me                   | bearer | authenticated |
| GET    | /users/by-email             | bearer | authenticated |
| GET    | /users/:id                  | bearer | self |
| PATCH  | /users/:id/push-token       | bearer | self |
| PATCH  | /users/:id/timezone         | bearer | self |
| POST   | /users/:id/session          | bearer | self |

**POST /auth/signup — body:**

```json
{ "email": "string", "name": "string", "password": "string (min 8)", "phone": "string?" }
```

**POST /auth/signup — response 201:**

```json
{
  "method": "PASSWORD",
  "accessToken": "string",
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
- Normalizes provider names case-insensitively to `GOOGLE`, `FACEBOOK`, or `APPLE`; unsupported provider names fail with `400`
- Links to an existing CareLoop user by provider identity first, then by email
- Creates a new CareLoop user on first sign-in if no linked user exists
- Local/dev fallback profile payloads are rejected in production mode; production requires provider token validation or OAuth callback exchange

**POST /auth/social — response 200:**

```json
{
  "method": "GOOGLE|FACEBOOK|APPLE",
  "accessToken": "string",
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

**GET /users/me — response 200:** same shape as `GET /users/:id`.

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

**`GET /users/:id` rule:** this endpoint is authenticated and self-only. The authenticated CareLoop user may fetch only their own profile and memberships. No admin cross-user profile read path is introduced in v1.

**PATCH /users/:id/push-token — body:** `{ "pushToken": "string" }`

**PATCH /users/:id/timezone — body:** `{ "timezone": "string (IANA)" }`

Both PATCH endpoints return the updated user object.

**POST /users/:id/session — body:** `{ "circleId": "string?" }` (if omitted, resolved from first membership)

**POST /users/:id/session — response 200:** `{ "logged": true }` if a new `APP_SESSION` event was recorded; `{ "logged": false }` if already logged today.

---

### Care Circles (legacy API paths still use `/circles`)

| Method | Endpoint                                 | Auth | Role          |
|--------|------------------------------------------|------|---------------|
| POST   | /circles                                 | bearer | authenticated |
| GET    | /circles/:id                             | bearer | member        |
| PATCH  | /circles/:id                             | bearer | admin         |
| DELETE | /circles/:id                             | bearer | admin         |
| POST   | /circles/:id/recipients                  | bearer | admin         |
| PATCH  | /circles/:id/recipients/:recipientId     | bearer | admin         |
| DELETE | /circles/:id/recipients/:recipientId     | bearer | admin         |
| POST   | /circles/:id/invitations                 | bearer | admin         |
| POST   | /invitations/:inviteId/accept            | bearer | authenticated |
| DELETE | /circles/:id/invitations/:inviteId       | bearer | admin         |
| DELETE | /circles/:id/members/:memberId           | bearer | admin         |
| PATCH  | /circles/:id/members/:memberId/role      | bearer | admin         |

**POST /circles — current local body:**

```json
{
  "name": "string (required)",
  "firstRecipientName": "string (required)",
  "archiveAfterDays": "number? (default: 7, min: 1, max: 30)"
}
```

Creator comes from the authenticated bearer token and is automatically added as Admin. Legacy callers may still send `creatorId`, but it must match the authenticated user. Creating a fourth Care Circle for the same user must return a clear `400` limit error. Response 201 returns full group object (see GET response).

**Product contract note:** the target Care Circle setup flow should support creating a circle first, then adding or inviting the first care receiver, with task creation blocked until that receiver becomes `active` or `proxy-active`. The current local contract still compresses this into `firstRecipientName` and should be treated as transitional.

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

**POST /circles/:id/recipients — current local body:**

```json
{ "name": "string (required)", "label": "string?", "isPrimary": "boolean?" }
```

Adds another care recipient profile inside the Care Circle.

**Product contract note:** this endpoint needs a follow-up evolution to support `draft`, `invited`, `active`, and `proxy-active` receiver states plus consent metadata and explicit access-list behavior.

**POST /circles/:id/invitations — current local body:**

```json
{
  "userId": "admin-user-id",
  "email": "string (required)",
  "role": "MEMBER|ADMIN (default MEMBER)"
}
```

Creates a pending invite. Admin may invite another caregiver directly as `ADMIN` if desired. Invite acceptance, not invite creation, creates the membership row.

**Product contract note:** the current local API mainly models caregiver or admin invites. The target product model also needs explicit care receiver invite / activation flows and caregiver-to-receiver access grants.

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
| POST   | /circles/:circleId/tasks                  | bearer | member              |
| GET    | /circles/:circleId/tasks                  | bearer | member              |
| PATCH  | /circles/:circleId/tasks/:taskId          | bearer | member (limited)    |
| DELETE | /circles/:circleId/tasks/:taskId          | bearer | member (own)/admin  |

**POST /circles/:circleId/tasks — body:**

```json
{
  "title": "string (required, max 200 chars)",
  "notes": "string? (max 1000 chars)",
  "dueAt": "ISO8601?",
  "priority": "LOW | NORMAL | HIGH | URGENT (default: NORMAL)",
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

Creator comes from the authenticated bearer token. Legacy callers may still send `creatorId`, but it must match the authenticated user. If `dueAt` is set, a `Reminder` is created at `dueAt - 15 minutes`. Response 201 returns full task object.

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

**PATCH — patchable fields by product role (mapped internally to `ADMIN` / `MEMBER`):**

| Field                                | Care Organizer | Caregiver      |
|--------------------------------------|----------------|----------------|
| status                               | yes            | yes            |
| title, notes, dueAt, priority        | yes            | own tasks only |
| assigneeId                           | yes            | no             |
| recipientId                          | yes            | no             |

Errors: `403` if a Caregiver tries to edit another user's task or reassign; `404` if task not found in circle.

---

### Events

| Method | Endpoint                      | Auth | Role   |
|--------|-------------------------------|------|--------|
| GET    | /circles/:circleId/events     | bearer | member |

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

- A user can belong to at most 3 Care Circles
- A Care Circle can contain multiple care recipients
- Recurring tasks should be modeled as a series/template plus individual occurrences for completion history
- Care Circle invites are accepted after auth; invite creation alone does not create a membership
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

1. **Authentication** — login, sign up, forgot-password, and Google/Facebook/Apple entry points using backend-owned OAuth start/callback routes
2. **Invite Resolution and Care Circle List** — authenticated root for Care Organizers and Caregivers; shows pending invites plus current Care Circle memberships
3. **Care Circle Setup** — create a Care Circle, then add or invite the first care receiver; task creation remains blocked until that receiver becomes `active` or `proxy-active`
4. **Care Receiver Activation** — explicit direct-accept or organizer-recorded proxy activation flow with consent context
5. **Care Circle Dashboard** — default landing for Care Organizers and Caregivers inside an active circle; shows care receiver cards, due / overdue / completed counts, premium state by receiver, and quick actions
6. **Care Receiver Home** — default landing for a logged-in Care Receiver in this phase; full-screen next due task plus limited personal task flow
7. **Receiver Task List** — task list scoped to the active Care Circle and then to a selected care receiver; split into `Active` and `Completed`
8. **Task Detail** — editable task surface with separate sections for title, notes, due date, priority, recurrence, assignee, receiver, and status; rendered according to role permissions
9. **New Task** — title, notes with health disclaimer, due date, priority, receiver picker, recurrence controls, assignee picker, and premium-aware reminders / automation affordances
10. **People and Access** — caregivers, organizers, pending invites, and receiver-by-receiver access grants
11. **Care Receiver Management** — add, invite, activate, rename, reorder, or remove care receivers inside the active Care Circle; organizer-only
12. **Organizer Insights** — completion charts, overdue trends, caregiver activity, and receiver-level insights; organizer-only and premium-scoped per receiver
13. **Care Circle Settings** — edit circle name, archive retention, manage invite state, and future circle-level policies
14. **Account Settings** — account info, all Care Circles, sign out, notification state, and billing surfaces when implemented

### Navigation

- Organizer / Caregiver root:
  - Authentication -> Invite Resolution / Care Circle List -> Care Circle Dashboard -> Receiver Task List -> Task Detail
- Care Receiver root:
  - Authentication / invite acceptance -> Care Receiver Home -> personal task detail / personal task history
- Modal or push flows:
  - New Task
  - People and Access
  - Care Receiver Management
  - Organizer Insights
  - Care Circle Settings
- Active Care Circle state must always be visible for Care Organizers and Caregivers and must scope all task, receiver, access, and settings operations.
- This phase does **not** require a fixed tab-bar information architecture. Role-based flows are more important than forcing identical navigation for every role.

---

## 10. Success Metrics and Required Analytics Events

Metrics below describe the product truth for the next implementation phase. Event names may continue to use legacy `circle` wording internally until the analytics contract is migrated.

### 10.1 Core product metrics

| Metric | Target (Day 30) | Required Event |
|--------|-----------------|----------------|
| Care Circles created | 10 | `CIRCLE_CREATED` |
| Active care receivers per active circle | >=1 | `RECIPIENT_CREATED` / activation event |
| Tasks created per active care receiver per week | 5+ | `TASK_CREATED` |
| Task completion rate | >70% | `TASK_COMPLETED` |
| D7 retention | >50% | `APP_SESSION` |
| Invite acceptance rate | >60% | `INVITE_ACCEPTED` |
| Recurring task adoption | >25% of active circles | `TASK_SERIES_CREATED` |
| Reminder escalation rate | <20% of due tasks | `REMINDER_ESCALATED` |

**Implementation rule:** every route that triggers a metric-backed action in the active phase must log the corresponding event before returning.

**D7 retention definition:** a user made at least one API call on Day 0 and at least one on Day 7 (±1 day), measured via `APP_SESSION`.

**APP_SESSION capture:** iOS calls `POST /users/:id/session` on every foreground via `scenePhase == .active`. The API deduplicates to one session event per user per UTC day and should include active Care Circle context when relevant.

**Deferred metric:** daily digest open rate remains desirable, but `DIGEST_OPENED` stays deferred until webhook-backed email open tracking is implemented.

### 10.2 Monetization metrics

These metrics become required once receiver-scoped premium entitlements are live:

| Metric | Target (Day 60) | Required Event |
|--------|-----------------|----------------|
| Premium upgrade rate on eligible receivers | >15% | `SUBSCRIPTION_STARTED` |
| Receiver-scoped renewal retention | >85% | `SUBSCRIPTION_RENEWED` |
| Premium receiver insights usage | >35% of premium receivers weekly | `INSIGHTS_VIEWED` |
| Upgrade prompt conversion from locked premium affordances | >10% | `PAYWALL_VIEWED` + purchase event |

### 10.3 Pricing and entitlements

**Business model:** free tier plus receiver-scoped premium entitlements.

This product should **not** use per-caregiver seat pricing. Premium is purchased by a Care Organizer for a specific care receiver, and premium features apply only inside that receiver's scope.

**Free tier — Basic Care Receiver**

- 1 active care receiver
- 1 Care Organizer plus 1 Caregiver
- the care receiver account does **not** count toward the caregiver team limit
- basic tasks
- basic reminders
- basic invite acceptance
- basic task completion
- no advanced receiver-scoped insights
- no advanced recurrence / accountability automation
- no premium receiver-level access-management features beyond core consent rights

**Premium entitlement — one Premium Care Receiver**

- purchased by a Care Organizer only
- smallest billable unit is one care receiver
- entitlement applies only to that receiver's workflow
- all users who have access to that receiver receive the premium features for that receiver
- premium receiver may have unlimited Caregivers supporting them
- premium unlocks:
  - advanced reminders and escalation automation
  - advanced recurrence and accountability tools
  - richer coordination controls for that receiver
  - receiver-scoped organizer insights
  - additional premium UX and reporting tied to that receiver

**Multi-receiver billing rule**

- families may keep one active care receiver on the free tier with limited functionality
- if a Care Circle has multiple care receivers, premium must be unlocked separately for each receiver that needs premium functionality
- a premium entitlement for Receiver A does **not** unlock premium for Receiver B
- shared-looking premium surfaces must still filter to the paid receiver's scope only

**Downgrade rules**

- do not lock users out of historical data
- keep Care Circles readable
- keep invite acceptance and basic task completion usable
- freeze only premium creation, premium automation, premium insights, and premium team-scale actions when entitlement is absent
- if the family exceeds free-tier limits after downgrade, existing data remains visible but new premium-only actions must be blocked until usage is reduced or premium is restored

**Purchase mechanics**

- iOS monetization should use App Store in-app purchase via StoreKit 2
- entitlements must be stored server-side and mapped to receiver-level access, not just device-local receipt state
- restore purchases must be supported
- receipt verification and entitlement refresh must be safe across multiple devices in the same Care Circle

**Paywall strategy**

- do not paywall invite acceptance
- do not paywall basic task completion
- do not paywall the core collaborative loop for one basic care receiver
- use a mix of visible locked premium features plus soft / hard upgrade prompts as families grow into more complexity

### 10.4 Monetization items locked

- free forever for one care receiver with limited functionality
- premium is purchased per care receiver, not per caregiver seat and not per whole circle
- only a Care Organizer can purchase premium for a receiver
- all users with access to that receiver benefit from that receiver's premium features
- premium receiver unlocks unlimited Caregivers for that receiver
- premium should unlock a bundle of value, not a single isolated feature:
  - multiple receivers in a family workflow
  - better accountability
  - more coordination controls
  - richer insights

### 10.5 Monetization items still open

- whether Care Circle count itself is limited by plan, or only receiver-level premium capability is monetized
- pricing numbers for monthly and annual plans
- whether a trial exists and, if so, its exact duration and trigger
- final paywall copy and upgrade timing
- whether any premium feature should unlock at the whole-circle level instead of strictly receiver scope
- final server-side entitlement object design and billing reconciliation policy

---

## 11. Next Implementation Phases

This is a convergence roadmap for the **existing** codebase, not a greenfield build plan.

**Permanently out of scope for this phase:** clinic / EHR integration, medical records, chat or social-network behavior, Android, and web app.

### Phase 0 — Baseline and test harness

- fix stale iOS tests so `xcodebuild test` runs green again
- add a dedicated iOS UI test target for core journeys
- verify backend smoke tests for auth, Care Circle, invite, and task routes
- document current client/server contract mismatches before feature work resumes

### Phase 1 — Entry flow and Care Circle setup

- authentication
- pending invite resolution
- Care Circle list
- create Care Circle
- add or invite first care receiver
- block task creation until receiver activation

### Phase 2 — Dashboard and task core

- organizer / caregiver Care Circle dashboard
- care receiver home
- receiver-scoped task list
- new task
- task detail
- recurrence and completion flows

### Phase 3 — Access control and multi-receiver operations

- caregiver receiver-access grants
- care receiver consent and proxy activation
- multi-receiver Care Circle UX
- people and access surface
- care receiver management
- organizer insights

### Phase 4 — Premium entitlement and launch hardening

- per-care-receiver premium entitlements
- StoreKit 2 purchase and restore
- server-side entitlement sync
- premium-aware insights and automation
- privacy policy, incident response, TestFlight, and launch QA

---

## 12. Decisions Locked

- **Shared workspace term:** user-facing term is `Care Circle`
- **Role terms:** `Care Organizer`, `Caregiver`, and `Care Receiver`
- **Family model:** one Care Circle represents one family, even if that family supports multiple care receivers
- **Multi-circle membership:** allowed, capped at 3 total Care Circles per user
- **Care receiver requirement:** every Care Circle is centered on at least one care receiver
- **Receiver activation rule:** tasks may be created only for `active` or `proxy-active` care receivers
- **Consent rule:** receiver participation is consent-based; proxy activation requires organizer attestation and/or external authorization
- **Caregiver access rule:** caregivers enter with no receiver access and must be explicitly assigned by a Care Organizer
- **Organizer visibility:** Care Organizers always have full circle-wide visibility and management across all care receivers
- **Caregiver visibility:** caregivers see only receivers they are granted, their own tasks, receiver-assigned tasks for supported receivers, and non-attributed receiver-level progress
- **Receiver visibility:** care receivers see only their own direct task flow in this phase
- **Task ownership:** every task belongs to exactly one Care Circle and exactly one care receiver
- **Task creation:** Care Organizers and Caregivers can create tasks; Care Receivers cannot
- **Task assignment:** Caregivers may assign only within a supported receiver's scope
- **Cross-caregiver privacy:** one caregiver does not automatically see another caregiver's assigned tasks
- **Escalation model:** overdue tasks remind the assignee first, then notify the organizer and relevant supporting caregivers; no silent auto-takeover
- **Recurring tasks:** advanced recurrence is premium-scoped; recurring task history must preserve individual occurrences
- **Completed task lifecycle:** `DONE` and `SKIPPED` tasks remain visible until `archiveAfterDays` expires, then archive server-side
- **Free-tier philosophy:** basic collaboration for one care receiver remains usable without payment
- **Billing unit:** one premium care receiver is the smallest billable unit
- **Premium purchaser:** only a Care Organizer may purchase premium for a receiver
- **Premium scope:** premium features apply only inside the paid receiver's scope, not automatically to the whole Care Circle
- **Caregiver team limit:** free tier supports one Care Organizer plus one Caregiver; premium receiver unlocks unlimited Caregivers for that receiver
- **Health content in notes:** prohibited via UI disclaimer; accepted risk remains documented in Section 8
- **Auth transport:** bearer-token transport is active in the current local build
- **Provider auth:** Google, Facebook, and Apple remain valid product entry points, but production credentials and callback approvals are still required before launch

---

## 13. Future Phases

### 13.1 Minor Care Receivers

CareLoop currently requires all members, caregivers, and care receivers to be **18 years or older** in this phase.

Supporting minors later would require:

- parent or guardian approval flow
- age-specific privacy handling
- guardian-linked account model
- simplified receiver UI
- age / guardian fields in the schema and invite flow

### 13.2 Richer Care Receiver Experience

Not in this phase, but likely next:

- lightweight personal dashboard instead of next-task-only home
- broader receiver awareness of family support without exposing private caregiver workflow
- richer personal history, progress, and reassurance surfaces

### 13.3 Professional Caregiver Expansion

The product is family-first in this phase. A later phase may support:

- professional caregiver participation
- finer-grained access / audit policies
- organization-level billing and reporting

---

## 14. Technology Stack

Full decision doc: `docs/tech-stack.md`

| Layer | Current / target decision |
|-------|---------------------------|
| iOS app | SwiftUI, iOS 16+ |
| Backend runtime | Node.js |
| API server | Fastify |
| ORM / schema | Prisma |
| Database | PostgreSQL |
| Email | Resend |
| Push | APNs directly |
| Background jobs | `node-cron` in-process |
| Auth | CareLoop account auth + provider OAuth -> bearer tokens |
| Billing | StoreKit 2 + server-side entitlement sync |
| Analytics | Event table first; PostHog later |
| Error tracking | Sentry before external beta |

**Architecture constraints**

- keep the current Fastify + Prisma + PostgreSQL stack for the next implementation phase
- do not change backend stack while aligning product behavior, access rules, and tests
- Prisma remains the schema source of truth
- Fastify owns circle, receiver, invite, task, access, and entitlement logic
- receiver-scoped premium entitlements must be enforced server-side, not trusted from device state alone
- keep REST endpoints and evolve them toward the product contract rather than replacing them wholesale
- no medical-record storage product and no file-attachment platform in this phase

---

## 15. Delivery Plan

Implementation should move in tested vertical slices, not isolated screen paint work.

### 15.1 Required testing baseline

- iOS app must build locally through Xcode
- current unit tests must run green before new feature work continues
- add iOS UI coverage for:
  - sign up / log in
  - Care Circle list -> create / join -> dashboard
  - create recurring task -> complete -> deep-link back from reminder
- backend smoke coverage must exist for auth, Care Circle, invite, receiver activation, and task routes

### 15.2 Slice order

1. baseline and test harness
2. authentication
3. Care Circle entry and setup
4. dashboard and task core
5. people, access, and receiver management
6. notifications and deep links
7. premium entitlement and billing

### 15.3 Gate rule

No slice is done until:

- app build passes
- targeted automated tests pass
- backend smoke checks pass
- simulator manual checklist is complete
- any device-only item is explicitly signed off or left as a documented blocker

### 15.4 Agent ownership

| Domain | Owner |
|--------|-------|
| planning and task graph | `shepherd` |
| product and UX convergence | `atlas`, `prism` |
| iOS implementation | `swift` |
| backend contract and API work | `core` |
| environment / runtime support | `forge` |
| code quality gate | `auditor` |
| simulator and Xcode verification | `sentinel` |
| privacy / consent / release gate | `warden` |
| final prioritization and release decision | `nexus` |
