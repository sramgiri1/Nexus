export const HOOK_REGISTRY_VERSION = "1.0";

export const HOOK_TRIGGER_TYPES = [
  "manual",
  "schedule_planned_placeholder",
  "file_change_planned_placeholder",
  "validation_result_planned_placeholder",
  "prd_change_planned_placeholder",
  "activity_event_planned_placeholder",
  "external_webhook_planned_placeholder",
];

export const HOOK_SCOPES = ["project", "portfolio", "os"];
export const HOOK_STATUSES = ["draft", "ready", "disabled", "blocked", "deprecated"];
export const HOOK_DATA_CLASSIFICATIONS = ["public", "internal", "private", "restricted"];

export function validateHookDefinition(hook) {
  const errors = [];
  const requiredStringFields = [
    "hookId",
    "label",
    "description",
    "ownerAgent",
    "scope",
    "triggerType",
    "triggerSource",
    "dataClassification",
    "killSwitchId",
    "createdAt",
    "updatedAt",
    "version",
    "status",
  ];

  for (const field of requiredStringFields) {
    if (!hook?.[field] || typeof hook[field] !== "string") {
      errors.push(`Missing string field: ${field}`);
    }
  }

  if (!HOOK_SCOPES.includes(hook?.scope)) errors.push(`Invalid scope: ${hook?.scope}`);
  if (!HOOK_TRIGGER_TYPES.includes(hook?.triggerType)) errors.push(`Invalid triggerType: ${hook?.triggerType}`);
  if (!HOOK_STATUSES.includes(hook?.status)) errors.push(`Invalid status: ${hook?.status}`);
  if (!HOOK_DATA_CLASSIFICATIONS.includes(hook?.dataClassification)) {
    errors.push(`Invalid dataClassification: ${hook?.dataClassification}`);
  }

  for (const field of [
    "allowedModes",
    "forbiddenModes",
    "requiredEvidence",
    "requiredApprovals",
    "allowedActions",
    "forbiddenActions",
  ]) {
    if (!Array.isArray(hook?.[field])) errors.push(`Missing array field: ${field}`);
  }

  for (const field of ["maxRunsPerDay", "cooldownSeconds", "maxRetries", "maxRuntimeSeconds"]) {
    if (!Number.isInteger(hook?.[field]) || hook[field] < 0) {
      errors.push(`Invalid non-negative integer field: ${field}`);
    }
  }

  if (!hook?.costPolicy || typeof hook.costPolicy !== "object" || Array.isArray(hook.costPolicy)) {
    errors.push("Missing costPolicy object");
  } else {
    for (const field of ["maxUsdPerRun", "maxUsdPerDay", "requiresApprovalAboveUsd"]) {
      if (typeof hook.costPolicy[field] !== "number" || hook.costPolicy[field] < 0) {
        errors.push(`Invalid costPolicy field: ${field}`);
      }
    }
  }

  if (hook?.enabled !== false) errors.push("enabled must be false in P51");
  if (hook?.failClosed !== true) errors.push("failClosed must be true");

  for (const forbidden of ["provider", "tool", "worker", "db_write", "project_mutation", "network"]) {
    if (!hook?.forbiddenActions?.includes(forbidden)) {
      errors.push(`forbiddenActions must include ${forbidden}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateHookRegistry(hooks) {
  const errors = [];
  const seen = new Set();

  if (!Array.isArray(hooks)) return { valid: false, errors: ["Registry must be an array"] };

  for (const hook of hooks) {
    const validation = validateHookDefinition(hook);
    if (!validation.valid) {
      errors.push(...validation.errors.map((error) => `${hook?.hookId || "unknown"}: ${error}`));
    }
    if (seen.has(hook.hookId)) errors.push(`Duplicate hookId: ${hook.hookId}`);
    seen.add(hook.hookId);
  }

  return { valid: errors.length === 0, errors };
}

export function summarizeHookRegistry(hooks = []) {
  const triggerCounts = {};
  const scopeCounts = {};

  for (const hook of hooks) {
    triggerCounts[hook.triggerType] = (triggerCounts[hook.triggerType] || 0) + 1;
    scopeCounts[hook.scope] = (scopeCounts[hook.scope] || 0) + 1;
  }

  return {
    registryVersion: HOOK_REGISTRY_VERSION,
    hookCount: hooks.length,
    enabledCount: hooks.filter((hook) => hook.enabled === true).length,
    failClosedCount: hooks.filter((hook) => hook.failClosed === true).length,
    triggerCounts,
    scopeCounts,
  };
}
