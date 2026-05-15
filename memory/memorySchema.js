import {
  FORBIDDEN_MEMORY_CLASSES,
  MEMORY_CLASSIFICATIONS,
  MEMORY_FRESHNESS_STATES,
  MEMORY_SCOPES,
  isForbiddenMemoryClass,
} from "./memoryScopes.js";

export const MEMORY_ITEM_FIELDS = [
  "memoryId",
  "scope",
  "projectId",
  "missionId",
  "taskId",
  "agentId",
  "type",
  "summary",
  "source",
  "classification",
  "allowedAgents",
  "forbiddenModes",
  "freshness",
  "confidence",
  "lastVerifiedAt",
  "expiresAt",
  "version",
  "redacted",
  "evidenceIds",
  "auditIds",
];

export const REQUIRED_MEMORY_ITEM_FIELDS = [
  "memoryId",
  "scope",
  "type",
  "summary",
  "source",
  "classification",
  "freshness",
  "confidence",
  "version",
  "redacted",
];

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /password/i,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
];

export function createMemoryItem(input = {}) {
  return {
    memoryId: input.memoryId || `mem-${Date.now()}`,
    scope: input.scope || "session",
    projectId: input.projectId || "",
    missionId: input.missionId || "",
    taskId: input.taskId || "",
    agentId: input.agentId || "",
    type: input.type || "note",
    summary: input.summary || "",
    source: input.source || "manual_metadata",
    classification: input.classification || "local_private",
    allowedAgents: Array.isArray(input.allowedAgents) ? input.allowedAgents : [],
    forbiddenModes: Array.isArray(input.forbiddenModes) ? input.forbiddenModes : ["demo", "public"],
    freshness: input.freshness || "unknown",
    confidence: typeof input.confidence === "number" ? input.confidence : 0.5,
    lastVerifiedAt: input.lastVerifiedAt || "",
    expiresAt: input.expiresAt || "",
    version: input.version || "1.0",
    redacted: input.redacted !== false,
    evidenceIds: Array.isArray(input.evidenceIds) ? input.evidenceIds : [],
    auditIds: Array.isArray(input.auditIds) ? input.auditIds : [],
  };
}

export function containsForbiddenMemoryContent(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value || "");
  return SECRET_PATTERNS.some((pattern) => pattern.test(text)) || isForbiddenMemoryClass(text);
}

export function validateMemoryItem(item = {}) {
  const errors = [];
  const warnings = [];

  for (const field of REQUIRED_MEMORY_ITEM_FIELDS) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      errors.push(`Missing required memory field: ${field}`);
    }
  }

  if (!MEMORY_SCOPES.includes(item.scope)) {
    errors.push(`Invalid memory scope: ${item.scope}`);
  }

  if (!MEMORY_CLASSIFICATIONS.includes(item.classification)) {
    errors.push(`Invalid memory classification: ${item.classification}`);
  }

  if (!MEMORY_FRESHNESS_STATES.includes(item.freshness)) {
    errors.push(`Invalid memory freshness: ${item.freshness}`);
  }

  if (containsForbiddenMemoryContent(item.summary)) {
    errors.push("Memory summary contains forbidden content class or secret-like text");
  }

  if (String(item.source || "").toLowerCase().includes("raw source")) {
    errors.push("Memory source cannot be raw source content");
  }

  if (item.classification === "forbidden") {
    errors.push("Forbidden memory classification cannot be stored");
  }

  if (item.redacted !== true) {
    warnings.push("Memory item should be redacted before storage or UI display");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateMemorySchema() {
  const errors = [];
  for (const field of REQUIRED_MEMORY_ITEM_FIELDS) {
    if (!MEMORY_ITEM_FIELDS.includes(field)) errors.push(`Required field is not declared: ${field}`);
  }
  if (FORBIDDEN_MEMORY_CLASSES.length < 5) errors.push("Forbidden memory classes are incomplete");
  return { ok: errors.length === 0, errors };
}
