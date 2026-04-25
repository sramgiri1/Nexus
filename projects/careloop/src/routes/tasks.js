export default async function tasks(app) {
  const db = app.db;

  app.post("/circles/:circleId/tasks", async (req, reply) => {
    const { title, notes, dueAt, priority, assigneeId, creatorId } = req.body;
    const task = await db.task.create({
      data: {
        title, notes, priority,
        dueAt:      dueAt ? new Date(dueAt) : undefined,
        circleId:   req.params.circleId,
        creatorId,
        assigneeId,
      },
    });
    reply.code(201).send(task);
  });

  app.get("/circles/:circleId/tasks", async (req) => {
    return db.task.findMany({
      where:   { circleId: req.params.circleId },
      orderBy: { dueAt: "asc" },
      include: { assignee: true, reminders: true },
    });
  });

  app.patch("/circles/:circleId/tasks/:taskId", async (req, reply) => {
    const task = await db.task.update({
      where: { id: req.params.taskId },
      data:  req.body,
    });
    return task;
  });
}
