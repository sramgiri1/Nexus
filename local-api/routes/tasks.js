import { readJsonSafe } from "../../local-state/safeFileReader.js";
import { readRuntimeTasks, readRuntimeEvidence } from "../../local-state/normalizeRuntimeFiles.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

function buildTaskSummary(task, evidenceRecords) {
  const linked = evidenceRecords.filter(e => e.taskId === task.taskId || e.runtimeTaskId === task.taskId);
  return {
    taskId: task.taskId,
    objective: task.objective,
    targetAgent: task.targetAgent,
    taskType: task.taskType,
    capabilityId: task.capabilityId,
    state: task.state,
    riskLevel: task.riskLevel,
    mutationAllowed: task.mutationAllowed,
    executionAllowed: task.executionAllowed,
    evidenceCount: linked.length,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    redacted: true,
  };
}

export function handleTasks(req, res, { mode }) {
  try {
    const planResult = readJsonSafe("contracts/missions/private-project-task-plan.json");
    const runtimeResult = readRuntimeTasks();
    const evidenceResult = readRuntimeEvidence();

    const plannedTasks = planResult.ok ? (planResult.data?.tasks || []) : [];
    const runtimeTasks = runtimeResult.tasks || [];
    const evidenceRecords = evidenceResult.records || [];

    const warnings = [];
    if (!planResult.ok) warnings.push("Task plan not found.");
    if (runtimeResult.warnings?.length) warnings.push(...runtimeResult.warnings);

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        planned: plannedTasks.map(t => buildTaskSummary(t, evidenceRecords)),
        runtime: runtimeTasks.map(t => buildTaskSummary(t, evidenceRecords)),
        counts: {
          planned: plannedTasks.length,
          runtime: runtimeTasks.length,
          byState: runtimeTasks.reduce((acc, t) => { acc[t.state] = (acc[t.state] || 0) + 1; return acc; }, {}),
        },
      },
      warnings,
    }));
  } catch (err) {
    sendError(res, 500, "tasks_error", "Failed to read task data.", null);
  }
}

export function handleTaskById(req, res, { mode, taskId }) {
  try {
    const planResult = readJsonSafe("contracts/missions/private-project-task-plan.json");
    const runtimeResult = readRuntimeTasks();
    const evidenceResult = readRuntimeEvidence();
    const auditResult = readJsonSafe("local-state/runtime/audit.jsonl");

    const planned = (planResult.data?.tasks || []).find(t => t.taskId === taskId);
    const runtime = (runtimeResult.tasks || []).find(t => t.taskId === taskId);
    const task = runtime || planned;

    if (!task) {
      sendError(res, 404, "task_not_found", `Task ${taskId.slice(0, 8)} not found.`, null);
      return;
    }

    const evidence = (evidenceResult.records || []).filter(e => e.taskId === taskId || e.runtimeTaskId === taskId);
    const audit = Array.isArray(auditResult.data)
      ? auditResult.data.filter(a => a.taskId === taskId)
      : [];

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        task: buildTaskSummary(task, evidence),
        evidence: evidence.slice(0, 20),
        audit: audit.slice(0, 20),
        evidenceCount: evidence.length,
        auditCount: audit.length,
      },
    }));
  } catch (err) {
    sendError(res, 500, "task_detail_error", "Failed to read task detail.", null);
  }
}
