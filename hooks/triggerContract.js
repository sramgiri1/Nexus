import { getTriggerDefinitionByType } from "./triggerDefinitions.js";

export function buildTriggerContract(hook, triggerDefinition = getTriggerDefinitionByType(hook?.triggerType)) {
  return {
    hookId: hook?.hookId || "unknown",
    triggerType: hook?.triggerType || "unknown",
    triggerSource: hook?.triggerSource || "unknown",
    label: triggerDefinition?.label || "Unknown Trigger",
    mode: "dry_run_preview",
    executable: false,
    runtimeEnabled: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    externalInputAllowed: false,
    requiredEvidence: [
      ...(triggerDefinition?.requiredEvidence || []),
      ...(hook?.requiredEvidence || []),
    ],
    safetyNotes: [
      "Trigger contracts are non-executable in P51.",
      ...(triggerDefinition?.safetyNotes || []),
    ],
  };
}

export function validateTriggerContract(contract) {
  const errors = [];

  for (const field of ["hookId", "triggerType", "triggerSource", "label", "mode"]) {
    if (!contract?.[field] || typeof contract[field] !== "string") {
      errors.push(`Missing string field: ${field}`);
    }
  }

  for (const field of ["executable", "runtimeEnabled", "schedulerAllowed", "webhookAllowed", "externalInputAllowed"]) {
    if (contract?.[field] !== false) errors.push(`${field} must be false`);
  }

  if (contract?.mode !== "dry_run_preview") errors.push("mode must be dry_run_preview");
  if (!Array.isArray(contract?.requiredEvidence) || contract.requiredEvidence.length === 0) {
    errors.push("requiredEvidence must be a non-empty array");
  }
  if (!Array.isArray(contract?.safetyNotes) || contract.safetyNotes.length === 0) {
    errors.push("safetyNotes must be a non-empty array");
  }

  return { valid: errors.length === 0, errors };
}

export function buildTriggerPreview(hook, simulatedEvent = {}) {
  const contract = buildTriggerContract(hook);
  const validation = validateTriggerContract(contract);

  return {
    hookId: hook?.hookId || "unknown",
    triggerType: hook?.triggerType || "unknown",
    dryRun: true,
    wouldExecute: false,
    decision: validation.valid ? "PREVIEW_ONLY" : "BLOCKED_INVALID_CONTRACT",
    disabledReason: "Hook execution is not enabled in P51.",
    simulatedEvent: {
      eventType: simulatedEvent.eventType || "manual_preview",
      source: simulatedEvent.source || "operator",
      redacted: true,
    },
    contract,
    validation,
  };
}
