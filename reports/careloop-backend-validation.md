# NEXUS CareLoop Backend Controlled Validation

## Metadata

- Generated at: 2026-05-08T01:00:06.761Z
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

- Status: FAIL
- Exit code: 1
- Duration: 1065ms
- Output hash: a8659e8802a0fe88
- Mutation detected: false

### Stdout (redacted preview)

```

> careloop-api@0.1.0 test
> node --test test/sprint2.test.js

▶ auth routes
  ✔ POST /auth/signup creates a password-backed user (59.789917ms)
  ✔ POST /auth/login rejects wrong password (75.863792ms)
  ✔ POST /auth/login returns the matching user (64.202167ms)
  ✔ POST /auth/social creates a user and identity from local fallback payload (4.334208ms)
  ✔ POST /auth/login includes pending invitations for the authenticated email (63.696958ms)
  ✔ GET /auth/oauth/google/start redirects to Google's consent screen (3.969ms)
  ✔ verifyOAuthState returns the signed callback payload (0.159167ms)
  ✔ forgot password request stores a reset code and returns debugCode in local dev (36.17375ms)
  ✔ forgot password verify/reset updates password (94.480625ms)
  ✔ forgot password reset revokes previously issued access tokens (120.917208ms)
✔ auth routes (524.4335ms)
▶ deliverTaskNotification
  ✔ returns NONE — user not found (0.178542ms)
  ✔ returns NONE — user has no push token and no email (0.107792ms)
  ✔ simulates PUSH — user has push token, APNs not configured (0.106375ms)
  ✔ simulates EMAIL fallback — no push token, RESEND not configured (0.090917ms)
  ✔ uses escalation content type without crashing (0.06875ms)
  ✔ uses assignment content type without crashing (0.050041ms)
✔ deliverTaskNotification (0.696042ms)
▶ circle membership management
  ✔ POST /circles rejects creating a fourth circle for the same user (4.920917ms)
  ✔ POST /circles/:id/members rejects joining a fourth circle (4.158125ms)
  ✔ POST /circles/:id/members/invite creates a pending invitation (2.831584ms)
  ✔ POST /invitations/:inviteId/accept creates membership after auth (2.563416ms)
  ✔ POST /invitations/:inviteId/decline marks the invite declined (2.626042ms)
  ✔ supports multi-user signup, invite acceptance, and self-join flows (92.168417ms)
  ✔ PATCH /circles/:id/members/:memberId/role lets an admin promote a caregiver (3.752042ms)
  ✔ DELETE /circles/:id/members/:memberId lets an admin remove another member (2.396792ms)
  ✔ POST /circles/:id/recipients lets an admin add another care recipient (2.300084ms)
  ✔ POST /circles/:id/recipients/reorder updates recipient order and primary recipient (2.434709ms)
  ✔ DELETE /circles/:id/recipients blocks removing the last care recipient (2.154417ms)
✔ circle membership management (122.60625ms)
▶ sendReminderNotifications
  ✔ delivers to all user IDs and returns one result per user (0.126459ms)
  ✔ handles empty userIds array (0.03875ms)
  ✔ returns NONE for users with no contact info (0.048833ms)
✔ sendReminderNotifications (0.2605ms)
▶ sendDailyDigest
  ✔ returns NONE when user has no email (0.071ms)
  ✔ simulates send when RESEND not configured (0.070667ms)
  ✔ digest is idempotent — same function call returns simulated regardless of content (0.060334ms)
  ✔ includes task data in digest HTML (no crash with real task objects) (0.039375ms)
✔ sendDailyDigest (0.294ms)
▶ PATCH /users/:id/push-token
  ✔ returns 200 with updated user including pushToken (5.347417ms)
  ✔ persists push token in DB (0.601917ms)
  ✔ returns 400 when pushToken is absent from body (0.341792ms)
  ✔ returns 401 when authorization header is missing (0.169791ms)
  ✔ returns 401 when bearer token is invalid (0.222ms)
✔ PATCH /users/:id/push-token (9.973ms)
▶ auth hardening and protected reads
  ✔ GET /users/me returns the authenticated user context (3.16025ms)
  ✔ prevents cross-user profile and push-token mutation (2.293083ms)
  ✔ prevents APP_SESSION writes into a foreign circle (2.128541ms)
  ✔ prevents non-members from reading circle data and members from reading admin-only insights (2.701458ms)
✔ auth hardening and protected reads (10.398167ms)
▶ POST /circles/:circleId/tasks — Reminder creation
  ✔ creates Reminder scheduled at dueAt minus 15 minutes (1.151084ms)
  ✔ does NOT create a Reminder when task has no dueAt (0.456375ms)
  ✔ logs TASK_CREATED event for every task (0.443792ms)
  ✔ returns 400 when title is missing (0.291125ms)
  ✔ returns
... [truncated at 4000 chars, total 5939]
```

## Safety

- Provider calls: false
- Network calls: false
- DB access: false
- API server: false
- Dependency install: false
- Project mutation: false

## Result: FAIL

## Warnings

- Forbidden environment variables present (will be ignored by command): ANTHROPIC_API_KEY
