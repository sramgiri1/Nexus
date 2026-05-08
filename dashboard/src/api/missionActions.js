/**
 * missionActions.js
 * Browser-side API client for the Mission Action Bridge server.
 * Uses fetch() — no Node.js APIs, no file writes, no shell exec.
 */

const ACTION_SERVER = "http://localhost:3748";

// ─── checkActionBridgeHealth ────────────────────────────────────────────────────

/**
 * Check if the mission action server is running and reachable.
 * @returns {Promise<{ online: boolean, service?: string }>}
 */
export async function checkActionBridgeHealth() {
  try {
    const res = await fetch(`${ACTION_SERVER}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, service: data.service };
  } catch {
    return { online: false };
  }
}

// ─── composeMissionFromCommandCenter ────────────────────────────────────────────

/**
 * Send a mission compose request to the local action server.
 * @param {{ missionText?: string, projectId?: string, projectLabel?: string }} input
 * @returns {Promise<object>}
 */
export async function composeMissionFromCommandCenter(input = {}) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/mission/compose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionText: input.missionText || "",
        projectId: "private-project-01",
        projectLabel: "Private Project",
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    return data;
  } catch {
    return {
      ok: false,
      errors: ["Mission action bridge offline or request failed."],
      offline: true,
    };
  }
}

// ─── getMissionAction ───────────────────────────────────────────────────────────

/**
 * Fetch a single mission action record by actionId.
 * @param {string} actionId
 * @returns {Promise<object>}
 */
export async function getMissionAction(actionId) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/${actionId}`, {
      signal: AbortSignal.timeout(5000),
    });
    return await res.json();
  } catch {
    return { ok: false, errors: ["Bridge offline"] };
  }
}

// ─── listMissionActions ─────────────────────────────────────────────────────────

/**
 * Fetch the list of recent mission action records.
 * @returns {Promise<object>}
 */
export async function listMissionActions() {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions`, {
      signal: AbortSignal.timeout(5000),
    });
    return await res.json();
  } catch {
    return { ok: false, records: [] };
  }
}
