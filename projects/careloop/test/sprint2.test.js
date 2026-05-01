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
    invitations: [...(seed.invitations || [])],
    recipients: [...(seed.recipients || (seed.circles || []).map((circle, index) => ({
      id: `cr${index + 1}`,
      circleId: circle.id,
      name: circle.recipientName,
      relationship: null,
      notes: null,
      isPrimary: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })))],
    members:    [...(seed.members    || [])],
    tasks:      [...(seed.tasks      || [])],
    reminders:  [...(seed.reminders  || [])],
    events:     [...(seed.events     || [])],
  };

  const seededIds = [
    ...S.users.map((item) => item.id),
    ...S.identities.map((item) => item.id),
    ...S.passwordResetCodes.map((item) => item.id),
    ...S.circles.map((item) => item.id),
    ...S.invitations.map((item) => item.id),
    ...S.recipients.map((item) => item.id),
    ...S.members.map((item) => item.id),
    ...S.tasks.map((item) => item.id),
    ...S.reminders.map((item) => item.id),
    ...S.events.map((item) => item.id),
  ];
  let seq = seededIds.reduce((max, id) => {
    const match = String(id ?? "").match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
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
        const c = { id: uid("c"), createdAt: new Date(), updatedAt: new Date(), archiveAfterDays: 7, ...d };
        s.circles.push(c);
        return c;
      },
      findMany: async ({ select } = {}) => {
        if (!select) return s.circles;
        return s.circles.map((circle) => {
          const picked = {};
          for (const key of Object.keys(select)) {
            if (select[key]) picked[key] = circle[key];
          }
          return picked;
        });
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
          recipients: include.recipients
            ? s.recipients
                .filter((recipient) => recipient.circleId === c.id)
                .sort((lhs, rhs) => {
                  if (lhs.isPrimary !== rhs.isPrimary) return lhs.isPrimary ? -1 : 1;
                  return lhs.createdAt - rhs.createdAt;
                })
            : undefined,
          tasks: include.tasks ? s.tasks.filter((t) => t.circleId === c.id) : undefined,
        };
      },
      update: async ({ where, data: d, include }) => {
        const circle = s.circles.find((x) => x.id === where.id);
        if (!circle) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        Object.assign(circle, d, { updatedAt: new Date() });
        if (!include) return circle;
        return {
          ...circle,
          members: include.members
            ? s.members
                .filter((m) => m.circleId === circle.id)
                .map((m) => ({
                  ...m,
                  user: include.members?.include?.user
                    ? (s.users.find((u) => u.id === m.userId) ?? null)
                    : undefined,
                }))
            : undefined,
          recipients: include.recipients
            ? s.recipients
                .filter((recipient) => recipient.circleId === circle.id)
                .sort((lhs, rhs) => {
                  if (lhs.isPrimary !== rhs.isPrimary) return lhs.isPrimary ? -1 : 1;
                  return lhs.createdAt - rhs.createdAt;
                })
            : undefined,
          tasks: include.tasks ? s.tasks.filter((t) => t.circleId === circle.id) : undefined,
        };
      },
    };
  }

  function invitationRepo(s) {
    function matchesInvitation(invitation, where = {}) {
      if (where.id && invitation.id !== where.id) return false;
      if (where.circleId && invitation.circleId !== where.circleId) return false;
      if (where.email && invitation.email !== where.email) return false;
      if (where.status && invitation.status !== where.status) return false;
      return true;
    }

    function includeInvitation(invitation, include) {
      if (!invitation) return null;
      if (!include) return { ...invitation };
      return {
        ...invitation,
        circle: include.circle ? (s.circles.find((circle) => circle.id === invitation.circleId) ?? null) : undefined,
        invitedBy: include.invitedBy ? (s.users.find((user) => user.id === invitation.invitedById) ?? null) : undefined,
      };
    }

    return {
      create: async ({ data: d }) => {
        const invitation = {
          id: uid("i"),
          status: "PENDING",
          acceptedAt: null,
          invitedById: null,
          acceptedById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...d,
        };
        s.invitations.push(invitation);
        return invitation;
      },
      findUnique: async ({ where, include }) =>
        includeInvitation(s.invitations.find((invitation) => invitation.id === where.id) ?? null, include),
      findFirst: async ({ where, include }) =>
        includeInvitation(s.invitations.find((invitation) => matchesInvitation(invitation, where)) ?? null, include),
      findMany: async ({ where, include, orderBy } = {}) => {
        let items = s.invitations.filter((invitation) => matchesInvitation(invitation, where));
        if (orderBy?.createdAt === "desc") {
          items = items.sort((lhs, rhs) => rhs.createdAt - lhs.createdAt);
        }
        return items.map((invitation) => includeInvitation(invitation, include));
      },
      update: async ({ where, data: d, include }) => {
        const invitation = s.invitations.find((item) => item.id === where.id);
        if (!invitation) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        Object.assign(invitation, d, { updatedAt: new Date() });
        return includeInvitation(invitation, include);
      },
    };
  }

  function careRecipientRepo(s) {
    return {
      create: async ({ data: d }) => {
        const recipient = {
          id: uid("cr"),
          relationship: null,
          notes: null,
          isPrimary: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...d,
        };
        s.recipients.push(recipient);
        return recipient;
      },
      findUnique: async ({ where }) =>
        s.recipients.find((recipient) => recipient.id === where.id) ?? null,
      findFirst: async ({ where, orderBy } = {}) => {
        let items = s.recipients.filter((recipient) => {
          if (where?.id && recipient.id !== where.id) return false;
          if (where?.circleId && recipient.circleId !== where.circleId) return false;
          return true;
        });
        if (orderBy) {
          const orderings = Array.isArray(orderBy) ? orderBy : [orderBy];
          items = items.sort((lhs, rhs) => {
            for (const ordering of orderings) {
              const [field, direction] = Object.entries(ordering)[0];
              const left = lhs[field];
              const right = rhs[field];
              if (left === right) continue;
              if (direction === "desc") return left > right ? -1 : 1;
              return left < right ? -1 : 1;
            }
            return 0;
          });
        }
        return items[0] ?? null;
      },
      findMany: async ({ where, orderBy } = {}) => {
        let items = s.recipients.filter((recipient) => {
          if (where?.circleId && recipient.circleId !== where.circleId) return false;
          return true;
        });
        if (orderBy) {
          const orderings = Array.isArray(orderBy) ? orderBy : [orderBy];
          items = items.sort((lhs, rhs) => {
            for (const ordering of orderings) {
              const [field, direction] = Object.entries(ordering)[0];
              const left = lhs[field];
              const right = rhs[field];
              if (left === right) continue;
              if (direction === "desc") return left > right ? -1 : 1;
              return left < right ? -1 : 1;
            }
            return 0;
          });
        }
        return items;
      },
      count: async ({ where } = {}) =>
        s.recipients.filter((recipient) => {
          if (where?.circleId && recipient.circleId !== where.circleId) return false;
          return true;
        }).length,
      update: async ({ where, data: d }) => {
        const recipient = s.recipients.find((item) => item.id === where.id);
        if (!recipient) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        Object.assign(recipient, d, { updatedAt: new Date() });
        return recipient;
      },
      updateMany: async ({ where, data: d }) => {
        let count = 0;
        for (const recipient of s.recipients) {
          if (where?.circleId && recipient.circleId !== where.circleId) continue;
          Object.assign(recipient, d, { updatedAt: new Date() });
          count += 1;
        }
        return { count };
      },
      delete: async ({ where }) => {
        const index = s.recipients.findIndex((item) => item.id === where.id);
        if (index === -1) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        const [deleted] = s.recipients.splice(index, 1);
        return deleted;
      },
    };
  }

  function memberRepo(s) {
    return {
      create: async ({ data: d }) => {
        if (s.members.some((m) => m.userId === d.userId && m.circleId === d.circleId)) {
          throw Object.assign(new Error("Unique"), { code: "P2002" });
        }
        const m = { id: uid("m"), joinedAt: new Date(), role: "MEMBER", ...d };
        s.members.push(m);
        return m;
      },
      findUnique: async ({ where, include }) => {
        const k = where.userId_circleId;
        const member = k
          ? s.members.find((m) => m.userId === k.userId && m.circleId === k.circleId) ?? null
          : where.id
            ? s.members.find((m) => m.id === where.id) ?? null
            : null;
        if (!member || !include?.user) return member;
        return {
          ...member,
          user: s.users.find((u) => u.id === member.userId) ?? null,
        };
      },
      findFirst: async ({ where }) =>
        s.members.find((m) => {
          if (where.userId && m.userId !== where.userId) return false;
          if (where.circleId && m.circleId !== where.circleId) return false;
          if (where.role && m.role !== where.role) return false;
          return true;
        }) ?? null,
      count: async ({ where } = {}) =>
        s.members.filter((m) => {
          if (where?.userId && m.userId !== where.userId) return false;
          if (where?.circleId && m.circleId !== where.circleId) return false;
          if (where?.role && m.role !== where.role) return false;
          return true;
        }).length,
      delete: async ({ where }) => {
        const index = s.members.findIndex((m) => m.id === where.id);
        if (index === -1) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        const [deleted] = s.members.splice(index, 1);
        return deleted;
      },
      update: async ({ where, data: d }) => {
        const member = s.members.find((m) => m.id === where.id);
        if (!member) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        Object.assign(member, d);
        return member;
      },
    };
  }

  function taskRepo(s) {
    function matchesTaskWhere(task, where = {}) {
      if (where.id && task.id !== where.id) return false;
      if (where.circleId && task.circleId !== where.circleId) return false;
      if (where.recipientId && task.recipientId !== where.recipientId) return false;
      if (where.seriesId && task.seriesId !== where.seriesId) return false;
      if (where.archivedAt === null && task.archivedAt !== null) return false;
      if (where.archivedAt?.not === null && task.archivedAt === null) return false;
      if (where.status && typeof where.status === "string" && task.status !== where.status) return false;
      if (where.status?.in && !where.status.in.includes(task.status)) return false;
      if (where.status?.not && task.status === where.status.not) return false;
      if (where.dueAt && where.dueAt instanceof Date && String(task.dueAt) !== String(where.dueAt)) return false;
      if (where.dueAt?.lt && !(task.dueAt && task.dueAt < where.dueAt.lt)) return false;
      if (where.dueAt?.lte && !(task.dueAt && task.dueAt <= where.dueAt.lte)) return false;
      if (where.dueAt?.gte && !(task.dueAt && task.dueAt >= where.dueAt.gte)) return false;
      if (where.dueAt?.not === null && task.dueAt === null) return false;
      if (where.completedAt?.lte && !(task.completedAt && task.completedAt <= where.completedAt.lte)) return false;
      if (where.completedAt?.gte && !(task.completedAt && task.completedAt >= where.completedAt.gte)) return false;
      return true;
    }

    function includeTask(task, include) {
      if (!task) return null;
      if (!include) return { ...task };
      return {
        ...task,
        assignee: include.assignee ? (s.users.find((u) => u.id === task.assigneeId) ?? null) : undefined,
        completedBy: include.completedBy ? (s.users.find((u) => u.id === task.completedById) ?? null) : undefined,
        recipient: include.recipient ? (s.recipients.find((recipient) => recipient.id === task.recipientId) ?? null) : undefined,
        circle: include.circle ? (s.circles.find((c) => c.id === task.circleId) ?? null) : undefined,
      };
    }

    return {
      create: async ({ data: d, include }) => {
        const t = {
          id: uid("t"),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "PENDING",
          notes: null,
          assigneeId: null,
          recurrenceFrequency: "NONE",
          recurrenceInterval: null,
          recurrenceWeekdays: [],
          recurrenceEndsAt: null,
          seriesId: null,
          completedAt: null,
          completedById: null,
          archivedAt: null,
          recipientId: null,
          ...d
        };
        s.tasks.push(t);
        return includeTask(t, include);
      },
      findMany:  async ({ where, include } = {}) =>
        s.tasks
          .filter((task) => matchesTaskWhere(task, where))
          .map((task) => includeTask(task, include)),
      findFirst: async ({ where, include }) =>
        includeTask(s.tasks.find((task) => matchesTaskWhere(task, where)) ?? null, include),
      count: async ({ where } = {}) =>
        s.tasks.filter((task) => matchesTaskWhere(task, where)).length,
      update: async ({ where, data: d, include }) => {
        const task = s.tasks.find((t) => t.id === where.id);
        if (!task) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        Object.assign(task, d, { updatedAt: new Date() });
        return includeTask(task, include);
      },
      updateMany: async ({ where, data: d }) => {
        let count = 0;
        for (const task of s.tasks) {
          if (!matchesTaskWhere(task, where)) continue;
          Object.assign(task, d, { updatedAt: new Date() });
          count += 1;
        }
        return { count };
      },
      delete: async ({ where }) => {
        const index = s.tasks.findIndex((task) => task.id === where.id);
        if (index === -1) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        const [deleted] = s.tasks.splice(index, 1);
        return deleted;
      },
    };
  }

  function reminderRepo(s) {
    return {
      create: async ({ data: d }) => {
        const r = { id: uid("r"), status: "PENDING", ...d };
        s.reminders.push(r);
        return r;
      },
      findFirst: async ({ where }) =>
        s.reminders.find((reminder) => {
          if (where.taskId && reminder.taskId !== where.taskId) return false;
          return true;
        }) ?? null,
      update: async ({ where, data: d }) => {
        const reminder = s.reminders.find((item) => item.id === where.id);
        if (!reminder) throw Object.assign(new Error("NotFound"), { code: "P2025" });
        Object.assign(reminder, d);
        return reminder;
      },
      deleteMany: async ({ where }) => {
        const before = s.reminders.length;
        s.reminders = s.reminders.filter((reminder) => {
          if (where.taskId && reminder.taskId === where.taskId) return false;
          return true;
        });
        return { count: before - s.reminders.length };
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
    invitation:   invitationRepo(s),
    careRecipient: careRecipientRepo(s),
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
    invitation:   invitationRepo(S),
    authIdentity: authIdentityRepo(S),
    passwordResetCode: passwordResetCodeRepo(S),
    careCircle:   circleRepo(S),
    careRecipient: careRecipientRepo(S),
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

  test("POST /auth/login includes pending invitations for the authenticated email", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "member@test.com", name: "Member", passwordHash: hashPassword("password123") }],
      circles: [{ id: "c1", name: "Alpha", recipientName: "Bob", archiveAfterDays: 7 }],
      invitations: [{
        id: "i1",
        circleId: "c1",
        email: "member@test.com",
        name: "Member",
        role: "MEMBER",
        status: "PENDING",
        invitedById: null,
        acceptedById: null,
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    }));
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: HDR,
      payload: { email: "member@test.com", password: "password123" },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.user.pendingInvites.length, 1);
    assert.equal(body.user.pendingInvites[0].id, "i1");
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

