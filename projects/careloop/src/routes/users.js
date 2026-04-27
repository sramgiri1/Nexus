import { Prisma } from "@prisma/client";

export default async function users(app) {
  const db = app.db;

  app.post("/users", async (req, reply) => {
    const { email, name, phone } = req.body ?? {};
    if (!email || !name) return reply.code(400).send({ error: "email and name are required" });
    try {
      const user = await db.user.create({ data: { email, name, phone: phone ?? null } });
      return reply.code(201).send(user);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
        return reply.code(409).send({ error: "Email already exists" });
      throw err;
    }
  });

  app.get("/users/by-email", async (req, reply) => {
    const { email } = req.query ?? {};
    if (!email) return reply.code(400).send({ error: "email required" });
    const user = await db.user.findUnique({
      where:   { email },
      include: { memberships: { include: { circle: true } } },
    });
    if (!user) return reply.code(404).send({ error: "Not found" });
    return user;
  });

  app.get("/users/:id", async (req, reply) => {
    const user = await db.user.findUnique({
      where:   { id: req.params.id },
      include: { memberships: { include: { circle: true } } },
    });
    if (!user) return reply.code(404).send({ error: "Not found" });
    return user;
  });

  app.patch("/users/:id/push-token", async (req, reply) => {
    const { pushToken } = req.body ?? {};
    if (!pushToken) return reply.code(400).send({ error: "pushToken required" });
    const user = await db.user.update({ where: { id: req.params.id }, data: { pushToken } });
    return user;
  });

  // POST /users/:id/session — log APP_SESSION, one per user per UTC day
  app.post("/users/:id/session", async (req, reply) => {
    const { circleId } = req.body ?? {};
    let cid = circleId;
    if (!cid) {
      const membership = await db.circleMember.findFirst({ where: { userId: req.params.id } });
      if (!membership) return reply.code(404).send({ error: "No circle membership found" });
      cid = membership.circleId;
    }

    const todayStart = new Date(); todayStart.setUTCHours(0,  0,  0,   0);
    const todayEnd   = new Date(); todayEnd.setUTCHours(23,  59, 59, 999);

    const existing = await db.event.findFirst({
      where: { actorId: req.params.id, type: "APP_SESSION", createdAt: { gte: todayStart, lte: todayEnd } },
    });
    if (existing) return reply.send({ logged: false });

    await db.event.create({ data: { type: "APP_SESSION", circleId: cid, actorId: req.params.id } });
    return reply.send({ logged: true });
  });

  app.patch("/users/:id/timezone", async (req, reply) => {
    const { timezone } = req.body ?? {};
    if (!timezone) return reply.code(400).send({ error: "timezone required" });
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      return reply.code(400).send({ error: "Invalid IANA timezone" });
    }
    const user = await db.user.update({ where: { id: req.params.id }, data: { timezone } });
    return user;
  });
}
