import { createShippingReadinessGate } from "../../../project-shipping/p71-4-placeholder.js";
import { buildProjectShippingPreviewUx } from "./releaseDeployExportPackageUx.js";

export const PROJECT_SHIPPING_ROUTE_ID = "projectShipping";

function statusLabel(value, readyLabel = "Ready") {
  return value ? readyLabel : "Blocked";
}

export function buildProjectShippingReadinessViewModel() {
  const gate = createShippingReadinessGate({
    evidenceRefs: ["reports/command-center-shipping-ux-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
  });
  const shippingPreview = buildProjectShippingPreviewUx();

  return {
    routeId: PROJECT_SHIPPING_ROUTE_ID,
    pageTitle: "Project Shipping",
    currentState: "Shipping readiness is ready for operator review, with package creation, export execution, project mutation, artifact creation, deploy, and release execution still blocked.",
    whatChanged: "Command Center now shows shipping state, export readiness, redaction posture, approval, blockers, evidence, activity, cost impact, and blocked shipping preview rows without enabling export.",
    nextAction: "Review redaction and evidence, resolve blockers, and keep package and export actions disabled until a future approved phase explicitly unlocks governed execution.",
    disabledReason: "Project shipping is display-only here; no package creation, export execution, artifact creation, project mutation, provider dispatch, worker execution, DB write, deploy, release, network call, or provider spend can run from this route.",
    ownerAgent: "NEXUS operator governance",
    ownerCapability: "Project shipping and export readiness",
    evidenceLocation: "reports/command-center-shipping-ux-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, package artifact creation, export execution, network calls, deploy/release execution, project mutation, or provider spend.",
    commandCenterVisible: true,
    shippingPreviewLabel: shippingPreview.label,
    shippingPreviewRows: shippingPreview.rows,
    shippingPreviewSummary: shippingPreview.summary,
    readinessCards: [
      {
        label: "Manifest",
        value: statusLabel(gate.manifestReady),
        tone: gate.manifestReady ? "pass" : "fail",
        detail: "Display-safe shipping manifest is available for review.",
      },
      {
        label: "Package",
        value: statusLabel(gate.previewReady, "Preview"),
        tone: gate.previewReady ? "pending" : "fail",
        detail: "Package contents are preview-only; no artifact is created.",
      },
      {
        label: "Redaction",
        value: statusLabel(gate.redactionReady),
        tone: gate.redactionReady ? "pass" : "fail",
        detail: "Raw paths, raw evidence, private IDs, secrets, and internals stay blocked.",
      },
      {
        label: "Export",
        value: "Disabled",
        tone: "disabled",
        detail: "Readiness does not unlock package creation or export execution.",
      },
    ],
    gateRows: [
      { label: "Shipping state", value: "Ready for operator review" },
      { label: "Export readiness", value: "Preview only" },
      { label: "Approval state", value: "Operator review required" },
      { label: "Package creation", value: "Disabled" },
      { label: "Export execution", value: "Disabled" },
      { label: "Project mutation", value: "Disabled" },
      { label: "Artifact creation", value: "Disabled" },
      { label: "DB/network/provider spend", value: "Disabled" },
    ],
    allowedScope: [
      "Project shipping readiness view model",
      "Command Center route metadata",
      "Command Center shipping route rendering",
      "Shipping UX checker and report",
    ],
    forbiddenScope: [
      "Project source trees",
      "Project roadmap files",
      "Package artifacts and export execution",
      "Provider/tool/worker execution, DB writes, network calls, and provider spend",
    ],
    blockers: [
      "Operator approval has not been granted.",
      "Shipping readiness cannot unlock package creation or export execution.",
      "Project mutation, artifact creation, provider/tool execution, worker execution, DB writes, network calls, deploy/release execution, and provider spend remain disabled.",
    ],
    disabledActions: [
      {
        label: "Create package",
        reason: "Package artifact creation remains disabled until a future approved phase explicitly enables governed packaging.",
      },
      {
        label: "Run export",
        reason: "Export execution remains disabled; this route records readiness only.",
      },
      {
        label: "Ship handoff",
        reason: "Shipping execution remains disabled and requires a future governed approval path.",
      },
    ],
  };
}
