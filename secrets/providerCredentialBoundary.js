import { listProviderCredentialReferences, validateProviderCredentialReference } from "./providerCredentialRegistry.js";

export function getProviderCredentialBoundary() {
  return {
    phase: "P59.4",
    previewOnly: true,
    providerCallsAllowed: false,
    credentialValuesReadable: false,
    references: listProviderCredentialReferences(),
  };
}

export function evaluateProviderCredentialReadiness(providerId) {
  const ref = listProviderCredentialReferences().find((item) => item.provider === providerId);
  if (!ref) return "reference_not_configured";
  if (ref.status === "blocked") return "blocked_until_provider_dispatch";
  return ref.storage === "not_configured" ? "reference_not_configured" : "metadata_ready";
}

export function summarizeProviderCredentialBoundary() {
  const boundary = getProviderCredentialBoundary();
  return {
    totalProviders: boundary.references.length,
    metadataReady: boundary.references.filter((ref) => evaluateProviderCredentialReadiness(ref.provider) === "metadata_ready").length,
    notConfigured: boundary.references.filter((ref) => evaluateProviderCredentialReadiness(ref.provider) === "reference_not_configured").length,
    providerCallsAllowed: boundary.providerCallsAllowed,
    credentialValuesReadable: boundary.credentialValuesReadable,
  };
}

export { listProviderCredentialReferences, validateProviderCredentialReference };
