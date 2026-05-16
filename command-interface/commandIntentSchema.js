import {
  COMMAND_ACTION_TYPES,
  COMMAND_INTENT_TYPES,
  COMMAND_RISK_LEVELS,
  COMMAND_SCOPES,
  isProjectRequiredIntent,
} from "./commandIntentTypes.js";

const INTENT_RULES = [
  { intentType: "plan_mission", actionType: "governed_action_preview", riskLevel: "low", pattern: /\b(plan|mission|milestone|prd|brief)\b/i },
  { intentType: "review_plan", actionType: "route_preview", riskLevel: "medium", pattern: /\b(review|audit|inspect)\b/i },
  { intentType: "run_quality_gate_preview", actionType: "governed_action_preview", riskLevel: "medium", pattern: /\b(qa|quality|test|validate|gate)\b/i },
  { intentType: "prepare_fix_preview", actionType: "governed_action_preview", riskLevel: "high", pattern: /\b(fix|repair|remediate|failure|bug)\b/i },
  { intentType: "prepare_release_preview", actionType: "governed_action_preview", riskLevel: "high", pattern: /\b(ship|release|deploy|launch)\b/i },
  { intentType: "guard_scope", actionType: "read_only_summary", riskLevel: "medium", pattern: /\b(guard|scope|boundary|policy)\b/i },
  { intentType: "freeze_scope", actionType: "blocked", riskLevel: "high", pattern: /\b(freeze|lock|pause)\b/i },
  { intentType: "explain_status", actionType: "read_only_summary", riskLevel: "low", pattern: /\b(explain|status|what'?s|state|summary)\b/i },
  { intentType: "open_page", actionType: "route_preview", riskLevel: "low", pattern: /\b(open|show|go to|navigate)\b/i },
];

function stableCommandId(commandText = "", intentType = "unknown") {
  const raw = `${intentType}|${commandText}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) >>> 0;
  }
  return `cmd_preview_${hash.toString(16).padStart(8, "0").slice(0, 8)}`;
}

export function normalizeCommandText(text = "") {
  return String(text || "").trim().replace(/\s+/g, " ");
}

export function classifyCommandPreview(input = {}) {
  const commandText = normalizeCommandText(input.commandText);
  const match = INTENT_RULES.find((rule) => rule.pattern.test(commandText));
  const intentType = match?.intentType || "unknown";
  const actionType = match?.actionType || "unknown";
  const riskLevel = match?.riskLevel || "low";
  const scope = COMMAND_SCOPES.includes(input.scope) ? input.scope : "project";
  const missingProject = isProjectRequiredIntent(intentType) && scope === "project" && !input.projectId;
  return {
    intentType,
    actionType,
    riskLevel,
    status: missingProject ? "blocked" : intentType === "unknown" ? "blocked" : "preview",
    reason: missingProject
      ? "Select or create a project first."
      : intentType === "unknown"
        ? "Command intent is unknown. Try Plan, Review, QA, Fix, Ship, Guard, Freeze, Explain, or Open."
        : "Classified by deterministic local command rules.",
    previewOnly: true,
  };
}

export function createCommandIntent(input = {}) {
  const commandText = normalizeCommandText(input.commandText);
  const classified = classifyCommandPreview(input);
  return {
    commandId: input.commandId || stableCommandId(commandText, classified.intentType),
    commandText,
    intentType: classified.intentType,
    actionType: classified.actionType,
    mode: input.mode || "local-private",
    scope: COMMAND_SCOPES.includes(input.scope) ? input.scope : "project",
    projectId: input.projectId || "",
    requestedBy: {
      userId: input.requestedBy?.userId || "local-operator",
      role: input.requestedBy?.role || "founder",
      authType: input.requestedBy?.authType || "local",
    },
    source: input.source || "command_center",
    riskLevel: classified.riskLevel,
    status: classified.status,
    reason: classified.reason,
    previewOnly: true,
    executionEnabled: false,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
  };
}

export function validateCommandIntent(intent = {}) {
  const errors = [];
  if (!intent.commandId) errors.push("commandId is required");
  if (!intent.commandText) errors.push("commandText is required");
  if (!COMMAND_INTENT_TYPES.includes(intent.intentType)) errors.push("intentType is invalid");
  if (!COMMAND_ACTION_TYPES.includes(intent.actionType)) errors.push("actionType is invalid");
  if (!COMMAND_RISK_LEVELS.includes(intent.riskLevel)) errors.push("riskLevel is invalid");
  if (!COMMAND_SCOPES.includes(intent.scope)) errors.push("scope is invalid");
  if (intent.previewOnly !== true) errors.push("previewOnly must be true");
  for (const field of [
    "executionEnabled",
    "providerCallsAllowed",
    "toolExecutionAllowed",
    "workerExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
  ]) {
    if (intent[field] !== false) errors.push(`${field} must be false`);
  }
  if (intent.mode === "demo" || intent.projectId === "DemoApp") {
    errors.push("full Command Center command intents must not fall back to DemoApp");
  }
  return { valid: errors.length === 0, errors };
}

export function buildCommandIntentSummary(intent = {}) {
  return {
    commandId: intent.commandId,
    intentType: intent.intentType,
    actionType: intent.actionType,
    scope: intent.scope,
    status: intent.status,
    riskLevel: intent.riskLevel,
    nextAction: intent.status === "blocked" ? intent.reason : "Preview route and approval requirements before execution.",
    previewOnly: intent.previewOnly === true,
  };
}
