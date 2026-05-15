import { HOOK_TRIGGER_TYPES } from "./hookSchema.js";

export const TRIGGER_DEFINITION_STATUS = {
  MANUAL_DRY_RUN_ONLY: "manual_dry_run_only",
  PLANNED_PLACEHOLDER: "planned_placeholder",
  BLOCKED_RUNTIME: "blocked_runtime",
};

export const HOOK_TRIGGER_DEFINITIONS = [
  {
    triggerType: "manual",
    label: "Manual Preview",
    description: "Operator-requested dry-run preview. This does not execute a hook.",
    status: TRIGGER_DEFINITION_STATUS.MANUAL_DRY_RUN_ONLY,
    runtimeEnabled: false,
    externalInputAllowed: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    requiredEvidence: ["operator-preview-request"],
    safetyNotes: ["Manual trigger definitions are preview-only in P51."],
  },
  {
    triggerType: "schedule_planned_placeholder",
    label: "Schedule Placeholder",
    description: "Future scheduled trigger metadata. Cron and timers are not enabled.",
    status: TRIGGER_DEFINITION_STATUS.PLANNED_PLACEHOLDER,
    runtimeEnabled: false,
    externalInputAllowed: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    requiredEvidence: ["schedule-intent-preview"],
    safetyNotes: ["No scheduler or background worker is active in P51."],
  },
  {
    triggerType: "file_change_planned_placeholder",
    label: "File Change Placeholder",
    description: "Future file-change trigger metadata. File watchers are not enabled.",
    status: TRIGGER_DEFINITION_STATUS.PLANNED_PLACEHOLDER,
    runtimeEnabled: false,
    externalInputAllowed: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    requiredEvidence: ["file-change-preview"],
    safetyNotes: ["No file watcher or project mutation path is active in P51."],
  },
  {
    triggerType: "validation_result_planned_placeholder",
    label: "Validation Result Placeholder",
    description: "Future validation-result trigger metadata for test and gate evidence.",
    status: TRIGGER_DEFINITION_STATUS.PLANNED_PLACEHOLDER,
    runtimeEnabled: false,
    externalInputAllowed: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    requiredEvidence: ["validation-result-preview"],
    safetyNotes: ["Validation triggers do not start automated repair or provider dispatch."],
  },
  {
    triggerType: "prd_change_planned_placeholder",
    label: "PRD Change Placeholder",
    description: "Future product-requirements trigger metadata for test gap planning.",
    status: TRIGGER_DEFINITION_STATUS.PLANNED_PLACEHOLDER,
    runtimeEnabled: false,
    externalInputAllowed: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    requiredEvidence: ["prd-change-preview"],
    safetyNotes: ["PRD changes produce preview metadata only in P51."],
  },
  {
    triggerType: "activity_event_planned_placeholder",
    label: "Activity Event Placeholder",
    description: "Future activity-event trigger metadata for escalations and reminders.",
    status: TRIGGER_DEFINITION_STATUS.PLANNED_PLACEHOLDER,
    runtimeEnabled: false,
    externalInputAllowed: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    requiredEvidence: ["activity-event-preview"],
    safetyNotes: ["Activity events do not execute hooks until a later governed runtime phase."],
  },
  {
    triggerType: "external_webhook_planned_placeholder",
    label: "External Webhook Placeholder",
    description: "Future external webhook metadata. Network listeners are not enabled.",
    status: TRIGGER_DEFINITION_STATUS.BLOCKED_RUNTIME,
    runtimeEnabled: false,
    externalInputAllowed: false,
    schedulerAllowed: false,
    webhookAllowed: false,
    requiredEvidence: ["webhook-intent-preview"],
    safetyNotes: ["External network and webhook runtime are explicitly disabled in P51."],
  },
];

export function getTriggerDefinitions() {
  return HOOK_TRIGGER_DEFINITIONS.map((definition) => ({
    ...definition,
    requiredEvidence: [...definition.requiredEvidence],
    safetyNotes: [...definition.safetyNotes],
  }));
}

export function getTriggerDefinitionByType(triggerType) {
  return getTriggerDefinitions().find((definition) => definition.triggerType === triggerType) || null;
}

export function validateTriggerDefinition(trigger) {
  const errors = [];

  if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) {
    return { valid: false, errors: ["Trigger definition must be an object"] };
  }

  for (const field of ["triggerType", "label", "description", "status"]) {
    if (!trigger[field] || typeof trigger[field] !== "string") {
      errors.push(`Missing string field: ${field}`);
    }
  }

  if (!HOOK_TRIGGER_TYPES.includes(trigger.triggerType)) {
    errors.push(`Invalid triggerType: ${trigger.triggerType}`);
  }

  for (const field of ["runtimeEnabled", "externalInputAllowed", "schedulerAllowed", "webhookAllowed"]) {
    if (trigger[field] !== false) errors.push(`${field} must be false in P51`);
  }

  if (!Array.isArray(trigger.requiredEvidence) || trigger.requiredEvidence.length === 0) {
    errors.push("requiredEvidence must be a non-empty array");
  }

  if (!Array.isArray(trigger.safetyNotes) || trigger.safetyNotes.length === 0) {
    errors.push("safetyNotes must be a non-empty array");
  }

  return { valid: errors.length === 0, errors };
}

export function validateTriggerDefinitions(triggers = getTriggerDefinitions()) {
  const errors = [];
  const seen = new Set();

  for (const trigger of triggers) {
    const validation = validateTriggerDefinition(trigger);
    if (!validation.valid) {
      errors.push(...validation.errors.map((error) => `${trigger?.triggerType || "unknown"}: ${error}`));
    }
    if (seen.has(trigger.triggerType)) errors.push(`Duplicate triggerType: ${trigger.triggerType}`);
    seen.add(trigger.triggerType);
  }

  for (const triggerType of HOOK_TRIGGER_TYPES) {
    if (!seen.has(triggerType)) errors.push(`Missing trigger definition: ${triggerType}`);
  }

  return { valid: errors.length === 0, errors };
}

export function summarizeTriggerDefinitions(triggers = getTriggerDefinitions()) {
  return {
    triggerCount: triggers.length,
    runtimeEnabledCount: triggers.filter((trigger) => trigger.runtimeEnabled).length,
    schedulerAllowedCount: triggers.filter((trigger) => trigger.schedulerAllowed).length,
    webhookAllowedCount: triggers.filter((trigger) => trigger.webhookAllowed).length,
    externalInputAllowedCount: triggers.filter((trigger) => trigger.externalInputAllowed).length,
  };
}
