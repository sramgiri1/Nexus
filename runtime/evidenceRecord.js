import { createHash, randomUUID } from "node:crypto";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function stableClone(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stableClone(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableClone(value[key]);
        return result;
      }, {});
  }

  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableClone(value));
}

function hashValue(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function buildRecordForHash(record) {
  const { recordHash, ...rest } = record;
  return rest;
}

export function hashEvidenceRecord(record = {}) {
  return hashValue(buildRecordForHash(record));
}

export function createEvidenceRecord(input = {}) {
  const identity = input.identityContext || {};
  const request = input.trafficRequest || {};
  const policyDecision = input.policyDecision || {};

  const record = {
    recordId: normalizeString(input.recordId) || randomUUID(),
    sessionId: normalizeString(identity.session?.sessionId),
    originatingUserId: normalizeString(identity.originatingUser?.userId),
    delegationChain: normalizeArray(identity.delegationChain),
    agentId: normalizeString(request.agentId || identity.agent?.agentId),
    agentVersion: normalizeString(identity.agent?.agentVersion) || "unknown",
    capabilityId: normalizeString(request.capabilityId),
    taskId: normalizeString(identity.request?.taskId || request.metadata?.taskId),
    projectId: normalizeString(identity.request?.projectId || request.metadata?.projectId),
    actionType: normalizeString(request.actionType),
    runtime: normalizeString(request.runtime),
    provider: normalizeString(request.provider),
    promptClassification:
      normalizeString(input.promptClassification || request.promptClassification) ||
      "unknown",
    retrievedContextClassification:
      normalizeString(
        input.retrievedContextClassification ||
          request.metadata?.retrievedContextClassification
      ) || "unknown",
    responseClassification:
      normalizeString(input.responseClassification || request.responseExpectedClass) ||
      "unknown",
    downstreamToolCalls: normalizeArray(input.downstreamToolCalls),
    policyDecision,
    inputHash:
      normalizeString(input.inputHash) ||
      (input.inputForHash !== undefined ? hashValue(input.inputForHash) : ""),
    outputHash:
      normalizeString(input.outputHash) ||
      (input.outputForHash !== undefined ? hashValue(input.outputForHash) : ""),
    recordHash: "",
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
    redacted: true,
    contextVersion: normalizeString(identity.contextVersion) || "1.0",
  };

  record.recordHash = hashEvidenceRecord(record);
  return record;
}

export function verifyEvidenceRecord(record = {}) {
  const errors = [];
  const warnings = [];

  const requiredFields = [
    "recordId",
    "sessionId",
    "originatingUserId",
    "agentId",
    "capabilityId",
    "actionType",
    "policyDecision",
    "createdAt",
  ];

  for (const field of requiredFields) {
    if (!record[field]) {
      errors.push(`missing_${field}`);
    }
  }

  if (record.redacted !== true) {
    errors.push("redaction_required");
  }

  if (!Array.isArray(record.delegationChain)) {
    errors.push("invalid_delegation_chain");
  }

  if (record.recordHash) {
    const expectedHash = hashEvidenceRecord(record);
    if (expectedHash !== record.recordHash) {
      errors.push("record_hash_mismatch");
    }
  } else {
    warnings.push("missing_record_hash");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
