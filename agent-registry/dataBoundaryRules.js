export const DATA_BOUNDARY_RULE_VERSION = "1.0";

export const DATA_CLASSIFICATION_ORDER = ["public", "internal", "confidential", "restricted", "secret"];

export const AGENT_DATA_BOUNDARIES = {
  NEXUS: ["public", "internal", "confidential"],
  SHEPHERD: ["public", "internal", "confidential"],
  CORE: ["public", "internal", "confidential"],
  SWIFT: ["public", "internal"],
  SENTINEL: ["public", "internal", "confidential"],
  AUDITOR: ["public", "internal", "confidential", "restricted"],
  WARDEN: ["public", "internal", "confidential", "restricted"],
  PRISM: ["public", "internal", "confidential"],
  FORGE: ["public", "internal"],
};

export const FORBIDDEN_DATA_REFERENCES = [
  "secret",
  "raw-secrets",
  "private-source-detailed-scan",
  "provider-credential",
  "production-db-row",
];

export function getDataBoundaryForAgent(agentId) {
  return {
    allowedDataClassifications: AGENT_DATA_BOUNDARIES[agentId] || ["public", "internal"],
    forbiddenDataReferences: FORBIDDEN_DATA_REFERENCES,
  };
}
