import { createManualTriggerRequest, previewManualTrigger } from "../../../trigger-gateway/index.js";

const COMMAND_SCHEMA_FIELDS = [
  "id",
  "label",
  "shortLabel",
  "category",
  "intent",
  "ownerAgent",
  "riskLevel",
  "capabilityId",
  "requiredCapabilities",
  "currentState",
  "disabledReason",
  "evidenceProduced",
  "costMode",
  "actionMode",
  "routeTarget",
  "commandCenterVisible",
];

export const NEXUS_COMMANDS = [
  {
    id: "plan",
    label: "Plan Mission",
    shortLabel: "Plan",
    category: "Plan",
    intent: "Turn a goal into a governed mission plan.",
    ownerAgent: "SHEPHERD",
    riskLevel: "low",
    capabilityId: "missionComposer",
    requiredCapabilities: ["missionComposer", "missionActionBridge"],
    currentState: "Available",
    disabledReason: "Requires governed mission composer.",
    evidenceProduced: "Mission contract, task plan, and planning audit records.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "existing_governed_action",
    routeTarget: "/command-center",
    commandCenterVisible: true,
  },
  {
    id: "review",
    label: "Review Work",
    shortLabel: "Review",
    category: "Review",
    intent: "Review activated task output, evidence, and blockers.",
    ownerAgent: "AUDITOR",
    riskLevel: "medium",
    capabilityId: "agentWorkbench",
    requiredCapabilities: ["agentWorkbench", "humanReview"],
    currentState: "Available",
    disabledReason: "Requires an activated task.",
    evidenceProduced: "Review decision, audit entries, and linked evidence posture.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "route_only",
    routeTarget: "/command-center/workbench",
    commandCenterVisible: true,
  },
  {
    id: "qa",
    label: "Run QA Gate",
    shortLabel: "QA",
    category: "Validate",
    intent: "Validate project or OS work through approved test gates.",
    ownerAgent: "SENTINEL",
    riskLevel: "medium",
    capabilityId: "controlledValidation",
    requiredCapabilities: ["controlledValidation", "liveLocalApi"],
    currentState: "Not enabled",
    disabledReason: "Requires controlled validation bridge.",
    evidenceProduced: "Validation report, gate evidence, and approval-ready findings.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "not_enabled",
    routeTarget: "/command-center/gates",
    commandCenterVisible: true,
  },
  {
    id: "fix",
    label: "Propose Fix",
    shortLabel: "Fix",
    category: "Build",
    intent: "Propose a safe fix for a known failure.",
    ownerAgent: "CORE + SENTINEL",
    riskLevel: "high",
    capabilityId: "controlledImplementation",
    requiredCapabilities: ["controlledImplementation", "controlledValidation"],
    currentState: "Not enabled",
    disabledReason: "Requires failing validation evidence.",
    evidenceProduced: "Scoped remediation proposal, validation plan, and rollback posture.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "not_enabled",
    routeTarget: "/command-center/implementation",
    commandCenterVisible: true,
  },
  {
    id: "ship",
    label: "Prepare Ship",
    shortLabel: "Ship",
    category: "Release",
    intent: "Prepare release readiness and release evidence.",
    ownerAgent: "NEXUS + AUDITOR",
    riskLevel: "high",
    capabilityId: "releaseActionBridge",
    requiredCapabilities: ["releaseActionBridge", "humanReview"],
    currentState: "Not enabled",
    disabledReason: "Requires release action bridge.",
    evidenceProduced: "Release checklist, verification gate summary, and release evidence package.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "not_enabled",
    routeTarget: "/command-center/release",
    commandCenterVisible: true,
  },
  {
    id: "retro",
    label: "Run Retro",
    shortLabel: "Retro",
    category: "Learn",
    intent: "Summarize work completed, blockers, lessons learned, and next actions.",
    ownerAgent: "SHEPHERD + AUDITOR",
    riskLevel: "low",
    capabilityId: "operatorActions",
    requiredCapabilities: ["operatorActions"],
    currentState: "Available as read-only summary",
    disabledReason: "Requires activity/evidence history.",
    evidenceProduced: "Summary of completed work, blockers, lessons learned, and next steps.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "read_only_summary",
    routeTarget: "/command-center",
    commandCenterVisible: true,
  },
  {
    id: "guard",
    label: "Guard Scope",
    shortLabel: "Guard",
    category: "Govern",
    intent: "Review and lock the active scope before work continues.",
    ownerAgent: "WARDEN",
    riskLevel: "medium",
    capabilityId: "operatorActions",
    requiredCapabilities: ["operatorActions"],
    currentState: "Available as read-only boundary preview",
    disabledReason: "Runtime locks are not enabled yet.",
    evidenceProduced: "Boundary summary, safety posture, and current governed limits.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "read_only_summary",
    routeTarget: "/command-center/safety",
    commandCenterVisible: true,
  },
  {
    id: "freeze",
    label: "Freeze Workspace",
    shortLabel: "Freeze",
    category: "Govern",
    intent: "Prevent risky actions while review or recovery is pending.",
    ownerAgent: "WARDEN + NEXUS",
    riskLevel: "high",
    capabilityId: "runtimeLocks",
    requiredCapabilities: ["runtimeLocks"],
    currentState: "Not enabled",
    disabledReason: "Requires runtime lock controls.",
    evidenceProduced: "Future runtime lock evidence once enforcement exists.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "not_enabled",
    routeTarget: "/command-center/safety",
    commandCenterVisible: true,
  },
  {
    id: "explain",
    label: "Explain Current State",
    shortLabel: "Explain",
    category: "Explain",
    intent: "Explain what NEXUS sees, what is ready, what is blocked, and what to do next.",
    ownerAgent: "NEXUS",
    riskLevel: "low",
    capabilityId: "commandPalette",
    requiredCapabilities: ["commandPalette"],
    currentState: "Available",
    disabledReason: "",
    evidenceProduced: "Read-only summary only. No new execution artifacts are created.",
    costMode: "Local-only. Provider spend disabled.",
    actionMode: "read_only_summary",
    routeTarget: "/command-center",
    commandCenterVisible: true,
  },
];

