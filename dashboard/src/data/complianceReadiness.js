import { createControlMappingPreview } from "../../../compliance/p77-4-placeholder.js";
import { buildSecurityPrivacyCompliancePreview } from "../../../shared/securityPrivacyCompliancePreview.js";

const controlMapping = createControlMappingPreview({
  nextAction: "Prepare validation coverage before any certification, attestation, export, or package runtime is considered.",
});

function displayState(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayText(value = "") {
  return String(value || "")
    .replace(/P\d+(?:\.\d+)?/g, "the current compliance phase")
    .replace(/\braw log export\b/gi, "internal log export")
    .replace(/\braw logs?\b/gi, "internal logs")
    .replace(/\braw data exposure\b/gi, "unsanitized data exposure")
    .replace(/\braw identifier\b/gi, "direct identifier")
    .replace(/\s+/g, " ")
    .trim();
}

function displayLabel(value = "") {
  return displayText(value).replace(/_/g, " ");
}

function buildPreviewDisplayModel() {
  const preview = buildSecurityPrivacyCompliancePreview();
  return {
    rows: preview.previewRows.map((row) => ({
      type: displayState(row.rowType),
      label: displayLabel(row.label),
      currentState: displayState(row.currentState),
      blockedState: "Blocked",
      owner: row.ownerCapability,
      nextAction: displayText(row.nextAction),
      blockers: row.blockers.slice(0, 2).map(displayText),
    })),
    sections: preview.previewSections.map((section) => ({
      label: section.label,
      rowCount: section.rowCount,
      blockedCount: section.blockedCount,
      nextAction: displayText(section.nextAction),
    })),
    summary: {
      previewRowCount: preview.readinessSummary.previewRowCount,
      previewSectionCount: preview.readinessSummary.previewSectionCount,
      blockedRowCount: preview.readinessSummary.blockedRowCount,
      runnableActionCount: preview.readinessSummary.runnableActionCount,
      nextAction: displayText(preview.readinessSummary.nextAction),
    },
    authoritySummary: {
      blockedAuthorityCount: preview.authoritySummary.blockedAuthorityCount,
      allowedAuthorityCount: preview.authoritySummary.allowedAuthorityCount,
      certificationAllowed: preview.authoritySummary.certificationAllowed,
      legalAttestationAllowed: preview.authoritySummary.legalAttestationAllowed,
      auditExportAllowed: preview.authoritySummary.auditExportAllowed,
      rawLogExportAllowed: preview.authoritySummary.rawLogExportAllowed,
      compliancePackageCreationAllowed: preview.authoritySummary.compliancePackageCreationAllowed,
      policyEnforcementAllowed: preview.authoritySummary.policyEnforcementAllowed,
      credentialHandlingAllowed: preview.authoritySummary.credentialHandlingAllowed,
      providerModelCallsAllowed: preview.authoritySummary.providerModelCallsAllowed,
      toolExecutionAllowed: preview.authoritySummary.toolExecutionAllowed,
      agentDispatchAllowed: preview.authoritySummary.agentDispatchAllowed,
      projectMutationAllowed: preview.authoritySummary.projectMutationAllowed,
      networkCallsAllowed: preview.authoritySummary.networkCallsAllowed,
      spendAllowed: preview.authoritySummary.spendAllowed,
    },
    disabledReason: displayText(preview.disabledReason),
    blockers: preview.blockers.map(displayText),
    costImpact: "No spend",
  };
}

export function buildComplianceReadinessViewModel() {
  const compliancePreview = buildPreviewDisplayModel();
  return {
    routeId: "compliance-readiness",
    pageTitle: "Compliance",
    whatChanged: "Compliance evidence, audit preview, control mapping, and the security/privacy preview are visible in Command Center.",
    currentState: "Display-only compliance readiness; certification, attestation, audit export, package creation, policy enforcement, DB writes, and runtime mutation remain disabled.",
    nextAction: compliancePreview.summary.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS Compliance Readiness",
    evidenceLocation: "Compliance readiness report",
    activityLocation: "OS roadmap compliance entry",
    costImpact: compliancePreview.costImpact,
    disabledReason: "Compliance readiness is display-only; certification, legal attestation, audit export, internal log export, package creation, DB writes, network calls, and provider spend remain disabled.",
    readinessCards: [
      { label: "Compliance posture", value: "Evidence indexed", tone: "teal", detail: "Compliance evidence references are summarized without certification." },
      { label: "Audit posture", value: "Preview only", tone: "amber", detail: "Audit trail export remains disabled and internal logs are not exposed." },
      { label: "Control mapping", value: "Safety gated", tone: "amber", detail: "Control mapping is visible without legal attestation or signing." },
      { label: "Security preview", value: `${compliancePreview.summary.previewRowCount} rows`, tone: "teal", detail: "Security, privacy, evidence, policy, and data rows are ready for review." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No certification, export, package, DB, network, or provider calls are made." },
    ],
    postureRows: [
      { label: "Compliance certification", value: "Disabled" },
      { label: "Legal attestation", value: "Disabled" },
      { label: "Audit export", value: "Disabled" },
      { label: "Internal log export", value: "Disabled" },
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
    blockers: [...compliancePreview.blockers, ...controlMapping.blockers].slice(0, 6),
    compliancePreviewRows: compliancePreview.rows,
    compliancePreviewSections: compliancePreview.sections,
    compliancePreviewSummary: compliancePreview.summary,
    authoritySummary: compliancePreview.authoritySummary,
    disabledActions: [
      { label: "Certification", reason: "Compliance certification is not enabled." },
      { label: "Legal attestation", reason: "Legal attestation and signing are not enabled." },
      { label: "Audit export", reason: "Audit export and internal log export are not enabled." },
      { label: "Package creation", reason: "Compliance package creation is not enabled." },
      { label: "Policy enforcement", reason: "Runtime policy enforcement is not enabled." },
      { label: "Credential handling", reason: "Credential values are not handled or exposed." },
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
