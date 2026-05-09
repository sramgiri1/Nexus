/**
 * implementationActions.js
 * Browser-side API client for Controlled Implementation Workflow Bridge (P39-LOCAL).
 * Uses fetch() only — no Node.js APIs, no file writes, no shell exec.
 */

const ACTION_SERVER = "http://localhost:3748";

// ─── proposeImplementation ────────────────────────────────────────────────────

export async function proposeImplementation(input = {}) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/implementation/propose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runtimeTaskId: input.runtimeTaskId || "",
        implementationType: input.implementationType || "documentation_readiness_log",
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return data;
  } catch {
    return {
      ok: false,
      errors: ["Requires governed implementation bridge (npm run mission:action-server)."],
      offline: true,
    };
  }
}

// ─── applyImplementation ──────────────────────────────────────────────────────

export async function applyImplementation(input = {}) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/implementation/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runtimeTaskId: input.runtimeTaskId || "",
        implementationType: input.implementationType || "documentation_readiness_log",
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json();
    return data;
  } catch {
    return {
      ok: false,
      errors: ["Requires governed implementation bridge (npm run mission:action-server)."],
      offline: true,
    };
  }
}

// ─── getImplementationAction ──────────────────────────────────────────────────

export async function getImplementationAction(actionId) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/implementation/${encodeURIComponent(actionId)}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, record: null, errors: ["Action bridge offline."] };
  }
}

// ─── listImplementationActions ────────────────────────────────────────────────

export async function listImplementationActions() {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/implementation`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, records: [], errors: ["Action bridge offline."], offline: true };
  }
}
