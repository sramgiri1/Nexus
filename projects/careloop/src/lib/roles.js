export async function assertMember(db, circleId, userId, reply) {
  if (!userId) { reply.code(400).send({ error: "userId required" }); return null; }
  const member = await db.circleMember.findUnique({
    where: { userId_circleId: { userId, circleId } },
  });
  if (!member) { reply.code(403).send({ error: "Not a circle member" }); return null; }
  return member;
}

export async function assertAdmin(db, circleId, userId, reply) {
  const member = await assertMember(db, circleId, userId, reply);
  if (!member) return null;
  if (member.role !== "ADMIN") { reply.code(403).send({ error: "Admin role required" }); return null; }
  return member;
}

export async function logEvent(db, { type, circleId, actorId = null, payload = {} }) {
  try {
    await db.event.create({ data: { type, circleId, actorId, payload } });
  } catch (err) {
    console.error("logEvent failed:", err.message);
  }
}
