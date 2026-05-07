export {
  buildIdentityContext,
  validateIdentityContext,
  createDelegationHop,
} from "./identityContext.js";
export {
  createPolicyDecision,
  normalizePolicyDecision,
} from "./policyDecision.js";
export { evaluateTrafficRequest } from "./trafficPlane.js";
export {
  createEvidenceRecord,
  verifyEvidenceRecord,
  hashEvidenceRecord,
} from "./evidenceRecord.js";
export {
  classifyBehaviorEvent,
  updateBehaviorBaseline,
  compareBehaviorToBaseline,
  createEmptyBaseline,
} from "./behaviorBaseline.js";
