import { randomUUID } from "node:crypto";

import { createDispatchEnvelope, validateDispatchEnvelope } from "../dispatch-governance/dispatchEnvelope.js";
import { buildDispatchDryRun, validateDispatchDryRun } from "../dispatch-governance/dispatchDryRun.js";
import { summarizeContextBudget } from "../tool-governance/contextBudgetGuard.js";
import { redactObject } from "../shared/redaction.js";

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createCodeModeSession(input = {}) {
  const contextBudget = summarizeContextBudget({
    contracts: input.selectedToolContracts || [],
    toolSummaries: input.toolSummaries || [],
    allToolSchemas: input.allToolSchemas === true,
    allMcpSchemas: input.allMcpSchemas === true,
    rawMcpSchemas: input.rawMcpSchemas === true,
    rawToolContracts: input.rawToolContracts === true,
  });
  const dispatchEnvelope = createDispatchEnvelope({
    dispatchId: input.dispatchId || "code_mode_dispatch_preview",
    requestType: "tool.call",
    toolId: input.primaryToolId || "git-status",
    capabilityId: "code-mode-preview",
    scopeLabel: input.scopeLabel || "NEXUS OS",
    requestSummary: input.intentSummary || "Preview code-mode session without execution.",
    safeSummary: input.safeSummary || {},
    evidenceRefs: input.evidenceRefs || [],
    auditRefs: input.activityRefs || [],
  });
  const dryRun = buildDispatchDryRun({ envelope: dispatchEnvelope });

  return {
    sessionId: normalizeString(input.sessionId) || `code_mode_${randomUUID()}`,
    phaseId: "P64.8.2",
    state: "preview_only",
    modeLabel: "Code Mode Preview",
    scopeLabel: normalizeString(input.scopeLabel, "NEXUS OS"),
    ownerCapability: "Code Mode Runtime",
    intentSummary: normalizeString(input.intentSummary, "Preview code-mode session without execution."),
    selectedToolContracts: normalizeArray(input.selectedToolContracts),
    selectedContractCount: normalizeArray(input.selectedToolContracts).length,
    toolSummaryCount: Array.isArray(input.toolSummaries) ? input.toolSummaries.length : 0,
    contextBudget,
    dispatchEnvelope,
    dryRun,
    executionAllowed: false,
    codeExecutionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    externalNetworkAllowed: false,
    workerExecutionAllowed: false,
    allToolSchemasAllowed: false,
    allMcpSchemasAllowed: false,
    rawPayloadStored: false,
    disabledReason: "P64.8.2 defines code-mode sessions only; code execution is not enabled.",
    nextAction: "Select bounded lazy tool contracts before any future code-mode runtime phase.",
    evidenceRefs: normalizeArray(input.evidenceRefs),
    activityRefs: normalizeArray(input.activityRefs),
    safeSummary: redactObject(input.safeSummary || {}),
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
  };
}

export function validateCodeModeSession(session = {}) {
  const errors = [];
  for (const field of [
    "sessionId",
    "phaseId",
    "state",
    "modeLabel",
    "scopeLabel",
    "ownerCapability",
    "intentSummary",
    "disabledReason",
    "nextAction",
    "createdAt",
  ]) {
    if (!session[field]) errors.push(`Missing ${field}`);
  }
  if (session.state !== "preview_only") errors.push("state must be preview_only");
  for (const field of [
    "executionAllowed",
    "codeExecutionAllowed",
    "providerDispatchAllowed",
    "toolExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployAllowed",
    "externalNetworkAllowed",
    "workerExecutionAllowed",
    "allToolSchemasAllowed",
    "allMcpSchemasAllowed",
    "rawPayloadStored",
  ]) {
    if (session[field] !== false) errors.push(`${field} must remain false`);
  }
  if (!Array.isArray(session.selectedToolContracts)) errors.push("selectedToolContracts must be an array");
  if (session.selectedContractCount !== session.selectedToolContracts?.length) {
    errors.push("selectedContractCount must match selectedToolContracts length");
  }
  if (!Array.isArray(session.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(session.activityRefs)) errors.push("activityRefs must be an array");
  if (session.contextBudget?.allToolSchemasDetected === true) errors.push("all tool schemas must not be loaded");
  if (session.contextBudget?.allMcpSchemasDetected === true) errors.push("all MCP schemas must not be loaded");
  const envelopeValidation = validateDispatchEnvelope(session.dispatchEnvelope || {});
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors.map((error) => `dispatchEnvelope.${error}`));
  const dryRunValidation = validateDispatchDryRun(session.dryRun || {});
  if (!dryRunValidation.valid) errors.push(...dryRunValidation.errors.map((error) => `dryRun.${error}`));
  if (JSON.stringify(session.safeSummary || {}).includes("projects/")) {
    errors.push("safeSummary must not expose project paths");
  }
  return { valid: errors.length === 0, errors };
}
