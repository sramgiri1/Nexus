# NEXUS CareLoop Backend Controlled Validation

## Metadata

- Generated at: 2026-05-08T01:17:59.053Z
- Mode: local-private
- Validation HEAD: (see git log)
- Note: Validation HEAD is the commit when the report was generated.

## Command

- Command ID: careloop-backend-npm-test
- Command: npm test
- Working directory: projects/careloop

## Preflight

- Status: WARNING
- Script exists: true
- Dependencies: READY
- node_modules present: true
- Lockfile present: true
- DB requirement detected: false
- Network requirement detected: false

### Preflight Warnings

- Forbidden environment variables present (will be ignored by command): ANTHROPIC_API_KEY

## Execution

- Status: PASS
- Exit code: 0
- Duration: 1041ms
- Output hash: edd14ca421b9d837
- Mutation detected: false

### Stdout (redacted preview)

```

> careloop-api@0.1.0 test
> node --test test/sprint2.test.js

▶ auth routes
  ✔ POST /auth/signup creates a password-backed user (61.299458ms)
  ✔ POST /auth/login rejects wrong password (63.166667ms)
  ✔ POST /auth/login returns the matching user (62.951542ms)
  ✔ POST /auth/social creates a user and identity from local fallback payload (4.494666ms)
  ✔ POST /auth/login includes pending invitations for the authenticated email (62.67375ms)
  ✔ GET /auth/oauth/google/start redirects to Google's consent screen (4.039167ms)
  ✔ verifyOAuthState returns the signed callback payload (0.166542ms)
  ✔ forgot password request stores a reset code and returns debugCode in local dev (36.060333ms)
  ✔ forgot password verify/reset updates password (93.094375ms)
  ✔ forgot password reset revokes previously issued access tokens (120.977958ms)
✔ auth routes (509.764792ms)
▶ deliverTaskNotification
  ✔ returns NONE — user not found (0.175959ms)
  ✔ returns NONE — user has no push token and no email (0.099625ms)
  ✔ simulates PUSH — user has push token, APNs not configured (0.096083ms)
  ✔ simulates EMAIL fallback — no push token, RESEND not configured (0.084333ms)
  ✔ uses escalation content type without crashing (0.059125ms)
  ✔ uses assignment content type without crashing (0.045708ms)
✔ deliverTaskNotification (0.653333ms)
▶ circle membership management
  ✔ POST /circles rejects creating a fourth circle for the same user (4.359ms)
  ✔ POST /circles/:id/members rejects joining a fourth circle (5.069542ms)
  ✔ POST /circles/:id/members/invite creates a pending invitation (2.708125ms)
  ✔ POST /invitations/:inviteId/accept creates membership after auth (2.595167ms)
  ✔ POST /invitations/:inviteId/decline marks the invite declined (2.37725ms)
  ✔ supports multi-user signup, invite acceptance, and self-join flows (91.159166ms)
  ✔ PATCH /circles/:id/members/:memberId/role lets an admin promote a caregiver (3.72675ms)
  ✔ DELETE /circles/:id/members/:memberId lets an admin remove another member (2.588667ms)
  ✔ POST /circles/:id/recipients lets an admin add another care recipient (2.1495ms)
  ✔ POST /circles/:id/recipients/reorder updates recipient order and primary recipient (2.51275ms)
  ✔ DELETE /circles/:id/recipients blocks removing the last care recipient (2.3085ms)
✔ circle membership management (121.826458ms)
▶ sendReminderNotifications
  ✔ delivers to all user IDs and returns one result per user (0.133333ms)
  ✔ handles empty userIds array (0.038166ms)
  ✔ returns NONE for users with no contact info (0.044792ms)
✔ sendReminderNotifications (0.260709ms)
▶ sendDailyDigest
  ✔ returns NONE when user has no email (0.071959ms)
  ✔ simulates send when RESEND not configured (0.068375ms)
  ✔ digest is idempotent — same function call returns simulated regardless of content (0.061166ms)
  ✔ includes task data in digest HTML (no crash with real task objects) (0.040708ms)
✔ sendDailyDigest (0.296958ms)
▶ PATCH /users/:id/push-token
  ✔ returns 200 with updated user including pushToken (3.124917ms)
  ✔ persists push token in DB (0.53775ms)
  ✔ returns 400 when pushToken is absent from body (0.329666ms)
  ✔ returns 401 when authorization header is missing (0.169ms)
  ✔ returns 401 when bearer token is invalid (0.198ms)
✔ PATCH /users/:id/push-token (7.464834ms)
▶ auth hardening and protected reads
  ✔ GET /users/me returns the authenticated user context (2.456292ms)
  ✔ prevents cross-user profile and push-token mutation (2.148208ms)
  ✔ prevents APP_SESSION writes into a foreign circle (2.117875ms)
  ✔ prevents non-members from reading circle data and members from reading admin-only insights (2.900917ms)
✔ auth hardening and protected reads (9.730875ms)
▶ POST /circles/:circleId/tasks — Reminder creation
  ✔ creates Reminder scheduled at dueAt minus 15 minutes (1.140625ms)
  ✔ does NOT create a Reminder when task has no dueAt (0.479ms)
  ✔ logs TASK_CREATED event for every task (0.361542ms)
  ✔ returns 400 when title is missing (0.27825ms)
  ✔ return
... [truncated at 4000 chars, total 5127]
```

## Safety

- Provider calls: false
- Network calls: false
- DB access: false
- API server: false
- Dependency install: false
- Project mutation: false

## Result: PASS

## Warnings

- Forbidden environment variables present (will be ignored by command): ANTHROPIC_API_KEY
