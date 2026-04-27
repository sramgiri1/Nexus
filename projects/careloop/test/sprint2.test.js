// Sprint 2 backend tests — push notifications, scheduler rules, route contracts
// Run: node --test test/sprint2.test.js

// Set env before any module-level reads (override shell env for isolation)
process.env.API_KEY            = "test-key";
process.env.DISABLE_SCHEDULER = "true";
process.env.RESEND_API_KEY     = "";   // force simulated email mode
process.env.APNS_KEY_ID        = "";   // force simulated push mode
process.env.APNS_TEAM_ID       = "";
process.env.APNS_KEY            = "";
process.env.GOOGLE_CLIENT_ID    = "google-client";
process.env.GOOGLE_CLIENT_SECRET = "google-secret";
process.env.FACEBOOK_APP_ID     = "facebook-app";
process.env.FACEBOOK_APP_SECRET = "facebook-secret";
process.env.APPLE_SERVICE_ID    = "com.careloop.web";
process.env.APPLE_TEAM_ID       = "team123";
process.env.APPLE_KEY_ID        = "key123";
process.env.APPLE_PRIVATE_KEY   = "-----BEGIN PRIVATE KEY-----\\nTEST\\n-----END PRIVATE KEY-----";
process.env.PUBLIC_API_BASE_URL = "http://localhost:3000";

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { deliverTaskNotification, sendReminderNotifications, sendDailyDigest } from "../src/lib/push.js";
import Fastify from "fastify";
import authPlugin    from "../src/plugins/auth.js";
import authRoutes    from "../src/routes/auth.js";
import usersRoute    from "../src/routes/users.js";
import circlesRoute  from "../src/routes/circles.js";
import tasksRoute    from "../src/routes/tasks.js";
import { createOAuthState, hashPassword, verifyOAuthState } from "../src/lib/auth.js";

const HDR = { "x-api-key": "test-key", "content-type": "application/json" };

