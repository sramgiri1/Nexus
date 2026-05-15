import { getTriggerTypes, validateTriggerType } from "./triggerTypes.js";

export function getTriggerGatewaySchema() {
  return {
    schemaVersion: "1.0",
    phase: "P53.1",
    purpose: "trigger_gateway_schema",
    executionAllowed: false,
    dryRunOnly: true,
    runtimeListenersAllowed: false,
    externalNetworkCallsAllowed: false,
    providerCallsAllowed: false,
    dbWritesAllowed: false,
    projectMutationAllowed: false,
    triggerTypes: getTriggerTypes(),
  };
}

export function validateTriggerGatewaySchema(schema = getTriggerGatewaySchema()) {
  const errors = [];
  if (schema.phase !== "P53.1") errors.push("Schema phase must be P53.1");
  if (schema.executionAllowed !== false) errors.push("Trigger execution must be disabled");
  if (schema.dryRunOnly !== true) errors.push("Schema must be dry-run only");
  if (schema.runtimeListenersAllowed !== false) errors.push("Runtime listeners must be disabled");
  if (schema.externalNetworkCallsAllowed !== false) errors.push("External network calls must be disabled");
  if (schema.providerCallsAllowed !== false) errors.push("Provider calls must be disabled");
  if (schema.dbWritesAllowed !== false) errors.push("DB writes must be disabled");
  if (schema.projectMutationAllowed !== false) errors.push("Project mutation must be disabled");
  if (!Array.isArray(schema.triggerTypes) || schema.triggerTypes.length < 9) {
    errors.push("Schema must include all required trigger types");
  }

  for (const triggerType of schema.triggerTypes || []) {
    const validation = validateTriggerType(triggerType);
    if (!validation.valid) {
      errors.push(`${triggerType.triggerType || "unknown"}: ${validation.errors.join("; ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createTriggerGatewaySummary() {
  const schema = getTriggerGatewaySchema();
  return {
    phase: schema.phase,
    triggerTypes: schema.triggerTypes.length,
    enabledNow: schema.triggerTypes.filter((triggerType) => triggerType.enabledNow).length,
    executionAllowed: schema.executionAllowed,
    dryRunOnly: schema.dryRunOnly,
    runtimeListenersAllowed: schema.runtimeListenersAllowed,
    previewOnlyTypes: schema.triggerTypes.filter((triggerType) => triggerType.dryRunOnly).length,
  };
}
