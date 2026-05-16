export const BATCH_WORKLOAD_TYPES = [
  "docs_generation",
  "module_classification",
  "test_gap_analysis",
  "stale_memory_scan",
  "refactor_candidate_scan",
];

export const BATCH_JOB_STATUSES = [
  "preview_created",
  "ready_for_review",
  "blocked",
  "upload_not_enabled",
  "awaiting_future_provider_dispatch",
  "reconciled_preview",
];

export function isBatchWorkloadType(value) {
  return BATCH_WORKLOAD_TYPES.includes(value);
}
