/**
 * taskActions.js
 * Browser-side API client for Task Activation Bridge (P37-LOCAL).
 * Uses fetch() only — no Node.js APIs, no file writes, no shell exec.
 * Reuses the mission action server at port 3748.
 */

const ACTION_SERVER = "http://localhost:3748";

// ─── activateMissionTask ──────────────────────────────────────────────────────

export async function activateMissionTask(input = {}) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/task/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planTaskId: input.planTaskId || "" }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return data;
  } catch {
    return {
      ok: false,
      errors: ["Requires governed action bridge (npm run mission:action-server)."],
      offline: true,
    };
  }
}

// ─── getTaskActivationAction ──────────────────────────────────────────────────

export async function getTaskActivationAction(actionId) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/task/${encodeURIComponent(actionId)}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, record: null, errors: ["Action bridge offline."] };
  }
}

// ─── listTaskActivationActions ────────────────────────────────────────────────

export async function listTaskActivationActions() {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/task`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, records: [], errors: ["Action bridge offline."] };
  }
}
