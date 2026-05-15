export {
  CHANGE_TYPES,
  SCOPE_DATA_CLASSIFICATIONS,
  SCOPE_RISK_LEVELS,
  SCOPE_STATUS,
  SCOPE_TYPES,
  isValidChangeType,
  isValidScopeType,
} from "./scopeTypes.js";
export {
  classifyActionScope,
  classifyFileSet,
  classifyPath,
  classifyTaskScope,
  summarizeScopeClassification,
  validateScopeClassification,
} from "./scopeClassifier.js";
export {
  evaluateScopePolicy,
  getAllowedRootsForScope,
  getForbiddenRootsForScope,
  loadScopePolicy,
  validateScopePolicy,
} from "./scopePolicy.js";
export {
  buildScopeClassificationReport,
  writeScopeClassificationReport,
} from "./scopeReport.js";
