import { createCostLedgerRecord } from "./costLedgerSchema.js";

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createActualCostRecord(input = {}) {
  return {
    actualCostId: input.actualCostId || createId("actual"),
    estimateId: input.estimateId || "",
    sourceType: input.sourceType || "task",
    sourceId: input.sourceId || "",
    projectId: input.projectId || "",
    taskId: input.taskId || "",
    agentId: input.agentId || "",
    providerId: input.providerId || "",
    modelId: input.modelId || "",
    actualUsd: Number(input.actualUsd || 0),
    actualInputTokens: Number(input.actualInputTokens || 0),
    actualOutputTokens: Number(input.actualOutputTokens || 0),
    actualToolCalls: Number(input.actualToolCalls || 0),
    actualRuntimeSeconds: Number(input.actualRuntimeSeconds || 0),
    billingSource: input.billingSource || "preview",
    providerDispatchOccurred: input.providerDispatchOccurred === true,
    redacted: input.redacted !== false,
    createdAt: input.createdAt || new Date().toISOString(),
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    errors: Array.isArray(input.errors) ? input.errors : [],
  };
}

export function validateActualCostRecord(record = {}) {
  const errors = [];
  if (!record.actualCostId) errors.push("actualCostId is required");
  if (!["task", "provider", "tool", "api_batch", "worker", "test_suite"].includes(record.sourceType)) errors.push(`invalid sourceType: ${record.sourceType}`);
  if (!["preview", "reported", "manual", "provider"].includes(record.billingSource)) errors.push(`invalid billingSource: ${record.billingSource}`);
  if (record.providerDispatchOccurred !== false) errors.push("providerDispatchOccurred must be false in P57");
  if (record.redacted !== true) errors.push("actual cost records must be redacted");
  for (const key of ["actualUsd", "actualInputTokens", "actualOutputTokens", "actualToolCalls", "actualRuntimeSeconds"]) {
    if (Number(record[key] || 0) < 0) errors.push(`${key} cannot be negative`);
  }
  return { valid: errors.length === 0, errors };
}

export function reconcileEstimateWithActual(estimate = {}, actual = {}) {
  const actualRecord = createActualCostRecord(actual);
  const estimatedUsd = Number(estimate.estimatedUsd || 0);
  const actualUsd = Number(actualRecord.actualUsd || 0);
  const deltaUsd = Number((actualUsd - estimatedUsd).toFixed(6));
  return {
    estimateId: estimate.estimateId || actualRecord.estimateId,
    actualCostId: actualRecord.actualCostId,
    estimatedUsd,
    actualUsd,
    deltaUsd,
    exceededEstimate: actualUsd > estimatedUsd,
    warnings: actualUsd > estimatedUsd ? ["Preview actual exceeds estimate."] : [],
    providerDispatchOccurred: false,
  };
}

export function summarizeActualCost(records = []) {
  const totalActualUsd = records.reduce((sum, record) => sum + Number(record.actualUsd || 0), 0);
  return {
    records: records.length,
    totalActualUsd: Number(totalActualUsd.toFixed(6)),
    previewOnly: records.every((record) => record.billingSource === "preview"),
    providerDispatchOccurred: records.some((record) => record.providerDispatchOccurred === true),
  };
}

export function markCostRecordSuperseded(record = {}, reason = "Superseded by newer preview record.") {
  return {
    ...createActualCostRecord(record),
    superseded: true,
    supersededReason: reason,
    ledgerRecord: createCostLedgerRecord({
      eventType: "cost_record_superseded",
      sourceType: record.sourceType || "task",
      sourceId: record.sourceId || "",
      projectId: record.projectId || "",
      taskId: record.taskId || "",
      actualUsd: record.actualUsd || 0,
      decision: "RECORD_ONLY",
      status: "superseded",
      metadata: { actualCostId: record.actualCostId || "" },
    }),
  };
}
