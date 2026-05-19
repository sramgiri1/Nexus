import { createSelfUpdateGate } from "../../../self-update/p68-4-placeholder.js";

export const SELF_UPDATE_ROUTE_ID = "selfUpdate";

function statusLabel(value, readyLabel = "Ready") {
  return value ? readyLabel : "Blocked";
}

export function buildSelfUpdateReadinessViewModel() {
  const gate = createSelfUpdateGate({
    allowedFiles: [
      "dashboard/src/data/selfUpdateReadiness.js",
      "dashboard/src/pages/CommandCenterV2.jsx",
      "scripts/check-p685-command-center-self-update-ux.js",
    ],
    evidenceRefs: ["reports/command-center-self-update-ux-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
  });

  return {
    routeId: SELF_UPDATE_ROUTE_ID,
    pageTitle: "Self-Update",
    currentState: "Approval and rollback gates are ready for operator review.",
    whatChanged: "Command Center now shows self-update scope, approval, rollback, validation, blockers, and evidence without enabling apply.",
    nextAction: "Review the gate evidence and keep apply disabled until a future approved phase explicitly unlocks it.",
    disabledReason: "Self-update apply is display-only here; no patch generation, apply, provider dispatch, worker execution, DB write, deploy, release, network call, or provider spend can run from this route.",
    ownerAgent: "NEXUS operator governance",
    ownerCapability: "Self-update readiness",
    evidenceLocation: "reports/command-center-self-update-ux-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, no network execution, and no provider spend.",
    commandCenterVisible: true,
    readinessCards: [
      {
        label: "Approval",
        value: gate.approvalRequired ? "Required" : "Not required",
        tone: "disabled",
        detail: "Operator approval is required and has not been granted.",
      },
      {
        label: "Scope",
        value: statusLabel(gate.scopeAllowed),
        tone: gate.scopeAllowed ? "pass" : "fail",
        detail: "Allowed scope excludes project source trees.",
      },
      {
        label: "Rollback",
        value: statusLabel(gate.rollbackReady),
        tone: gate.rollbackReady ? "pass" : "fail",
        detail: "Rollback posture is documented for review.",
      },
      {
        label: "Apply",
        value: "Disabled",
        tone: "disabled",
        detail: "Readiness does not unlock self-update apply.",
      },
    ],
    gateRows: [
      { label: "Current state", value: "Ready for operator review" },
      { label: "Approval state", value: "Not requested" },
      { label: "Validation", value: statusLabel(gate.validationReady) },
      { label: "Safety", value: "Apply blocked by policy" },
      { label: "Project mutation", value: "Disabled" },
      { label: "Provider/tool execution", value: "Disabled" },
      { label: "DB/deploy/release", value: "Disabled" },
    ],
    allowedScope: [
      "Self-update readiness view model",
      "Command Center route metadata",
      "Command Center route rendering",
      "Self-update UX checker and report",
    ],
    forbiddenScope: [
      "Project source trees",
      "Provider and tool dispatch",
      "Worker execution",
      "DB writes, deploy, and release actions",
    ],
    blockers: [
      "Operator approval has not been granted.",
      "Self-update readiness cannot unlock apply.",
      "Project mutation, provider/tool execution, worker execution, DB writes, deploy, release, network calls, and provider spend remain disabled.",
    ],
    disabledActions: [
      {
        label: "Apply self-update",
        reason: "Apply remains disabled until a future approved phase explicitly enables governed self-update execution.",
      },
      {
        label: "Generate patch",
        reason: "Patch generation is not exposed from Command Center in this preview.",
      },
      {
        label: "Dispatch tools",
        reason: "Provider, tool, and worker dispatch remain unavailable from this route.",
      },
    ],
  };
}
