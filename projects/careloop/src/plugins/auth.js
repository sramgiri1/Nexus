import fp from "fastify-plugin";

export default fp(async function auth(app) {
  app.addHook("onRequest", async (req, reply) => {
    if (req.routeOptions?.config?.public) return;
    const key = req.headers["x-api-key"];
    if (!key || key !== process.env.API_KEY) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
