import { BATCH_WORKLOAD_TYPES, isBatchWorkloadType } from "./batchJobTypes.js";

export function createBatchJob(options = {}) {
  const workloadType = options.workloadType || "docs_generation";
  return {
    batchJobId: options.batchJobId || `batch_preview_${Date.now()}`,
    mode: "preview_only",
    providerId: options.providerId || "openai-preview",
    workloadType,
    externalUploadAllowed: false,
    executionAllowed: false,
    requests: [],
    requestCount: 0,
    customIdsRequired: true,
    costEstimateRequired: true,
    resultReconciliationRequired: true,
    rawInputStored: false,
    status: "preview_created",
  };
}

export function addBatchRequest(batchJob, request = {}) {
  const nextRequest = {
    custom_id: request.custom_id || `request_${batchJob.requests.length + 1}`,
    method: request.method || "POST",
    endpoint: request.endpoint || "/v1/responses",
    inputSummary: request.inputSummary || "Redacted batch request summary only.",
    rawInputStored: false,
    externalCallAllowed: false,
    metadata: request.metadata || {},
  };
  return {
    ...batchJob,
    requests: [...batchJob.requests, nextRequest],
    requestCount: batchJob.requests.length + 1,
  };
}

export function validateBatchJob(batchJob = createBatchJob()) {
  const errors = [];
  if (!batchJob.batchJobId) errors.push("Batch job requires batchJobId");
  if (batchJob.mode !== "preview_only") errors.push("Batch job mode must be preview_only");
  if (!batchJob.providerId) errors.push("Batch job requires providerId");
  if (!isBatchWorkloadType(batchJob.workloadType)) {
    errors.push(`Unsupported batch workload type: ${batchJob.workloadType}`);
  }
  if (batchJob.externalUploadAllowed !== false) errors.push("Batch job must not allow external upload");
  if (batchJob.executionAllowed !== false) errors.push("Batch job must not allow execution");
  if (batchJob.customIdsRequired !== true) errors.push("Batch job must require custom IDs");
  if (batchJob.costEstimateRequired !== true) errors.push("Batch job must require cost estimate");
  if (batchJob.resultReconciliationRequired !== true) errors.push("Batch job must require result reconciliation");
  if (!Array.isArray(batchJob.requests)) errors.push("Batch job requests must be an array");
  if (batchJob.requestCount !== (batchJob.requests || []).length) {
    errors.push("Batch job requestCount must match requests length");
  }
  const seen = new Set();
  for (const request of batchJob.requests || []) {
    if (!request.custom_id) errors.push("Every batch request requires custom_id");
    if (seen.has(request.custom_id)) errors.push(`Duplicate custom_id: ${request.custom_id}`);
    seen.add(request.custom_id);
    if (request.rawInputStored !== false) errors.push(`${request.custom_id} must not store raw input`);
    if (request.externalCallAllowed !== false) errors.push(`${request.custom_id} must not allow external calls`);
  }
  return { valid: errors.length === 0, errors };
}

export function summarizeBatchJob(batchJob = createBatchJob()) {
  return {
    batchJobId: batchJob.batchJobId,
    providerId: batchJob.providerId,
    workloadType: batchJob.workloadType,
    mode: batchJob.mode,
    requestCount: batchJob.requestCount,
    externalUploadAllowed: batchJob.externalUploadAllowed,
    costEstimateRequired: batchJob.costEstimateRequired,
    resultReconciliationRequired: batchJob.resultReconciliationRequired,
    status: batchJob.status,
  };
}

export function estimateBatchJobSize(batchJob = createBatchJob()) {
  const requests = batchJob.requests || [];
  const estimatedLines = requests.length;
  const estimatedBytes = requests.reduce((total, request) => total + JSON.stringify(request).length + 1, 0);
  return {
    batchJobId: batchJob.batchJobId,
    estimatedLines,
    estimatedBytes,
    requestCount: requests.length,
    workloadType: batchJob.workloadType,
    supportedWorkload: BATCH_WORKLOAD_TYPES.includes(batchJob.workloadType),
  };
}
