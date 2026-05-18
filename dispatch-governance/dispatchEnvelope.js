import { randomUUID } from "node:crypto";

import { estimateRequestCost, validateCostEstimate } from "../api-batch/costEstimator.js";
import { createBlockedResult, createPassResult, validateResultEnvelope } from "../shared/resultEnvelope.js";
import { redactObject, summarizeRedaction } from "../shared/redaction.js";

export const DISPATCH_REQUEST_TYPES = Object.freeze([
  "provider.request",
  "provider.batch",
  "tool.call",
  "mcp.call",
]);

export const DISPATCH_DECISION_STATES = Object.freeze([
  "DENIED",
  "PREVIEW_ONLY",
  "REQUIRES_APPROVAL",
  "BLOCKED_NOT_ENABLED",
]);

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function isProviderRequest(requestType = "") {
  return requestType === "provider.request" || requestType === "provider.batch";
}

function isToolRequest(requestType = "") {
  return requestType === "tool.call" || requestType === "mcp.call";
}

function buildSafeSummary(input = {}, redaction = summarizeRedaction(input.safeSummary || {})) {
  return {
    title: normalizeString(input.displayTitle, "Governed dispatch preview"),
    scopeLabel: normalizeString(input.scopeLabel, "NEXUS OS"),
    ownerCapability: normalizeString(input.capabilityId, "unassigned-capability"),
    requestSummary: normalizeString(input.requestSummary, "Redacted dispatch request summary."),
    dataClassification: normalizeString(input.dataClassification, "unknown"),
    redactionApplied: redaction.changed,
    rawPayloadStored: false,
  };
}

export function createDispatchEnvelope(input = {}) {
  const requestType = normalizeString(input.requestType, "provider.request");
  const redaction = summarizeRedaction(input.safeSummary || {});
  const providerId = normalizeString(input.providerId, isProviderRequest(requestType) ? "openai-preview" : "");
  const toolId = normalizeString(input.toolId, isToolRequest(requestType) ? "governed-tool-preview" : "");
  const costEstimate = estimateRequestCost(
    {
      providerId: providerId || "openai-preview",
      inputSummary: input.requestSummary || input.safeSummary?.requestSummary || "",
      modelPolicy: input.modelPolicy || "unset",
    },
    { approvalThresholdUsd: input.approvalThresholdUsd || 1 },
  );

  return {
    dispatchId: normalizeString(input.dispatchId) || `dispatch_${randomUUID()}`,
    phaseId: "P64.2",
    requestType,
    providerId,
    toolId,
    capabilityId: normalizeString(input.capabilityId, "dispatch-governance"),
    agentId: normalizeString(input.agentId, "nexus-core"),
    scopeLabel: normalizeString(input.scopeLabel, "NEXUS OS"),
    riskLevel: normalizeString(input.riskLevel, "medium"),
    dataClassification: normalizeString(input.dataClassification, "internal"),
    promptClassification: normalizeString(input.promptClassification, "internal"),
    responseExpectedClass: normalizeString(input.responseExpectedClass, "internal"),
    approvalStatus: normalizeString(input.approvalStatus, "not_requested"),
    costEstimate,
    costEstimateRequired: true,
    evidenceRequired: true,
    auditRequired: true,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    externalNetworkAllowed: false,
    rawPayloadStored: false,
    safeSummary: buildSafeSummary(input, redaction),
    redactedPayload: redactObject(input.safeSummary || {}),
    evidenceRefs: normalizeArray(input.evidenceRefs),
    auditRefs: normalizeArray(input.auditRefs),
    disabledReason: normalizeString(
      input.disabledReason,
      "P64.2 defines governed dispatch envelopes only; execution is not enabled.",
    ),
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
  };
}

export function validateDispatchEnvelope(envelope = {}) {
  const errors = [];
  const warnings = [];

  if (!envelope.dispatchId) errors.push("dispatchId is required");
  if (!DISPATCH_REQUEST_TYPES.includes(envelope.requestType)) {
    errors.push(`Unsupported requestType: ${envelope.requestType || "missing"}`);
  }
  if (!envelope.capabilityId) errors.push("capabilityId is required");
  if (!envelope.scopeLabel) errors.push("scopeLabel is required");
  if (!envelope.disabledReason) errors.push("disabledReason is required");
  if (envelope.executionAllowed !== false) errors.push("executionAllowed must remain false");
  if (envelope.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must remain false");
  if (envelope.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must remain false");
  if (envelope.projectMutationAllowed !== false) errors.push("projectMutationAllowed must remain false");
  if (envelope.dbWritesAllowed !== false) errors.push("dbWritesAllowed must remain false");
  if (envelope.deployAllowed !== false) errors.push("deployAllowed must remain false");
  if (envelope.externalNetworkAllowed !== false) errors.push("externalNetworkAllowed must remain false");
  if (envelope.rawPayloadStored !== false) errors.push("rawPayloadStored must remain false");
  if (!envelope.safeSummary || typeof envelope.safeSummary !== "object") {
    errors.push("safeSummary is required");
  }
  if (!Array.isArray(envelope.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(envelope.auditRefs)) errors.push("auditRefs must be an array");

  const costValidation = validateCostEstimate(envelope.costEstimate || {});
  if (!costValidation.valid) {
    errors.push(...costValidation.errors.map((error) => `costEstimate.${error}`));
  }

  if (isProviderRequest(envelope.requestType) && !envelope.providerId) {
    errors.push("providerId is required for provider dispatch requests");
  }
  if (isToolRequest(envelope.requestType) && !envelope.toolId) {
    errors.push("toolId is required for tool dispatch requests");
  }
  if (envelope.safeSummary?.scopeLabel && envelope.safeSummary.scopeLabel.includes("projects/")) {
    errors.push("safeSummary.scopeLabel must not expose project paths");
  }
  if (envelope.safeSummary?.rawPayloadStored !== false) {
    errors.push("safeSummary.rawPayloadStored must remain false");
  }
  if (!envelope.evidenceRefs.length) warnings.push("evidenceRefs are expected before future execution");
  if (!envelope.auditRefs.length) warnings.push("auditRefs are expected before future execution");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function createDispatchEnvelopeResult(input = {}) {
  const envelope = createDispatchEnvelope(input);
  const validation = validateDispatchEnvelope(envelope);
  const result = validation.valid
    ? createPassResult({
        phase: "P64.2",
        mode: "dispatch-envelope-preview",
        source: "dispatch-governance/dispatchEnvelope.js",
        summary: "Governed dispatch envelope created with execution disabled.",
        data: { envelope },
        warnings: validation.warnings,
      })
    : createBlockedResult({
        phase: "P64.2",
        mode: "dispatch-envelope-preview",
        source: "dispatch-governance/dispatchEnvelope.js",
        summary: "Governed dispatch envelope failed validation.",
        data: { envelope },
        errors: validation.errors,
        warnings: validation.warnings,
      });

  return {
    ...result,
    envelope,
    validation,
    resultValidation: validateResultEnvelope(result),
  };
}
