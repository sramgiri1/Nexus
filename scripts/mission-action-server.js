/**
 * mission-action-server.js
 * Local HTTP server for the Mission Action Bridge.
 * Binds to 127.0.0.1 only. No external packages — node:http only.
 *
 * Start: npm run mission:action-server
 */

import http from "node:http";
import process from "node:process";
import {
  runMissionActionRequest,
  createMissionActionRequest,
  listMissionActions,
  getMissionActionResult,
} from "../mission-actions/missionActionBridge.js";

const PORT = 3748;
const HOST = "127.0.0.1"; // localhost only — never 0.0.0.0

// ─── Body Parser ───────────────────────────────────────────────────────────────

async function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// ─── JSON Responder ────────────────────────────────────────────────────────────

function json(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// ─── Server ────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  // CORS for localhost dashboard only
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── GET /health ──
  if (method === "GET" && url === "/health") {
    return json(res, 200, {
      ok: true,
      service: "mission-action-server",
      port: PORT,
      mode: process.env.NEXUS_MODE || "demo",
    });
  }

  // ── POST /actions/mission/compose ──
  if (method === "POST" && url === "/actions/mission/compose") {
    const body = await readBody(req);
    const reqObj = createMissionActionRequest({
      actionType: "mission.compose",
      mode: process.env.NEXUS_MODE || "local-private",
      projectId: "private-project-01",
      projectLabel: "Private Project",
      missionText: body.missionText || "",
      requestedBy: { userId: "local-operator", role: "founder", authType: "local" },
      source: "command_center_v2",
    });

    if (!reqObj.ok) {
      return json(res, 400, { ok: false, errors: reqObj.errors });
    }

    const result = await runMissionActionRequest(reqObj.request);
    return json(res, result.ok ? 200 : 422, result);
  }

  // ── GET /actions ──
  if (method === "GET" && url === "/actions") {
    const result = listMissionActions();
    return json(res, 200, { ok: true, records: result.records || [] });
  }

  // ── GET /actions/:actionId ──
  if (method === "GET" && url.startsWith("/actions/") && url !== "/actions/") {
    const actionId = url.replace("/actions/", "");
    if (!actionId) {
      return json(res, 400, { ok: false, error: "actionId required" });
    }
    const record = getMissionActionResult(actionId);
    if (!record) {
      return json(res, 404, { ok: false, error: "action not found" });
    }
    return json(res, 200, { ok: true, record });
  }

  return json(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`Mission Action Server running at http://${HOST}:${PORT}`);
  console.log("Mode:", process.env.NEXUS_MODE || "demo");
  console.log("Routes:");
  console.log(`  GET  http://${HOST}:${PORT}/health`);
  console.log(`  POST http://${HOST}:${PORT}/actions/mission/compose`);
  console.log(`  GET  http://${HOST}:${PORT}/actions`);
  console.log(`  GET  http://${HOST}:${PORT}/actions/:actionId`);
});
