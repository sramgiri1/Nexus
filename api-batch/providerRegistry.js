import { createProviderAdapter, validateProviderAdapter } from "./providerAdapter.js";

const PROVIDER_ADAPTERS = [
  createProviderAdapter(),
  createProviderAdapter({
    providerId: "anthropic-preview",
    label: "Claude API Preview",
    status: "planned",
    supportedModes: ["request_preview", "batch_preview"],
    supportedWorkloads: ["classification", "summarization", "docs_generation", "review_assistance"],
  }),
  createProviderAdapter({
    providerId: "generic-api-preview",
    label: "Generic API Preview",
    status: "planned",
    supportedModes: ["request_preview"],
    supportedWorkloads: ["classification", "summarization"],
  }),
];

export function listProviderAdapters() {
  return PROVIDER_ADAPTERS.map((adapter) => ({ ...adapter }));
}

export function getProviderAdapter(providerId) {
  return listProviderAdapters().find((adapter) => adapter.providerId === providerId) || null;
}

export function validateProviderRegistry(adapters = listProviderAdapters()) {
  const errors = [];
  if (!Array.isArray(adapters) || adapters.length === 0) errors.push("Provider registry must not be empty");
  for (const adapter of adapters || []) {
    const validation = validateProviderAdapter(adapter);
    if (!validation.valid) errors.push(`${adapter.providerId || "unknown"}: ${validation.errors.join("; ")}`);
  }
  return { valid: errors.length === 0, errors };
}

export function summarizeProviderRegistry(adapters = listProviderAdapters()) {
  return {
    providerCount: adapters.length,
    previewOnlyCount: adapters.filter((adapter) => adapter.status === "preview_only").length,
    plannedCount: adapters.filter((adapter) => adapter.status === "planned").length,
    externalCallsEnabledCount: adapters.filter((adapter) => adapter.externalCallsEnabled).length,
    executionEnabled: false,
  };
}
