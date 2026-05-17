import { Prisma } from "@prisma/client";
import { assertRequestAdmin, assertRequestMember, logEvent, requireAuthenticatedUser } from "../lib/roles.js";
import { normalizeEmail } from "../lib/auth.js";
import { activationForAcceptedReceiver } from "../lib/receiver-state.js";
import { filterVisibleTasks, isCareOrganizer, loadReceiverAccessContext } from "../lib/access.js";

const circleInclude = {
  members: { include: { user: { select: { id: true, name: true, email: true } } } },
  recipients: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] },
  tasks:   true,
};
const invitationInclude = {
  circle: { select: { id: true, name: true, recipientName: true, archiveAfterDays: true } },
  recipient: { select: { id: true, name: true, activationStatus: true, receiverUserId: true } },
  invitedBy: { select: { id: true, name: true, email: true } },
};
const MAX_CIRCLES_PER_USER = 3;

export default async function circles(app) {
  const db = app.db;

  function filteredCircleForMember(circle, member, accessContext) {
    if (isCareOrganizer(member)) return circle;
    const filteredRecipients = accessContext.recipients;
    const filteredTasks = filterVisibleTasks(circle.tasks ?? [], {
      member,
      userId: member.userId,
      accessContext,
    });
    return {
      ...circle,
      recipientName: filteredRecipients[0]?.name ?? "",
      recipients: filteredRecipients,
      tasks: filteredTasks,
    };
  }

  function eventVisibleToMember(event, member, accessContext, visibleTaskIds) {
    if (isCareOrganizer(member)) return true;
    const payload = event.payload ?? {};
    if (payload.taskId) return visibleTaskIds.has(payload.taskId);
    if (payload.recipientId && accessContext.recipientIds.has(payload.recipientId)) return true;
    return event.actorId === member.userId;
  }

  async function caregiverMemberOrReply(circleId, memberId, reply) {
    const member = await db.circleMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!member || member.circleId !== circleId) {
      reply.code(404).send({ error: "Member not found" });
      return null;
    }
    if (member.role !== "MEMBER") {
      reply.code(400).send({ error: "Receiver access can only be managed for caregivers" });
      return null;
    }
    return member;
  }

  function normalizedArchiveAfterDays(value) {
    if (!Number.isInteger(value)) return undefined;
    return Math.min(30, Math.max(1, value));
  }

  async function membershipCount(userId) {
    return db.circleMember.count({ where: { userId } });
  }

  async function ensureCircleCapacity(userId, reply) {
    const count = await membershipCount(userId);
    if (count >= MAX_CIRCLES_PER_USER) {
      reply.code(400).send({ error: `Users can only belong to ${MAX_CIRCLES_PER_USER} circles.` });
      return false;
    }
    return true;
  }

  async function resolvePrimaryRecipient(tx, circleId) {
    return tx.careRecipient.findFirst({
      where: { circleId },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async function findInvitationOr404(inviteId, reply) {
    const invitation = await db.invitation.findUnique({
      where: { id: inviteId },
      include: invitationInclude,
    });
    if (!invitation) {
      reply.code(404).send({ error: "Invitation not found" });
      return null;
    }
    return invitation;
  }

  function rejectUserMismatch(providedUserId, authenticatedUserId, reply) {
    if (providedUserId && providedUserId !== authenticatedUserId) {
      reply.code(403).send({ error: "userId must match the authenticated user" });
      return true;
    }
    return false;
  }

  // POST /circles — create circle, auto-add creator as Admin
  app.post("/circles", async (req, reply) => {
    const { name, recipientName, creatorId, archiveAfterDays } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(creatorId, authenticatedUserId, reply)) return;
    if (!name)
      return reply.code(400).send({ error: "name is required" });

    const creator = await db.user.findUnique({ where: { id: authenticatedUserId } });
    if (!creator) return reply.code(404).send({ error: "Creator user not found" });
    if (!await ensureCircleCapacity(authenticatedUserId, reply)) return;

    const normalizedDays = normalizedArchiveAfterDays(archiveAfterDays);

    const circle = await db.$transaction(async (tx) => {
      const c = await tx.careCircle.create({
        data: {
          name,
          recipientName: recipientName ?? "",
          archiveAfterDays: normalizedDays,
        },
      });
      if (recipientName?.trim()) {
        await tx.careRecipient.create({
          data: {
            circleId: c.id,
            name: recipientName.trim(),
            isPrimary: true,
          },
        });
      }
      await tx.circleMember.create({ data: { circleId: c.id, userId: authenticatedUserId, role: "ADMIN" } });
      await tx.event.create({ data: { type: "CIRCLE_CREATED", circleId: c.id, actorId: authenticatedUserId } });
      return tx.careCircle.findUnique({ where: { id: c.id }, include: circleInclude });
    });

    return reply.code(201).send(circle);
  });

  // GET /circles/:id
  app.get("/circles/:id", async (req, reply) => {
    const member = await assertRequestMember(db, req.params.id, req, reply);
    if (!member) return;
    const circle = await db.careCircle.findUnique({
      where:   { id: req.params.id },
      include: circleInclude,
    });
    if (!circle) return reply.code(404).send({ error: "Not found" });
    const accessContext = await loadReceiverAccessContext(db, {
      circleId: req.params.id,
      member,
      userId: member.userId,
    });
    return filteredCircleForMember(circle, member, accessContext);
  });

  // GET /circles/:id/insights/completion — admin only
  app.get("/circles/:id/insights/completion", async (req, reply) => {
    const requestedDays = Number.parseInt(req.query?.days ?? "7", 10);
    const recipientId = req.query?.recipientId || null;
    const periodDays = Number.isInteger(requestedDays) ? Math.min(30, Math.max(7, requestedDays)) : 7;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    if (recipientId) {
      const recipient = await db.careRecipient.findFirst({
        where: { id: recipientId, circleId: req.params.id },
      });
      if (!recipient) return reply.code(404).send({ error: "Recipient not found" });
    }

    const now = new Date(Date.now());
    const since = new Date(now);
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (periodDays - 1));
    const recipientScope = recipientId ? { recipientId } : {};

    const [completedTasks, activeTasks, allTasks, circleRecipients] = await Promise.all([
      db.task.findMany({
        where: {
          circleId: req.params.id,
          status: "DONE",
          completedAt: { gte: since },
          archivedAt: null,
          ...recipientScope,
        },
        include: {
          completedBy: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          recipient: { select: { id: true, name: true } },
        },
      }),
      db.task.findMany({
        where: {
          circleId: req.params.id,
          archivedAt: null,
          status: { in: ["PENDING", "IN_PROGRESS"] },
          ...recipientScope,
        },
        include: { recipient: { select: { id: true, name: true } } },
      }),
      db.task.findMany({
        where: {
          circleId: req.params.id,
          archivedAt: null,
        },
        include: { recipient: { select: { id: true, name: true } } },
      }),
      db.careRecipient.findMany({
        where: { circleId: req.params.id },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);
    const overdueCount = activeTasks.filter((task) => task.dueAt && task.dueAt < now).length;

    const dailyMap = new Map();
    for (let offset = 0; offset < periodDays; offset += 1) {
      const day = new Date(since);
      day.setUTCDate(day.getUTCDate() + offset);
      const date = day.toISOString().slice(0, 10);
      dailyMap.set(date, 0);
    }

    const caregiverCounts = new Map();
    for (const task of completedTasks) {
      const date = task.completedAt?.toISOString().slice(0, 10);
      if (date && dailyMap.has(date)) {
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
      }

      const caregiver = task.completedBy ?? task.assignee;
      if (!caregiver) continue;
      const current = caregiverCounts.get(caregiver.id) ?? {
        userId: caregiver.id,
        name: caregiver.name,
        email: caregiver.email,
        completedCount: 0,
      };
      current.completedCount += 1;
      caregiverCounts.set(caregiver.id, current);
    }

    const recipientBreakdown = circleRecipients.map((recipient) => {
      const tasksForRecipient = allTasks.filter((task) => task.recipientId === recipient.id);
      const completed = tasksForRecipient.filter((task) => task.status === "DONE" && task.completedAt && task.completedAt >= since).length;
      const active = tasksForRecipient.filter((task) => ["PENDING", "IN_PROGRESS"].includes(task.status)).length;
      const overdue = tasksForRecipient.filter((task) => ["PENDING", "IN_PROGRESS"].includes(task.status) && task.dueAt && task.dueAt < now).length;
      return {
        recipientId: recipient.id,
        name: recipient.name,
        completed,
        active,
        overdue,
      };
    });

    return {
      periodDays,
      selectedRecipientId: recipientId,
      completedByDay: [...dailyMap.entries()].map(([date, count]) => ({ date, count })),
      topCaregivers: [...caregiverCounts.values()]
        .sort((lhs, rhs) => rhs.completedCount - lhs.completedCount || lhs.name.localeCompare(rhs.name))
        .slice(0, 5),
      recipientBreakdown,
      totals: {
        completed: completedTasks.length,
        active: activeTasks.length,
        overdue: overdueCount,
      },
    };
  });

  // PATCH /circles/:id — admin only, update circle settings
  app.patch("/circles/:id", async (req, reply) => {
    const { userId, name, recipientName, archiveAfterDays } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;
    const normalizedDays = normalizedArchiveAfterDays(archiveAfterDays);

    const circle = await db.$transaction(async (tx) => {
      const updatedCircle = await tx.careCircle.update({
        where:   { id: req.params.id },
        data:    {
          ...(name && { name }),
          ...(recipientName && { recipientName }),
          ...(normalizedDays !== undefined && { archiveAfterDays: normalizedDays }),
        },
      });

      if (recipientName) {
        const primaryRecipient = await resolvePrimaryRecipient(tx, req.params.id);
        if (primaryRecipient) {
          await tx.careRecipient.update({
            where: { id: primaryRecipient.id },
            data: { name: recipientName },
          });
        } else {
          await tx.careRecipient.create({
            data: {
              circleId: req.params.id,
              name: recipientName,
              isPrimary: true,
            },
          });
        }
      }

      return tx.careCircle.findUnique({
        where: { id: updatedCircle.id },
        include: circleInclude,
      });
    });
    return circle;
  });

  // GET /circles/:id/recipients — members can view recipients
  app.get("/circles/:id/recipients", async (req, reply) => {
    const member = await assertRequestMember(db, req.params.id, req, reply);
    if (!member) return;
    const accessContext = await loadReceiverAccessContext(db, {
      circleId: req.params.id,
      member,
      userId: member.userId,
    });
    return accessContext.recipients;
  });

  // POST /circles/:id/recipients — admin only
  app.post("/circles/:id/recipients", async (req, reply) => {
    const { userId, name, relationship, notes } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;
    if (!name?.trim()) {
      return reply.code(400).send({ error: "name is required" });
    }

    const recipient = await db.$transaction(async (tx) => {
      const count = await tx.careRecipient.count({ where: { circleId: req.params.id } });
      const created = await tx.careRecipient.create({
        data: {
          circleId: req.params.id,
          name: name.trim(),
          relationship: relationship?.trim() || null,
          notes: notes?.trim() || null,
          sortOrder: count,
        },
      });
      await tx.event.create({
        data: {
          type: "RECIPIENT_ADDED",
          circleId: req.params.id,
          actorId: authenticatedUserId,
          payload: { recipientId: created.id, name: created.name },
        },
      });
      return created;
    });

    return reply.code(201).send(recipient);
  });

  // PATCH /circles/:id/recipients/:recipientId — admin only
  app.patch("/circles/:id/recipients/:recipientId", async (req, reply) => {
    const { userId, name, relationship, notes, isPrimary } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const existing = await db.careRecipient.findFirst({
      where: { id: req.params.recipientId, circleId: req.params.id },
    });
    if (!existing) return reply.code(404).send({ error: "Recipient not found" });

    const recipient = await db.$transaction(async (tx) => {
      if (isPrimary === true && !existing.isPrimary) {
        await tx.careRecipient.updateMany({
          where: { circleId: req.params.id },
          data: { isPrimary: false },
        });
      }
      const updated = await tx.careRecipient.update({
        where: { id: req.params.recipientId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(relationship !== undefined && { relationship: relationship?.trim() || null }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
          ...(isPrimary === true && { isPrimary: true }),
        },
      });

      if (updated.isPrimary && name?.trim()) {
        await tx.careCircle.update({
          where: { id: req.params.id },
          data: { recipientName: updated.name },
        });
      }

      await tx.event.create({
        data: {
          type: "RECIPIENT_UPDATED",
          circleId: req.params.id,
          actorId: authenticatedUserId,
          payload: { recipientId: updated.id },
        },
      });

      return updated;
    });

    return recipient;
  });

  // POST /circles/:id/recipients/reorder — admin only
  app.post("/circles/:id/recipients/reorder", async (req, reply) => {
    const { userId, recipientIds, primaryRecipientId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return reply.code(400).send({ error: "recipientIds must be a non-empty array" });
    }

    const recipients = await db.careRecipient.findMany({
      where: { circleId: req.params.id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const existingIds = recipients.map((recipient) => recipient.id).sort();
    const requestedIds = [...recipientIds].sort();
    if (existingIds.length !== requestedIds.length || existingIds.some((id, index) => id !== requestedIds[index])) {
      return reply.code(400).send({ error: "recipientIds must include every recipient in the circle exactly once" });
    }

    const nextPrimaryId = primaryRecipientId && recipientIds.includes(primaryRecipientId)
      ? primaryRecipientId
      : recipientIds[0];

    await db.$transaction(async (tx) => {
      for (const [index, recipientId] of recipientIds.entries()) {
        await tx.careRecipient.update({
          where: { id: recipientId },
          data: {
            sortOrder: index,
            isPrimary: recipientId === nextPrimaryId,
          },
        });
      }

      const primaryRecipient = await tx.careRecipient.findUnique({ where: { id: nextPrimaryId } });
      if (primaryRecipient) {
        await tx.careCircle.update({
          where: { id: req.params.id },
          data: { recipientName: primaryRecipient.name },
        });
      }

      await tx.event.create({
        data: {
          type: "RECIPIENT_UPDATED",
          circleId: req.params.id,
          actorId: authenticatedUserId,
          payload: { recipientIds, primaryRecipientId: nextPrimaryId },
        },
      });
    });

    return db.careRecipient.findMany({
      where: { circleId: req.params.id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
  });

  // DELETE /circles/:id/recipients/:recipientId — admin only
  app.delete("/circles/:id/recipients/:recipientId", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const recipient = await db.careRecipient.findFirst({
      where: { id: req.params.recipientId, circleId: req.params.id },
    });
    if (!recipient) return reply.code(404).send({ error: "Recipient not found" });

    const [recipientCount, recipientTaskCount] = await Promise.all([
      db.careRecipient.count({ where: { circleId: req.params.id } }),
      db.task.count({ where: { circleId: req.params.id, recipientId: req.params.recipientId, archivedAt: null } }),
    ]);

    if (recipientCount <= 1) {
      return reply.code(400).send({ error: "Every circle must keep at least one care recipient." });
    }
    if (recipientTaskCount > 0) {
      return reply.code(400).send({ error: "Move or archive this recipient's tasks before removing them." });
    }

    await db.$transaction(async (tx) => {
      await tx.careRecipient.delete({ where: { id: req.params.recipientId } });

      if (recipient.isPrimary) {
        const replacement = await tx.careRecipient.findFirst({
          where: { circleId: req.params.id },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        });
        if (replacement) {
          await tx.careRecipient.update({
            where: { id: replacement.id },
            data: { isPrimary: true },
          });
          await tx.careCircle.update({
            where: { id: req.params.id },
            data: { recipientName: replacement.name },
          });
        }
      }

      await tx.event.create({
        data: {
          type: "RECIPIENT_REMOVED",
          circleId: req.params.id,
          actorId: authenticatedUserId,
          payload: { recipientId: req.params.recipientId },
        },
      });
    });

    return reply.code(204).send();
  });

  // DELETE /circles/:id — admin only
  app.delete("/circles/:id", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    await db.careCircle.delete({ where: { id: req.params.id } });
    return reply.code(204).send();
  });

  // POST /circles/:id/members — authenticated self-join
  app.post("/circles/:id/members", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;

    const [user, circle] = await Promise.all([
      db.user.findUnique({ where: { id: authenticatedUserId } }),
      db.careCircle.findUnique({ where: { id: req.params.id } }),
    ]);
    if (!user)   return reply.code(404).send({ error: "User not found" });
    if (!circle) return reply.code(404).send({ error: "Circle not found" });

    const existing = await db.circleMember.findUnique({
      where: { userId_circleId: { userId: authenticatedUserId, circleId: req.params.id } },
    });
    if (existing) return reply.code(409).send({ error: "User is already a member" });
    if (!await ensureCircleCapacity(authenticatedUserId, reply)) return;

    try {
      const member = await db.circleMember.create({
        data: { circleId: req.params.id, userId: authenticatedUserId, role: "MEMBER" },
      });
      await logEvent(db, { type: "MEMBER_JOINED", circleId: req.params.id, actorId: authenticatedUserId, payload: { userId: authenticatedUserId } });
      return reply.code(201).send(member);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
        return reply.code(409).send({ error: "User is already a member" });
      throw err;
    }
  });

  // GET /circles/:id/invitations — admin only
  app.get("/circles/:id/invitations", async (req, reply) => {
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const requestedStatus = String(req.query?.status ?? "PENDING").toUpperCase();
    const status = ["PENDING", "ACCEPTED", "DECLINED", "REVOKED"].includes(requestedStatus)
      ? requestedStatus
      : "PENDING";

    return db.invitation.findMany({
      where: { circleId: req.params.id, status },
      include: invitationInclude,
      orderBy: { createdAt: "desc" },
    });
  });

  // POST /circles/:id/members/invite — admin invite by email, membership created on acceptance
  app.post("/circles/:id/members/invite", async (req, reply) => {
    const { userId, email, name, role, recipientId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = String(role ?? "MEMBER").toUpperCase();
    if (!normalizedEmail || !name?.trim()) {
      return reply.code(400).send({ error: "name and email are required" });
    }
    if (!["ADMIN", "MEMBER", "RECIPIENT"].includes(normalizedRole)) {
      return reply.code(400).send({ error: "role must be ADMIN, MEMBER, or RECIPIENT" });
    }

    const circle = await db.careCircle.findUnique({ where: { id: req.params.id } });
    if (!circle) return reply.code(404).send({ error: "Circle not found" });

    let invitedRecipient = null;
    if (recipientId !== undefined) {
      if (normalizedRole !== "RECIPIENT") {
        return reply.code(400).send({ error: "recipientId can only be used for care receiver invitations" });
      }
      invitedRecipient = await db.careRecipient.findFirst({
        where: { id: recipientId, circleId: req.params.id },
      });
      if (!invitedRecipient) {
        return reply.code(404).send({ error: "Care receiver not found" });
      }
      if (invitedRecipient.receiverUserId) {
        return reply.code(409).send({ error: "Care receiver already has an account" });
      }
    }

    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const existingMembership = await db.circleMember.findUnique({
        where: { userId_circleId: { userId: existingUser.id, circleId: req.params.id } },
      });
      if (existingMembership) {
        return reply.code(409).send({ error: "User is already a member" });
      }
    }

    const existingPending = await db.invitation.findFirst({
      where: { circleId: req.params.id, email: normalizedEmail, status: "PENDING" },
    });
    if (existingPending) {
      return reply.code(409).send({ error: "A pending invitation already exists for this email" });
    }

    const invitation = await db.$transaction(async (tx) => {
      const created = await tx.invitation.create({
        data: {
          circleId: req.params.id,
          email: normalizedEmail,
          name: name.trim(),
          role: normalizedRole,
          recipientId: invitedRecipient?.id ?? null,
          invitedById: authenticatedUserId,
        },
      });

      await tx.event.create({
        data: {
          type: "INVITE_CREATED",
          circleId: req.params.id,
          actorId: authenticatedUserId,
          payload: {
            invitationId: created.id,
            email: normalizedEmail,
            role: normalizedRole,
            recipientId: invitedRecipient?.id ?? null,
          },
        },
      });

      return tx.invitation.findUnique({
        where: { id: created.id },
        include: invitationInclude,
      });
    });

    return reply.code(201).send(invitation);
  });

  // DELETE /circles/:id/invitations/:inviteId — admin only
  app.delete("/circles/:id/invitations/:inviteId", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const invitation = await db.invitation.findUnique({ where: { id: req.params.inviteId } });
    if (!invitation || invitation.circleId !== req.params.id) {
      return reply.code(404).send({ error: "Invitation not found" });
    }
    if (invitation.status !== "PENDING") {
      return reply.code(409).send({ error: "Only pending invitations can be revoked" });
    }

    await db.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: req.params.inviteId },
        data: { status: "REVOKED" },
      });
      await tx.event.create({
        data: {
          type: "INVITE_REVOKED",
          circleId: req.params.id,
          actorId: authenticatedUserId,
          payload: { invitationId: req.params.inviteId },
        },
      });
    });

    return reply.code(204).send();
  });

  // DELETE /circles/:id/members/:memberId — admin only
  app.delete("/circles/:id/members/:memberId", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const target = await db.circleMember.findUnique({ where: { id: req.params.memberId } });
    if (!target || target.circleId !== req.params.id)
      return reply.code(404).send({ error: "Member not found" });

    if (target.role === "ADMIN") {
      const adminCount = await db.circleMember.count({
        where: { circleId: req.params.id, role: "ADMIN" },
      });
      if (adminCount <= 1)
        return reply.code(400).send({ error: "Cannot remove the last admin" });
    }

    await db.circleMember.delete({ where: { id: req.params.memberId } });
    await logEvent(db, { type: "MEMBER_REMOVED", circleId: req.params.id, actorId: authenticatedUserId, payload: { memberId: req.params.memberId } });
    return reply.code(204).send();
  });

  // PATCH /circles/:id/members/:memberId/role — admin only, prevent last admin demotion
  app.patch("/circles/:id/members/:memberId/role", async (req, reply) => {
    const { userId, role } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!role || !["ADMIN", "MEMBER"].includes(role))
      return reply.code(400).send({ error: "role must be ADMIN or MEMBER" });
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const target = await db.circleMember.findUnique({ where: { id: req.params.memberId } });
    if (!target || target.circleId !== req.params.id)
      return reply.code(404).send({ error: "Member not found" });

    if (role === "MEMBER" && target.role === "ADMIN") {
      const adminCount = await db.circleMember.count({
        where: { circleId: req.params.id, role: "ADMIN" },
      });
      if (adminCount <= 1)
        return reply.code(400).send({ error: "Cannot demote the last admin" });
    }

    const updated = await db.circleMember.update({
      where: { id: req.params.memberId },
      data:  { role },
    });
    await logEvent(db, {
      type: "MEMBER_ROLE_UPDATED",
      circleId: req.params.id,
      actorId: authenticatedUserId,
      payload: { memberId: req.params.memberId, role },
    });
    return updated;
  });

  // GET /circles/:id/members/:memberId/recipient-access — admin only
  app.get("/circles/:id/members/:memberId/recipient-access", async (req, reply) => {
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;
    const caregiver = await caregiverMemberOrReply(req.params.id, req.params.memberId, reply);
    if (!caregiver) return;

    const [recipients, grants] = await Promise.all([
      db.careRecipient.findMany({
        where: { circleId: req.params.id },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      db.careRecipientAccess.findMany({
        where: { memberId: caregiver.id, revokedAt: null },
      }),
    ]);
    const grantByRecipientId = new Map(grants.map((grant) => [grant.recipientId, grant]));
    return recipients.map((recipient) => ({
      recipientId: recipient.id,
      name: recipient.name,
      activationStatus: recipient.activationStatus,
      hasAccess: grantByRecipientId.has(recipient.id),
      grantedAt: grantByRecipientId.get(recipient.id)?.grantedAt ?? null,
    }));
  });

  // PUT /circles/:id/members/:memberId/recipient-access/:recipientId — admin only
  app.put("/circles/:id/members/:memberId/recipient-access/:recipientId", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const caregiver = await caregiverMemberOrReply(req.params.id, req.params.memberId, reply);
    if (!caregiver) return;
    const recipient = await db.careRecipient.findFirst({
      where: { id: req.params.recipientId, circleId: req.params.id },
    });
    if (!recipient) return reply.code(404).send({ error: "Care receiver not found" });

    const [existingGrant] = await db.careRecipientAccess.findMany({
      where: { memberId: caregiver.id, recipientId: recipient.id },
    });
    let grant;
    if (existingGrant && !existingGrant.revokedAt) {
      grant = existingGrant;
    } else if (existingGrant) {
      grant = await db.careRecipientAccess.update({
        where: { id: existingGrant.id },
        data: {
          revokedAt: null,
          grantedAt: new Date(),
          grantedById: authenticatedUserId,
        },
      });
    } else {
      grant = await db.careRecipientAccess.create({
        data: {
          memberId: caregiver.id,
          recipientId: recipient.id,
          grantedById: authenticatedUserId,
        },
      });
    }

    await logEvent(db, {
      type: "RECIPIENT_ACCESS_GRANTED",
      circleId: req.params.id,
      actorId: authenticatedUserId,
      payload: { memberId: caregiver.id, recipientId: recipient.id },
    });
    return grant;
  });

  // DELETE /circles/:id/members/:memberId/recipient-access/:recipientId — admin only
  app.delete("/circles/:id/members/:memberId/recipient-access/:recipientId", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;
    if (!await assertRequestAdmin(db, req.params.id, req, reply)) return;

    const caregiver = await caregiverMemberOrReply(req.params.id, req.params.memberId, reply);
    if (!caregiver) return;
    const recipient = await db.careRecipient.findFirst({
      where: { id: req.params.recipientId, circleId: req.params.id },
    });
    if (!recipient) return reply.code(404).send({ error: "Care receiver not found" });

    const [existingGrant] = await db.careRecipientAccess.findMany({
      where: { memberId: caregiver.id, recipientId: recipient.id, revokedAt: null },
    });
    if (!existingGrant) return reply.code(404).send({ error: "Receiver access grant not found" });

    await db.careRecipientAccess.update({
      where: { id: existingGrant.id },
      data: { revokedAt: new Date() },
    });
    await logEvent(db, {
      type: "RECIPIENT_ACCESS_REVOKED",
      circleId: req.params.id,
      actorId: authenticatedUserId,
      payload: { memberId: caregiver.id, recipientId: recipient.id },
    });
    return reply.code(204).send();
  });

  // POST /invitations/:inviteId/accept — authenticated user accepts own pending invite
  app.post("/invitations/:inviteId/accept", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;

    const [user, invitation] = await Promise.all([
      db.user.findUnique({ where: { id: authenticatedUserId } }),
      findInvitationOr404(req.params.inviteId, reply),
    ]);
    if (!invitation) return;
    if (!user) return reply.code(404).send({ error: "User not found" });
    if (normalizeEmail(user.email) !== invitation.email) {
      return reply.code(403).send({ error: "Invitation email does not match the authenticated user" });
    }

    const existingMembership = await db.circleMember.findUnique({
      where: { userId_circleId: { userId: authenticatedUserId, circleId: invitation.circleId } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (existingMembership) {
      if (invitation.status === "PENDING") {
        await db.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedById: authenticatedUserId },
        });
      }
      return reply.send(existingMembership);
    }

    if (invitation.status !== "PENDING") {
      return reply.code(409).send({ error: `Invitation is already ${invitation.status.toLowerCase()}` });
    }
    if (!await ensureCircleCapacity(authenticatedUserId, reply)) return;

    const member = await db.$transaction(async (tx) => {
      const created = await tx.circleMember.create({
        data: { circleId: invitation.circleId, userId: authenticatedUserId, role: invitation.role },
      });

      if (invitation.role === "RECIPIENT") {
        if (invitation.recipientId) {
          await tx.careRecipient.update({
            where: { id: invitation.recipientId },
            data: activationForAcceptedReceiver(authenticatedUserId),
          });
        } else {
          const existing = await tx.careRecipient.findFirst({
            where: { circleId: invitation.circleId },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          });
          const isPrimary = !existing;
          await tx.careRecipient.create({
            data: {
              circleId: invitation.circleId,
              name: user.name,
              isPrimary,
              ...activationForAcceptedReceiver(authenticatedUserId),
            },
          });
        }
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedById: authenticatedUserId,
        },
      });
      await tx.event.create({
        data: {
          type: "INVITE_ACCEPTED",
          circleId: invitation.circleId,
          actorId: authenticatedUserId,
          payload: { invitationId: invitation.id, role: invitation.role },
        },
      });
      await tx.event.create({
        data: {
          type: "MEMBER_JOINED",
          circleId: invitation.circleId,
          actorId: authenticatedUserId,
          payload: { userId: authenticatedUserId, invitationId: invitation.id, role: invitation.role },
        },
      });
      return tx.circleMember.findUnique({
        where: { id: created.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    return reply.code(201).send(member);
  });

  // POST /invitations/:inviteId/decline — authenticated user declines own pending invite
  app.post("/invitations/:inviteId/decline", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (rejectUserMismatch(userId, authenticatedUserId, reply)) return;

    const [user, invitation] = await Promise.all([
      db.user.findUnique({ where: { id: authenticatedUserId } }),
      findInvitationOr404(req.params.inviteId, reply),
    ]);
    if (!invitation) return;
    if (!user) return reply.code(404).send({ error: "User not found" });
    if (normalizeEmail(user.email) !== invitation.email) {
      return reply.code(403).send({ error: "Invitation email does not match the authenticated user" });
    }
    if (invitation.status !== "PENDING") {
      return reply.code(409).send({ error: `Invitation is already ${invitation.status.toLowerCase()}` });
    }

    await db.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "DECLINED" },
      });
      await tx.event.create({
        data: {
          type: "INVITE_DECLINED",
          circleId: invitation.circleId,
          actorId: authenticatedUserId,
          payload: { invitationId: invitation.id },
        },
      });
    });

    return reply.send({ declined: true });
  });

  // GET /circles/:circleId/events
  app.get("/circles/:circleId/events", async (req, reply) => {
    const member = await assertRequestMember(db, req.params.circleId, req, reply);
    if (!member) return;
    const [events, tasks, accessContext] = await Promise.all([
      db.event.findMany({
        where:   { circleId: req.params.circleId },
        orderBy: { createdAt: "desc" },
        take:    100,
        include: { actor: { select: { id: true, name: true } } },
      }),
      db.task.findMany({
        where: { circleId: req.params.circleId, archivedAt: null },
        orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      }),
      loadReceiverAccessContext(db, {
        circleId: req.params.circleId,
        member,
        userId: member.userId,
      }),
    ]);
    if (isCareOrganizer(member)) return events;
    const visibleTaskIds = new Set(
      filterVisibleTasks(tasks, { member, userId: member.userId, accessContext }).map((task) => task.id),
    );
    return events.filter((event) => eventVisibleToMember(event, member, accessContext, visibleTaskIds));
  });
}
