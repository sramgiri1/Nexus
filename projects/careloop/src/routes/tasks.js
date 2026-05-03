import { randomUUID } from "node:crypto";
import { assertRequestMember, logEvent, requireAuthenticatedUser } from "../lib/roles.js";
import { deliverTaskNotification } from "../lib/push.js";
import {
  isRecurringTask,
  isTerminalTaskStatus,
  nextDueAtForTask,
  normalizeRecurrenceInput,
  recurrenceFields,
} from "../lib/recurrence.js";

const taskInclude = {
  assignee: { select: { id: true, email: true, name: true, phone: true, pushToken: true, timezone: true } },
  completedBy: { select: { id: true, name: true, email: true } },
  recipient: { select: { id: true, name: true, relationship: true, notes: true, isPrimary: true, sortOrder: true } },
  circle: { select: { id: true, name: true } },
};

function parseOptionalDate(value, fieldName) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO8601 date`);
  }
  return date;
}

function completionStateForStatus(nextStatus) {
  if (nextStatus === "DONE" || nextStatus === "SKIPPED") {
    return new Date();
  }
  return null;
}

function nextSeriesScope(raw) {
  return String(raw ?? "THIS_OCCURRENCE").toUpperCase() === "SERIES"
    ? "SERIES"
    : "THIS_OCCURRENCE";
}

async function syncReminderForTask(tx, taskId, dueAt) {
  if (dueAt) {
    const scheduledAt = new Date(dueAt.getTime() - 15 * 60 * 1000);
    const existingReminder = await tx.reminder.findFirst({ where: { taskId } });
    if (existingReminder) {
      await tx.reminder.update({
        where: { id: existingReminder.id },
        data: {
          scheduledAt,
          status: "PENDING",
          sentAt: null,
          escalatedAt: null,
        },
      });
    } else {
      await tx.reminder.create({ data: { taskId, scheduledAt } });
    }
    return;
  }

  await tx.reminder.deleteMany({ where: { taskId } });
}

async function createTaskRecord(tx, data) {
  const task = await tx.task.create({
    data,
    include: taskInclude,
  });

  await syncReminderForTask(tx, task.id, task.dueAt);
  return task;
}

async function ensureNextRecurringOccurrence(tx, task) {
  const nextDueAt = nextDueAtForTask(task);
  if (!nextDueAt || !task.seriesId) return null;

  const existing = await tx.task.findFirst({
    where: {
      seriesId: task.seriesId,
      dueAt: nextDueAt,
    },
  });
  if (existing) return existing;

  return createTaskRecord(tx, {
    title: task.title,
    notes: task.notes,
    dueAt: nextDueAt,
    priority: task.priority,
    recipientId: task.recipientId,
    recurrenceFrequency: task.recurrenceFrequency,
    recurrenceInterval: task.recurrenceInterval,
    recurrenceWeekdays: task.recurrenceWeekdays ?? [],
    recurrenceEndsAt: task.recurrenceEndsAt ?? null,
    seriesId: task.seriesId,
    circleId: task.circleId,
    creatorId: task.creatorId,
    assigneeId: task.assigneeId ?? null,
  });
}

export default async function tasks(app) {
  const db = app.db;

  async function resolveRecipientId(tx, circleId, requestedRecipientId, assigneeId) {
    if (requestedRecipientId) {
      const recipient = await tx.careRecipient.findFirst({
        where: { id: requestedRecipientId, circleId },
      });
      if (!recipient) throw new Error("recipientId must belong to this circle");
      return recipient.id;
    }

    const primaryRecipient = await tx.careRecipient.findFirst({
      where: { circleId },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (primaryRecipient) return primaryRecipient.id;

    // No CareRecipient profile exists yet. If the assignee is a RECIPIENT member,
    // auto-create their profile so tasks can be saved without manual setup.
    if (assigneeId) {
      const assigneeMember = await tx.circleMember.findUnique({
        where: { userId_circleId: { userId: assigneeId, circleId } },
        include: { user: true },
      });
      if (assigneeMember?.role === "RECIPIENT" && assigneeMember.user) {
        return (await tx.careRecipient.create({
          data: { circleId, name: assigneeMember.user.name, isPrimary: true },
        })).id;
      }
    }

    return null;
  }

  // POST /circles/:circleId/tasks
  app.post("/circles/:circleId/tasks", async (req, reply) => {
    const { title, notes, dueAt, priority, creatorId, assigneeId, recurrence, recipientId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (!title)
      return reply.code(400).send({ error: "title is required" });
    if (creatorId && creatorId !== authenticatedUserId) {
      return reply.code(403).send({ error: "creatorId must match the authenticated user" });
    }
    if (title.length > 200)
      return reply.code(400).send({ error: "title exceeds 200 characters" });
    if (notes && notes.length > 1000)
      return reply.code(400).send({ error: "notes exceeds 1000 characters" });

    const member = await assertRequestMember(db, req.params.circleId, req, reply);
    if (!member) return;

    const dueDate = parseOptionalDate(dueAt, "dueAt");
    let normalizedRecurrence;
    try {
      normalizedRecurrence = normalizeRecurrenceInput(recurrence);
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }

    if (normalizedRecurrence.frequency !== "NONE" && !dueDate) {
      return reply.code(400).send({ error: "Recurring tasks require dueAt" });
    }

    const seriesId = normalizedRecurrence.frequency === "NONE" ? null : randomUUID();

    let task;
    try {
      task = await db.$transaction(async (tx) => {
        const resolvedRecipientId = await resolveRecipientId(tx, req.params.circleId, recipientId, assigneeId);
        if (!resolvedRecipientId) throw new Error("recipientId is required");

        const createdTask = await createTaskRecord(tx, {
          title,
          notes: notes ?? null,
          priority: priority ?? "NORMAL",
          dueAt: dueDate,
          circleId: req.params.circleId,
          recipientId: resolvedRecipientId,
          creatorId: authenticatedUserId,
          assigneeId: assigneeId ?? null,
          ...recurrenceFields(normalizedRecurrence, seriesId),
        });

        if (seriesId) {
          await tx.event.create({
            data: {
              type: "TASK_SERIES_CREATED",
              circleId: req.params.circleId,
              actorId: authenticatedUserId,
              payload: {
                seriesId,
                taskId: createdTask.id,
                frequency: normalizedRecurrence.frequency,
              },
            },
          });
        }

        await tx.event.create({
          data: { type: "TASK_CREATED", circleId: req.params.circleId, actorId: authenticatedUserId, payload: { taskId: createdTask.id, title } },
        });

        return createdTask;
      });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }

    if (task.assigneeId) {
      const assigneeMember = await db.circleMember.findUnique({
        where: { userId_circleId: { userId: task.assigneeId, circleId: task.circleId } },
        select: { role: true },
      });
      const notifType = assigneeMember?.role === "RECIPIENT" ? "recipientAssignment" : "assignment";
      await deliverTaskNotification({ db, userId: task.assigneeId, task, type: notifType });
    }

    return reply.code(201).send(task);
  });

  // GET /circles/:circleId/tasks
  app.get("/circles/:circleId/tasks", async (req, reply) => {
    if (!await assertRequestMember(db, req.params.circleId, req, reply)) return;
    return db.task.findMany({
      where: { circleId: req.params.circleId, archivedAt: null },
      orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      include: taskInclude,
    });
  });

  // PATCH /circles/:circleId/tasks/:taskId
  app.patch("/circles/:circleId/tasks/:taskId", async (req, reply) => {
    const { userId, status, title, notes, dueAt, priority, assigneeId, recipientId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (userId && userId !== authenticatedUserId) {
      return reply.code(403).send({ error: "userId must match the authenticated user" });
    }
    const recurrenceWasProvided = Object.prototype.hasOwnProperty.call(req.body ?? {}, "recurrence");
    const seriesScope = nextSeriesScope(req.body?.seriesScope);

    const member = await assertRequestMember(db, req.params.circleId, req, reply);
    if (!member) return;

    const task = await db.task.findFirst({
      where: { id: req.params.taskId, circleId: req.params.circleId },
    });
    if (!task) return reply.code(404).send({ error: "Task not found" });

    if (title !== undefined && title.length > 200)
      return reply.code(400).send({ error: "title exceeds 200 characters" });
    if (notes !== undefined && notes && notes.length > 1000)
      return reply.code(400).send({ error: "notes exceeds 1000 characters" });

    if (member.role === "RECIPIENT") {
      const isAssignedToMe = task.assigneeId === authenticatedUserId;
      if (!isAssignedToMe || status === undefined || assigneeId !== undefined || recipientId !== undefined
          || title !== undefined || notes !== undefined || dueAt !== undefined || priority !== undefined || recurrenceWasProvided)
        return reply.code(403).send({ error: "Care receivers can only mark their own assigned tasks as done" });
      if (status !== "DONE")
        return reply.code(403).send({ error: "Care receivers can only mark tasks as done" });
    }

    if (member.role === "MEMBER") {
      if (assigneeId !== undefined)
        return reply.code(403).send({ error: "Members cannot reassign tasks" });
      if (recipientId !== undefined)
        return reply.code(403).send({ error: "Members cannot reassign task recipients" });
      const isOwn = task.creatorId === authenticatedUserId;
      if (!isOwn && (title !== undefined || notes !== undefined || dueAt !== undefined || priority !== undefined || recurrenceWasProvided))
        return reply.code(403).send({ error: "Members can only edit their own tasks" });
      if (status === "SKIPPED" && !isOwn)
        return reply.code(403).send({ error: "Members can only skip their own tasks" });
    }

    const currentDueAt = task.dueAt ?? null;
    const nextDueAt = dueAt !== undefined
      ? parseOptionalDate(dueAt, "dueAt")
      : currentDueAt;

    let normalizedRecurrence = null;
    if (recurrenceWasProvided) {
      try {
        normalizedRecurrence = normalizeRecurrenceInput(req.body.recurrence);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }

    const nextRecurrenceFrequency = recurrenceWasProvided
      ? normalizedRecurrence.frequency
      : task.recurrenceFrequency;
    if (nextRecurrenceFrequency !== "NONE" && !nextDueAt) {
      return reply.code(400).send({ error: "Recurring tasks require dueAt" });
    }
    if (seriesScope === "SERIES" && task.seriesId && status !== undefined && status !== task.status) {
      return reply.code(400).send({ error: "Status updates only apply to a single occurrence" });
    }

    const data = {};
    if (status !== undefined) {
      data.status = status;
      data.completedAt = completionStateForStatus(status);
      data.completedById = status === "DONE" ? authenticatedUserId : null;
      data.archivedAt = null;
    }
    if (title !== undefined) data.title = title;
    if (notes !== undefined) data.notes = notes;
    if (dueAt !== undefined) data.dueAt = nextDueAt;
    if (priority !== undefined) data.priority = priority;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;

    const previousAssigneeId = task.assigneeId;
    const applyToSeries = seriesScope === "SERIES" && Boolean(task.seriesId) && (
      title !== undefined
      || notes !== undefined
      || dueAt !== undefined
      || priority !== undefined
      || assigneeId !== undefined
      || recipientId !== undefined
      || recurrenceWasProvided
    );
    let updated;
    try {
      updated = await db.$transaction(async (tx) => {
        if (recipientId !== undefined) {
          const resolvedRecipientId = await resolveRecipientId(tx, req.params.circleId, recipientId);
          if (!resolvedRecipientId) throw new Error("recipientId is required");
          data.recipientId = resolvedRecipientId;
        }

        if (recurrenceWasProvided) {
          const seriesId = normalizedRecurrence.frequency === "NONE"
            ? null
            : (task.seriesId ?? randomUUID());
          Object.assign(data, recurrenceFields(normalizedRecurrence, seriesId));
        }

        let nextTask;
        if (applyToSeries) {
          const futureTasks = await tx.task.findMany({
            where: {
              circleId: req.params.circleId,
              seriesId: task.seriesId,
              archivedAt: null,
              dueAt: task.dueAt ? { gte: task.dueAt } : undefined,
              status: { in: ["PENDING", "IN_PROGRESS"] },
            },
          });
          const dueShiftMs = dueAt !== undefined && task.dueAt && nextDueAt
            ? nextDueAt.getTime() - task.dueAt.getTime()
            : null;

          for (const seriesTask of futureTasks) {
            const seriesData = { ...data };
            if (dueShiftMs !== null && seriesTask.dueAt) {
              seriesData.dueAt = new Date(seriesTask.dueAt.getTime() + dueShiftMs);
            }

            const seriesUpdatedTask = await tx.task.update({
              where: { id: seriesTask.id },
              data: seriesData,
              include: taskInclude,
            });

            if (dueAt !== undefined) {
              await syncReminderForTask(tx, seriesUpdatedTask.id, seriesUpdatedTask.dueAt);
            }

            if (seriesTask.id === req.params.taskId) {
              nextTask = seriesUpdatedTask;
            }
          }

          if (!nextTask) {
            nextTask = await tx.task.findFirst({
              where: { id: req.params.taskId, circleId: req.params.circleId },
              include: taskInclude,
            });
          }
        } else {
          nextTask = await tx.task.update({
            where: { id: req.params.taskId },
            data,
            include: taskInclude,
          });

          if (dueAt !== undefined) {
            await syncReminderForTask(tx, nextTask.id, nextTask.dueAt);
          }
        }

        if (recurrenceWasProvided && task.recurrenceFrequency === "NONE" && nextTask.recurrenceFrequency !== "NONE" && nextTask.seriesId) {
          await tx.event.create({
            data: {
              type: "TASK_SERIES_CREATED",
              circleId: req.params.circleId,
              actorId: authenticatedUserId,
              payload: {
                seriesId: nextTask.seriesId,
                taskId: nextTask.id,
                frequency: nextTask.recurrenceFrequency,
              },
            },
          });
        }

        if (!isTerminalTaskStatus(task.status) && isTerminalTaskStatus(nextTask.status) && isRecurringTask(nextTask)) {
          await ensureNextRecurringOccurrence(tx, nextTask);
        }

        return nextTask;
      });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }

    if (status === "DONE" && task.status !== "DONE") {
      await logEvent(db, {
        type: "TASK_COMPLETED",
        circleId: req.params.circleId,
        actorId: authenticatedUserId,
        payload: { taskId: task.id },
      });

      if (updated.assigneeId && updated.assigneeId !== authenticatedUserId) {
        const assigneeMember = await db.circleMember.findUnique({
          where: { userId_circleId: { userId: updated.assigneeId, circleId: updated.circleId } },
          select: { role: true },
        });
        if (assigneeMember?.role === "RECIPIENT") {
          const completerFirst = updated.completedBy?.name?.split(" ")[0] ?? "Your caregiver";
          await deliverTaskNotification({
            db, userId: updated.assigneeId, task: updated,
            type: "taskCompletedForRecipient", extra: completerFirst,
          });
        }
      } else if (member.role === "RECIPIENT" && updated.creatorId !== authenticatedUserId) {
        const recipientName = updated.recipient?.name ?? updated.completedBy?.name ?? "Care receiver";
        await deliverTaskNotification({
          db, userId: updated.creatorId, task: updated,
          type: "recipientCompletedTask", extra: recipientName,
        });
      }
    } else if (
      status && status !== task.status
      || recurrenceWasProvided
      || title !== undefined
      || notes !== undefined
      || dueAt !== undefined
      || priority !== undefined
      || assigneeId !== undefined
      || recipientId !== undefined
    ) {
      await logEvent(db, {
        type: "TASK_UPDATED",
        circleId: req.params.circleId,
        actorId: authenticatedUserId,
        payload: { taskId: task.id, status: status ?? task.status, seriesScope },
      });
    }

    if (assigneeId !== undefined && assigneeId && assigneeId !== previousAssigneeId) {
      const assigneeMember = await db.circleMember.findUnique({
        where: { userId_circleId: { userId: assigneeId, circleId: updated.circleId } },
        select: { role: true },
      });
      const notifType = assigneeMember?.role === "RECIPIENT" ? "recipientAssignment" : "assignment";
      await deliverTaskNotification({ db, userId: assigneeId, task: updated, type: notifType });
    }

    return updated;
  });

  // DELETE /circles/:circleId/tasks/:taskId — admin or own task
  app.delete("/circles/:circleId/tasks/:taskId", async (req, reply) => {
    const { userId } = req.body ?? {};
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (userId && userId !== authenticatedUserId) {
      return reply.code(403).send({ error: "userId must match the authenticated user" });
    }

    const member = await assertRequestMember(db, req.params.circleId, req, reply);
    if (!member) return;

    const task = await db.task.findFirst({
      where: { id: req.params.taskId, circleId: req.params.circleId },
    });
    if (!task) return reply.code(404).send({ error: "Task not found" });

    if (member.role === "MEMBER" && task.creatorId !== authenticatedUserId)
      return reply.code(403).send({ error: "Members can only delete their own tasks" });

    await db.task.delete({ where: { id: req.params.taskId } });
    await logEvent(db, {
      type: "TASK_DELETED",
      circleId: req.params.circleId,
      actorId: authenticatedUserId,
      payload: { taskId: task.id },
    });
    return reply.code(204).send();
  });

  const commentInclude = {
    author: { select: { id: true, name: true } },
  };

  // GET /circles/:circleId/tasks/:taskId/comments
  app.get("/circles/:circleId/tasks/:taskId/comments", async (req, reply) => {
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (!await assertRequestMember(db, req.params.circleId, req, reply)) return;
    const task = await db.task.findFirst({
      where: { id: req.params.taskId, circleId: req.params.circleId },
      select: { id: true },
    });
    if (!task) return reply.code(404).send({ error: "Task not found" });
    return db.taskComment.findMany({
      where: { taskId: req.params.taskId },
      orderBy: { createdAt: "asc" },
      include: commentInclude,
    });
  });

  // POST /circles/:circleId/tasks/:taskId/comments
  app.post("/circles/:circleId/tasks/:taskId/comments", async (req, reply) => {
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    if (!await assertRequestMember(db, req.params.circleId, req, reply)) return;
    const { body } = req.body ?? {};
    if (!body?.trim()) return reply.code(400).send({ error: "body is required" });
    const task = await db.task.findFirst({
      where: { id: req.params.taskId, circleId: req.params.circleId },
      select: { id: true },
    });
    if (!task) return reply.code(404).send({ error: "Task not found" });
    const comment = await db.taskComment.create({
      data: { body: body.trim(), taskId: req.params.taskId, authorId: authenticatedUserId },
      include: commentInclude,
    });
    return reply.code(201).send(comment);
  });

  // DELETE /circles/:circleId/tasks/:taskId/comments/:commentId
  app.delete("/circles/:circleId/tasks/:taskId/comments/:commentId", async (req, reply) => {
    const authenticatedUserId = requireAuthenticatedUser(req, reply);
    if (!authenticatedUserId) return;
    const member = await assertRequestMember(db, req.params.circleId, req, reply);
    if (!member) return;
    const comment = await db.taskComment.findFirst({
      where: { id: req.params.commentId, taskId: req.params.taskId },
      select: { id: true, authorId: true },
    });
    if (!comment) return reply.code(404).send({ error: "Comment not found" });
    if (member.role !== "ADMIN" && comment.authorId !== authenticatedUserId)
      return reply.code(403).send({ error: "Only admins or the comment author can delete comments" });
    await db.taskComment.delete({ where: { id: req.params.commentId } });
    return reply.code(204).send();
  });
}
