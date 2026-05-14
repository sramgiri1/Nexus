export {
  AUDIT_SCAN_AREAS,
  buildReuseAudit,
  classifyDuplicatePattern,
  scanDuplicatePatterns,
  summarizeReuseAudit,
  validateReuseAudit,
} from "./reuseAudit.js";

export {
  buildRefactorCandidatePlan,
  prioritizeRefactorCandidates,
  validateRefactorCandidatePlan,
  validateRefactorCandidatePlan as validateReuseRefactorCandidatePlan,
} from "./refactorCandidates.js";

export {
  getSharedHelperById,
  getSharedHelperCatalog,
  listSharedHelperCategories,
  summarizeSharedHelperCatalog,
  validateSharedHelperCatalog,
} from "./sharedHelperCatalog.js";

export {
  buildRefactorCandidatePlan as buildSharedHelperRefactorCandidatePlan,
  getFirstSafeRefactorCandidates,
  getRefactorCandidatesByRisk,
  summarizeRefactorCandidatePlan,
  validateRefactorCandidatePlan as validateSharedHelperRefactorCandidatePlan,
  writeRefactorCandidatePlanReport,
} from "./refactorCandidatePlan.js";
