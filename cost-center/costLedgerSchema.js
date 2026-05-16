import { redactObject } from "../shared/redaction.js";

export const COST_LEDGER_SCHEMA_VERSION = "1.0";

export const COST_EVENT_TYPES = [
  "cost_estimate_created",
  "cost_actual_recorded",
  "budget_check_passed",
  "budget_check_blocked",
  "approval_threshold_reached",
  "budget_policy_updated",
  "cost_record_superseded",
];

export const COST_SOURCE_TYPES = [
  "task",
  "agent",
  "skill",
  "hook",
  "tool",
  "trigger",
  "provider",
  "api_batch",
  "worker",
  "test_suite",
  "command_center",
  "os_phase",
];

export const COST_UNITS = ["usd", "token", "tool_call", "runtime_second", "record"];

const DECISIONS = new Set(["ALLOW", "BLOCK", "REQUIRE_APPROVAL", "RECORD_ONLY"]);
const STATUSES = new Set(["preview", "recorded", "blocked", "superseded"]);

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCostLedgerRecord(input = {}) {
  return {
    costRecordId: input.costRecordId || createId("cost"),
    schemaVersion: COST_LEDGER_SCHEMA_VERSION,
    eventType: input.eventType || "cost_estimate_created",
    sourceType: input.sourceType || "task",
    sourceId: input.sourceId || "",
    projectId: input.projectId || "",
    missionId: input.missionId || "",
    taskId: input.taskId || "",
    agentId: input.agentId || "",
    skillId: input.skillId || "",
    toolId: input.toolId || "",
    phaseId: input.phaseId || "P57.1",
    correlationId: input.correlationId || "",
    currency: input.currency || "USD",
    estimatedUsd: Number(input.estimatedUsd || 0),
    actualUsd: Number(input.actualUsd || 0),
    estimatedTokens: Number(input.estimatedTokens || 0),
    actualTokens: Number(input.actualTokens || 0),
    units: input.units || {},
    budgetPolicyId: input.budgetPolicyId || "",
    decision: input.decision || "RECORD_ONLY",
    status: input.status || "preview",
    dataClassification: input.dataClassification || "internal",
    redacted: input.redacted !== false,
    createdAt: input.createdAt || new Date().toISOString(),
    metadata: input.metadata || {},
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    errors: Array.isArray(input.errors) ? input.errors : [],
  };
}

export function validateCostLedgerRecord(record = {}) {
  const errors = [];
  if (!record.costRecordId) errors.push("costRecordId is required");
  if (record.schemaVersion !== COST_LEDGER_SCHEMA_VERSION) errors.push("schemaVersion must be 1.0");
  if (!COST_EVENT_TYPES.includes(record.eventType)) errors.push(`invalid eventType: ${record.eventType}`);
  if (!COST_SOURCE_TYPES.includes(record.sourceType)) errors.push(`invalid sourceType: ${record.sourceType}`);
  if (record.currency !== "USD") errors.push("only USD preview currency is supported in P57");
  if (!DECISIONS.has(record.decision)) errors.push(`invalid decision: ${record.decision}`);
  if (!STATUSES.has(record.status)) errors.push(`invalid status: ${record.status}`);
  if (record.redacted !== true) errors.push("cost ledger records must be redacted");
  for (const field of ["estimatedUsd", "actualUsd", "estimatedTokens", "actualTokens"]) {
    if (Number(record[field] || 0) < 0) errors.push(`${field} cannot be negative`);
  }
  return { valid: errors.length === 0, errors };
}

export function sanitizeCostLedgerRecord(record = {}) {
  const normalized = createCostLedgerRecord({ ...record, redacted: true });
  normalized.metadata = redactObject(normalized.metadata || {});
  normalized.warnings = normalized.warnings.map(String);
  normalized.errors = normalized.errors.map(String);
  return normalized;
}

export function summarizeCostLedger(records = []) {
  const totals = records.reduce(
    (summary, record) => {
      summary.estimatedUsd += Number(record.estimatedUsd || 0);
      summary.actualUsd += Number(record.actualUsd || 0);
      summary.estimatedTokens += Number(record.estimatedTokens || 0);
      summary.actualTokens += Number(record.actualTokens || 0);
      summary.byDecision[record.decision] = (summary.byDecision[record.decision] || 0) + 1;
      summary.bySourceType[record.sourceType] = (summary.bySourceType[record.sourceType] || 0) + 1;
      return summary;
    },
    {
      records: records.length,
      estimatedUsd: 0,
      actualUsd: 0,
      estimatedTokens: 0,
      actualTokens: 0,
      byDecision: {},
      bySourceType: {},
    },
  );
  return {
    ...totals,
    estimatedUsd: Number(totals.estimatedUsd.toFixed(6)),
    actualUsd: Number(totals.actualUsd.toFixed(6)),
  };
}
