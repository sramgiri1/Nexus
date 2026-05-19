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
import {
  createTaskActivationRequest,
  runTaskActivationRequest,
  listTaskActivationActions,
  getTaskActivationResult,
} from "../task-actions/taskActivationBridge.js";
import {
  createReviewRequest,
  runReviewRequest,
  listReviewRecords,
  getReviewResult,
} from "../workbench/reviewBridge.js";
import { listReviewsForTask } from "../workbench/reviewStore.js";
import { loadTaskWorkbench, listAgentWorkbenchItems } from "../workbench/agentWorkbench.js";
import {
  createImplementationRequest,
  runImplementationRequest,
  listImplementationActions,
  getImplementationResult,
} from "../implementation-actions/implementationBridge.js";
import { admitLiveActionBridgeRequest } from "../live-execution/actionBridgeAdmissionController.js";

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

function maybeBlockLiveBridge(res, actionType, body = {}) {
  if ((process.env.NEXUS_MODE || "local-private") !== "live") return false;
  const admission = admitLiveActionBridgeRequest({
    mode: "live",
    actionType,
    body,
    approval: body.liveApproval || {},
  });
  json(res, 423, {
    ok: false,
    status: admission.status,
    actionType,
    admission: admission.data,
    errors: admission.errors,
    warnings: admission.warnings,
  });
  return true;
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
    if (maybeBlockLiveBridge(res, "mission.compose", body)) return;
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

  // ── POST /actions/task/activate ──
  if (method === "POST" && url === "/actions/task/activate") {
    const body = await readBody(req);
    if (maybeBlockLiveBridge(res, "task.activate", body)) return;
    const reqObj = createTaskActivationRequest({
      actionType: "task.activate",
      mode: process.env.NEXUS_MODE || "local-private",
      projectId: "private-project-01",
      missionId: "private-project-governed-build-mission",
      planTaskId: body.planTaskId || "",
      requestedBy: { userId: "local-operator", role: "founder", authType: "local" },
      source: "command_center_v2",
    });
    if (!reqObj.ok) return json(res, 400, { ok: false, errors: reqObj.errors });
    const result = await runTaskActivationRequest(reqObj.request);
    return json(res, result.ok ? 200 : 422, result);
  }

  // ── GET /actions/task ──
  if (method === "GET" && url === "/actions/task") {
    const result = listTaskActivationActions();
    return json(res, 200, { ok: true, records: result.records || [] });
  }

  // ── GET /actions/task/:actionId ──
  if (method === "GET" && url.startsWith("/actions/task/") && url !== "/actions/task/") {
    const actionId = url.replace("/actions/task/", "");
    const result = getTaskActivationResult(actionId);
    if (!result.ok) return json(res, 404, { ok: false, errors: result.errors });
    return json(res, 200, { ok: true, record: result.record });
  }

  // ── POST /actions/workbench/review ──
  if (method === "POST" && url === "/actions/workbench/review") {
    const body = await readBody(req);
    if (maybeBlockLiveBridge(res, "task.review", body)) return;
    const reqObj = createReviewRequest({
      actionType: "task.review",
      mode: process.env.NEXUS_MODE || "local-private",
      projectId: "private-project-01",
      missionId: "private-project-governed-build-mission",
      runtimeTaskId: body.runtimeTaskId || "",
      decision: body.decision || "",
      reason: body.reason || "",
      requestedBy: { userId: "local-operator", role: "founder", authType: "local" },
      source: "command_center_v2",
    });
    if (!reqObj.ok) return json(res, 400, { ok: false, errors: reqObj.errors });
    const result = await runReviewRequest(reqObj.request);
    return json(res, result.ok ? 200 : 422, result);
  }

  // ── GET /workbench ──
  if (method === "GET" && url === "/workbench") {
    const result = listAgentWorkbenchItems();
    return json(res, 200, { ok: true, items: result.items || [] });
  }

  // ── GET /workbench/:taskId ──
  if (method === "GET" && url.startsWith("/workbench/") && url !== "/workbench/") {
    const taskId = url.replace("/workbench/", "");
    const result = loadTaskWorkbench(taskId);
    if (!result.ok) return json(res, 404, { ok: false, errors: result.errors });
    return json(res, 200, { ok: true, view: result.view });
  }

  // ── GET /workbench/:taskId/reviews ──
  if (method === "GET" && url.match(/^\/workbench\/[^/]+\/reviews$/)) {
    const taskId = url.split("/")[2];
    const result = listReviewsForTask(taskId);
    return json(res, 200, { ok: true, records: result.records || [] });
  }

  // ── POST /actions/implementation/propose ──
  if (method === "POST" && url === "/actions/implementation/propose") {
    const body = await readBody(req);
    if (maybeBlockLiveBridge(res, "implementation.propose", body)) return;
    const reqObj = createImplementationRequest({
      actionType: "implementation.propose",
      mode: process.env.NEXUS_MODE || "local-private",
      projectId: "private-project-01",
      missionId: "private-project-governed-build-mission",
      runtimeTaskId: body.runtimeTaskId || "",
      targetAgent: "CORE",
      capabilityId: "implementation.backend_code",
      implementationType: body.implementationType || "documentation_readiness_log",
      requestedBy: { userId: "local-operator", role: "founder", authType: "local" },
      source: "command_center_v2",
    });
    if (!reqObj.ok) return json(res, 400, { ok: false, errors: reqObj.errors });
    const result = await runImplementationRequest(reqObj.request);
    return json(res, result.ok ? 200 : 422, result);
  }

  // ── POST /actions/implementation/apply ──
  if (method === "POST" && url === "/actions/implementation/apply") {
    const body = await readBody(req);
    if (maybeBlockLiveBridge(res, "implementation.apply", body)) return;
    const reqObj = createImplementationRequest({
      actionType: "implementation.apply",
      mode: process.env.NEXUS_MODE || "local-private",
      projectId: "private-project-01",
      missionId: "private-project-governed-build-mission",
      runtimeTaskId: body.runtimeTaskId || "",
      targetAgent: "CORE",
      capabilityId: "implementation.backend_code",
      implementationType: body.implementationType || "documentation_readiness_log",
      requestedBy: { userId: "local-operator", role: "founder", authType: "local" },
      source: "command_center_v2",
    });
    if (!reqObj.ok) return json(res, 400, { ok: false, errors: reqObj.errors });
    const result = await runImplementationRequest(reqObj.request);
    return json(res, result.ok ? 200 : 422, result);
  }

  // ── GET /actions/implementation ──
  if (method === "GET" && url === "/actions/implementation") {
    const result = listImplementationActions();
    return json(res, 200, { ok: true, records: result.records || [] });
  }

  // ── GET /actions/implementation/:actionId ──
  if (method === "GET" && url.startsWith("/actions/implementation/") && url !== "/actions/implementation/") {
    const actionId = url.replace("/actions/implementation/", "");
    const result = getImplementationResult(actionId);
    if (!result.ok) return json(res, 404, { ok: false, errors: result.errors });
    return json(res, 200, { ok: true, record: result.record });
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
  console.log(`  POST http://${HOST}:${PORT}/actions/task/activate`);
  console.log(`  GET  http://${HOST}:${PORT}/actions/task`);
  console.log(`  GET  http://${HOST}:${PORT}/actions/task/:actionId`);
});
