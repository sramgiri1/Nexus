/**
 * localApiClient.js
 * Browser-side client for the NEXUS Live Local API (P40-LOCAL).
 * Falls back to generated snapshot when API is offline.
 * Uses fetch() only — no Node.js APIs.
 */

const LOCAL_API = "http://localhost:4321";
const TIMEOUT_MS = 5000;

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${LOCAL_API}${path}`, {
      ...options,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await res.json();
    return { ...data, _httpStatus: res.status };
  } catch {
    return { ok: false, source: "offline", _offline: true, errors: [{ code: "api_offline", message: "Local API offline." }] };
  }
}

// ─── Health & Status ──────────────────────────────────────────────────────────

export async function getLocalApiHealth() {
  return apiFetch("/health");
}

export async function getLocalStatus() {
  return apiFetch("/status");
}

// ─── Read endpoints ───────────────────────────────────────────────────────────

export async function getMissions() {
  return apiFetch("/missions");
}

export async function getTasks() {
  return apiFetch("/tasks");
}

export async function getTask(id) {
  return apiFetch(`/tasks/${encodeURIComponent(id)}`);
}

export async function getAgents() {
  return apiFetch("/agents");
}

export async function getEvidence() {
  return apiFetch("/evidence");
}

export async function getAudit() {
  return apiFetch("/audit");
}

export async function getRuntime() {
  return apiFetch("/runtime");
}

export async function getContracts() {
  return apiFetch("/contracts");
}

export async function getProjects() {
  return apiFetch("/projects");
}

export async function getRoadmap() {
  return apiFetch("/roadmap");
}

export async function getActions() {
  return apiFetch("/actions");
}

export async function getDbStatus() {
  return apiFetch("/db");
}

export async function getActivity(limit = 50) {
  return apiFetch(`/activity?limit=${encodeURIComponent(limit)}`);
}

// ─── Action endpoints (delegate to governed bridges via action server) ─────────
// These POST to the mission action server (port 3748) which delegates to bridges.
// The local API (port 4321) is read-focused; writes go through the action bridge.

const ACTION_SERVER = "http://localhost:3748";

async function actionFetch(path, body) {
  try {
    const res = await fetch(`${ACTION_SERVER}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, offline: true, errors: [{ code: "bridge_offline", message: "Action bridge offline." }] };
  }
}

export async function composeMission(input) {
  return actionFetch("/actions/mission/compose", input);
}

export async function activateTask(input) {
  return actionFetch("/actions/task/activate", input);
}

export async function reviewTask(input) {
  return actionFetch("/actions/workbench/review", input);
}

export async function applyImplementation(input) {
  return actionFetch("/actions/implementation/apply", input);
}

// ─── API state helper ─────────────────────────────────────────────────────────

export function buildApiState(healthResult) {
  const online = healthResult?.ok === true && !healthResult?._offline;
  return {
    liveApiOnline: online,
    usingSnapshotFallback: !online,
    lastRefreshStatus: online ? "succeeded" : "failed",
    lastRefreshAt: new Date().toISOString(),
    apiError: online ? null : (healthResult?.errors?.[0]?.message || "Local API offline."),
  };
}
