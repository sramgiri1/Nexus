export const MEMORY_SCOPES = [
  "global_agent",
  "nexus_os",
  "project",
  "mission",
  "task",
  "session",
  "evidence_linked",
  "promotion_candidate",
];

export const CHANGE_SCOPES = [
  "NEXUS_OS_CHANGE",
  "PROJECT_CHANGE",
  "CROSS_CUTTING_CHANGE",
  "DEMO_CHANGE",
  "DOCS_CHANGE",
  "UNKNOWN",
];

export const MEMORY_FRESHNESS_STATES = [
  "fresh",
  "stale_pending_validation",
  "expired",
  "invalidated",
  "unknown",
];

export const MEMORY_CLASSIFICATIONS = [
  "public_safe",
  "local_private",
  "project_private",
  "os_internal",
  "sensitive_metadata",
  "forbidden",
];

export const FORBIDDEN_MEMORY_CLASSES = [
  "secrets",
  ".env",
  "raw credentials",
  "unrelated project memory",
  "raw private source",
  "raw prompts unless explicitly allowed",
  "unrelated audit history",
];

export function isValidMemoryScope(scope) {
  return MEMORY_SCOPES.includes(scope);
}

export function isValidChangeScope(scope) {
  return CHANGE_SCOPES.includes(scope);
}

export function isForbiddenMemoryClass(value) {
  const normalized = String(value || "").toLowerCase();
  return FORBIDDEN_MEMORY_CLASSES.some((entry) => normalized.includes(entry.toLowerCase()));
}
