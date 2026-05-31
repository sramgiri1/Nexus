import { createMitigationReadinessGate } from "../../../deploy-monitoring/p70-4-placeholder.js";
import { buildDeployMonitoringShippingPreviewUx } from "./releaseDeployExportPackageUx.js";

export const DEPLOY_MONITORING_ROUTE_ID = "deployMonitoring";

function statusLabel(value, readyLabel = "Ready") {
  return value ? readyLabel : "Blocked";
}

export function buildDeployMonitoringReadinessViewModel() {
  const gate = createMitigationReadinessGate({
    evidenceRefs: ["reports/command-center-monitoring-ux-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
  });
  const shippingPreview = buildDeployMonitoringShippingPreviewUx();

  return {
    routeId: DEPLOY_MONITORING_ROUTE_ID,
    pageTitle: "Deploy Monitoring",
    currentState: "Mitigation readiness is ready for operator review, with monitoring, alerts, rollback, deploy, incident, and mitigation execution still blocked.",
    whatChanged: "Command Center now shows monitor state, incident state, mitigation gate posture, approval, rollback, blockers, evidence, activity, cost impact, and blocked shipping preview rows without enabling execution.",
    nextAction: "Review monitoring evidence, resolve blockers, and keep alert, rollback, deploy, incident, and mitigation actions disabled until a future approved phase explicitly unlocks governed execution.",
    disabledReason: "Deploy monitoring is display-only here; no monitor execution, alert dispatch, rollback, deploy, incident, mitigation, provider dispatch, worker execution, DB write, project mutation, network call, or provider spend can run from this route.",
    ownerAgent: "NEXUS operator governance",
    ownerCapability: "Deploy monitoring and incident mitigation readiness",
    evidenceLocation: "reports/command-center-monitoring-ux-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, alert dispatch, network execution, deploy execution, incident execution, mitigation execution, rollback execution, or provider spend.",
    commandCenterVisible: true,
    shippingPreviewLabel: shippingPreview.label,
    shippingPreviewRows: shippingPreview.rows,
    shippingPreviewSummary: shippingPreview.summary,
    readinessCards: [
      {
        label: "Monitor",
        value: statusLabel(gate.validationReady),
        tone: gate.validationReady ? "pass" : "fail",
        detail: "Monitor event evidence is present for review.",
      },
      {
        label: "Incident",
        value: gate.incidentState === "signal_ready_for_review" ? "Preview" : "Blocked",
        tone: gate.incidentState === "signal_ready_for_review" ? "pending" : "fail",
        detail: "Incident signal is a preview and cannot dispatch alerts.",
      },
      {
        label: "Rollback",
        value: statusLabel(gate.rollbackReady),
        tone: gate.rollbackReady ? "pass" : "fail",
        detail: "Rollback posture is documented before any future mitigation path.",
      },
      {
        label: "Mitigation",
        value: "Disabled",
        tone: "disabled",
        detail: "Readiness does not unlock mitigation execution.",
      },
    ],
    gateRows: [
      { label: "Monitor state", value: "Ready for operator review" },
      { label: "Incident state", value: "Signal preview only" },
      { label: "Approval state", value: "Not requested" },
      { label: "Mitigation execution", value: "Disabled" },
      { label: "Rollback execution", value: "Disabled" },
      { label: "Alert dispatch", value: "Disabled" },
      { label: "Deploy and incident execution", value: "Disabled" },
      { label: "DB/network/provider spend", value: "Disabled" },
    ],
    allowedScope: [
      "Deploy monitoring readiness view model",
      "Command Center route metadata",
      "Command Center monitoring route rendering",
      "Monitoring UX checker and report",
    ],
    forbiddenScope: [
      "Project source trees",
      "Monitor execution and alert dispatch",
      "Rollback, deploy, incident, and mitigation execution",
      "Provider/tool/worker execution, DB writes, network calls, and provider spend",
    ],
    blockers: [
      "Operator approval has not been granted.",
      "Monitoring readiness cannot unlock alerts, rollback, deploy, incident, or mitigation execution.",
      "Project mutation, provider/tool execution, worker execution, DB writes, network calls, and provider spend remain disabled.",
    ],
    disabledActions: [
      {
        label: "Dispatch alert",
        reason: "Alert dispatch remains disabled until a future approved phase explicitly enables governed alerting.",
      },
      {
        label: "Run rollback",
        reason: "Rollback execution remains disabled; this route records readiness only.",
      },
      {
        label: "Start mitigation",
        reason: "Mitigation execution remains disabled and requires a future governed approval path.",
      },
    ],
  };
}
