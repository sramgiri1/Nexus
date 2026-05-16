import { isProjectRequiredIntent } from "./commandIntentTypes.js";
import { getOperatorActionForIntent } from "./operatorActionCatalog.js";

function capabilityReady(capabilityId, context = {}) {
  const readiness = context.capabilityReadiness || {};
  const entry = readiness[capabilityId];
  if (!entry) return false;
  return ["ready", "ready_read_only", "ready_scoped", "ready_limited"].includes(entry.status);
}

export function routeCommandIntent(intent = {}, context = {}) {
  const action = getOperatorActionForIntent(intent.intentType);
  if (!action) {
    return {
      routeStatus: "blocked",
      actionType: "unknown",
      routeTarget: "/command-center",
      blockedReason: "Unknown command intent.",
      nextAction: "Try Plan, Review, QA, Fix, Ship, Guard, Freeze, Explain, or Open.",
      previewOnly: true,
    };
  }

  if (isProjectRequiredIntent(intent.intentType) && intent.scope === "project" && !intent.projectId) {
    return {
      actionId: action.actionId,
      routeStatus: "blocked",
      actionType: "blocked",
      routeTarget: action.routeTarget,
      blockedReason: "Select or create a project first.",
      nextAction: "Create or select a project, then retry the command.",
      riskLevel: action.riskLevel,
      previewOnly: true,
    };
  }

  const missingCapabilities = action.requiredCapabilities.filter((capabilityId) => {
    if (["failingEvidence", "runtimeLocks", "releaseActionBridge", "controlledValidation", "testSuiteManager"].includes(capabilityId)) {
      return true;
    }
    return !capabilityReady(capabilityId, context);
  });
  const routeStatus = missingCapabilities.length ? "blocked" : "preview";
  return {
    actionId: action.actionId,
    label: action.label,
    routeStatus,
    actionType: routeStatus === "blocked" ? "blocked" : "route_preview",
    routeTarget: action.routeTarget,
    requiredCapabilities: action.requiredCapabilities,
    missingCapabilities,
    blockedReason: routeStatus === "blocked" ? action.blockedReason : "",
    nextAction: routeStatus === "blocked" ? action.nextAction : action.nextAction,
    riskLevel: action.riskLevel,
    evidenceLocation: "Command timeline preview and future activity ledger.",
    executionEnabled: false,
    previewOnly: true,
  };
}

export function validateCommandRoute(route = {}) {
  const errors = [];
  if (!["available", "blocked", "preview"].includes(route.routeStatus)) errors.push("routeStatus is invalid");
  if (!route.routeTarget) errors.push("routeTarget is required");
  if (!route.nextAction) errors.push("nextAction is required");
  if (route.previewOnly !== true) errors.push("previewOnly must be true");
  if (route.executionEnabled === true) errors.push("executionEnabled must not be true");
  if (route.routeStatus === "blocked" && !route.blockedReason) errors.push("blocked routes need blockedReason");
  return { valid: errors.length === 0, errors };
}

export function buildCommandRoutePreview(intent = {}, route = {}) {
  return {
    commandId: intent.commandId,
    commandText: intent.commandText,
    intentType: intent.intentType,
    scope: intent.scope,
    routeStatus: route.routeStatus,
    routeTarget: route.routeTarget,
    riskLevel: route.riskLevel || intent.riskLevel,
    blockedReason: route.blockedReason || "",
    nextAction: route.nextAction,
    evidenceLocation: route.evidenceLocation || "Command timeline preview.",
    previewOnly: true,
  };
}
