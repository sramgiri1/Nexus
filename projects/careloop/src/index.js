import "dotenv/config";
import Fastify         from "fastify";
import cors            from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

import health  from "./routes/health.js";
import circles from "./routes/circles.js";
import tasks   from "./routes/tasks.js";
import users   from "./routes/users.js";

const app = Fastify({ logger: true });
const db  = new PrismaClient();

app.decorate("db", db);

await app.register(cors);

app.register(health);
app.register(users);
app.register(circles);
app.register(tasks);

const port = parseInt(process.env.PORT || "3000");
await app.listen({ port, host: "0.0.0.0" });
console.log(`CareLoop API running on port ${port}`);
