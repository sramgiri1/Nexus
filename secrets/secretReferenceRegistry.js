import { createSecretReference, validateSecretReference } from "./secretReferenceSchema.js";

const REFERENCE_INPUTS = [
  {
    referenceId: "secret-ref-openai-api-key",
    label: "OpenAI API Key",
    provider: "openai",
    purpose: "provider_api_access",
    scope: "os",
    environment: "local-private",
    storage: "local_env_reference",
    allowedAgents: ["NEXUS"],
    allowedCapabilities: ["provider.dispatch.preview"],
    status: "not_configured",
  },
  {
    referenceId: "secret-ref-anthropic-api-key",
    label: "Anthropic API Key",
    provider: "anthropic",
    purpose: "provider_api_access",
    scope: "os",
    environment: "local-private",
    storage: "local_env_reference",
    allowedAgents: ["NEXUS"],
    allowedCapabilities: ["provider.dispatch.preview"],
    status: "not_configured",
  },
  {
    referenceId: "secret-ref-github-token",
    label: "GitHub Token",
    provider: "github",
    purpose: "repository_api_access",
    scope: "os",
    environment: "local-private",
    storage: "local_env_reference",
    allowedAgents: ["AUDITOR"],
    allowedCapabilities: ["git.lifecycle.preview"],
    status: "not_configured",
  },
  {
    referenceId: "secret-ref-project-db-url",
    label: "Project Database URL",
    provider: "database",
    purpose: "project_database_access",
    scope: "project",
    projectId: "private-project",
    environment: "local-private",
    storage: "not_configured",
    allowedAgents: [],
    allowedCapabilities: ["db.runtime.future"],
    status: "blocked",
  },
  {
    referenceId: "secret-ref-deploy-token",
    label: "Deploy Token",
    provider: "deployment",
    purpose: "deploy_access",
    scope: "project",
    projectId: "private-project",
    environment: "production-placeholder",
    storage: "external_vault",
    allowedAgents: [],
    allowedCapabilities: ["release.deploy.future"],
    status: "blocked",
  },
];

export function listSecretReferences(options = {}) {
  const refs = REFERENCE_INPUTS.map(createSecretReference);
  if (options.scope) return refs.filter((ref) => ref.scope === options.scope);
  if (options.provider) return refs.filter((ref) => ref.provider === options.provider);
  return refs;
}

export function validateSecretReferenceRegistry(refs = listSecretReferences()) {
  const errors = [];
  const seen = new Set();
  for (const ref of refs) {
    const validation = validateSecretReference(ref);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${ref.referenceId}: ${error}`));
    if (seen.has(ref.referenceId)) errors.push(`duplicate referenceId: ${ref.referenceId}`);
    seen.add(ref.referenceId);
  }
  return { valid: errors.length === 0, errors };
}
