export default async function circles(app) {
  const db = app.db;

  app.post("/circles", async (req, reply) => {
    const { name, recipientName } = req.body;
    const circle = await db.careCircle.create({ data: { name, recipientName } });
    reply.code(201).send(circle);
  });

  app.get("/circles/:id", async (req, reply) => {
    const circle = await db.careCircle.findUnique({
      where: { id: req.params.id },
      include: { members: { include: { user: true } }, tasks: true },
    });
    if (!circle) return reply.code(404).send({ error: "Not found" });
    return circle;
  });

  app.post("/circles/:id/members", async (req, reply) => {
    const { userId, role } = req.body;
    const member = await db.circleMember.create({
      data: { circleId: req.params.id, userId, role: role || "MEMBER" },
    });
    reply.code(201).send(member);
  });
}
