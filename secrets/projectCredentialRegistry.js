import { createSecretReference, validateSecretReference } from "./secretReferenceSchema.js";

const CATEGORIES = [
  "app_database",
  "ci_cd",
  "deployment",
  "mobile_signing",
  "oauth",
  "notification_service",
  "payment_provider",
  "storage_provider",
];

export function listProjectCredentialReferences(projectId = "private-project") {
  return CATEGORIES.map((category) => createSecretReference({
    referenceId: `secret-ref-project-${category}`,
    label: category.replace(/_/g, " "),
    provider: category,
    purpose: "project_credential_reference",
    scope: "project",
    projectId,
    environment: category === "deployment" ? "production-placeholder" : "local-private",
    storage: "not_configured",
    allowedAgents: [],
    allowedCapabilities: [`project.${category}.future`],
    status: "blocked",
  }));
}

export function validateProjectCredentialReference(ref) {
  const validation = validateSecretReference(ref);
  const errors = [...validation.errors];
  if (ref.scope !== "project") errors.push("project credential references must be project-scoped");
  if (!ref.projectId) errors.push("projectId is required");
  if (ref.valueStored !== false) errors.push("project credential values must not be stored");
  return { valid: errors.length === 0, errors };
}
