import { createControlMappingPreview } from "../../../compliance/p77-4-placeholder.js";

const controlMapping = createControlMappingPreview({
  nextAction: "Prepare validation coverage before any certification, attestation, export, or package runtime is considered.",
});

export function buildComplianceReadinessViewModel() {
  return {
    routeId: "compliance-readiness",
    pageTitle: "Compliance",
    whatChanged: "Compliance evidence, audit preview, and control mapping readiness are visible in Command Center.",
    currentState: "Display-only compliance readiness; certification, attestation, audit export, package creation, DB writes, and runtime mutation remain disabled.",
    nextAction: controlMapping.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS Compliance Readiness",
    evidenceLocation: "reports/command-center-compliance-ux-report.md",
    activityLocation: "os-roadmap/phase-status.json compliance entry",
    costImpact: controlMapping.costImpact,
    disabledReason: "Compliance readiness is display-only; certification, legal attestation, audit export, raw log export, package creation, DB writes, network calls, and provider spend remain disabled.",
    readinessCards: [
      { label: "Compliance posture", value: "Evidence indexed", tone: "teal", detail: "Compliance evidence references are summarized without certification." },
      { label: "Audit posture", value: "Preview only", tone: "amber", detail: "Audit trail export remains disabled and raw logs are not exposed." },
      { label: "Control mapping", value: "Safety gated", tone: "amber", detail: "Control mapping is visible without legal attestation or signing." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No certification, export, package, DB, network, or provider calls are made." },
    ],
    postureRows: [
      { label: "Compliance certification", value: "Disabled" },
      { label: "Legal attestation", value: "Disabled" },
      { label: "Audit export", value: "Disabled" },
      { label: "Raw log export", value: "Disabled" },
      { label: "Package creation", value: "Disabled" },
      { label: "DB writes", value: "Disabled" },
      { label: "Network calls", value: "Disabled" },
      { label: "Provider spend", value: "Disabled" },
    ],
    controlRows: controlMapping.controlRows.map((row) => ({
      label: row.label,
      currentState: row.currentState,
      executionState: row.executionState,
    })),
    blockers: controlMapping.blockers.slice(0, 6),
    disabledActions: [
      { label: "Certification", reason: "Compliance certification is not enabled." },
      { label: "Legal attestation", reason: "Legal attestation and signing are not enabled." },
      { label: "Audit export", reason: "Audit export and raw log export are not enabled." },
      { label: "Package creation", reason: "Compliance package creation is not enabled." },
    ],
    safety: {
      certificationAllowed: controlMapping.certificationAllowed,
      legalAttestationAllowed: controlMapping.legalAttestationAllowed,
      auditExportAllowed: controlMapping.auditExportAllowed,
      rawLogExportAllowed: controlMapping.rawLogExportAllowed,
      packageCreationAllowed: controlMapping.packageCreationAllowed,
      dbWritesAllowed: controlMapping.dbWritesAllowed,
      projectMutationAllowed: controlMapping.projectMutationAllowed,
      providerDispatchAllowed: controlMapping.providerDispatchAllowed,
      toolExecutionAllowed: controlMapping.toolExecutionAllowed,
      workerExecutionAllowed: controlMapping.workerExecutionAllowed,
      networkCallsAllowed: controlMapping.networkCallsAllowed,
      providerSpendAllowed: controlMapping.providerSpendAllowed,
    },
  };
}

export const complianceReadinessViewModel = buildComplianceReadinessViewModel();
