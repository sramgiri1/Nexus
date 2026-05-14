export const ACTIVITY_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "security",
  "audit",
];

export const ACTIVITY_CATEGORIES = [
  "ui",
  "api",
  "action_bridge",
  "agent",
  "task",
  "policy",
  "evidence",
  "tool",
  "provider",
  "worker",
  "test",
  "cost",
  "security",
  "release",
  "recovery",
  "docs",
  "system",
];

export const ACTIVITY_STATUSES = [
  "started",
  "success",
  "failed",
  "blocked",
  "skipped",
  "pending",
  "requires_approval",
];

export const ACTIVITY_DECISIONS = [
  "ALLOW",
  "DENY",
  "REDACT",
  "REQUIRE_APPROVAL",
  "NOT_APPLICABLE",
];

export const ACTIVITY_SCOPES = [
  "NEXUS_OS_CHANGE",
  "PROJECT_CHANGE",
  "CROSS_CUTTING_CHANGE",
  "DEMO",
  "SYSTEM",
];

export const ACTIVITY_MODES = [
  "local-private",
  "demo",
  "public-safe",
  "test",
  "unknown",
];

export const ACTIVITY_SOURCES = [
  "command_center",
  "local_api",
  "action_bridge",
  "checker",
  "script",
  "worker",
  "provider",
  "tool",
  "system",
];

export const ACTIVITY_EVENT_TYPES = {
  ui: [
    "page_viewed",
    "tab_changed",
    "command_palette_opened",
    "operator_action_requested",
  ],
  action_bridge: [
    "mission_compose_requested",
    "mission_compose_completed",
    "task_activation_requested",
    "task_activation_completed",
    "review_requested",
    "review_completed",
    "implementation_requested",
    "implementation_completed",
  ],
  api: [
    "local_api_request_started",
    "local_api_request_completed",
    "local_api_request_failed",
  ],
  agent: [
    "agent_assigned",
    "agent_handoff_requested",
    "agent_message_created",
    "agent_review_requested",
  ],
  task: [
    "task_created",
    "task_state_transition_requested",
    "task_state_transition_completed",
    "task_blocked",
  ],
  policy: [
    "policy_decision_recorded",
    "policy_block_recorded",
    "approval_required",
  ],
  evidence: [
    "evidence_record_created",
    "audit_event_created",
  ],
  system: [
    "nexus_boot_started",
    "nexus_boot_completed",
    "service_health_checked",
    "docs_check_completed",
    "roadmap_status_updated",
  ],
  tool: [
    "tool_call_started",
    "tool_call_completed",
  ],
  provider: [
    "provider_call_started",
    "provider_call_completed",
  ],
  worker: [
    "worker_heartbeat",
    "worker_retry",
  ],
  cost: [
    "cost_budget_checked",
  ],
  recovery: [
    "recovery_point_created",
    "restore_simulation_completed",
  ],
  release: [
    "release_gate_evaluated",
  ],
  test: [
    "test_run_started",
    "test_run_completed",
    "test_run_failed",
  ],
  security: [
    "security_boundary_checked",
    "security_incident_recorded",
  ],
  docs: [
    "docs_check_completed",
    "docs_surface_viewed",
  ],
};

export function validateActivityType(category, eventType) {
  if (!ACTIVITY_CATEGORIES.includes(category)) {
    return false;
  }
  if (typeof eventType !== "string" || eventType.length === 0) {
    return false;
  }
  return (ACTIVITY_EVENT_TYPES[category] || []).includes(eventType);
}