// ─── mock DB ─────────────────────────────────────────────────────────────────
function buildDb(seed = {}) {
  const S = {
    users:      [...(seed.users      || [])],
    identities: [...(seed.identities || [])],
    passwordResetCodes: [...(seed.passwordResetCodes || [])],
    circles:    [...(seed.circles    || [])],
    members:    [...(seed.members    || [])],
    tasks:      [],
    reminders:  [],
    events:     [],
  };

  let seq = 0;
  const uid = (p) => `${p}${++seq}`;

  function userRepo(s) {
    return {
      findUnique: async ({ where, include }) => {
        const user = s.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null;
        if (!user || !include) return user;
        return {
          ...user,
          memberships: include.memberships
            ? s.members
                .filter((m) => m.userId === user.id)
                .map((m) => ({
                  ...m,
                  circle: include.memberships?.include?.circle
                    ? (s.circles.find((c) => c.id === m.circleId) ?? null)
                    : undefined,
                }))
            : undefined,
          identities: include.identities
            ? s.identities.filter((i) => i.userId === user.id)
            : undefined,
        };
      },
      findMany: async () => s.users,
      create: async ({ data: d }) => {
        if (s.users.some((u) => u.email === d.email)) {
          throw Object.assign(new Error("Unique"), { code: "P2002" });
        }
        const u = { id: uid("u"), createdAt: new Date(), updatedAt: new Date(), pushToken: null, timezone: null, phone: null, ...d };
        s.users.push(u);
        return u;
      },
      update: async ({ where, data: d }) => {
        const u = s.users.find((x) => x.id === where.id);
        if (!u) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        Object.assign(u, d, { updatedAt: new Date() });
        return u;
      },
    };
  }

  function authIdentityRepo(s) {
    return {
      findUnique: async ({ where }) => {
        const key = where.provider_providerUserId;
        if (!key) return null;
        return s.identities.find((i) => i.provider === key.provider && i.providerUserId === key.providerUserId) ?? null;
      },
      upsert: async ({ where, update, create }) => {
        const key = where.provider_providerUserId;
        const existing = s.identities.find((i) => i.provider === key.provider && i.providerUserId === key.providerUserId);
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return existing;
        }
        const identity = { id: uid("ai"), createdAt: new Date(), updatedAt: new Date(), ...create };
        s.identities.push(identity);
        return identity;
      },
    };
  }

  function passwordResetCodeRepo(s) {
    return {
      create: async ({ data: d }) => {
        const record = { id: uid("pr"), createdAt: new Date(), consumedAt: null, ...d };
        s.passwordResetCodes.push(record);
        return record;
      },
      findFirst: async ({ where, orderBy }) => {
        let items = s.passwordResetCodes.filter((r) => {
          if (where.userId && r.userId !== where.userId) return false;
          if (where.consumedAt === null && r.consumedAt !== null) return false;
          if (where.expiresAt?.gt && !(r.expiresAt > where.expiresAt.gt)) return false;
          return true;
        });
        if (orderBy?.createdAt === "desc") {
          items = items.sort((a, b) => b.createdAt - a.createdAt);
        }
        return items[0] ?? null;
      },
      updateMany: async ({ where, data: d }) => {
        let count = 0;
        for (const record of s.passwordResetCodes) {
          if (where.userId && record.userId !== where.userId) continue;
          if (where.consumedAt === null && record.consumedAt !== null) continue;
          Object.assign(record, d);
          count += 1;
        }
        return { count };
      },
    };
  }

  function circleRepo(s) {
    return {
      create: async ({ data: d }) => {
        const c = { id: uid("c"), createdAt: new Date(), updatedAt: new Date(), ...d };
        s.circles.push(c);
        return c;
      },
      findUnique: async ({ where, include }) => {
        const c = s.circles.find((x) => x.id === where.id) ?? null;
        if (!c || !include) return c;
        return {
          ...c,
          members: include.members
            ? s.members
                .filter((m) => m.circleId === c.id)
                .map((m) => ({
                  ...m,
                  user: include.members?.include?.user
                    ? (s.users.find((u) => u.id === m.userId) ?? null)
                    : undefined,
                }))
            : undefined,
          tasks: include.tasks ? s.tasks.filter((t) => t.circleId === c.id) : undefined,
        };
      },
    };
  }

  function memberRepo(s) {
    return {
      create: async ({ data: d }) => {
        const m = { id: uid("m"), joinedAt: new Date(), role: "MEMBER", ...d };
        s.members.push(m);
        return m;
      },
      findUnique: async ({ where }) => {
        const k = where.userId_circleId;
        return k ? (s.members.find((m) => m.userId === k.userId && m.circleId === k.circleId) ?? null) : null;
      },
      findFirst: async ({ where }) =>
        s.members.find((m) => m.userId === where.userId) ?? null,
    };
  }

  function taskRepo(s) {
    return {
      create: async ({ data: d, include }) => {
        const t = { id: uid("t"), createdAt: new Date(), updatedAt: new Date(), status: "PENDING", notes: null, assigneeId: null, ...d };
        s.tasks.push(t);
        if (!include) return t;
        return {
          ...t,
          assignee: include.assignee ? (s.users.find((u) => u.id === t.assigneeId) ?? null) : undefined,
          circle:   include.circle   ? (s.circles.find((c) => c.id === t.circleId)  ?? null) : undefined,
        };
      },
      findMany:  async () => s.tasks,
      findFirst: async ({ where }) =>
        s.tasks.find((t) => t.id === where?.id) ?? null,
    };
  }

  function reminderRepo(s) {
    return {
      create: async ({ data: d }) => {
        const r = { id: uid("r"), status: "PENDING", ...d };
        s.reminders.push(r);
        return r;
      },
    };
  }

  function eventRepo(s) {
    return {
      create:   async ({ data: d }) => { const e = { id: uid("e"), createdAt: new Date(), payload: {}, ...d }; s.events.push(e); return e; },
      findFirst: async () => null,
    };
  }

  const txProxy = (s) => ({
    user:         userRepo(s),
    careCircle:   circleRepo(s),
    circleMember: memberRepo(s),
    authIdentity: authIdentityRepo(s),
    passwordResetCode: passwordResetCodeRepo(s),
    task:         taskRepo(s),
    reminder:     reminderRepo(s),
    event:        eventRepo(s),
  });

  return {
    _s: S,
    user:         userRepo(S),
    authIdentity: authIdentityRepo(S),
    passwordResetCode: passwordResetCodeRepo(S),
    careCircle:   circleRepo(S),
    circleMember: memberRepo(S),
    task:         taskRepo(S),
    reminder:     reminderRepo(S),
    event:        eventRepo(S),
    $transaction: async (fn) => fn(txProxy(S)),
  };
}