export function getCommandById(commandId) {
  return NEXUS_COMMANDS.find((command) => command.id === commandId) || null;
}

function capabilityEnabled(capabilityReadiness, capabilityId) {
  if (!capabilityId) return false;
  const entry = capabilityReadiness?.[capabilityId];
  return entry
    ? ["ready", "ready_read_only", "ready_scoped", "ready_limited"].includes(entry.status)
    : false;
}

function activeScopeLabel(scope) {
  return scope?.activeProject || scope?.activeScope || "Private Project";
}

export function getNexusCommandsForScope(scope = {}, capabilityReadiness = {}) {
  const bridgeOnline = scope?.actionBridgeOnline === true;
  const liveApiOnline = scope?.liveApiOnline === true;
  const hasActivatedTasks = (scope?.activatedTaskCount || 0) > 0;
  const hasEvidenceHistory = (scope?.evidenceCount || 0) > 0 || (scope?.activityCount || 0) > 0;
  const hasFailingEvidence = scope?.hasFailingEvidence === true;

  return NEXUS_COMMANDS.map((command) => {
    let currentState = command.currentState;
    let disabledReason = command.disabledReason;
    let actionMode = command.actionMode;
    let available = false;

    switch (command.id) {
      case "plan":
        available = capabilityEnabled(capabilityReadiness, "missionComposer")
          && capabilityEnabled(capabilityReadiness, "missionActionBridge")
          && bridgeOnline;
        currentState = available ? "Available" : "Requires action bridge";
        disabledReason = bridgeOnline
          ? "Requires governed mission composer."
          : "Requires action bridge.";
        actionMode = "route_only";
        break;
      case "review":
        available = capabilityEnabled(capabilityReadiness, "agentWorkbench")
          && capabilityEnabled(capabilityReadiness, "humanReview")
          && hasActivatedTasks;
        currentState = available ? "Available" : "Requires activated task";
        disabledReason = "Requires an activated task.";
        actionMode = "route_only";
        break;
      case "qa":
        available = capabilityEnabled(capabilityReadiness, "controlledValidation") && liveApiOnline;
        currentState = available ? "Available" : "Not enabled";
        disabledReason = liveApiOnline
          ? "Requires controlled validation bridge."
          : "Requires controlled validation bridge.";
        actionMode = available ? "existing_governed_action" : "not_enabled";
        break;
      case "fix":
        available = capabilityEnabled(capabilityReadiness, "controlledImplementation") && hasFailingEvidence;
        currentState = available ? "Available for scoped implementation" : "Not enabled";
        disabledReason = hasFailingEvidence
          ? "Requires controlled implementation bridge."
          : "Requires failing validation evidence.";
        actionMode = available ? "route_only" : "not_enabled";
        break;
      case "ship":
        available = false;
        currentState = "Not enabled";
        disabledReason = "Requires release action bridge.";
        actionMode = "not_enabled";
        break;
      case "retro":
        available = hasEvidenceHistory;
        currentState = available ? "Available as read-only summary" : "Planned";
        disabledReason = "Requires activity/evidence history.";
        actionMode = available ? "read_only_summary" : "not_enabled";
        break;
      case "guard":
        available = capabilityEnabled(capabilityReadiness, "operatorActions");
        currentState = available ? "Available as read-only boundary preview" : "Not enabled";
        disabledReason = "Runtime locks are not enabled yet.";
        actionMode = available ? "read_only_summary" : "not_enabled";
        break;
      case "freeze":
        available = false;
        currentState = "Not enabled";
        disabledReason = "Requires runtime lock controls.";
        actionMode = "not_enabled";
        break;
      case "explain":
        available = capabilityEnabled(capabilityReadiness, "commandPalette");
        currentState = available ? "Available" : "Unknown";
        disabledReason = "";
        actionMode = "read_only_summary";
        break;
      default:
        break;
    }

    return {
      ...command,
      schemaFields: COMMAND_SCHEMA_FIELDS,
      available,
      currentState,
      disabledReason,
      actionMode,
      activeScope: activeScopeLabel(scope),
      serviceState: {
        actionBridge: bridgeOnline ? "Online" : "Offline",
        liveApi: liveApiOnline ? "Online" : "Snapshot fallback",
      },
      triggerPreview: previewManualTrigger(createManualTriggerRequest({
        triggerType: "manual.command_palette",
        source: "command_palette",
        mode: scope?.mode || "local-private",
        scope: scope?.changeScope || "PROJECT_CHANGE",
        projectId: scope?.selectedProjectId || "private-project-01",
        requestedAction: command.id,
        requestedBy: { userId: "local-operator", role: "operator", authType: "local" },
      })),
    };
  });
}
