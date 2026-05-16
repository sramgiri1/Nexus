export function validateBatchResultRecord(record = {}) {
  const errors = [];
  if (!record.custom_id) errors.push("Result record requires custom_id");
  if (record.rawProviderPayloadStored === true) errors.push(`${record.custom_id || "unknown"} stores raw provider payload`);
  if (record.externalDownloadAllowed === true) errors.push(`${record.custom_id || "unknown"} allows external download`);
  if (typeof record.outputSummary !== "string" || !record.outputSummary.trim()) {
    errors.push(`${record.custom_id || "unknown"} requires outputSummary`);
  }
  const serialized = JSON.stringify(record);
  for (const unsafe of ["sk-", "api_key", "secret", "BEGIN PRIVATE KEY"]) {
    if (serialized.includes(unsafe)) errors.push(`${record.custom_id || "unknown"} contains unsafe token: ${unsafe}`);
  }
  return { valid: errors.length === 0, errors };
}

export function mapResultByCustomId(results = []) {
  const map = new Map();
  const errors = [];
  for (const result of results) {
    const validation = validateBatchResultRecord(result);
    if (!validation.valid) errors.push(...validation.errors);
    if (result.custom_id && map.has(result.custom_id)) errors.push(`Duplicate custom_id: ${result.custom_id}`);
    if (result.custom_id) map.set(result.custom_id, result);
  }
  return { map, errors };
}

export function reconcileBatchResultsPreview(batchJob, results = []) {
  const errors = [];
  const warnings = [];
  const { map, errors: mapErrors } = mapResultByCustomId(results);
  errors.push(...mapErrors);
  const matched = [];
  const missing = [];
  for (const request of batchJob.requests || []) {
    const result = map.get(request.custom_id);
    if (result) matched.push({ custom_id: request.custom_id, outputSummary: result.outputSummary });
    else missing.push(request.custom_id);
  }
  const requestIds = new Set((batchJob.requests || []).map((request) => request.custom_id));
  const unmatched = results.filter((result) => result.custom_id && !requestIds.has(result.custom_id)).map((result) => result.custom_id);
  if (missing.length) warnings.push(`Missing results: ${missing.join(", ")}`);
  if (unmatched.length) warnings.push(`Unmatched results: ${unmatched.join(", ")}`);
  return {
    batchJobId: batchJob.batchJobId,
    mode: "preview_only",
    providerDownloadAllowed: false,
    rawProviderPayloadStored: false,
    matched,
    missing,
    unmatched,
    errors,
    warnings,
  };
}

export function summarizeReconciliation(reconciliation) {
  return {
    batchJobId: reconciliation.batchJobId,
    mode: reconciliation.mode,
    matchedCount: reconciliation.matched.length,
    missingCount: reconciliation.missing.length,
    unmatchedCount: reconciliation.unmatched.length,
    errorCount: reconciliation.errors.length,
    warningCount: reconciliation.warnings.length,
    providerDownloadAllowed: reconciliation.providerDownloadAllowed,
  };
}
