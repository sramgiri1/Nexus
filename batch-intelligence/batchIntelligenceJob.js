import { randomUUID } from "node:crypto";

import {
  addBatchRequest,
  createBatchJob,
  estimateBatchJobSize,
  summarizeBatchJob,
  validateBatchJob,
} from "../api-batch/batchJobBuilder.js";
import { estimateBatchCost, validateCostEstimate } from "../api-batch/costEstimator.js";
import { redactObject } from "../shared/redaction.js";

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function addRequests(batchJob, requests = []) {
  return normalizeArray(requests).reduce((job, request, index) => {
    return addBatchRequest(job, {
      custom_id: request.custom_id || `preview_request_${index + 1}`,
      inputSummary: normalizeString(request.inputSummary, "Redacted batch intelligence request summary."),
      metadata: redactObject(request.metadata || {}),
    });
  }, batchJob);
}

export function createBatchIntelligenceJob(input = {}) {
  const batchJob = addRequests(
    createBatchJob({
      batchJobId: input.batchJobId || input.jobId || `batch_intelligence_${randomUUID()}`,
      providerId: input.providerId || "openai-preview",
      workloadType: input.workloadType || "test_gap_analysis",
    }),
    input.requests || [],
  );
  const batchValidation = validateBatchJob(batchJob);
  const costEstimate = estimateBatchCost(batchJob, {
    modelPolicy: input.modelPolicy || "unset",
    approvalThresholdUsd: input.approvalThresholdUsd || 1,
  });
  const costValidation = validateCostEstimate(costEstimate);

  return {
    jobId: batchJob.batchJobId,
    phaseId: "P65.2",
    state: batchValidation.valid && costValidation.valid ? "preview_ready" : "blocked_preview",
    mode: "preview_only",
    workloadType: batchJob.workloadType,
    scopeLabel: normalizeString(input.scopeLabel, "NEXUS OS"),
    ownerCapability: "Batch Intelligence",
    requestCount: batchJob.requestCount,
    batchJobSummary: summarizeBatchJob(batchJob),
    sizeEstimate: estimateBatchJobSize(batchJob),
    costEstimate,
    uploadAllowed: false,
    providerUploadAllowed: false,
    batchSubmissionAllowed: false,
    providerPollingAllowed: false,
    providerReconciliationAllowed: false,
    providerDispatchAllowed: false,
    executionAllowed: false,
    toolExecutionAllowed: false,
    codeExecutionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    externalNetworkAllowed: false,
    rawInputStored: false,
    rawProviderPayloadStored: false,
    disabledReason: "P65.2 defines preview-only batch intelligence jobs; provider upload and execution are not enabled.",
    blocker: "Provider upload, batch submission, worker runtime, and dispatch approval remain disabled.",
    nextAction: "Build redacted workload selection previews before any future batch intelligence runtime phase.",
    evidenceRefs: normalizeArray(input.evidenceRefs).map(String),
    activityRefs: normalizeArray(input.activityRefs).map(String),
    safeSummary: redactObject(input.safeSummary || {}),
    validationErrors: [...batchValidation.errors, ...costValidation.errors],
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
  };
}

export function validateBatchIntelligenceJob(job = {}) {
  const errors = [];
  for (const field of ["jobId", "phaseId", "state", "mode", "workloadType", "scopeLabel", "ownerCapability", "disabledReason", "nextAction", "createdAt"]) {
    if (!job[field]) errors.push(`Missing ${field}`);
  }
  if (!["preview_ready", "blocked_preview"].includes(job.state)) errors.push("state must be preview_ready or blocked_preview");
  if (job.mode !== "preview_only") errors.push("mode must be preview_only");
  if (job.requestCount !== job.batchJobSummary?.requestCount) errors.push("requestCount must match batchJobSummary");
  for (const field of [
    "uploadAllowed",
    "providerUploadAllowed",
    "batchSubmissionAllowed",
    "providerPollingAllowed",
    "providerReconciliationAllowed",
    "providerDispatchAllowed",
    "executionAllowed",
    "toolExecutionAllowed",
    "codeExecutionAllowed",
    "workerExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployAllowed",
    "externalNetworkAllowed",
    "rawInputStored",
    "rawProviderPayloadStored",
  ]) {
    if (job[field] !== false) errors.push(`${field} must remain false`);
  }
  if (!Array.isArray(job.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(job.activityRefs)) errors.push("activityRefs must be an array");
  if (job.costEstimate?.executionAllowed !== false) errors.push("costEstimate.executionAllowed must remain false");
  if (JSON.stringify(job.safeSummary || {}).includes("projects/")) errors.push("safeSummary must not expose project paths");
  if (JSON.stringify(job).includes("sk-")) errors.push("job must not expose provider secrets");
  return { valid: errors.length === 0, errors };
}
