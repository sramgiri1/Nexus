/**
 * local-api/server.js
 * Live Local API Server (P40-LOCAL).
 * Binds to 127.0.0.1 only. Port 4321.
 * No external network calls, no providers, no DB, no arbitrary file reads.
 */

import http from "node:http";
import process from "node:process";
import { sendJson, sendError } from "./safeResponse.js";
import { handleHealth } from "./routes/health.js";
import { handleStatus } from "./routes/status.js";
import { handleMissions } from "./routes/missions.js";
import { handleTasks, handleTaskById } from "./routes/tasks.js";
import { handleAgents } from "./routes/agents.js";
import { handleEvidence } from "./routes/evidence.js";
import { handleAudit } from "./routes/audit.js";
import { handleRuntime } from "./routes/runtime.js";
import { handleContracts } from "./routes/contracts.js";
import { handleProjects } from "./routes/projects.js";
import { handleRoadmap } from "./routes/roadmap.js";
import { handleListActions, handleGetAction } from "./routes/actions.js";
import { handleDb } from "./routes/db.js";

const DEFAULT_PORT = 4321;
const DEFAULT_HOST = "127.0.0.1";
const DASHBOARD_ORIGIN = "http://localhost:5173";

// ─── Config ──────────────────────────────────────────────────────────────────

export function getLocalApiConfig(options = {}) {
  return {
    port: options.port || Number(process.env.LOCAL_API_PORT) || DEFAULT_PORT,
    host: options.host || DEFAULT_HOST,
    mode: options.mode || process.env.NEXUS_MODE || "local-private",
  };
}

// ─── Body reader ─────────────────────────────────────────────────────────────

async function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

// ─── Router ──────────────────────────────────────────────────────────────────

function route(req, res, config) {
  const { method, url } = req;
  const ctx = { mode: config.mode };

  res.setHeader("Access-Control-Allow-Origin", DASHBOARD_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (method === "GET" && url === "/health") return handleHealth(req, res, ctx);
  if (method === "GET" && url === "/status") return handleStatus(req, res, ctx);
  if (method === "GET" && url === "/missions") return handleMissions(req, res, ctx);
  if (method === "GET" && url === "/tasks") return handleTasks(req, res, ctx);
  if (method === "GET" && url.startsWith("/tasks/") && url !== "/tasks/") {
    return handleTaskById(req, res, { ...ctx, taskId: decodeURIComponent(url.replace("/tasks/", "")) });
  }
  if (method === "GET" && url === "/agents") return handleAgents(req, res, ctx);
  if (method === "GET" && url === "/evidence") return handleEvidence(req, res, ctx);
  if (method === "GET" && url === "/audit") return handleAudit(req, res, ctx);
  if (method === "GET" && url === "/runtime") return handleRuntime(req, res, ctx);
  if (method === "GET" && url === "/contracts") return handleContracts(req, res, ctx);
  if (method === "GET" && url === "/projects") return handleProjects(req, res, ctx);
  if (method === "GET" && url === "/roadmap") return handleRoadmap(req, res, ctx);
  if (method === "GET" && url === "/actions") return handleListActions(req, res, ctx);
  if (method === "GET" && url.startsWith("/actions/") && url !== "/actions/") {
    return handleGetAction(req, res, { ...ctx, actionId: decodeURIComponent(url.replace("/actions/", "")) });
  }
  if (method === "GET" && url === "/db") return handleDb(req, res, ctx);

  sendError(res, 404, "not_found", `Route ${method} ${url} not found.`, null);
}

// ─── Server lifecycle ─────────────────────────────────────────────────────────

export function createLocalApiServer(options = {}) {
  const config = getLocalApiConfig(options);
  const server = http.createServer((req, res) => {
    try { route(req, res, config); }
    catch (err) { sendError(res, 500, "server_error", "Internal server error.", null); }
  });
  server._nexusConfig = config;
  return server;
}

export function startLocalApiServer(options = {}) {
  return new Promise((resolve, reject) => {
    const server = createLocalApiServer(options);
    const { port, host, mode } = server._nexusConfig;
    server.listen(port, host, () => {
      console.log(`NEXUS Local API running at http://${host}:${port}`);
      console.log(`Mode: ${mode}`);
      resolve(server);
    });
    server.on("error", reject);
  });
}

export function stopLocalApiServer(server) {
  return new Promise((resolve) => {
    if (!server) { resolve(); return; }
    server.close(resolve);
  });
}
