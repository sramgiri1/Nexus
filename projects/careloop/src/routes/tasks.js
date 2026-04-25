import { assertMember, logEvent } from "../lib/roles.js";

const taskInclude = {
  assignee: { select: { id: true, name: true } },
};

export default async function tasks(app) {
  const db = app.db;

  // POST /circles/:circleId/tasks
  app.post("/circles/:circleId/tasks", async (req, reply) => {
    const { title, notes, dueAt, priority, creatorId, assigneeId } = req.body ?? {};
    if (!title || !creatorId)
      return reply.code(400).send({ error: "title and creatorId are required" });
    if (title.length > 200)
      return reply.code(400).send({ error: "title exceeds 200 characters" });
    if (notes && notes.length > 1000)
      return reply.code(400).send({ error: "notes exceeds 1000 characters" });

    const member = await assertMember(db, req.params.circleId, creatorId, reply);
    if (!member) return;

    const task = await db.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: {
          title,
          notes:      notes ?? null,
          priority:   priority ?? "NORMAL",
          dueAt:      dueAt ? new Date(dueAt) : undefined,
          circleId:   req.params.circleId,
          creatorId,
          assigneeId: assigneeId ?? null,
        },
        include: taskInclude,
      });

      if (dueAt) {
        const scheduledAt = new Date(new Date(dueAt).getTime() - 15 * 60 * 1000);
        await tx.reminder.create({ data: { taskId: t.id, scheduledAt } });
      }

      await tx.event.create({
        data: { type: "TASK_CREATED", circleId: req.params.circleId, actorId: creatorId, payload: { taskId: t.id, title } },
      });

      return t;
    });

    return reply.code(201).send(task);
  });

  // GET /circles/:circleId/tasks
  app.get("/circles/:circleId/tasks", async (req) => {
    return db.task.findMany({
      where:   { circleId: req.params.circleId },
      orderBy: { dueAt: "asc" },
      include: taskInclude,
    });
  });

  // PATCH /circles/:circleId/tasks/:taskId
  app.patch("/circles/:circleId/tasks/:taskId", async (req, reply) => {
    const { userId, status, title, notes, dueAt, priority, assigneeId } = req.body ?? {};

    const member = await assertMember(db, req.params.circleId, userId, reply);
    if (!member) return;

    const task = await db.task.findFirst({
      where: { id: req.params.taskId, circleId: req.params.circleId },
    });
    if (!task) return reply.code(404).send({ error: "Task not found" });

    if (member.role === "MEMBER") {
      if (assigneeId !== undefined)
        return reply.code(403).send({ error: "Members cannot reassign tasks" });
      const isOwn = task.creatorId === userId;
      if (!isOwn && (title !== undefined || notes !== undefined || dueAt !== undefined || priority !== undefined))
        return reply.code(403).send({ error: "Members can only edit their own tasks" });
      if (status === "SKIPPED" && !isOwn)
        return reply.code(403).send({ error: "Members can only skip their own tasks" });
    }

    const data = {};
    if (status     !== undefined) data.status     = status;
    if (title      !== undefined) data.title      = title;
    if (notes      !== undefined) data.notes      = notes;
    if (dueAt      !== undefined) data.dueAt      = dueAt ? new Date(dueAt) : null;
    if (priority   !== undefined) data.priority   = priority;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;

    const updated = await db.task.update({
      where:   { id: req.params.taskId },
      data,
      include: taskInclude,
    });

    if (status === "DONE" && task.status !== "DONE") {
      await logEvent(db, {
        type: "TASK_COMPLETED", circleId: req.params.circleId,
        actorId: userId, payload: { taskId: task.id },
      });
    } else if (status && status !== task.status) {
      await logEvent(db, {
        type: "TASK_UPDATED", circleId: req.params.circleId,
        actorId: userId, payload: { taskId: task.id, status },
      });
    }

    return updated;
  });

  // DELETE /circles/:circleId/tasks/:taskId — admin or own task
  app.delete("/circles/:circleId/tasks/:taskId", async (req, reply) => {
    const { userId } = req.body ?? {};

    const member = await assertMember(db, req.params.circleId, userId, reply);
    if (!member) return;

    const task = await db.task.findFirst({
      where: { id: req.params.taskId, circleId: req.params.circleId },
    });
    if (!task) return reply.code(404).send({ error: "Task not found" });

    if (member.role === "MEMBER" && task.creatorId !== userId)
      return reply.code(403).send({ error: "Members can only delete their own tasks" });

    await db.task.delete({ where: { id: req.params.taskId } });
    await logEvent(db, {
      type: "TASK_DELETED", circleId: req.params.circleId,
      actorId: userId, payload: { taskId: task.id },
    });
    return reply.code(204).send();
  });
}
