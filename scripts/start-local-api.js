/**
 * start-local-api.js
 * Starts the NEXUS Live Local API server.
 * Run: NEXUS_MODE=local-private npm run local-api:start
 */

import { startLocalApiServer } from "../local-api/server.js";
import process from "node:process";

const mode = process.env.NEXUS_MODE || "local-private";

startLocalApiServer({ mode }).then((server) => {
  process.on("SIGINT", () => {
    console.log("\nShutting down Local API server...");
    server.close(() => process.exit(0));
  });
  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
}).catch((err) => {
  console.error("Failed to start Local API server:", err.message);
  process.exit(1);
});
