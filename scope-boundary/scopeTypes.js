export const SCOPE_TYPES = Object.freeze({
  NEXUS_OS: "NEXUS_OS",
  PROJECT: "PROJECT",
  CROSS_CUTTING: "CROSS_CUTTING",
  DEMO: "DEMO",
  UNKNOWN: "UNKNOWN",
});

export const CHANGE_TYPES = Object.freeze({
  NEXUS_OS_CHANGE: "NEXUS_OS_CHANGE",
  PROJECT_CHANGE: "PROJECT_CHANGE",
  CROSS_CUTTING_CHANGE: "CROSS_CUTTING_CHANGE",
  DEMO_CHANGE: "DEMO_CHANGE",
  UNKNOWN_CHANGE: "UNKNOWN_CHANGE",
});

export const SCOPE_STATUS = Object.freeze({
  CLASSIFIED: "classified",
  UNCLASSIFIED: "unclassified",
  REQUIRES_REVIEW: "requires_review",
  BLOCKED: "blocked",
});

export const SCOPE_RISK_LEVELS = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
});

export const SCOPE_DATA_CLASSIFICATIONS = Object.freeze({
  PUBLIC: "public",
  INTERNAL: "internal",
  CONFIDENTIAL: "confidential",
  RESTRICTED: "restricted",
});

export function isValidScopeType(scopeType) {
  return Object.values(SCOPE_TYPES).includes(scopeType);
}

export function isValidChangeType(changeType) {
  return Object.values(CHANGE_TYPES).includes(changeType);
}
