export default async function users(app) {
  const db = app.db;

  app.post("/users", async (req, reply) => {
    const { email, name, phone } = req.body;
    const user = await db.user.create({ data: { email, name, phone } });
    reply.code(201).send(user);
  });

  app.get("/users/:id", async (req, reply) => {
    const user = await db.user.findUnique({
      where:   { id: req.params.id },
      include: { memberships: { include: { circle: true } } },
    });
    if (!user) return reply.code(404).send({ error: "Not found" });
    return user;
  });

  app.patch("/users/:id/push-token", async (req) => {
    return db.user.update({
      where: { id: req.params.id },
      data:  { pushToken: req.body.pushToken },
    });
  });
}
