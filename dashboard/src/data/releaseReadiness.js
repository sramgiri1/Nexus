import { createDeployReadinessGate } from "../../../release-governance/p69-4-placeholder.js";
import { buildReleaseControlShippingPreviewUx } from "./releaseDeployExportPackageUx.js";

export const RELEASE_ROUTE_ID = "release";

function statusLabel(value, readyLabel = "Ready") {
  return value ? readyLabel : "Blocked";
}

export function buildReleaseReadinessViewModel() {
  const gate = createDeployReadinessGate({
    evidenceRefs: ["reports/command-center-release-ux-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
  });
  const shippingPreview = buildReleaseControlShippingPreviewUx();

  return {
    routeId: RELEASE_ROUTE_ID,
    pageTitle: "Release Control",
    currentState: "Deploy readiness is ready for operator review, with release and deploy execution still blocked.",
    whatChanged: "Command Center now shows release candidate readiness, deploy gate posture, approval, rollback, blockers, evidence, activity, cost impact, and blocked shipping preview rows without enabling execution.",
    nextAction: "Review the readiness evidence, resolve blockers, and keep release and deploy actions disabled until a future approved phase explicitly unlocks governed execution.",
    disabledReason: "Release and deploy execution are display-only here; no package creation, release, deploy, provider dispatch, worker execution, DB write, project mutation, network call, or provider spend can run from this route.",
    ownerAgent: "NEXUS operator governance",
    ownerCapability: "Release and deploy readiness",
    evidenceLocation: "reports/command-center-release-ux-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, packaging execution, network execution, deploy execution, or provider spend.",
    commandCenterVisible: true,
    shippingPreviewLabel: shippingPreview.label,
    shippingPreviewRows: shippingPreview.rows,
    shippingPreviewSummary: shippingPreview.summary,
    readinessCards: [
      {
        label: "Approval",
        value: gate.approvalRequired ? "Required" : "Not required",
        tone: "disabled",
        detail: "Operator approval is required and has not been requested.",
      },
      {
        label: "Validation",
        value: statusLabel(gate.validationReady),
        tone: gate.validationReady ? "pass" : "fail",
        detail: "Validation command evidence is present for review.",
      },
      {
        label: "Rollback",
        value: statusLabel(gate.rollbackReady),
        tone: gate.rollbackReady ? "pass" : "fail",
        detail: "Rollback posture is documented before any future deploy path.",
      },
      {
        label: "Deploy",
        value: "Disabled",
        tone: "disabled",
        detail: "Readiness does not unlock deploy execution.",
      },
    ],
    gateRows: [
      { label: "Current state", value: "Ready for operator review" },
      { label: "Approval state", value: "Not requested" },
      { label: "Release execution", value: "Disabled" },
      { label: "Deploy execution", value: "Disabled" },
      { label: "Package creation", value: "Disabled" },
      { label: "Project mutation", value: "Disabled" },
      { label: "Provider/tool/worker execution", value: "Disabled" },
      { label: "DB/network/provider spend", value: "Disabled" },
    ],
    allowedScope: [
      "Release readiness view model",
      "Command Center route metadata",
      "Command Center release route rendering",
      "Release UX checker and report",
    ],
    forbiddenScope: [
      "Project source trees",
      "Release package creation",
      "Release and deploy execution",
      "Provider/tool/worker execution, DB writes, network calls, and provider spend",
    ],
    blockers: [
      "Operator approval has not been granted.",
      "Release and deploy execution cannot be unlocked from Command Center.",
      "Project mutation, provider/tool execution, worker execution, DB writes, network calls, and provider spend remain disabled.",
    ],
    disabledActions: [
      {
        label: "Create release package",
        reason: "Package creation remains disabled until a future approved phase explicitly enables governed release packaging.",
      },
      {
        label: "Start deploy",
        reason: "Deploy execution remains disabled; this route records readiness only.",
      },
      {
        label: "Override gate",
        reason: "Gate overrides are unavailable from Command Center and require a future governed approval path.",
      },
    ],
  };
}
