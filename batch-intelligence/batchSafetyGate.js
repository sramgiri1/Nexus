import { randomUUID } from "node:crypto";

import { buildCostApprovalSummary, validateCostEstimate } from "../api-batch/costEstimator.js";
import { buildWorkloadSelectionPreview, validateWorkloadSelectionPreview } from "./workloadSelectionPreview.js";

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function buildBatchIntelligenceSafetyGate(input = {}) {
  const selection = input.selection || buildWorkloadSelectionPreview(input.selectionInput || {});
  const selectionValidation = validateWorkloadSelectionPreview(selection);
  const costEstimate = input.costEstimate || selection.batchJob?.costEstimate || {};
  const costValidation = validateCostEstimate(costEstimate);
  const blockedReasons = [];

  if (!selectionValidation.valid) blockedReasons.push(...selectionValidation.errors);
  if (!costValidation.valid) blockedReasons.push(...costValidation.errors);
  if (input.dataClassification === "restricted") blockedReasons.push("Restricted data cannot be sent to batch intelligence previews.");
  if (input.redactionEvidencePresent !== true) blockedReasons.push("Redaction evidence is required before batch intelligence review.");
  if (selection.uploadAllowed !== false || selection.executionAllowed !== false) {
    blockedReasons.push("Selection must keep upload and execution disabled.");
  }

  const costApproval = buildCostApprovalSummary(costEstimate);
  return {
    gateId: normalizeString(input.gateId) || `batch_safety_gate_${randomUUID()}`,
    phaseId: "P65.4",
    decision: blockedReasons.length === 0 ? "review_ready_preview" : "blocked_preview",
    state: "preview_only",
    workloadType: selection.workloadType,
    scopeLabel: normalizeString(input.scopeLabel, selection.scopeLabel || "NEXUS OS"),
    ownerCapability: "Batch Intelligence Safety Gate",
    itemCount: selection.itemCount,
    requestCount: selection.batchJob?.requestCount || 0,
    costEstimate,
    costApproval,
    approvalRequired: costApproval.approvalRequired,
    redactionEvidencePresent: input.redactionEvidencePresent === true,
    dataClassification: normalizeString(input.dataClassification, "internal"),
    uploadAllowed: false,
    providerUploadAllowed: false,
    batchSubmissionAllowed: false,
    providerSpendAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    externalNetworkAllowed: false,
    rawPayloadStored: false,
    blockedReasons,
    disabledReason: "P65.4 evaluates preview gates only; provider upload, spend, and execution are not enabled.",
    nextAction:
      blockedReasons.length === 0
        ? "Show batch intelligence readiness in Command Center before any future runtime phase."
        : "Resolve redaction and safety blockers before batch intelligence review can proceed.",
    evidenceRefs: normalizeArray(input.evidenceRefs),
    activityRefs: normalizeArray(input.activityRefs),
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
  };
}

export function validateBatchIntelligenceSafetyGate(gate = {}) {
  const errors = [];
  for (const field of ["gateId", "phaseId", "decision", "state", "workloadType", "scopeLabel", "ownerCapability", "disabledReason", "nextAction", "createdAt"]) {
    if (!gate[field]) errors.push(`Missing ${field}`);
  }
  if (!["review_ready_preview", "blocked_preview"].includes(gate.decision)) errors.push("decision must be review_ready_preview or blocked_preview");
  if (gate.state !== "preview_only") errors.push("state must be preview_only");
  for (const field of [
    "uploadAllowed",
    "providerUploadAllowed",
    "batchSubmissionAllowed",
    "providerSpendAllowed",
    "executionAllowed",
    "workerExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployAllowed",
    "externalNetworkAllowed",
    "rawPayloadStored",
  ]) {
    if (gate[field] !== false) errors.push(`${field} must remain false`);
  }
  if (!Array.isArray(gate.blockedReasons)) errors.push("blockedReasons must be an array");
  if (!Array.isArray(gate.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(gate.activityRefs)) errors.push("activityRefs must be an array");
  if (gate.costEstimate?.executionAllowed !== false) errors.push("costEstimate.executionAllowed must remain false");
  if (gate.costApproval?.executionAllowed !== false) errors.push("costApproval.executionAllowed must remain false");
  if (gate.dataClassification === "restricted" && gate.decision !== "blocked_preview") {
    errors.push("restricted data must block the gate");
  }
  if (gate.redactionEvidencePresent !== true && gate.decision !== "blocked_preview") {
    errors.push("missing redaction evidence must block the gate");
  }
  if (JSON.stringify(gate).includes("projects/")) errors.push("gate must not expose project paths");
  if (JSON.stringify(gate).includes("sk-")) errors.push("gate must not expose provider secrets");
  return { valid: errors.length === 0, errors };
}
