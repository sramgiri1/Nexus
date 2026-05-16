export const SECRET_REFERENCE_SCHEMA_VERSION = "1.0";

export const SECRET_REFERENCE_STATUSES = ["not_configured", "configured_reference", "blocked"];
export const SECRET_REFERENCE_SCOPES = ["os", "project", "tenant", "environment"];
export const SECRET_REFERENCE_ENVIRONMENTS = ["local-private", "ci", "production-placeholder"];
export const SECRET_REFERENCE_STORAGE = ["external_vault", "local_env_reference", "not_configured"];

export function getSecretReferenceSchema() {
  return {
    schemaVersion: SECRET_REFERENCE_SCHEMA_VERSION,
    phase: "P59.1",
    requiredFields: [
      "referenceId",
      "label",
      "provider",
      "purpose",
      "scope",
      "environment",
      "storage",
      "valueStored",
      "allowedAgents",
      "allowedCapabilities",
      "requiresApproval",
      "redactionRequired",
      "status",
    ],
    rawValuesAllowed: false,
    envReadsAllowed: false,
  };
}

export function createSecretReference(input = {}) {
  return {
    referenceId: input.referenceId || "secret-ref-unconfigured",
    label: input.label || "Unconfigured Secret Reference",
    provider: input.provider || "generic",
    purpose: input.purpose || "credential_reference",
    scope: input.scope || "os",
    projectId: input.projectId ?? null,
    environment: input.environment || "local-private",
    storage: input.storage || "not_configured",
    valueStored: false,
    rawValue: null,
    allowedAgents: Array.isArray(input.allowedAgents) ? input.allowedAgents : [],
    allowedCapabilities: Array.isArray(input.allowedCapabilities) ? input.allowedCapabilities : [],
    requiresApproval: input.requiresApproval !== false,
    redactionRequired: true,
    status: input.status || "not_configured",
    createdAt: input.createdAt || "",
  };
}

export function validateSecretReference(ref = {}) {
  const errors = [];
  if (!ref.referenceId) errors.push("referenceId is required");
  if (!ref.label) errors.push("label is required");
  if (!SECRET_REFERENCE_SCOPES.includes(ref.scope)) errors.push(`invalid scope: ${ref.scope}`);
  if (!SECRET_REFERENCE_ENVIRONMENTS.includes(ref.environment)) errors.push(`invalid environment: ${ref.environment}`);
  if (!SECRET_REFERENCE_STORAGE.includes(ref.storage)) errors.push(`invalid storage: ${ref.storage}`);
  if (!SECRET_REFERENCE_STATUSES.includes(ref.status)) errors.push(`invalid status: ${ref.status}`);
  if (ref.valueStored !== false) errors.push("valueStored must be false in P59");
  if (ref.rawValue !== null && ref.rawValue !== undefined) errors.push("rawValue must be null or undefined");
  if (ref.redactionRequired !== true) errors.push("redactionRequired must be true");
  return { valid: errors.length === 0, errors };
}

export function summarizeSecretReferences(refs = []) {
  return refs.reduce(
    (summary, ref) => {
      summary.total += 1;
      summary.byStatus[ref.status] = (summary.byStatus[ref.status] || 0) + 1;
      summary.byScope[ref.scope] = (summary.byScope[ref.scope] || 0) + 1;
      if (ref.requiresApproval) summary.requiresApproval += 1;
      if (ref.valueStored === true || ref.rawValue) summary.unsafeReferences += 1;
      return summary;
    },
    { total: 0, requiresApproval: 0, unsafeReferences: 0, byStatus: {}, byScope: {} },
  );
}
