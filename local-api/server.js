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
import { handleActivity } from "./routes/activity.js";
import { recordApiActivity, recordActivityFailure } from "../observability/index.js";

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

function captureApiRead(req, ctx, routeName, handler) {
  const startedAt = Date.now();
  const correlationId = req.headers["x-nexus-correlation-id"];
  try {
    const result = handler();
    recordApiActivity({
      correlationId,
      mode: ctx.mode,
      scope: "NEXUS_OS_CHANGE",
      eventType: "local_api_request_completed",
      status: "success",
      summary: `Local API read completed: ${routeName}`,
      durationMs: Date.now() - startedAt,
      metadata: {
        method: req.method,
        route: routeName,
      },
    });
    return result;
  } catch (error) {
    recordActivityFailure({
      correlationId,
      mode: ctx.mode,
      scope: "NEXUS_OS_CHANGE",
      category: "api",
      source: "local_api",
      eventType: "local_api_request_failed",
      summary: `Local API read failed: ${routeName}`,
      error,
      durationMs: Date.now() - startedAt,
      metadata: {
        method: req.method,
        route: routeName,
      },
    });
    throw error;
  }
}

function route(req, res, config) {
  const { method, url } = req;
  const ctx = { mode: config.mode };

  res.setHeader("Access-Control-Allow-Origin", DASHBOARD_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-NEXUS-Correlation-ID");

  if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (method === "GET" && url === "/health") {
    return captureApiRead(req, ctx, "/health", () => handleHealth(req, res, ctx));
  }
  if (method === "GET" && url === "/status") {
    return captureApiRead(req, ctx, "/status", () => handleStatus(req, res, ctx));
  }
  if (method === "GET" && url === "/missions") {
    return captureApiRead(req, ctx, "/missions", () => handleMissions(req, res, ctx));
  }
  if (method === "GET" && url === "/tasks") {
    return captureApiRead(req, ctx, "/tasks", () => handleTasks(req, res, ctx));
  }
  if (method === "GET" && url.startsWith("/tasks/") && url !== "/tasks/") {
    return captureApiRead(req, ctx, "/tasks/:id", () => handleTaskById(req, res, {
      ...ctx,
      taskId: decodeURIComponent(url.replace("/tasks/", "")),
    }));
  }
  if (method === "GET" && url === "/agents") {
    return captureApiRead(req, ctx, "/agents", () => handleAgents(req, res, ctx));
  }
  if (method === "GET" && url === "/evidence") {
    return captureApiRead(req, ctx, "/evidence", () => handleEvidence(req, res, ctx));
  }
  if (method === "GET" && url === "/audit") {
    return captureApiRead(req, ctx, "/audit", () => handleAudit(req, res, ctx));
  }
  if (method === "GET" && url === "/runtime") {
    return captureApiRead(req, ctx, "/runtime", () => handleRuntime(req, res, ctx));
  }
  if (method === "GET" && url === "/contracts") {
    return captureApiRead(req, ctx, "/contracts", () => handleContracts(req, res, ctx));
  }
  if (method === "GET" && url === "/projects") {
    return captureApiRead(req, ctx, "/projects", () => handleProjects(req, res, ctx));
  }
  if (method === "GET" && url === "/roadmap") {
    return captureApiRead(req, ctx, "/roadmap", () => handleRoadmap(req, res, ctx));
  }
  if (method === "GET" && url === "/actions") {
    return captureApiRead(req, ctx, "/actions", () => handleListActions(req, res, ctx));
  }
  if (method === "GET" && url.startsWith("/actions/") && url !== "/actions/") {
    return captureApiRead(req, ctx, "/actions/:id", () => handleGetAction(req, res, {
      ...ctx,
      actionId: decodeURIComponent(url.replace("/actions/", "")),
    }));
  }
  if (method === "GET" && url === "/db") {
    return captureApiRead(req, ctx, "/db", () => handleDb(req, res, ctx));
  }
  if (method === "GET" && url.startsWith("/activity")) {
    return captureApiRead(req, ctx, "/activity", () => handleActivity(req, res, ctx));
  }

  recordActivityFailure({
    mode: ctx.mode,
    scope: "NEXUS_OS_CHANGE",
    category: "api",
    source: "local_api",
    eventType: "local_api_request_failed",
    summary: `Local API route not found: ${method} ${url}`,
    errorCode: "not_found",
    error: `Route ${method} ${url} not found.`,
    metadata: { method, route: url },
  });
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
