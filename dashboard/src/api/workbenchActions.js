/**
 * workbenchActions.js
 * Browser-side API client for Agent Workbench Review Bridge (P38-LOCAL).
 * Uses fetch() only — no Node.js APIs, no file writes, no shell exec.
 */

const ACTION_SERVER = "http://localhost:3748";

// ─── reviewTask ───────────────────────────────────────────────────────────────

export async function reviewTask(input = {}) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/workbench/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runtimeTaskId: input.runtimeTaskId || "",
        decision: input.decision || "",
        reason: input.reason || "",
      }),
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

// ─── getReviewResult ──────────────────────────────────────────────────────────

export async function getReviewResult(reviewId) {
  try {
    const res = await fetch(`${ACTION_SERVER}/actions/task/${encodeURIComponent(reviewId)}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, record: null, errors: ["Action bridge offline."] };
  }
}

// ─── listTaskReviews ──────────────────────────────────────────────────────────

export async function listTaskReviews(runtimeTaskId) {
  try {
    const res = await fetch(`${ACTION_SERVER}/workbench/${encodeURIComponent(runtimeTaskId)}/reviews`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, records: [], errors: ["Action bridge offline."] };
  }
}

// ─── loadWorkbenchView ────────────────────────────────────────────────────────

export async function loadWorkbenchView(runtimeTaskId) {
  try {
    const res = await fetch(`${ACTION_SERVER}/workbench/${encodeURIComponent(runtimeTaskId)}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, view: null, errors: ["Action bridge offline."] };
  }
}

// ─── listWorkbenchItems ───────────────────────────────────────────────────────

export async function listWorkbenchItems() {
  try {
    const res = await fetch(`${ACTION_SERVER}/workbench`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, items: [], errors: ["Action bridge offline."], offline: true };
  }
}
