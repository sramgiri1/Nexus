const TICKET_SYSTEMS = ["jira_preview", "linear_preview"];
const TICKET_EVENTS = [
  "issue.created",
  "issue.updated",
  "issue.assigned",
  "issue.status_changed",
  "issue.priority_changed",
  "comment.created",
];

const EVENT_ACTION_MAP = {
  "issue.created": "plan",
  "issue.updated": "explain",
  "issue.assigned": "review",
  "issue.status_changed": "review",
  "issue.priority_changed": "guard",
  "comment.created": "explain",
};

export function getTicketTriggerCatalog() {
  return TICKET_SYSTEMS.flatMap((system) => (
    TICKET_EVENTS.map((eventType) => ({
      system,
      eventType,
      displayName: `${system.replace("_preview", "")} ${eventType}`,
      mappedAction: EVENT_ACTION_MAP[eventType],
      dryRunOnly: true,
      executionAllowed: false,
    }))
  ));
}

export function mapTicketEventToNexusAction(event = {}) {
  return {
    eventType: event.eventType,
    requestedAction: EVENT_ACTION_MAP[event.eventType] || "explain",
    routeTarget: event.eventType === "issue.created"
      ? "/command-center"
      : event.eventType === "issue.assigned" || event.eventType === "issue.status_changed"
        ? "/command-center/workbench"
        : "/command-center/safety",
    disabledReason: "Jira / Linear - Planned integration. No credentials configured and no outbound calls are enabled.",
  };
}

export function createTicketTriggerPreview(input = {}) {
  const system = input.system || "jira_preview";
  const eventType = input.eventType || "issue.created";
  const mappedAction = mapTicketEventToNexusAction({ eventType });

  return {
    previewVersion: "1.0",
    phase: "P53.5",
    sourceSystem: system,
    eventType,
    projectId: input.projectId || "private-project-01",
    ticketId: input.ticketId || "ticket-preview-001",
    scope: input.scope || "PROJECT_CHANGE",
    privacyClassification: input.privacyClassification || "private_project_metadata",
    ...mappedAction,
    dryRunOnly: true,
    executionAllowed: false,
    ticketApiCallsAllowed: false,
    externalNetworkCallsAllowed: false,
    credentialUseAllowed: false,
    webhookReceiverAllowed: false,
    ticketMutationAllowed: false,
    projectMutationAllowed: false,
    status: "preview_only",
    dedupeKey: `${system}:${eventType}:${input.ticketId || "ticket-preview-001"}`,
  };
}

export function validateTicketTriggerPreview(preview = {}) {
  const errors = [];
  if (!TICKET_SYSTEMS.includes(preview.sourceSystem)) errors.push("Unsupported ticket preview system");
  if (!TICKET_EVENTS.includes(preview.eventType)) errors.push("Unsupported ticket event type");
  if (!preview.projectId) errors.push("Ticket preview requires project scope");
  if (!preview.privacyClassification) errors.push("Ticket preview requires privacy classification");
  if (!preview.dedupeKey) errors.push("Ticket preview requires dedupe key");
  if (preview.dryRunOnly !== true) errors.push("Ticket preview must be dry-run only");
  if (preview.executionAllowed !== false) errors.push("Ticket preview execution must be disabled");
  if (preview.ticketApiCallsAllowed !== false) errors.push("Ticket API calls must be disabled");
  if (preview.externalNetworkCallsAllowed !== false) errors.push("External network calls must be disabled");
  if (preview.credentialUseAllowed !== false) errors.push("Credential use must be disabled");
  if (preview.webhookReceiverAllowed !== false) errors.push("Webhook receiver must be disabled");
  if (preview.ticketMutationAllowed !== false) errors.push("Ticket mutation must be disabled");
  if (preview.projectMutationAllowed !== false) errors.push("Project mutation must be disabled");
  return { valid: errors.length === 0, errors };
}
