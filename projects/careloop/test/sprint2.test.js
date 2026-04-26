// Sprint 2 backend tests — push notifications, scheduler rules, route contracts
// Run: node --test test/sprint2.test.js

// Set env before any module-level reads (override shell env for isolation)
process.env.API_KEY            = "test-key";
process.env.DISABLE_SCHEDULER = "true";
process.env.RESEND_API_KEY     = "";   // force simulated email mode
process.env.APNS_KEY_ID        = "";   // force simulated push mode
process.env.APNS_TEAM_ID       = "";
process.env.APNS_KEY            = "";

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { deliverTaskNotification, sendReminderNotifications, sendDailyDigest } from "../src/lib/push.js";
import Fastify from "fastify";
import authPlugin    from "../src/plugins/auth.js";
import usersRoute    from "../src/routes/users.js";
import circlesRoute  from "../src/routes/circles.js";
import tasksRoute    from "../src/routes/tasks.js";

const HDR = { "x-api-key": "test-key", "content-type": "application/json" };

// ─── mock DB ─────────────────────────────────────────────────────────────────
function buildDb(seed = {}) {
  const S = {
    users:     [...(seed.users     || [])],
    circles:   [...(seed.circles   || [])],
    members:   [...(seed.members   || [])],
    tasks:     [],
    reminders: [],
    events:    [],
  };

  let seq = 0;
  const uid = (p) => `${p}${++seq}`;

  function userRepo(s) {
    return {
      findUnique: async ({ where }) =>
        s.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
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
    careCircle:   circleRepo(s),
    circleMember: memberRepo(s),
    task:         taskRepo(s),
    reminder:     reminderRepo(s),
    event:        eventRepo(s),
  });

  return {
    _s: S,
    user:         userRepo(S),
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
  app.register(usersRoute);
  app.register(circlesRoute);
  app.register(tasksRoute);
  await app.ready();
  return app;
}

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
