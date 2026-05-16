import { PRIORITY_RULES, inferPrioritySignals } from "./priorityRules.js";
import { COST_IMPACTS, PRIORITY_LEVELS, RISK_LEVELS, requirePreviewOnly, stablePreviewId, validateEnum } from "./concurrencySchema.js";

const PRIORITY_ORDER = { urgent: 5, high: 4, normal: 3, low: 2, blocked: 1 };

export function calculateTaskPriority(task = {}, context = {}) {
  const signals = inferPrioritySignals(task, context);
  const matchedRules = PRIORITY_RULES.filter((rule) => signals[rule.signal]);
  const topRule = matchedRules.sort((left, right) => right.weight - left.weight)[0];
  const priority = topRule?.priority || (task.lowPriority ? "low" : "normal");
  const riskLevel = ["low", "medium", "high"].includes(task.riskLevel) ? task.riskLevel : "medium";
  const costImpact = task.costImpact || (context.costEstimateAvailable === false ? "medium" : "low");
  return {
    priorityId: stablePreviewId("priority_preview", [task.taskId || task.id, priority, riskLevel, costImpact]),
    taskId: task.taskId || task.id || "",
    priority,
    reason: topRule?.reason || "Default deterministic priority preview.",
    riskLevel,
    costImpact,
    matchedSignals: Object.entries(signals).filter(([, value]) => value).map(([key]) => key),
    previewOnly: true,
  };
}

export function validatePriorityRecord(record = {}) {
  const errors = [];
  if (!record.priorityId) errors.push("priorityId is required");
  if (!record.taskId) errors.push("taskId is required");
  validateEnum(record.priority, PRIORITY_LEVELS, "priority", errors);
  validateEnum(record.riskLevel, RISK_LEVELS, "riskLevel", errors);
  validateEnum(record.costImpact, COST_IMPACTS, "costImpact", errors);
  requirePreviewOnly(record, errors, "priority record");
  return { valid: errors.length === 0, errors };
}

export function rankTasksByPriority(tasks = [], context = {}) {
  return tasks
    .map((task) => calculateTaskPriority(task, context))
    .sort((left, right) => PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority]);
}

export function buildPrioritySummary(records = []) {
  return {
    totalRecords: records.length,
    urgent: records.filter((record) => record.priority === "urgent").length,
    high: records.filter((record) => record.priority === "high").length,
    normal: records.filter((record) => record.priority === "normal").length,
    low: records.filter((record) => record.priority === "low").length,
    blocked: records.filter((record) => record.priority === "blocked").length,
    queueReorderingEnabled: false,
    previewOnly: true,
  };
}

export function explainPriorityDecision(record = {}) {
  return [
    `${record.priority || "normal"} priority preview`,
    record.reason || "No deterministic reason available.",
    `Risk: ${record.riskLevel || "medium"}. Cost impact: ${record.costImpact || "low"}.`,
    "No real queue reordering is performed.",
  ].join(" ");
}