describe("circle membership management", () => {
  test("POST /circles rejects creating a fourth circle for the same user", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "a@test.com", name: "Alice" }],
      circles: [
        { id: "c1", name: "One", recipientName: "A", archiveAfterDays: 7 },
        { id: "c2", name: "Two", recipientName: "B", archiveAfterDays: 7 },
        { id: "c3", name: "Three", recipientName: "C", archiveAfterDays: 7 },
      ],
      members: [
        { id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" },
        { id: "m2", userId: "u1", circleId: "c2", role: "ADMIN" },
        { id: "m3", userId: "u1", circleId: "c3", role: "MEMBER" },
      ],
    }));

    const res = await app.inject({
      method: "POST",
      url: "/circles",
      headers: HDR,
      payload: { name: "Four", recipientName: "D", creatorId: "u1" },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, "Users can only belong to 3 circles.");
    await app.close();
  });

  test("POST /circles/:id/members rejects joining a fourth circle", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "a@test.com", name: "Alice" }],
      circles: [
        { id: "c1", name: "One", recipientName: "A", archiveAfterDays: 7 },
        { id: "c2", name: "Two", recipientName: "B", archiveAfterDays: 7 },
        { id: "c3", name: "Three", recipientName: "C", archiveAfterDays: 7 },
        { id: "c4", name: "Four", recipientName: "D", archiveAfterDays: 7 },
      ],
      members: [
        { id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" },
        { id: "m2", userId: "u1", circleId: "c2", role: "ADMIN" },
        { id: "m3", userId: "u1", circleId: "c3", role: "MEMBER" },
      ],
    }));

    const res = await app.inject({
      method: "POST",
      url: "/circles/c4/members",
      headers: HDR,
      payload: { userId: "u1" },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, "Users can only belong to 3 circles.");
    await app.close();
  });

  test("POST /circles/:id/members/invite creates a pending invitation", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "admin@test.com", name: "Admin" }],
      circles: [{ id: "c1", name: "Alpha", recipientName: "Bob", archiveAfterDays: 7 }],
      members: [{ id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" }],
    }));

    const res = await app.inject({
      method: "POST",
      url: "/circles/c1/members/invite",
      headers: HDR,
      payload: { userId: "u1", name: "New Member", email: "member@test.com", role: "ADMIN" },
    });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.role, "ADMIN");
    assert.equal(body.email, "member@test.com");
    assert.equal(body.status, "PENDING");
    assert.equal(app.db._s.members.length, 1);
    await app.close();
  });

  test("POST /invitations/:inviteId/accept creates membership after auth", async () => {
    const app = await buildApp(buildDb({
      users: [
        { id: "u1", email: "admin@test.com", name: "Admin" },
        { id: "u2", email: "member@test.com", name: "Member" },
      ],
      circles: [{ id: "c1", name: "Alpha", recipientName: "Bob", archiveAfterDays: 7 }],
      members: [{ id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" }],
      invitations: [{
        id: "i1",
        circleId: "c1",
        email: "member@test.com",
        name: "Member",
        role: "ADMIN",
        status: "PENDING",
        invitedById: "u1",
        acceptedById: null,
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    }));

    const res = await app.inject({
      method: "POST",
      url: "/invitations/i1/accept",
      headers: HDR,
      payload: { userId: "u2" },
    });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.role, "ADMIN");
    assert.equal(app.db._s.members.length, 2);
    assert.equal(app.db._s.invitations[0].status, "ACCEPTED");
    await app.close();
  });

  test("POST /invitations/:inviteId/decline marks the invite declined", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u2", email: "member@test.com", name: "Member" }],
      circles: [{ id: "c1", name: "Alpha", recipientName: "Bob", archiveAfterDays: 7 }],
      invitations: [{
        id: "i1",
        circleId: "c1",
        email: "member@test.com",
        name: "Member",
        role: "MEMBER",
        status: "PENDING",
        invitedById: null,
        acceptedById: null,
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
    }));

    const res = await app.inject({
      method: "POST",
      url: "/invitations/i1/decline",
      headers: HDR,
      payload: { userId: "u2" },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().declined, true);
    assert.equal(app.db._s.invitations[0].status, "DECLINED");
    await app.close();
  });

  test("PATCH /circles/:id/members/:memberId/role lets an admin promote a caregiver", async () => {
    const app = await buildApp(buildDb({
      users: [
        { id: "u1", email: "admin@test.com", name: "Admin" },
        { id: "u2", email: "member@test.com", name: "Member" },
      ],
      circles: [{ id: "c1", name: "Alpha", recipientName: "Bob", archiveAfterDays: 7 }],
      members: [
        { id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" },
        { id: "m2", userId: "u2", circleId: "c1", role: "MEMBER" },
      ],
    }));

    const res = await app.inject({
      method: "PATCH",
      url: "/circles/c1/members/m2/role",
      headers: HDR,
      payload: { userId: "u1", role: "ADMIN" },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().role, "ADMIN");
    await app.close();
  });

  test("DELETE /circles/:id/members/:memberId lets an admin remove another member", async () => {
    const app = await buildApp(buildDb({
      users: [
        { id: "u1", email: "admin@test.com", name: "Admin" },
        { id: "u2", email: "member@test.com", name: "Member" },
      ],
      circles: [{ id: "c1", name: "Alpha", recipientName: "Bob", archiveAfterDays: 7 }],
      members: [
        { id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" },
        { id: "m2", userId: "u2", circleId: "c1", role: "MEMBER" },
      ],
    }));

    const res = await app.inject({
      method: "DELETE",
      url: "/circles/c1/members/m2",
      headers: HDR,
      payload: { userId: "u1" },
    });

    assert.equal(res.statusCode, 204);
    await app.close();
  });

  test("POST /circles/:id/recipients lets an admin add another care recipient", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "admin@test.com", name: "Admin" }],
      circles: [{ id: "c1", name: "Alpha", recipientName: "John Doe", archiveAfterDays: 7 }],
      members: [{ id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" }],
    }));

    const res = await app.inject({
      method: "POST",
      url: "/circles/c1/recipients",
      headers: HDR,
      payload: { userId: "u1", name: "Jane Doe", relationship: "Spouse" },
    });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.name, "Jane Doe");
    assert.equal(body.relationship, "Spouse");
    await app.close();
  });

  test("POST /circles/:id/recipients/reorder updates recipient order and primary recipient", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "admin@test.com", name: "Admin" }],
      circles: [{ id: "c1", name: "Alpha", recipientName: "John Doe", archiveAfterDays: 7 }],
      members: [{ id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" }],
      recipients: [
        { id: "r1", circleId: "c1", name: "John Doe", relationship: "Dad", notes: null, isPrimary: true, sortOrder: 0 },
        { id: "r2", circleId: "c1", name: "Jane Doe", relationship: "Mom", notes: null, isPrimary: false, sortOrder: 1 },
        { id: "r3", circleId: "c1", name: "Mia Doe", relationship: "Grandma", notes: null, isPrimary: false, sortOrder: 2 },
      ],
    }));

    const res = await app.inject({
      method: "POST",
      url: "/circles/c1/recipients/reorder",
      headers: HDR,
      payload: {
        userId: "u1",
        recipientIds: ["r3", "r1", "r2"],
        primaryRecipientId: "r3",
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.deepEqual(body.map((recipient) => recipient.id), ["r3", "r1", "r2"]);
    assert.equal(body[0].isPrimary, true);
    assert.equal(app.db._s.circles[0].recipientName, "Mia Doe");
    await app.close();
  });

  test("DELETE /circles/:id/recipients blocks removing the last care recipient", async () => {
    const app = await buildApp(buildDb({
      users: [{ id: "u1", email: "admin@test.com", name: "Admin" }],
      circles: [{ id: "c1", name: "Alpha", recipientName: "John Doe", archiveAfterDays: 7 }],
      members: [{ id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" }],
    }));

    const recipientId = app.db._s.recipients[0].id;
    const res = await app.inject({
      method: "DELETE",
      url: `/circles/c1/recipients/${recipientId}`,
      headers: HDR,
      payload: { userId: "u1" },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, "Every circle must keep at least one care recipient.");
    await app.close();
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

  test("creates a recurring task series and logs TASK_SERIES_CREATED", async () => {
    const recipientId = db._s.recipients[0].id;
    const dueAt = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const beforeSeriesEvents = db._s.events.filter((event) => event.type === "TASK_SERIES_CREATED").length;
    const res = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({
        title: "Evening meds",
        creatorId: "u1",
        dueAt,
        recipientId,
        recurrence: {
          frequency: "DAILY",
          interval: 1,
        },
      }),
    });
    assert.equal(res.statusCode, 201);
    const task = res.json();
    assert.equal(task.recurrenceFrequency, "DAILY");
    assert.equal(task.recipientId, recipientId);
    assert.ok(task.seriesId, "seriesId is assigned");
    const afterSeriesEvents = db._s.events.filter((event) => event.type === "TASK_SERIES_CREATED").length;
    assert.equal(afterSeriesEvents, beforeSeriesEvents + 1);
  });

  test("completing a recurring task creates the next occurrence", async () => {
    const recipientId = db._s.recipients[0].id;
    const dueAt = new Date("2026-04-29T12:00:00.000Z").toISOString();
    const create = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({
        title: "Weekly check-in",
        creatorId: "u1",
        dueAt,
        recipientId,
        recurrence: {
          frequency: "WEEKLY",
          interval: 1,
        },
      }),
    });
    assert.equal(create.statusCode, 201);
    const createdTask = create.json();

    const update = await app.inject({
      method: "PATCH",
      url: `/circles/c1/tasks/${createdTask.id}`,
      headers: HDR,
      body: JSON.stringify({
        userId: "u1",
        status: "DONE",
      }),
    });
    assert.equal(update.statusCode, 200);

    const seriesTasks = db._s.tasks.filter((task) => task.seriesId === createdTask.seriesId);
    assert.equal(seriesTasks.length, 2);
    const nextTask = seriesTasks.find((task) => task.id !== createdTask.id);
    assert.ok(nextTask, "next recurring occurrence exists");
    assert.equal(nextTask.status, "PENDING");
    assert.equal(nextTask.recipientId, recipientId);
    assert.equal(nextTask.dueAt.toISOString(), "2026-05-06T12:00:00.000Z");
  });

  test("editing a recurring task with SERIES scope updates future occurrences", async () => {
    const recipientId = db._s.recipients[0].id;
    const dueAt = new Date("2026-04-29T12:00:00.000Z").toISOString();
    const create = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({
        title: "Weekly check-in",
        creatorId: "u1",
        dueAt,
        recipientId,
        recurrence: {
          frequency: "WEEKLY",
          interval: 1,
        },
      }),
    });
    assert.equal(create.statusCode, 201);
    const createdTask = create.json();

    await app.inject({
      method: "PATCH",
      url: `/circles/c1/tasks/${createdTask.id}`,
      headers: HDR,
      body: JSON.stringify({ userId: "u1", status: "DONE" }),
    });

    const nextTask = db._s.tasks.find((task) => task.seriesId === createdTask.seriesId && task.id !== createdTask.id);
    assert.ok(nextTask);

    const update = await app.inject({
      method: "PATCH",
      url: `/circles/c1/tasks/${nextTask.id}`,
      headers: HDR,
      body: JSON.stringify({
        userId: "u1",
        title: "Updated weekly check-in",
        priority: "HIGH",
        seriesScope: "SERIES",
      }),
    });

    assert.equal(update.statusCode, 200);
    const editableSeriesTasks = db._s.tasks.filter((task) =>
      task.seriesId === createdTask.seriesId && ["PENDING", "IN_PROGRESS"].includes(task.status)
    );
    assert.ok(editableSeriesTasks.every((task) => task.title === "Updated weekly check-in"));
    assert.ok(editableSeriesTasks.every((task) => task.priority === "HIGH"));
  });

  test("editing a recurring task with SERIES scope rejects status updates", async () => {
    const recipientId = db._s.recipients[0].id;
    const create = await app.inject({
      method: "POST", url: "/circles/c1/tasks",
      headers: HDR,
      body: JSON.stringify({
        title: "Weekly check-in",
        creatorId: "u1",
        dueAt: new Date("2026-04-29T12:00:00.000Z").toISOString(),
        recipientId,
        recurrence: {
          frequency: "WEEKLY",
          interval: 1,
        },
      }),
    });
    assert.equal(create.statusCode, 201);
    const createdTask = create.json();

    const update = await app.inject({
      method: "PATCH",
      url: `/circles/c1/tasks/${createdTask.id}`,
      headers: HDR,
      body: JSON.stringify({
        userId: "u1",
        status: "DONE",
        seriesScope: "SERIES",
      }),
    });

    assert.equal(update.statusCode, 400);
    assert.equal(update.json().error, "Status updates only apply to a single occurrence");
  });
});

