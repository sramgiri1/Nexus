export function getApiBatchAdapterPolicy() {
  return {
    version: "1.0",
    phase: "P54",
    purpose: "api_batch_execution_adapter_preview",
    previewOnly: true,
    providerCallsAllowed: false,
    externalNetworkCallsAllowed: false,
    apiKeysAllowed: false,
    credentialReadsAllowed: false,
    dbWritesAllowed: false,
    workerRuntimeAllowed: false,
    projectMutationAllowed: false,
    batchUploadAllowed: false,
    providerPollingAllowed: false,
    rawPromptStorageAllowed: false,
    costEstimateRequired: true,
    evidenceRequired: true,
    humanApprovalRequiredForExecution: true,
  };
}

export function validateApiBatchAdapterPolicy(policy = getApiBatchAdapterPolicy()) {
  const errors = [];
  for (const field of [
    "providerCallsAllowed",
    "externalNetworkCallsAllowed",
    "apiKeysAllowed",
    "credentialReadsAllowed",
    "dbWritesAllowed",
    "workerRuntimeAllowed",
    "projectMutationAllowed",
    "batchUploadAllowed",
    "providerPollingAllowed",
    "rawPromptStorageAllowed",
  ]) {
    if (policy[field] !== false) errors.push(`Policy must set ${field} false`);
  }
  if (policy.previewOnly !== true) errors.push("Policy must be preview-only");
  if (policy.costEstimateRequired !== true) errors.push("Policy must require cost estimates");
  if (policy.evidenceRequired !== true) errors.push("Policy must require evidence");
  if (policy.humanApprovalRequiredForExecution !== true) {
    errors.push("Policy must require human approval before future execution");
  }
  return { valid: errors.length === 0, errors };
}
