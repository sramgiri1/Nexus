import { createSecretReference, validateSecretReference } from "./secretReferenceSchema.js";

const PROVIDERS = [
  ["openai", "OpenAI API Key"],
  ["anthropic", "Anthropic API Key"],
  ["github", "GitHub Token"],
  ["slack-placeholder", "Slack Placeholder"],
  ["jira-linear-placeholder", "Jira / Linear Placeholder"],
  ["cloud-provider-placeholder", "Cloud Provider Placeholder"],
];

export function listProviderCredentialReferences() {
  return PROVIDERS.map(([provider, label]) => createSecretReference({
    referenceId: `secret-ref-provider-${provider}`,
    label,
    provider,
    purpose: "provider_api_access",
    scope: "os",
    environment: "local-private",
    storage: provider.includes("placeholder") ? "not_configured" : "local_env_reference",
    allowedAgents: ["NEXUS"],
    allowedCapabilities: ["provider.dispatch.future"],
    status: "not_configured",
  }));
}

export function validateProviderCredentialReference(ref) {
  const validation = validateSecretReference(ref);
  const errors = [...validation.errors];
  if (ref.scope !== "os") errors.push("provider credential references must be OS-scoped in P59");
  if (ref.valueStored !== false) errors.push("provider credential values must not be stored");
  return { valid: errors.length === 0, errors };
}
