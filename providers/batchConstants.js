// providers/batchConstants.js
// Shared constants for batch lifecycle — imported by batch-submit, batch-status, and tests.

export const DRY_RUN_STATUS       = "dry_run_submitted";
export const DRY_RUN_BATCH_PREFIX = "dryrun-batch-";

// All valid batch item lifecycle states in order
export const BATCH_LIFECYCLE_STATES = [
  "batch_pending",               // queued locally, not yet submitted
  "dry_run_submitted",           // processed by dry-run path; no real API call made
  "provider_submitted",          // submitted to real provider batch API
  "provider_processing",         // provider confirmed receipt, processing in progress
  "provider_completed",          // provider finished, results available
  "provider_failed",             // provider returned failure
  "reconciled",                  // results downloaded, content validated, stored
  "reconciled_requires_review",  // results downloaded but flagged: empty/refusal/gate task/code edits
];
