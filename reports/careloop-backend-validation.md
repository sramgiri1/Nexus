# NEXUS CareLoop Backend Controlled Validation

## Metadata

- Generated at: 2026-05-08T09:32:17.735Z
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
- Duration: 1090ms
- Output hash: e8b6de0bfeff3772
- Mutation detected: false

### Stdout (redacted preview)

```

> careloop-api@0.1.0 test
> node --test test/sprint2.test.js

▶ auth routes
  ✔ POST /auth/signup creates a password-backed user (64.148ms)
  ✔ POST /auth/login rejects wrong password (65.538ms)
  ✔ POST /auth/login returns the matching user (64.438834ms)
  ✔ POST /auth/social creates a user and identity from local fallback payload (4.114292ms)
  ✔ POST /auth/login includes pending invitations for the authenticated email (63.123833ms)
  ✔ GET /auth/oauth/google/start redirects to Google's consent screen (3.914666ms)
  ✔ verifyOAuthState returns the signed callback payload (0.173834ms)
  ✔ forgot password request stores a reset code and returns debugCode in local dev (36.05325ms)
  ✔ forgot password verify/reset updates password (92.769875ms)
  ✔ forgot password reset revokes previously issued access tokens (121.373583ms)
✔ auth routes (516.481625ms)
▶ deliverTaskNotification
  ✔ returns NONE — user not found (0.175833ms)
  ✔ returns NONE — user has no push token and no email (0.101125ms)
  ✔ simulates PUSH — user has push token, APNs not configured (0.099958ms)
  ✔ simulates EMAIL fallback — no push token, RESEND not configured (0.092625ms)
  ✔ uses escalation content type without crashing (0.058083ms)
  ✔ uses assignment content type without crashing (0.042583ms)
✔ deliverTaskNotification (0.657209ms)
▶ circle membership management
  ✔ POST /circles rejects creating a fourth circle for the same user (4.285458ms)
  ✔ POST /circles/:id/members rejects joining a fourth circle (5.615666ms)
  ✔ POST /circles/:id/members/invite creates a pending invitation (2.854792ms)
  ✔ POST /invitations/:inviteId/accept creates membership after auth (2.639084ms)
  ✔ POST /invitations/:inviteId/decline marks the invite declined (2.484917ms)
  ✔ supports multi-user signup, invite acceptance, and self-join flows (98.084542ms)
  ✔ PATCH /circles/:id/members/:memberId/role lets an admin promote a caregiver (3.921458ms)
  ✔ DELETE /circles/:id/members/:memberId lets an admin remove another member (2.451666ms)
  ✔ POST /circles/:id/recipients lets an admin add another care recipient (2.172875ms)
  ✔ POST /circles/:id/recipients/reorder updates recipient order and primary recipient (3.310667ms)
  ✔ DELETE /circles/:id/recipients blocks removing the last care recipient (2.640625ms)
✔ circle membership management (130.764958ms)
▶ sendReminderNotifications
  ✔ delivers to all user IDs and returns one result per user (0.137708ms)
  ✔ handles empty userIds array (0.041292ms)
  ✔ returns NONE for users with no contact info (0.047625ms)
✔ sendReminderNotifications (0.275417ms)
▶ sendDailyDigest
  ✔ returns NONE when user has no email (0.073458ms)
  ✔ simulates send when RESEND not configured (0.070208ms)
  ✔ digest is idempotent — same function call returns simulated regardless of content (0.065416ms)
  ✔ includes task data in digest HTML (no crash with real task objects) (0.04025ms)
✔ sendDailyDigest (0.304292ms)
▶ PATCH /users/:id/push-token
  ✔ returns 200 with updated user including pushToken (3.428958ms)
  ✔ persists push token in DB (0.54875ms)
  ✔ returns 400 when pushToken is absent from body (0.333917ms)
  ✔ returns 401 when authorization header is missing (0.169ms)
  ✔ returns 401 when bearer token is invalid (0.203084ms)
✔ PATCH /users/:id/push-token (8.046875ms)
▶ auth hardening and protected reads
  ✔ GET /users/me returns the authenticated user context (2.562458ms)
  ✔ prevents cross-user profile and push-token mutation (2.408084ms)
  ✔ prevents APP_SESSION writes into a foreign circle (2.5815ms)
  ✔ prevents non-members from reading circle data and members from reading admin-only insights (2.715125ms)
✔ auth hardening and protected reads (10.387166ms)
▶ POST /circles/:circleId/tasks — Reminder creation
  ✔ creates Reminder scheduled at dueAt minus 15 minutes (1.172834ms)
  ✔ does NOT create a Reminder when task has no dueAt (0.478166ms)
  ✔ logs TASK_CREATED event for every task (0.372708ms)
  ✔ returns 400 when title is missing (0.30075ms)

... [truncated at 4000 chars, total 5135]
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
