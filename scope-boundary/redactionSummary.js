const DEFAULT_EXCLUDED_CONTENT = Object.freeze([
  "NEXUS agents and policy files",
  "runtime state and service PID files",
  "evidence, audit, and activity ledgers",
  "provider/tool/worker internals",
  "secrets, credentials, and key material",
  "demo-only data",
]);

export function createRedactionSummary(input = {}) {
  const excludedContent = Array.isArray(input.excludedContent) && input.excludedContent.length > 0
    ? input.excludedContent
    : [...DEFAULT_EXCLUDED_CONTENT];

  return {
    redactionVersion: "1.0",
    redacted: true,
    privateProjectNameRedacted: input.privateProjectNameRedacted !== false,
    secretsRemoved: true,
    nexusInternalsRemoved: true,
    localRuntimeStateRemoved: true,
    ledgerPayloadsRemoved: true,
    demoDataRemoved: true,
    excludedContent,
    notes: [
      "Manifest contains release posture only, not source files or internal NEXUS runtime content.",
      "Package creation remains disabled.",
    ],
  };
}

export function validateRedactionSummary(summary = {}) {
  const errors = [];
  if (summary.redactionVersion !== "1.0") errors.push("redactionVersion must be 1.0");
  if (summary.redacted !== true) errors.push("summary must be marked redacted");
  if (summary.secretsRemoved !== true) errors.push("secretsRemoved must be true");
  if (summary.nexusInternalsRemoved !== true) errors.push("nexusInternalsRemoved must be true");
  if (summary.localRuntimeStateRemoved !== true) errors.push("localRuntimeStateRemoved must be true");
  if (summary.ledgerPayloadsRemoved !== true) errors.push("ledgerPayloadsRemoved must be true");
  if (!Array.isArray(summary.excludedContent)) errors.push("excludedContent must be an array");
  return {
    valid: errors.length === 0,
    errors,
  };
}
