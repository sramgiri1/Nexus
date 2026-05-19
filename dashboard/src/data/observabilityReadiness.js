import { createObservabilityHealthSnapshot } from "../../../observability/p74-4-placeholder.js";

const snapshot = createObservabilityHealthSnapshot({
  nextAction: "Keep observability readiness display-only until telemetry export, SLO enforcement, paging, and remediation are explicitly approved.",
});

export function buildObservabilityReadinessViewModel() {
  return {
    routeId: "observability-readiness",
    pageTitle: "Observability",
    whatChanged: "Telemetry, SLO, health, and incident readiness are visible in Command Center.",
    currentState: "Display-only observability readiness; exporters, enforcement, paging, and remediation remain disabled.",
    nextAction: snapshot.nextAction,
    ownerAgent: "AUDITOR",
    ownerCapability: "NEXUS Observability Readiness",
    evidenceLocation: "reports/command-center-observability-ux-report.md",
    activityLocation: "os-roadmap/phase-status.json observability entry",
    costImpact: snapshot.costImpact,
    disabledReason: "Observability readiness is display-only; telemetry export, raw log exposure, SLO enforcement, paging, remediation, DB writes, network calls, and provider spend remain disabled.",
    readinessCards: [
      { label: "Telemetry posture", value: "Preview", tone: "teal", detail: "Telemetry contracts are defined without exporters." },
      { label: "SLO posture", value: "Defined", tone: "teal", detail: "SLO objectives are visible but not enforced." },
      { label: "Health state", value: "Display-only", tone: "amber", detail: "Health snapshots are local readiness records." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No paging, telemetry, network, DB, or provider calls are made." },
    ],
    postureRows: [
      { label: "Telemetry export", value: "Disabled" },
      { label: "Raw log exposure", value: "Disabled" },
      { label: "SLO enforcement", value: "Disabled" },
      { label: "Incident paging", value: "Disabled" },
      { label: "Remediation execution", value: "Disabled" },
      { label: "DB writes", value: "Disabled" },
      { label: "Network calls", value: "Disabled" },
    ],
    snapshotRows: snapshot.snapshotRows,
    blockers: snapshot.blockers.slice(0, 6),
    disabledActions: [
      { label: "Telemetry export", reason: "External telemetry exporters are not enabled." },
      { label: "SLO enforcement", reason: "SLO enforcement is not enabled." },
      { label: "Incident paging", reason: "Paging integration is not enabled." },
      { label: "Remediation execution", reason: "Automated remediation is not enabled." },
    ],
    safety: {
      remediationAllowed: snapshot.remediationAllowed,
      pagingAllowed: snapshot.pagingAllowed,
      sloEnforcementAllowed: snapshot.sloEnforcementAllowed,
      telemetryExportAllowed: snapshot.telemetryExportAllowed,
      rawLogExposureAllowed: snapshot.rawLogExposureAllowed,
      dbWritesAllowed: snapshot.dbWritesAllowed,
      networkCallsAllowed: snapshot.networkCallsAllowed,
      providerSpendAllowed: snapshot.providerSpendAllowed,
    },
  };
}

export const observabilityReadinessViewModel = buildObservabilityReadinessViewModel();