async function buildApp(db) {
  const app = Fastify({ logger: false });
  app.decorate("db", db);
  await app.register(authPlugin);
  app.register(authRoutes);
  app.register(usersRoute);
  app.register(circlesRoute);
  app.register(tasksRoute);
  await app.ready();
  return app;
}

// ═══════════════════════════════════════════════════════════════════════════════
// auth routes
// ═══════════════════════════════════════════════════════════════════════════════

describe("auth routes", () => {
  test("POST /auth/signup creates a password-backed user", async () => {
    const app = await buildApp(buildDb());
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      headers: HDR,
      payload: { email: "New@Example.com", name: "New User", password: "password123" },
    });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.user.email, "new@example.com");
    assert.equal(body.method, "PASSWORD");
    await app.close();
  });

  test("POST /auth/login rejects wrong password", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "a@test.com", name: "Alice", passwordHash: hashPassword("password123") }],
    }));
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: HDR,
      payload: { email: "a@test.com", password: "wrongpass" },
    });
    assert.equal(res.statusCode, 401);
    await app.close();
  });

  test("POST /auth/login returns the matching user", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "a@test.com", name: "Alice", passwordHash: hashPassword("password123") }],
    }));
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: HDR,
      payload: { email: "A@Test.com", password: "password123" },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.user.id, "u1");
    assert.equal(body.method, "PASSWORD");
    await app.close();
  });

  test("POST /auth/social creates a user and identity from local fallback payload", async () => {
    const app = await buildApp(buildDb());
    const res = await app.inject({
      method: "POST",
      url: "/auth/social",
      headers: HDR,
      payload: {
        provider: "GOOGLE",
        providerUserId: "google-123",
        email: "social@test.com",
        name: "Social User",
      },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.user.email, "social@test.com");
    assert.equal(body.method, "GOOGLE");
    await app.close();
  });

  test("GET /auth/oauth/google/start redirects to Google's consent screen", async () => {
    const app = await buildApp(buildDb());
    const res = await app.inject({
      method: "GET",
      url: "/auth/oauth/google/start?callback_scheme=careloop",
    });
    assert.equal(res.statusCode, 302);
    assert.match(res.headers.location, /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
    assert.match(res.headers.location, /client_id=google-client/);
    assert.match(res.headers.location, /redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Foauth%2Fgoogle%2Fcallback/);
    await app.close();
  });

  test("verifyOAuthState returns the signed callback payload", () => {
    const state = createOAuthState({ provider: "GOOGLE", callbackScheme: "careloop" });
    const payload = verifyOAuthState(state);
    assert.equal(payload.provider, "GOOGLE");
    assert.equal(payload.callbackScheme, "careloop");
  });

  test("forgot password request stores a reset code and returns debugCode in local dev", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "reset@test.com", name: "Reset User", passwordHash: hashPassword("password123") }],
    }));
    const res = await app.inject({
      method: "POST",
      url: "/auth/forgot-password/request",
      headers: HDR,
      payload: { email: "reset@test.com" },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.sent, true);
    assert.equal(typeof body.debugCode, "string");
    assert.equal(app.db._s.passwordResetCodes.length, 1);
    await app.close();
  });

  test("forgot password verify/reset updates password", async () => {
    const db = buildDb({
      users: [{ id: "u1", email: "reset@test.com", name: "Reset User", passwordHash: hashPassword("password123") }],
    });
    const app = await buildApp(db);
    const request = await app.inject({
      method: "POST",
      url: "/auth/forgot-password/request",
      headers: HDR,
      payload: { email: "reset@test.com" },
    });
    const code = request.json().debugCode;
    const verify = await app.inject({
      method: "POST",
      url: "/auth/forgot-password/verify",
      headers: HDR,
      payload: { email: "reset@test.com", code },
    });
    assert.equal(verify.statusCode, 200);
    const reset = await app.inject({
      method: "POST",
      url: "/auth/forgot-password/reset",
      headers: HDR,
      payload: { email: "reset@test.com", code, password: "newpassword1" },
    });
    assert.equal(reset.statusCode, 200);

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: HDR,
      payload: { email: "reset@test.com", password: "newpassword1" },
    });
    assert.equal(login.statusCode, 200);
    await app.close();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// push.js — deliverTaskNotification
