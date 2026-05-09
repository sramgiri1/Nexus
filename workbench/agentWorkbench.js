/**
 * agentWorkbench.js
 * Agent Workbench data model — P38-LOCAL.
 *
 * Reads activated runtime tasks, links to mission plan, and builds
 * workbench views for the human review loop. No execution. No providers.
 * No project mutation.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readTasks } from "../local-state/taskStore.js";
import { listReviewsForTask, listReviewRecords } from "./reviewStore.js";

const ROOT = process.cwd();

const TASK_PLAN_PATH = "contracts/missions/private-project-task-plan.json";
const MISSION_CONTRACT_PATH = "contracts/missions/private-project-mission-contract.json";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readJsonSafe(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  try { return JSON.parse(readFileSync(full, "utf8")); } catch { return null; }
}

function loadPlanTask(planTaskId) {
  const plan = readJsonSafe(TASK_PLAN_PATH);
  if (!plan || !Array.isArray(plan.tasks)) return null;
  return plan.tasks.find((t) => t.taskId === planTaskId) || null;
}

function buildExpectedOutput(task) {
  const outputTypeMap = {
    "orchestration.plan_flow": "plan",
    "orchestration.planning": "plan",
    "verification.code_quality_gate": "validation_summary",
    "verification.qa_gate": "validation_summary",
    "design.ux_flow": "analysis",
    "security.privacy_review": "review",
    "compliance.privacy_review": "review",
    "implementation.backend_code": "implementation_candidate",
    "mission_task_activation": "plan",
  };
  const capability = normalizeString(task.capabilityId || task.taskType);
  const outputType = outputTypeMap[capability] || "analysis";

  return {
    summary: "Task execution is not enabled in this phase. This workbench is ready for review flow and evidence inspection.",
    outputType,
    available: false,
    reason: "Task execution is not enabled yet. Review the task plan, agent assignment, capability, and risk before approving for future execution.",
  };
}

function reviewStatusFromRecords(reviews) {
  if (!reviews || reviews.length === 0) return "not_started";
  const last = reviews[reviews.length - 1];
  if (last.decision === "approve") return "approved";
  if (last.decision === "reject") return "rejected";
  if (last.decision === "request_changes") return "changes_requested";
  return "pending";
}

function buildWorkbenchView(task, reviews = []) {
  const planTask = task.sourcePlanTaskId ? loadPlanTask(task.sourcePlanTaskId) : null;
  const contract = readJsonSafe(MISSION_CONTRACT_PATH);
  const reviewStatus = reviewStatusFromRecords(reviews);
  const lastReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;

  const nextActions = [];
  if (reviewStatus === "not_started") {
    nextActions.push({ label: "Review task plan", action: "review", enabled: true });
  } else if (reviewStatus === "changes_requested") {
    nextActions.push({ label: "Review updated plan", action: "review", enabled: true });
  } else if (reviewStatus === "approved") {
    nextActions.push({ label: "Ready for P39 execution", action: "none", enabled: false, reason: "Requires P39 implementation workflow" });
  } else if (reviewStatus === "rejected") {
    nextActions.push({ label: "Task rejected — no further action", action: "none", enabled: false, reason: "Task rejected by reviewer" });
  }

  return {
    workbenchVersion: "1.0",
    mode: "local-private",
    projectId: "private-project-01",
    missionId: normalizeString(task.contractId) || "private-project-governed-build-mission",
    runtimeTaskId: task.taskId,
    sourcePlanTaskId: normalizeString(task.sourcePlanTaskId) || "",
    title: normalizeString(task.objective),
    assignedAgent: normalizeString(task.targetAgent),
    capabilityId: normalizeString(task.capabilityId || task.taskType),
    riskLevel: normalizeString(task.riskLevel),
    state: normalizeString(task.state),
    mutationAllowed: task.mutationAllowed === true,
    executionAllowed: task.executionAllowed === true,
    contract: {
      path: contract ? MISSION_CONTRACT_PATH : "",
      type: contract ? normalizeString(contract.contractType) : "mission",
      requiredEvidence: contract?.governance?.evidenceAllowed ? ["task_activation", "task_review_decision"] : [],
    },
    agentExpectedOutput: buildExpectedOutput(task),
    review: {
      status: reviewStatus,
      reviewer: lastReview?.reviewer || "local-operator",
      decision: lastReview?.decision || "",
      reason: lastReview?.reason || "",
      createdAt: lastReview?.createdAt || "",
    },
    evidence: task.evidenceIds || [],
    audit: task.auditEventIds || [],
    runtimeEvents: [],
    nextActions,
    warnings: [],
    errors: [],
  };
}

// ─── loadActivatedTasks ───────────────────────────────────────────────────────

export function loadActivatedTasks() {
  const result = readTasks();
  if (!result.ok) return { ok: false, tasks: [], errors: result.errors };

  const activated = result.document.tasks.filter(
    (t) => t.taskType === "mission_task_activation" && ["queued", "running", "awaiting_approval"].includes(t.state)
  );

  return { ok: true, tasks: activated, errors: [] };
}

// ─── loadTaskWorkbench ────────────────────────────────────────────────────────

export function loadTaskWorkbench(taskId) {
  const result = readTasks();
  if (!result.ok) return { ok: false, view: null, errors: result.errors };

  const task = result.document.tasks.find((t) => t.taskId === taskId);
  if (!task) return { ok: false, view: null, errors: [`Task not found: ${taskId}`] };

  const reviewsResult = listReviewsForTask(taskId);
  const reviews = reviewsResult.ok ? reviewsResult.records : [];
  const view = buildWorkbenchView(task, reviews);

  return { ok: true, view, errors: [] };
}

// ─── buildAgentWorkbenchView ──────────────────────────────────────────────────

export function buildAgentWorkbenchView(task) {
  if (!task || typeof task !== "object") {
    return {
      workbenchVersion: "1.0", mode: "local-private", projectId: "private-project-01",
      runtimeTaskId: "", title: "", assignedAgent: "", capabilityId: "", riskLevel: "", state: "",
      mutationAllowed: false, executionAllowed: false,
      contract: { path: "", type: "", requiredEvidence: [] },
      agentExpectedOutput: { summary: "No task loaded.", outputType: "plan", available: false, reason: "No activated task selected." },
      review: { status: "not_started", reviewer: "", decision: "", reason: "", createdAt: "" },
      evidence: [], audit: [], runtimeEvents: [], nextActions: [], warnings: ["No task provided."], errors: [],
    };
  }
  const reviewsResult = listReviewsForTask(task.taskId);
  const reviews = reviewsResult.ok ? reviewsResult.records : [];
  return buildWorkbenchView(task, reviews);
}

// ─── validateAgentWorkbenchView ───────────────────────────────────────────────

export function validateAgentWorkbenchView(view) {
  const errors = [];
  const required = ["workbenchVersion", "mode", "runtimeTaskId", "assignedAgent", "capabilityId", "riskLevel", "state", "agentExpectedOutput", "review"];
  for (const field of required) {
    if (!(field in view)) errors.push(`Missing field: ${field}`);
  }
  if (view.mutationAllowed !== false) errors.push("mutationAllowed must be false.");
  if (view.executionAllowed !== false) errors.push("executionAllowed must be false.");
  if (view.agentExpectedOutput?.available !== false) errors.push("agentExpectedOutput.available must be false in P38.");
  return { valid: errors.length === 0, errors };
}

// ─── listAgentWorkbenchItems ──────────────────────────────────────────────────

export function listAgentWorkbenchItems() {
  const activated = loadActivatedTasks();
  if (!activated.ok) return { ok: false, items: [], errors: activated.errors };

  const allReviews = listReviewRecords();
  const reviewMap = {};
  if (allReviews.ok) {
    for (const r of allReviews.records) {
      if (!reviewMap[r.runtimeTaskId]) reviewMap[r.runtimeTaskId] = [];
      reviewMap[r.runtimeTaskId].push(r);
    }
  }

  const items = activated.tasks.map((task) => {
    const reviews = reviewMap[task.taskId] || [];
    const reviewStatus = reviewStatusFromRecords(reviews);
    return {
      runtimeTaskId: task.taskId,
      title: task.objective,
      assignedAgent: task.targetAgent,
      capabilityId: task.capabilityId || task.taskType,
      riskLevel: task.riskLevel,
      state: task.state,
      reviewStatus,
      reviewCount: reviews.length,
    };
  });

  return { ok: true, items, errors: [] };
}
