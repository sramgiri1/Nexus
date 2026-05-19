import { randomUUID } from "node:crypto";

import { summarizeContextBudget } from "../tool-governance/contextBudgetGuard.js";
import { getToolContract } from "../tool-governance/toolContractLoader.js";
import { redactObject } from "../shared/redaction.js";

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function summarizeContract(contractResult) {
  if (!contractResult?.contract) return null;
  const contract = contractResult.contract;
  return {
    toolId: contract.toolId,
    version: contract.version,
    purpose: contract.purpose,
    methods: Array.isArray(contract.methods) ? [...contract.methods] : [],
    allowedScopes: Array.isArray(contract.allowedScopes) ? [...contract.allowedScopes] : [],
    costEstimateShape: contract.costEstimateShape,
    evidenceShape: contract.evidenceShape,
    auditShape: contract.auditShape,
    executionEnabled: false,
  };
}

export function buildLazyToolSelectionPacket(input = {}) {
  const requestedToolIds = normalizeArray(input.selectedToolIds || input.selectedContracts);
  const contractResults = requestedToolIds.map((toolId) => ({
    toolId,
    result: getToolContract(toolId, {
      scope: normalizeString(input.scope, "NEXUS_OS_CHANGE"),
      agentId: normalizeString(input.agentId, "NEXUS"),
      projectId: normalizeString(input.projectId, "private-project"),
      dataClassification: normalizeString(input.dataClassification, "internal"),
      costEstimateUsd: 0,
    }),
  }));
  const selectedContracts = contractResults.map((entry) => summarizeContract(entry.result)).filter(Boolean);
  const unavailableContracts = contractResults
    .filter((entry) => !entry.result.allowed)
    .map((entry) => ({
      toolId: entry.toolId,
      reason: entry.result.reason || "Selected tool contract is unavailable",
    }));
  const contextBudget = summarizeContextBudget({
    contracts: selectedContracts,
    toolSummaries: input.toolSummaries || [],
    allToolSchemas: input.allToolSchemas === true,
    allMcpSchemas: input.allMcpSchemas === true,
    rawMcpSchemas: input.rawMcpSchemas === true,
    rawToolContracts: input.rawToolContracts === true,
  });
  const blockedReasons = [
    ...unavailableContracts.map((entry) => `${entry.toolId}: ${entry.reason}`),
    ...contextBudget.errors,
  ];

  return {
    packetId: normalizeString(input.packetId) || `lazy_tool_packet_${randomUUID()}`,
    phaseId: "P64.8.3",
    state: blockedReasons.length === 0 ? "ready_preview" : "blocked_preview",
    scopeLabel: normalizeString(input.scopeLabel, "NEXUS OS"),
    ownerCapability: "Code Mode Runtime",
    selectedContracts,
    contractCount: selectedContracts.length,
    requestedContractCount: requestedToolIds.length,
    unavailableContracts,
    toolSummaryCount: Array.isArray(input.toolSummaries) ? input.toolSummaries.length : 0,
    contextBudget,
    budgetAllowed: contextBudget.allowed && unavailableContracts.length === 0,
    blockedReasons,
    blockedBulkLoadingReason:
      blockedReasons.length > 0
        ? "Only selected lazy contracts may enter code-mode context; bulk schema loading is blocked."
        : "",
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
    rawToolSchemasIncluded: false,
    rawMcpSchemasIncluded: false,
    nextAction:
      blockedReasons.length > 0
        ? "Reduce selected contracts to bounded metadata-only contracts before code-mode preview can continue."
        : "Show selected lazy contract readiness in Command Center before any future execution phase.",
    evidenceRefs: normalizeArray(input.evidenceRefs),
    activityRefs: normalizeArray(input.activityRefs),
    safeSummary: redactObject(input.safeSummary || {}),
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
  };
}

export function validateLazyToolSelectionPacket(packet = {}) {
  const errors = [];
  for (const field of ["packetId", "phaseId", "state", "scopeLabel", "ownerCapability", "nextAction", "createdAt"]) {
    if (!packet[field]) errors.push(`Missing ${field}`);
  }
  if (!["ready_preview", "blocked_preview"].includes(packet.state)) errors.push("state must be ready_preview or blocked_preview");
  if (!Array.isArray(packet.selectedContracts)) errors.push("selectedContracts must be an array");
  if (packet.contractCount !== packet.selectedContracts?.length) errors.push("contractCount must match selectedContracts length");
  if (!Array.isArray(packet.unavailableContracts)) errors.push("unavailableContracts must be an array");
  if (!Array.isArray(packet.blockedReasons)) errors.push("blockedReasons must be an array");
  if (!Array.isArray(packet.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(packet.activityRefs)) errors.push("activityRefs must be an array");
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
    "rawToolSchemasIncluded",
    "rawMcpSchemasIncluded",
  ]) {
    if (packet[field] !== false) errors.push(`${field} must remain false`);
  }
  if (packet.state === "ready_preview" && packet.contextBudget?.allToolSchemasDetected === true) {
    errors.push("ready packets must not include all-tool schema requests");
  }
  if (packet.state === "ready_preview" && packet.contextBudget?.allMcpSchemasDetected === true) {
    errors.push("ready packets must not include all-MCP schema requests");
  }
  if (packet.state === "ready_preview" && packet.contextBudget?.rawMcpSchemasDetected === true) {
    errors.push("ready packets must not include raw MCP schema requests");
  }
  for (const contract of packet.selectedContracts || []) {
    if (contract.executionEnabled !== false) errors.push(`${contract.toolId || "contract"} executionEnabled must be false`);
    if (contract.inputSchema || contract.outputSchema || contract.examples) {
      errors.push(`${contract.toolId || "contract"} must be a summary, not a raw contract body`);
    }
  }
  if (packet.budgetAllowed === false && packet.blockedReasons.length === 0) errors.push("blocked packets must explain blockedReasons");
  if (JSON.stringify(packet.safeSummary || {}).includes("projects/")) errors.push("safeSummary must not expose project paths");
  return { valid: errors.length === 0, errors };
}
