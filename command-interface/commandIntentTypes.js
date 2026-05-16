export const COMMAND_INTENT_TYPES = Object.freeze([
  "plan_mission",
  "review_plan",
  "run_quality_gate_preview",
  "prepare_fix_preview",
  "prepare_release_preview",
  "guard_scope",
  "freeze_scope",
  "explain_status",
  "open_page",
  "unknown",
]);

export const COMMAND_ACTION_TYPES = Object.freeze([
  "route_preview",
  "read_only_summary",
  "governed_action_preview",
  "blocked",
  "unknown",
]);

export const COMMAND_RISK_LEVELS = Object.freeze(["low", "medium", "high"]);

export const COMMAND_SCOPES = Object.freeze(["os", "portfolio", "project"]);

export const COMMAND_ROUTE_STATUSES = Object.freeze(["available", "blocked", "preview"]);

export const PROJECT_REQUIRED_INTENTS = Object.freeze([
  "plan_mission",
  "review_plan",
  "run_quality_gate_preview",
  "prepare_fix_preview",
  "prepare_release_preview",
]);

export function isProjectRequiredIntent(intentType) {
  return PROJECT_REQUIRED_INTENTS.includes(intentType);
}
