import { summarizeHookRegistry, validateHookRegistry } from "./hookSchema.js";

const FORBIDDEN_AUTOMATION_ACTIONS = [
  "provider",
  "tool",
  "worker",
  "db_write",
  "project_mutation",
  "network",
];

const BASE_HOOK = {
  ownerAgent: "NEXUS",
  scope: "project",
  projectId: "private-project",
  triggerType: "manual",
  triggerSource: "operator_preview",
  enabled: false,
  allowedModes: ["local-private"],
  forbiddenModes: ["demo", "public"],
  dataClassification: "private",
  maxRunsPerDay: 0,
  cooldownSeconds: 3600,
  maxRetries: 0,
  maxRuntimeSeconds: 0,
  costPolicy: {
    maxUsdPerRun: 0,
    maxUsdPerDay: 0,
    requiresApprovalAboveUsd: 0,
  },
  requiredEvidence: ["hook-preview-record"],
  requiredApprovals: ["human-operator"],
  allowedActions: ["dry_run_preview"],
  forbiddenActions: FORBIDDEN_AUTOMATION_ACTIONS,
  failClosed: true,
  createdAt: "2026-05-15T20:10:00.000Z",
  updatedAt: "2026-05-15T20:10:00.000Z",
  version: "1.0",
  status: "disabled",
};

export const HOOK_REGISTRY = [
  {
    ...BASE_HOOK,
    hookId: "test-failure-classification",
    label: "Test Failure Classification",
    description: "Classify failed validation evidence and propose a review path.",
    ownerAgent: "SENTINEL",
    triggerType: "validation_result_planned_placeholder",
    triggerSource: "validation_result_preview",
    requiredEvidence: ["failed-validation-summary", "classification-preview"],
    killSwitchId: "kill-hook-test-failure-classification",
  },
  {
    ...BASE_HOOK,
    hookId: "prd-change-test-gap-proposal",
    label: "PRD Change Test Gap Proposal",
    description: "Preview test gap recommendations when product requirements change.",
    ownerAgent: "PRISM",
    triggerType: "prd_change_planned_placeholder",
    triggerSource: "prd_change_preview",
    requiredEvidence: ["prd-change-summary", "test-gap-preview"],
    killSwitchId: "kill-hook-prd-change-test-gap-proposal",
  },
  {
    ...BASE_HOOK,
    hookId: "validation-pass-evidence-update",
    label: "Validation Pass Evidence Update",
    description: "Preview evidence updates after a validation pass.",
    ownerAgent: "AUDITOR",
    triggerType: "validation_result_planned_placeholder",
    triggerSource: "validation_pass_preview",
    requiredEvidence: ["validation-pass-summary", "evidence-update-preview"],
    killSwitchId: "kill-hook-validation-pass-evidence-update",
  },
  {
    ...BASE_HOOK,
    hookId: "repeated-failure-escalation",
    label: "Repeated Failure Escalation",
    description: "Preview escalation guidance for repeated validation failures.",
    ownerAgent: "WARDEN",
    triggerType: "activity_event_planned_placeholder",
    triggerSource: "failure_pattern_preview",
    requiredEvidence: ["failure-pattern-summary", "escalation-preview"],
    requiredApprovals: ["human-operator", "WARDEN"],
    killSwitchId: "kill-hook-repeated-failure-escalation",
  },
  {
    ...BASE_HOOK,
    hookId: "docs-drift-reminder",
    label: "Docs Drift Reminder",
    description: "Preview documentation drift reminders for completed platform changes.",
    ownerAgent: "SHEPHERD",
    triggerType: "file_change_planned_placeholder",
    triggerSource: "docs_drift_preview",
    dataClassification: "internal",
    requiredEvidence: ["docs-drift-summary", "reminder-preview"],
    killSwitchId: "kill-hook-docs-drift-reminder",
  },
];

export function getHookRegistry() {
  return HOOK_REGISTRY.map((hook) => ({
    ...hook,
    allowedModes: [...hook.allowedModes],
    forbiddenModes: [...hook.forbiddenModes],
    costPolicy: { ...hook.costPolicy },
    requiredEvidence: [...hook.requiredEvidence],
    requiredApprovals: [...hook.requiredApprovals],
    allowedActions: [...hook.allowedActions],
    forbiddenActions: [...hook.forbiddenActions],
  }));
}

export function getHookById(hookId) {
  return getHookRegistry().find((hook) => hook.hookId === hookId) || null;
}

export function validateRegisteredHooks(hooks = getHookRegistry()) {
  return validateHookRegistry(hooks);
}

export function summarizeRegisteredHooks(hooks = getHookRegistry()) {
  return summarizeHookRegistry(hooks);
}
