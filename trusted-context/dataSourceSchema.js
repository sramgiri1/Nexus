export const DATA_SOURCE_TYPES = [
  "roadmap",
  "phase_status",
  "architecture_doc",
  "module_registry",
  "project_registry",
  "project_profile",
  "project_doc",
  "validation_report",
  "runtime_state",
  "evidence_ledger",
  "audit_ledger",
  "activity_ledger",
  "policy",
  "safety_report",
  "planned_placeholder",
];

export const DATA_CLASSIFICATIONS = ["public-safe", "internal", "confidential", "local-private"];

export const TRUSTED_CONTEXT_SCOPES = ["os", "project", "mission", "task", "runtime", "safety", "portfolio"];

export const REQUIRED_DATA_SOURCE_FIELDS = [
  "sourceId",
  "label",
  "type",
  "scope",
  "projectId",
  "path",
  "systemOfRecord",
  "owner",
  "dataClassification",
  "allowedAgents",
  "forbiddenModes",
  "freshnessPolicy",
  "redactionRequired",
  "lineageRequired",
];

export function createDataSourceTemplate(type = "planned_placeholder") {
  return {
    sourceId: "",
    label: "",
    type,
    scope: "os",
    projectId: null,
    path: "",
    systemOfRecord: false,
    owner: "NEXUS",
    dataClassification: "internal",
    allowedAgents: ["NEXUS"],
    forbiddenModes: ["public"],
    freshnessPolicy: "manual_verified",
    redactionRequired: true,
    lineageRequired: true,
  };
}