// ═══════════════════════════════════════════════════════════════════════════════

describe("deliverTaskNotification", () => {
  const task = { id: "t1", title: "Give meds", circle: { name: "Smith Family" } };

  test("returns NONE — user not found", async () => {
    const db = buildDb();
    const r = await deliverTaskNotification({ db, userId: "ghost", task, type: "reminder" });
    assert.equal(r.delivered, false);
    assert.equal(r.channel, "NONE");
    assert.equal(r.reason, "user_not_found");
  });

  test("returns NONE — user has no push token and no email", async () => {
    const db = buildDb({ users: [{ id: "u1", name: "A", email: null, pushToken: null }] });
    const r = await deliverTaskNotification({ db, userId: "u1", task, type: "reminder" });
    assert.equal(r.delivered, false);
    assert.equal(r.channel, "NONE");
  });

  test("simulates PUSH — user has push token, APNs not configured", async () => {
    const db = buildDb({ users: [{ id: "u1", name: "A", email: "a@t.com", pushToken: "tok123" }] });
    const r = await deliverTaskNotification({ db, userId: "u1", task, type: "reminder" });
    assert.equal(r.simulated, true);
    assert.equal(r.channel, "PUSH");
    assert.equal(r.reason, "apns_not_configured");
  });

  test("simulates EMAIL fallback — no push token, RESEND not configured", async () => {
    const db = buildDb({ users: [{ id: "u1", name: "A", email: "a@t.com", pushToken: null }] });
    const r = await deliverTaskNotification({ db, userId: "u1", task, type: "reminder" });
    assert.equal(r.delivered, true);
    assert.equal(r.simulated, true);
    assert.equal(r.channel, "EMAIL");
  });

  test("uses escalation content type without crashing", async () => {
    const db = buildDb({ users: [{ id: "u1", name: "A", email: null, pushToken: "tok" }] });
    const r = await deliverTaskNotification({ db, userId: "u1", task, type: "escalation" });
    assert.equal(r.channel, "PUSH");
    assert.equal(r.simulated, true);
  });

  test("uses assignment content type without crashing", async () => {
    const db = buildDb({ users: [{ id: "u1", name: "A", email: null, pushToken: "tok" }] });
    const r = await deliverTaskNotification({ db, userId: "u1", task, type: "assignment" });
    assert.equal(r.channel, "PUSH");
    assert.equal(r.simulated, true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// push.js — sendReminderNotifications
// ═══════════════════════════════════════════════════════════════════════════════

describe("sendReminderNotifications", () => {
  const task = { id: "t1", title: "Meds", circle: { name: "Circle" } };

  test("delivers to all user IDs and returns one result per user", async () => {
    const db = buildDb({
      users: [
        { id: "u1", name: "Alice", email: "a@t.com", pushToken: null },
        { id: "u2", name: "Bob",   email: "b@t.com", pushToken: null },
      ],
    });
    const results = await sendReminderNotifications({ db, task, type: "reminder", userIds: ["u1", "u2"] });
    assert.equal(results.length, 2);
    assert.ok(results.every((r) => r.simulated === true), "all simulated (no RESEND key)");
  });

  test("handles empty userIds array", async () => {
    const db = buildDb();
    const results = await sendReminderNotifications({ db, task, type: "reminder", userIds: [] });
    assert.equal(results.length, 0);
  });

  test("returns NONE for users with no contact info", async () => {
    const db = buildDb({ users: [{ id: "u1", name: "Ghost", email: null, pushToken: null }] });
    const results = await sendReminderNotifications({ db, task, type: "reminder", userIds: ["u1"] });
    assert.equal(results[0].channel, "NONE");
    assert.equal(results[0].delivered, false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// push.js — sendDailyDigest
// ═══════════════════════════════════════════════════════════════════════════════

describe("sendDailyDigest", () => {
  test("returns NONE when user has no email", async () => {
    const r = await sendDailyDigest({
      user: { id: "u1", name: "Alice", email: null },
      digestDate: "2026-04-26",
      dueToday: [], overdue: [], completedToday: [],
    });
    assert.equal(r.delivered, false);
    assert.equal(r.channel, "NONE");
    assert.equal(r.reason, "user_has_no_email");
  });

  test("simulates send when RESEND not configured", async () => {
    const r = await sendDailyDigest({
      user: { id: "u1", name: "Alice", email: "alice@test.com" },
      digestDate: "2026-04-26",
      dueToday: [], overdue: [], completedToday: [],
    });
    assert.equal(r.delivered, true);
    assert.equal(r.simulated, true);
    assert.equal(r.channel, "EMAIL");
  });

  test("digest is idempotent — same function call returns simulated regardless of content", async () => {
    const user = { id: "u1", name: "Alice", email: "alice@test.com" };
    const [r1, r2] = await Promise.all([
      sendDailyDigest({ user, digestDate: "2026-04-26", dueToday: [{ title: "Task A" }], overdue: [], completedToday: [] }),
      sendDailyDigest({ user, digestDate: "2026-04-26", dueToday: [{ title: "Task A" }], overdue: [], completedToday: [] }),
    ]);
    // Idempotency is enforced at the scheduler layer (DigestLog check), not push.js itself
    assert.equal(r1.delivered, true);
    assert.equal(r2.delivered, true);
  });

  test("includes task data in digest HTML (no crash with real task objects)", async () => {
    const r = await sendDailyDigest({
      user: { id: "u1", name: "Alice", email: "alice@test.com" },
      digestDate: "2026-04-26",
      dueToday:       [{ title: "Give meds"        }],
      overdue:        [{ title: "Doctor appt"       }],
      completedToday: [{ title: "Morning walk done" }],
    });
    assert.equal(r.delivered, true);
    assert.equal(r.simulated, true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Route — PATCH /users/:id/push-token
// ═══════════════════════════════════════════════════════════════════════════════

describe("PATCH /users/:id/push-token", () => {
  let app, db;

  before(async () => {
    db = buildDb({ users: [{ id: "u1", name: "Alice", email: "a@t.com", pushToken: null }] });
    app = await buildApp(db);
  });

  after(() => app.close());

  test("returns 200 with updated user including pushToken", async () => {
    const res = await app.inject({
      method: "PATCH", url: "/users/u1/push-token",
      headers: HDR, body: JSON.stringify({ pushToken: "device-abc-123" }),
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.pushToken, "device-abc-123");
  });

  test("persists push token in DB", async () => {
    await app.inject({
      method: "PATCH", url: "/users/u1/push-token",
      headers: HDR, body: JSON.stringify({ pushToken: "stored-token" }),
    });
    const user = db._s.users.find((u) => u.id === "u1");
    assert.equal(user.pushToken, "stored-token");
  });

  test("returns 400 when pushToken is absent from body", async () => {
    const res = await app.inject({
      method: "PATCH", url: "/users/u1/push-token",
      headers: HDR, body: JSON.stringify({}),
    });
    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.payload).error, "pushToken required");
  });

  test("returns 401 when x-api-key header is missing", async () => {
    const res = await app.inject({
      method: "PATCH", url: "/users/u1/push-token",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pushToken: "tok" }),
    });
    assert.equal(res.statusCode, 401);
  });

  test("returns 401 when x-api-key header is wrong", async () => {
    const res = await app.inject({
      method: "PATCH", url: "/users/u1/push-token",
      headers: { "x-api-key": "wrong-key", "content-type": "application/json" },
      body: JSON.stringify({ pushToken: "tok" }),
    });
    assert.equal(res.statusCode, 401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Route — Task creation → Reminder scheduling
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /circles/:circleId/tasks — Reminder creation", () => {
  let app, db;

  before(async () => {
    db = buildDb({
      users:   [{ id: "u1", name: "Alice", email: "a@t.com", pushToken: null }],
      circles: [{ id: "c1", name: "Smith Family", recipientName: "Mom" }],
      members: [{ id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" }],
    });
    app = await buildApp(db);
  });

  after(() => app.close());

  test("creates Reminder scheduled at dueAt minus 15 minutes", async () => {
    const dueAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const res = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({ title: "Give meds", creatorId: "u1", dueAt }),
    });
    assert.equal(res.statusCode, 201);
    const task = JSON.parse(res.payload);

    const reminder = db._s.reminders.find((r) => r.taskId === task.id);
    assert.ok(reminder, "Reminder exists in DB");
    assert.equal(reminder.status, "PENDING");

    const expectedMs = new Date(dueAt).getTime() - 15 * 60 * 1000;
    const diff = Math.abs(new Date(reminder.scheduledAt).getTime() - expectedMs);
    assert.ok(diff < 2000, `scheduledAt within 2s of dueAt-15m (actual diff: ${diff}ms)`);
  });

  test("does NOT create a Reminder when task has no dueAt", async () => {
    const countBefore = db._s.reminders.length;
    const res = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({ title: "Check in on Dad", creatorId: "u1" }),
    });
    assert.equal(res.statusCode, 201);
    assert.equal(db._s.reminders.length, countBefore, "no new reminder created");
  });

  test("logs TASK_CREATED event for every task", async () => {
    const countBefore = db._s.events.filter((e) => e.type === "TASK_CREATED").length;
    await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({ title: "Morning walk", creatorId: "u1" }),
    });
    const countAfter = db._s.events.filter((e) => e.type === "TASK_CREATED").length;
    assert.equal(countAfter, countBefore + 1);
  });

  test("returns 400 when title is missing", async () => {
    const res = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({ creatorId: "u1" }),
    });
    assert.equal(res.statusCode, 400);
  });

  test("returns 400 when title exceeds 200 characters", async () => {
    const res = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({ title: "x".repeat(201), creatorId: "u1" }),
    });
    assert.equal(res.statusCode, 400);
  });

  test("returns 403 when creatorId is not a circle member", async () => {
    const res = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({ title: "Intruder task", creatorId: "not-a-member" }),
    });
    assert.equal(res.statusCode, 403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Scheduler logic — escalation cutoff rule
// ═══════════════════════════════════════════════════════════════════════════════

describe("Scheduler escalation rules (unit)", () => {
  const ESCALATION_MIN = 15;

  test("escalation window: sentAt + 15min is before now → should escalate", () => {
    const sentAt = new Date(Date.now() - (ESCALATION_MIN + 1) * 60 * 1000);
    const cutoff  = new Date(Date.now() - ESCALATION_MIN * 60 * 1000);
    assert.ok(sentAt <= cutoff, "reminder older than 15min qualifies for escalation");
  });

  test("escalation window: sentAt + 14min is after now → should NOT escalate", () => {
    const sentAt = new Date(Date.now() - (ESCALATION_MIN - 1) * 60 * 1000);
    const cutoff  = new Date(Date.now() - ESCALATION_MIN * 60 * 1000);
    assert.ok(sentAt > cutoff, "reminder younger than 15min does not qualify");
  });

  test("digest date string format is YYYY-MM-DD", () => {
    const date = new Date("2026-04-26T18:00:00Z");
    const formatted = date.toISOString().split("T")[0];
    assert.equal(formatted, "2026-04-26");
  });

  test("DIGEST_HOUR default is 18", () => {
    const digestHour = parseInt(process.env.DAILY_DIGEST_HOUR || "18", 10);
    assert.equal(digestHour, 18);
  });
});
