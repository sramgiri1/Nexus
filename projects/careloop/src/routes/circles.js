import { Prisma } from "@prisma/client";
import { assertAdmin, assertMember, logEvent } from "../lib/roles.js";

const circleInclude = {
  members: { include: { user: { select: { id: true, name: true, email: true } } } },
  tasks:   true,
};

export default async function circles(app) {
  const db = app.db;

  // POST /circles — create circle, auto-add creator as Admin
  app.post("/circles", async (req, reply) => {
    const { name, recipientName, creatorId } = req.body ?? {};
    if (!name || !recipientName || !creatorId)
      return reply.code(400).send({ error: "name, recipientName, and creatorId are required" });

    const creator = await db.user.findUnique({ where: { id: creatorId } });
    if (!creator) return reply.code(404).send({ error: "Creator user not found" });

    const circle = await db.$transaction(async (tx) => {
      const c = await tx.careCircle.create({ data: { name, recipientName } });
      await tx.circleMember.create({ data: { circleId: c.id, userId: creatorId, role: "ADMIN" } });
      await tx.event.create({ data: { type: "CIRCLE_CREATED", circleId: c.id, actorId: creatorId } });
      return tx.careCircle.findUnique({ where: { id: c.id }, include: circleInclude });
    });

    return reply.code(201).send(circle);
  });

  // GET /circles/:id
  app.get("/circles/:id", async (req, reply) => {
    const circle = await db.careCircle.findUnique({
      where:   { id: req.params.id },
      include: circleInclude,
    });
    if (!circle) return reply.code(404).send({ error: "Not found" });
    return circle;
  });

  // PATCH /circles/:id — admin only, update name/recipientName
  app.patch("/circles/:id", async (req, reply) => {
    const { userId, name, recipientName } = req.body ?? {};
    if (!await assertAdmin(db, req.params.id, userId, reply)) return;

    const circle = await db.careCircle.update({
      where:   { id: req.params.id },
      data:    { ...(name && { name }), ...(recipientName && { recipientName }) },
      include: circleInclude,
    });
    return circle;
  });

  // DELETE /circles/:id — admin only
  app.delete("/circles/:id", async (req, reply) => {
    const { userId } = req.body ?? {};
    if (!await assertAdmin(db, req.params.id, userId, reply)) return;

    await db.careCircle.delete({ where: { id: req.params.id } });
    return reply.code(204).send();
  });

  // POST /circles/:id/members — self-join, API key only (no admin required)
  app.post("/circles/:id/members", async (req, reply) => {
    const { userId } = req.body ?? {};
    if (!userId) return reply.code(400).send({ error: "userId required" });

    const [user, circle] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.careCircle.findUnique({ where: { id: req.params.id } }),
    ]);
    if (!user)   return reply.code(404).send({ error: "User not found" });
    if (!circle) return reply.code(404).send({ error: "Circle not found" });

    try {
      const member = await db.circleMember.create({
        data: { circleId: req.params.id, userId, role: "MEMBER" },
      });
      await logEvent(db, { type: "MEMBER_JOINED", circleId: req.params.id, actorId: userId, payload: { userId } });
      return reply.code(201).send(member);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
        return reply.code(409).send({ error: "User is already a member" });
      throw err;
    }
  });

  // DELETE /circles/:id/members/:memberId — admin only
  app.delete("/circles/:id/members/:memberId", async (req, reply) => {
    const { userId } = req.body ?? {};
    if (!await assertAdmin(db, req.params.id, userId, reply)) return;

    const target = await db.circleMember.findUnique({ where: { id: req.params.memberId } });
    if (!target || target.circleId !== req.params.id)
      return reply.code(404).send({ error: "Member not found" });

    await db.circleMember.delete({ where: { id: req.params.memberId } });
    await logEvent(db, { type: "MEMBER_REMOVED", circleId: req.params.id, actorId: userId, payload: { memberId: req.params.memberId } });
    return reply.code(204).send();
  });

  // PATCH /circles/:id/members/:memberId/role — admin only, prevent last admin demotion
  app.patch("/circles/:id/members/:memberId/role", async (req, reply) => {
    const { userId, role } = req.body ?? {};
    if (!role || !["ADMIN", "MEMBER"].includes(role))
      return reply.code(400).send({ error: "role must be ADMIN or MEMBER" });
    if (!await assertAdmin(db, req.params.id, userId, reply)) return;

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
    return updated;
  });

  // GET /circles/:circleId/events — internal/audit
  app.get("/circles/:circleId/events", async (req) => {
    return db.event.findMany({
      where:   { circleId: req.params.circleId },
      orderBy: { createdAt: "desc" },
    });
  });
}