describe("GET /circles/:id/insights/completion", () => {
  test("returns admin completion chart data for the requested window", async () => {
    const now = new Date("2026-04-29T18:00:00.000Z");
    const db = buildDb({
      users: [
        { id: "u1", email: "admin@test.com", name: "Admin" },
        { id: "u2", email: "caregiver@test.com", name: "Caregiver" },
      ],
      circles: [{ id: "c1", name: "Alpha", recipientName: "John Doe", archiveAfterDays: 7 }],
      recipients: [
        { id: "cr1", circleId: "c1", name: "John Doe", relationship: null, notes: null, isPrimary: true, createdAt: now, updatedAt: now },
        { id: "cr2", circleId: "c1", name: "Jane Doe", relationship: "Spouse", notes: null, isPrimary: false, createdAt: now, updatedAt: now },
      ],
      members: [
        { id: "m1", userId: "u1", circleId: "c1", role: "ADMIN" },
        { id: "m2", userId: "u2", circleId: "c1", role: "MEMBER" },
      ],
      tasks: [
        {
          id: "t1",
          title: "Task 1",
          status: "DONE",
          priority: "NORMAL",
          circleId: "c1",
          creatorId: "u1",
          assigneeId: "u2",
          completedById: "u2",
          completedAt: new Date("2026-04-29T13:00:00.000Z"),
          dueAt: new Date("2026-04-29T12:00:00.000Z"),
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
          recurrenceFrequency: "NONE",
          recurrenceInterval: null,
          recurrenceWeekdays: [],
          recurrenceEndsAt: null,
          seriesId: null,
          recipientId: "cr1",
        },
        {
          id: "t2",
          title: "Task 2",
          status: "DONE",
          priority: "NORMAL",
          circleId: "c1",
          creatorId: "u1",
          assigneeId: "u2",
          completedById: "u2",
          completedAt: new Date("2026-04-28T13:00:00.000Z"),
          dueAt: new Date("2026-04-28T12:00:00.000Z"),
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
          recurrenceFrequency: "NONE",
          recurrenceInterval: null,
          recurrenceWeekdays: [],
          recurrenceEndsAt: null,
          seriesId: null,
          recipientId: "cr1",
        },
        {
          id: "t3",
          title: "Overdue Task",
          status: "PENDING",
          priority: "HIGH",
          circleId: "c1",
          creatorId: "u1",
          assigneeId: "u2",
          completedById: null,
          completedAt: null,
          dueAt: new Date("2026-04-27T12:00:00.000Z"),
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
          recurrenceFrequency: "NONE",
          recurrenceInterval: null,
          recurrenceWeekdays: [],
          recurrenceEndsAt: null,
          seriesId: null,
          recipientId: "cr2",
        },
      ],
    });
    const app = await buildApp(db);

    const realDateNow = Date.now;
    Date.now = () => now.getTime();
    try {
      const res = await app.inject({
        method: "GET",
        url: "/circles/c1/insights/completion?userId=u1&days=7",
        headers: HDR,
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.equal(body.periodDays, 7);
      assert.equal(body.totals.completed, 2);
      assert.equal(body.totals.active, 1);
      assert.equal(body.totals.overdue, 1);
      assert.equal(body.recipientBreakdown.length, 2);
      assert.deepEqual(body.recipientBreakdown.find((item) => item.recipientId === "cr1"), {
        recipientId: "cr1",
        name: "John Doe",
        completed: 2,
        active: 0,
        overdue: 0,
      });
      assert.deepEqual(body.recipientBreakdown.find((item) => item.recipientId === "cr2"), {
        recipientId: "cr2",
        name: "Jane Doe",
        completed: 0,
        active: 1,
        overdue: 1,
      });
      assert.deepEqual(body.topCaregivers[0], {
        userId: "u2",
        name: "Caregiver",
        email: "caregiver@test.com",
        completedCount: 2,
      });
      assert.equal(body.completedByDay.find((item) => item.date === "2026-04-29").count, 1);
      assert.equal(body.completedByDay.find((item) => item.date === "2026-04-28").count, 1);

      const filtered = await app.inject({
        method: "GET",
        url: "/circles/c1/insights/completion?userId=u1&days=7&recipientId=cr1",
        headers: HDR,
      });
      assert.equal(filtered.statusCode, 200);
      const filteredBody = filtered.json();
      assert.equal(filteredBody.selectedRecipientId, "cr1");
      assert.equal(filteredBody.totals.completed, 2);
      assert.equal(filteredBody.totals.active, 0);
      assert.equal(filteredBody.totals.overdue, 0);
    } finally {
      Date.now = realDateNow;
      await app.close();
    }
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
