import { redactObject } from "../shared/redaction.js";

function stableRecordId(commandText = "", intentType = "") {
  const raw = `${commandText}|${intentType}|${Date.now()}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) >>> 0;
  }
  return `cmd_record_${hash.toString(16).padStart(8, "0").slice(0, 8)}`;
}

export function createCommandRecord(input = {}) {
  const safe = redactObject(input);
  return {
    commandId: safe.commandId || stableRecordId(safe.commandText, safe.intentType),
    correlationId: safe.correlationId || `corr_${safe.commandId || "command_preview"}`,
    commandText: safe.commandText || "",
    intentType: safe.intentType || "unknown",
    scope: safe.scope || "project",
    projectId: safe.projectId || "",
    routeStatus: safe.routeStatus || "preview",
    nextAction: safe.nextAction || "Preview route before execution.",
    redacted: true,
    previewOnly: true,
    executionEnabled: false,
    createdAt: safe.createdAt || new Date().toISOString(),
  };
}

export function validateCommandRecord(record = {}) {
  const errors = [];
  if (!record.commandId) errors.push("commandId is required");
  if (!record.correlationId) errors.push("correlationId is required");
  if (!record.commandText) errors.push("commandText is required");
  if (!record.intentType) errors.push("intentType is required");
  if (!["available", "blocked", "preview"].includes(record.routeStatus)) errors.push("routeStatus is invalid");
  if (!record.nextAction) errors.push("nextAction is required");
  if (record.redacted !== true) errors.push("redacted must be true");
  if (record.previewOnly !== true) errors.push("previewOnly must be true");
  if (record.executionEnabled !== false) errors.push("executionEnabled must be false");
  return { valid: errors.length === 0, errors };
}

export function buildCommandTimeline(options = {}) {
  const records = options.records || [];
  return {
    phase: "P62.5",
    totalRecords: records.length,
    blocked: records.filter((record) => record.routeStatus === "blocked").length,
    preview: records.filter((record) => record.routeStatus === "preview").length,
    available: records.filter((record) => record.routeStatus === "available").length,
    records: records.slice(0, options.limit || 10),
    activityLinked: false,
    previewOnly: true,
  };
}
