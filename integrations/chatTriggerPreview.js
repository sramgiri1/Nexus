const CHAT_SYSTEMS = ["slack_preview", "teams_preview"];
const CHAT_COMMANDS = [
  "/nexus plan",
  "/nexus review",
  "/nexus qa",
  "/nexus fix",
  "/nexus ship",
  "/nexus status",
  "/nexus freeze",
  "/nexus guard",
];

const COMMAND_ACTION_MAP = {
  "/nexus plan": "plan",
  "/nexus review": "review",
  "/nexus qa": "qa",
  "/nexus fix": "fix",
  "/nexus ship": "ship",
  "/nexus status": "explain",
  "/nexus freeze": "freeze",
  "/nexus guard": "guard",
};

export function getChatTriggerCatalog() {
  return CHAT_SYSTEMS.flatMap((system) => (
    CHAT_COMMANDS.map((command) => ({
      system,
      command,
      mappedAction: COMMAND_ACTION_MAP[command],
      dryRunOnly: true,
      executionAllowed: false,
      requiresScopeConfirmation: true,
      requiresProjectConfirmation: true,
      futureApprovalRequired: ["fix", "ship", "freeze", "guard"].includes(COMMAND_ACTION_MAP[command]),
    }))
  ));
}

export function mapChatCommandToNexusAction(command = "") {
  const normalized = command.trim().toLowerCase();
  const requestedAction = COMMAND_ACTION_MAP[normalized] || "explain";
  return {
    command: normalized,
    requestedAction,
    routeTarget: requestedAction === "fix"
      ? "/command-center/implementation"
      : requestedAction === "ship"
        ? "/command-center/release"
        : requestedAction === "review"
          ? "/command-center/workbench"
          : requestedAction === "qa"
            ? "/command-center/gates"
            : "/command-center",
    disabledReason: "Slack / Teams - Planned integration. Chat execution is disabled.",
  };
}

export function createChatTriggerPreview(input = {}) {
  const system = input.system || "slack_preview";
  const command = input.command || "/nexus status";
  const mappedAction = mapChatCommandToNexusAction(command);
  return {
    previewVersion: "1.0",
    phase: "P53.6",
    sourceSystem: system,
    ...mappedAction,
    projectId: input.projectId || "private-project-01",
    scope: input.scope || "PROJECT_CHANGE",
    dryRunOnly: true,
    executionAllowed: false,
    chatApiCallsAllowed: false,
    externalNetworkCallsAllowed: false,
    botTokenUseAllowed: false,
    webhookReceiverAllowed: false,
    channelDataStorageAllowed: false,
    userDataStorageAllowed: false,
    projectMutationAllowed: false,
    requiresScopeConfirmation: true,
    requiresProjectConfirmation: true,
    riskyCommandApprovalRequired: ["fix", "ship", "freeze", "guard"].includes(mappedAction.requestedAction),
    status: "preview_only",
  };
}

export function validateChatTriggerPreview(preview = {}) {
  const errors = [];
  if (!CHAT_SYSTEMS.includes(preview.sourceSystem)) errors.push("Unsupported chat preview system");
  if (!CHAT_COMMANDS.includes(preview.command)) errors.push("Unsupported chat command");
  if (!preview.projectId) errors.push("Chat preview requires project confirmation");
  if (!preview.scope) errors.push("Chat preview requires scope confirmation");
  if (preview.dryRunOnly !== true) errors.push("Chat preview must be dry-run only");
  if (preview.executionAllowed !== false) errors.push("Chat preview execution must be disabled");
  if (preview.chatApiCallsAllowed !== false) errors.push("Chat API calls must be disabled");
  if (preview.externalNetworkCallsAllowed !== false) errors.push("External network calls must be disabled");
  if (preview.botTokenUseAllowed !== false) errors.push("Bot token use must be disabled");
  if (preview.webhookReceiverAllowed !== false) errors.push("Webhook receiver must be disabled");
  if (preview.channelDataStorageAllowed !== false) errors.push("Channel data storage must be disabled");
  if (preview.userDataStorageAllowed !== false) errors.push("User data storage must be disabled");
  if (preview.requiresScopeConfirmation !== true) errors.push("Scope confirmation must be required");
  if (preview.requiresProjectConfirmation !== true) errors.push("Project confirmation must be required");
  return { valid: errors.length === 0, errors };
}
