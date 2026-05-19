import { randomUUID } from "node:crypto";

import { createBatchIntelligenceJob, validateBatchIntelligenceJob } from "./batchIntelligenceJob.js";
import { redactObject } from "../shared/redaction.js";

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeItems(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function summarizeItem(item = {}, index) {
  return {
    itemLabel: normalizeString(item.itemLabel, `Work item ${index + 1}`),
    summary: normalizeString(item.summary, "Redacted workload summary only."),
    sourceType: normalizeString(item.sourceType, "report"),
    redactionApplied: true,
    rawSourcePathStored: false,
    rawPayloadStored: false,
    metadata: redactObject(item.metadata || {}),
  };
}

export function buildWorkloadSelectionPreview(input = {}) {
  const selectedItems = normalizeItems(input.items).map(summarizeItem);
  const requests = selectedItems.map((item, index) => ({
    custom_id: `workload_selection_${index + 1}`,
    inputSummary: item.summary,
    metadata: { sourceType: item.sourceType, itemLabel: item.itemLabel },
  }));
  const job = createBatchIntelligenceJob({
    jobId: input.jobId || `workload_selection_${randomUUID()}`,
    workloadType: input.workloadType || "test_gap_analysis",
    scopeLabel: input.scopeLabel || "NEXUS OS",
    requests,
    evidenceRefs: input.evidenceRefs || [],
    activityRefs: input.activityRefs || [],
    safeSummary: input.safeSummary || {},
  });
  const jobValidation = validateBatchIntelligenceJob(job);
  const blockedReasons = [];
  if (selectedItems.length === 0) blockedReasons.push("No redacted workload items were selected.");
  if (!jobValidation.valid) blockedReasons.push(...jobValidation.errors);

  return {
    selectionId: normalizeString(input.selectionId) || `workload_selection_${randomUUID()}`,
    phaseId: "P65.3",
    state: blockedReasons.length === 0 ? "preview_ready" : "blocked_preview",
    workloadType: job.workloadType,
    scopeLabel: normalizeString(input.scopeLabel, "NEXUS OS"),
    ownerCapability: "Batch Intelligence",
    itemCount: selectedItems.length,
    selectedItems,
    batchJob: job,
    redactionApplied: true,
    uploadAllowed: false,
    providerUploadAllowed: false,
    batchSubmissionAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    projectSourceReadAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    externalNetworkAllowed: false,
    rawPayloadStored: false,
    blockedReasons,
    disabledReason: "P65.3 builds redacted workload previews only; provider upload and execution are not enabled.",
    nextAction: "Apply cost and safety gates before any future batch intelligence runtime phase.",
    evidenceRefs: Array.isArray(input.evidenceRefs) ? input.evidenceRefs.map(String) : [],
    activityRefs: Array.isArray(input.activityRefs) ? input.activityRefs.map(String) : [],
    safeSummary: redactObject(input.safeSummary || {}),
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
  };
}

export function validateWorkloadSelectionPreview(selection = {}) {
  const errors = [];
  for (const field of ["selectionId", "phaseId", "state", "workloadType", "scopeLabel", "ownerCapability", "disabledReason", "nextAction", "createdAt"]) {
    if (!selection[field]) errors.push(`Missing ${field}`);
  }
  if (!["preview_ready", "blocked_preview"].includes(selection.state)) errors.push("state must be preview_ready or blocked_preview");
  if (!Array.isArray(selection.selectedItems)) errors.push("selectedItems must be an array");
  if (selection.itemCount !== selection.selectedItems?.length) errors.push("itemCount must match selectedItems length");
  for (const field of [
    "redactionApplied",
  ]) {
    if (selection[field] !== true) errors.push(`${field} must be true`);
  }
  for (const field of [
    "uploadAllowed",
    "providerUploadAllowed",
    "batchSubmissionAllowed",
    "executionAllowed",
    "workerExecutionAllowed",
    "projectSourceReadAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployAllowed",
    "externalNetworkAllowed",
    "rawPayloadStored",
  ]) {
    if (selection[field] !== false) errors.push(`${field} must remain false`);
  }
  for (const item of selection.selectedItems || []) {
    if (item.rawSourcePathStored !== false) errors.push(`${item.itemLabel || "item"} rawSourcePathStored must remain false`);
    if (item.rawPayloadStored !== false) errors.push(`${item.itemLabel || "item"} rawPayloadStored must remain false`);
    if (item.redactionApplied !== true) errors.push(`${item.itemLabel || "item"} redactionApplied must be true`);
  }
  const jobValidation = validateBatchIntelligenceJob(selection.batchJob || {});
  if (!jobValidation.valid) errors.push(...jobValidation.errors.map((error) => `batchJob.${error}`));
  if (JSON.stringify(selection).includes("projects/")) errors.push("selection must not expose project paths");
  if (JSON.stringify(selection).includes("sk-")) errors.push("selection must not expose provider secrets");
  return { valid: errors.length === 0, errors };
}
