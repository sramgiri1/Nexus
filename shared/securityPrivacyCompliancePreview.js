import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
  SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES,
  buildSecurityPrivacyComplianceControlModel,
  validateSecurityPrivacyComplianceControlModel,
} from "./securityPrivacyComplianceControlModel.js";

export const SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE = "P141.3";
export const SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION = "1.0";

export const SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS = Object.freeze([
  ...SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES,
  "certificationPreviewExecutionAllowed",
  "attestationPreviewExecutionAllowed",
  "auditPackagePreviewExecutionAllowed",
  "runtimeControlMutationAllowed",
]);

const OWNER_CAPABILITY = "NEXUS Security Privacy Compliance Preview Guard";
const DEFAULT_REPORT_REF = "reports/p1413-security-privacy-compliance-controls-report.md";
const DEFAULT_ACTIVITY_REF = "os-roadmap/phase-status.json#P141.3";
const DISABLED_REASON = "P141.3 builds a display-safe compliance, security, and privacy preview only. Certification, legal attestation, audit export, raw log export, compliance package creation, policy enforcement, credential handling, raw data exposure, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedAuthorityFlags() {
  return Object.fromEntries(SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS.map((flag) => [flag, false]));
}

function normalizeText(value = "", fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function asArray(value = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function uniqueList(values = []) {
  return [...new Set(asArray(values))];
}

function displayRef(prefix, sequence) {
  return `${prefix}-${Number.isFinite(Number(sequence)) ? Number(sequence) : 1}`;
}

function hasRawIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence|compliance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function previewEvidenceRefs(inputRefs = []) {
  return uniqueList([DEFAULT_REPORT_REF, ...asArray(inputRefs)]);
}

function buildRedactionState(input = {}) {
  const redaction = summarizeRedaction({
    sourceScope: input.sourceScope || "NEXUS OS security privacy compliance preview",
    sourceSurface: "P141.3 compliance preview",
    sampleValue: "display-safe compliance preview metadata only",
  });
  return {
    redacted: true,
    redactionChecked: true,
    redactionChanged: redaction.changed,
    rawPrivateIdsVisible: false,
    rawInternalPayloadsVisible: false,
    rawDataExposureAllowed: false,
    credentialValuesVisible: false,
  };
}

function basePreviewRow(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const flags = blockedAuthorityFlags();
  return {
    rowRef: normalizeText(input.rowRef, displayRef("compliance-preview-row", sequence)),
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION,
    phase: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE,
    sourceModelPhase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    rowType: normalizeText(input.rowType, "control"),
    label: normalizeText(input.label, "Display-safe compliance preview row"),
    currentState: normalizeText(input.currentState, "display_only"),
    previewState: "ready-for-review",
    ownerCapability: OWNER_CAPABILITY,
    evidenceRefs: previewEvidenceRefs(input.evidenceRefs),
    activityRefs: uniqueList([DEFAULT_ACTIVITY_REF, ...asArray(input.activityRefs)]),
    blockers: uniqueList([DISABLED_REASON, ...asArray(input.blockers)]),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Review this display-safe preview before any future enforcement or export authority is considered."),
    redactionState: buildRedactionState(input),
    costImpact: {
      estimatedUsd: 0,
      actualUsd: 0,
      providerSpendAllowed: false,
      networkCallsAllowed: false,
      exportJobsAllowed: false,
      packageJobsAllowed: false,
    },
    safetyFlags: flags,
    ...flags,
  };
}

export function buildSecurityPrivacyCompliancePreviewRow(input = {}) {
  const source = input.source || {};
  const sourceEvidence = previewEvidenceRefs([...(source.evidenceRefs || []), ...(input.evidenceRefs || [])]);
  if (input.rowType === "privacy") {
    return basePreviewRow({
      ...input,
      label: normalizeText(input.label, `Privacy boundary: ${source.dataClass || "display-safe data"}`),
      currentState: source.redactionState || "redacted",
      evidenceRefs: sourceEvidence,
      blockers: [
        source.prohibitedUse || "Raw data exposure, sharing, and export remain blocked.",
        "Credential values and raw identifiers remain hidden.",
        ...asArray(input.blockers),
      ],
      nextAction: "Review allowed use, prohibited use, redaction, and retention posture before any future data handling authority.",
    });
  }
  if (input.rowType === "evidence") {
    return basePreviewRow({
      ...input,
      label: normalizeText(input.label, `Evidence posture: ${source.framework || "internal control"}`),
      currentState: source.evidenceState || "indexed",
      evidenceRefs: sourceEvidence,
      blockers: [
        "Certification, legal attestation, audit export, raw log export, and package creation remain blocked.",
        ...asArray(input.blockers),
      ],
      nextAction: "Review evidence coverage and blockers before any future compliance package workflow.",
    });
  }
  if (input.rowType === "policy") {
    return basePreviewRow({
      ...input,
      label: normalizeText(input.label, "Policy enforcement gate"),
      currentState: source.decisionMode || "deny_by_default",
      evidenceRefs: sourceEvidence,
      blockers: [
        "Runtime policy enforcement and override paths remain blocked.",
        ...asArray(input.blockers),
      ],
      nextAction: "Review deny-by-default posture and approval requirements before any future runtime enforcement.",
    });
  }
  if (input.rowType === "data") {
    return basePreviewRow({
      ...input,
      label: normalizeText(input.label, `Data handling: ${source.dataClass || "display-safe data"}`),
      currentState: source.retentionState || "policy_defined",
      evidenceRefs: sourceEvidence,
      blockers: [
        "Collection, processing, sharing, export, and raw identifier use remain blocked.",
        ...asArray(input.blockers),
      ],
      nextAction: "Review collection and processing blockers before any future data workflow authority.",
    });
  }
  return basePreviewRow({
    ...input,
    label: normalizeText(input.label, `Security control: ${source.domain || "policy"}`),
    currentState: source.currentState || "display_only",
    evidenceRefs: sourceEvidence,
    blockers: [...asArray(source.blockers), ...asArray(input.blockers)],
    nextAction: "Review objective, blockers, evidence, and next action before any future control enforcement.",
  });
}

export function validateSecurityPrivacyCompliancePreviewRow(row = {}) {
  const errors = [];
  for (const field of ["rowRef", "rowType", "label", "currentState", "previewState", "ownerCapability", "evidenceRefs", "activityRefs", "blockers", "disabledReason", "nextAction", "costImpact", "safetyFlags"]) {
    if (!(field in row)) errors.push(`${field} is required`);
  }
  if (row.phase !== SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE) errors.push("phase must be P141.3");
  if (row.sourceModelPhase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("sourceModelPhase must be P141.2");
  if (row.previewState !== "ready-for-review") errors.push("previewState must be ready-for-review");
  if (!Array.isArray(row.evidenceRefs) || row.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(row.activityRefs) || row.activityRefs.length === 0) errors.push("activityRefs are required");
  if (!Array.isArray(row.blockers) || row.blockers.length === 0) errors.push("blockers are required");
  if (!/remain blocked/i.test(row.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (row.redactionState?.rawPrivateIdsVisible !== false || row.redactionState?.credentialValuesVisible !== false || row.redactionState?.rawDataExposureAllowed !== false) errors.push("redaction must hide raw/private data");
  if (row.costImpact?.estimatedUsd !== 0 || row.costImpact?.actualUsd !== 0 || row.costImpact?.providerSpendAllowed !== false || row.costImpact?.networkCallsAllowed !== false) errors.push("cost impact must remain zero-spend");
  if (Object.values(row.safetyFlags || {}).some((value) => value !== false)) errors.push("row safety flags must be false");
  if (SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS.some((flag) => row[flag] !== false)) errors.push("row authority flags must be false");
  if (hasRawIdentifier(row)) errors.push("row must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyCompliancePreviewSection(input = {}) {
  const rows = Array.isArray(input.rows) ? input.rows : [];
  return {
    sectionRef: normalizeText(input.sectionRef, "compliance-preview-section"),
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION,
    phase: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE,
    label: normalizeText(input.label, "Compliance preview section"),
    rowRefs: rows.map((row) => row.rowRef),
    rowCount: rows.length,
    blockedCount: rows.length,
    runnableActionCount: 0,
    ownerCapability: OWNER_CAPABILITY,
    evidenceRefs: previewEvidenceRefs(rows.flatMap((row) => row.evidenceRefs || [])),
    activityRefs: uniqueList([DEFAULT_ACTIVITY_REF, ...rows.flatMap((row) => row.activityRefs || [])]),
    nextAction: normalizeText(input.nextAction, "Review display-safe rows before any future runtime authority."),
  };
}

export function validateSecurityPrivacyCompliancePreviewSection(section = {}) {
  const errors = [];
  for (const field of ["sectionRef", "label", "rowRefs", "rowCount", "blockedCount", "runnableActionCount", "evidenceRefs", "activityRefs", "nextAction"]) {
    if (!(field in section)) errors.push(`${field} is required`);
  }
  if (section.phase !== SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE) errors.push("phase must be P141.3");
  if (!Array.isArray(section.rowRefs) || section.rowRefs.length !== section.rowCount) errors.push("rowRefs must match rowCount");
  if (section.blockedCount !== section.rowCount || section.runnableActionCount !== 0) errors.push("section must keep every row blocked and non-runnable");
  if (!Array.isArray(section.evidenceRefs) || section.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(section.activityRefs) || section.activityRefs.length === 0) errors.push("activityRefs are required");
  if (hasRawIdentifier(section)) errors.push("section must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyCompliancePreview(input = {}) {
  const sourceModel = input.sourceModel || buildSecurityPrivacyComplianceControlModel(input);
  const sourceValidation = validateSecurityPrivacyComplianceControlModel(sourceModel);
  const previewRows = [
    ...(sourceModel.controls || []).map((source, index) => buildSecurityPrivacyCompliancePreviewRow({ sequence: index + 1, rowType: "control", source, evidenceRefs: sourceModel.evidenceRefs, activityRefs: sourceModel.activityRefs })),
    ...(sourceModel.privacyBoundaries || []).map((source, index) => buildSecurityPrivacyCompliancePreviewRow({ sequence: index + 1 + (sourceModel.controls || []).length, rowType: "privacy", source, evidenceRefs: sourceModel.evidenceRefs, activityRefs: sourceModel.activityRefs })),
    ...(sourceModel.complianceEvidence || []).map((source, index) => buildSecurityPrivacyCompliancePreviewRow({ sequence: index + 1 + (sourceModel.controls || []).length + (sourceModel.privacyBoundaries || []).length, rowType: "evidence", source, evidenceRefs: sourceModel.evidenceRefs, activityRefs: sourceModel.activityRefs })),
    ...(sourceModel.policyEnforcement || []).map((source, index) => buildSecurityPrivacyCompliancePreviewRow({ sequence: index + 1 + (sourceModel.controls || []).length + (sourceModel.privacyBoundaries || []).length + (sourceModel.complianceEvidence || []).length, rowType: "policy", source, evidenceRefs: sourceModel.evidenceRefs, activityRefs: sourceModel.activityRefs })),
    ...(sourceModel.dataHandlingControls || []).map((source, index) => buildSecurityPrivacyCompliancePreviewRow({ sequence: index + 1 + (sourceModel.controls || []).length + (sourceModel.privacyBoundaries || []).length + (sourceModel.complianceEvidence || []).length + (sourceModel.policyEnforcement || []).length, rowType: "data", source, evidenceRefs: sourceModel.evidenceRefs, activityRefs: sourceModel.activityRefs })),
  ];
  const rowsByType = (rowType) => previewRows.filter((row) => row.rowType === rowType);
  const previewSections = [
    buildSecurityPrivacyCompliancePreviewSection({ sectionRef: "security-control-preview", label: "Security control preview", rows: rowsByType("control"), nextAction: "Review security control objectives and blockers before P141.4 UX." }),
    buildSecurityPrivacyCompliancePreviewSection({ sectionRef: "privacy-boundary-preview", label: "Privacy boundary preview", rows: rowsByType("privacy"), nextAction: "Review data-use, redaction, and retention posture before P141.4 UX." }),
    buildSecurityPrivacyCompliancePreviewSection({ sectionRef: "compliance-evidence-preview", label: "Compliance evidence preview", rows: rowsByType("evidence"), nextAction: "Review evidence coverage and blocked compliance outputs before P141.4 UX." }),
    buildSecurityPrivacyCompliancePreviewSection({ sectionRef: "policy-data-preview", label: "Policy and data handling preview", rows: [...rowsByType("policy"), ...rowsByType("data")], nextAction: "Review policy/data handling blockers before P141.4 UX." }),
  ];
  const flags = blockedAuthorityFlags();
  return {
    phase: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE,
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION,
    mode: "display-safe-compliance-preview",
    sourceModelPhase: sourceModel.phase,
    sourceModelValid: sourceValidation.valid,
    previewOnly: true,
    localOnly: true,
    readOnly: true,
    commandCenterVisible: false,
    currentState: "display_safe_preview_ready_runtime_blocked",
    ownerCapability: OWNER_CAPABILITY,
    modeGuard: buildModeGuardResult(input.mode || "public-safe", ["public-safe", "local-private", "test"]),
    previewRows,
    previewSections,
    readinessSummary: {
      previewRowCount: previewRows.length,
      previewSectionCount: previewSections.length,
      blockedRowCount: previewRows.length,
      runnableActionCount: 0,
      sourceModelValid: sourceValidation.valid,
      nextAction: "Route P141.3 display-safe preview into P141.4 Compliance Command Center UX.",
    },
    authoritySummary: {
      blockedAuthorityCount: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS.length,
      allowedAuthorityCount: 0,
      certificationAllowed: false,
      legalAttestationAllowed: false,
      auditExportAllowed: false,
      rawLogExportAllowed: false,
      compliancePackageCreationAllowed: false,
      policyEnforcementAllowed: false,
      credentialHandlingAllowed: false,
      providerModelCallsAllowed: false,
      toolExecutionAllowed: false,
      agentDispatchAllowed: false,
      projectMutationAllowed: false,
      networkCallsAllowed: false,
      spendAllowed: false,
    },
    blockers: [
      DISABLED_REASON,
      "P141.4 must render this preview with existing Command Center components before any runtime authority is considered.",
    ],
    disabledReason: DISABLED_REASON,
    nextAction: "Route display-safe compliance preview to P141.4 Command Center UX.",
    evidenceRefs: previewEvidenceRefs(sourceModel.evidenceRefs),
    activityRefs: uniqueList([DEFAULT_ACTIVITY_REF, ...asArray(sourceModel.activityRefs)]),
    costImpact: {
      estimatedUsd: 0,
      actualUsd: 0,
      providerSpendAllowed: false,
      networkCallsAllowed: false,
      exportJobsAllowed: false,
      packageJobsAllowed: false,
    },
    redaction: buildRedactionState({ sourceScope: "P141.3 preview aggregate" }),
    safetyFlags: flags,
    ...flags,
  };
}

export function validateSecurityPrivacyCompliancePreview(preview = {}) {
  const errors = [];
  if (preview.phase !== SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE) errors.push("phase must be P141.3");
  if (preview.schemaVersion !== SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (preview.mode !== "display-safe-compliance-preview") errors.push("mode must be display-safe-compliance-preview");
  if (preview.sourceModelPhase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("sourceModelPhase must be P141.2");
  if (preview.previewOnly !== true || preview.localOnly !== true || preview.readOnly !== true) errors.push("preview must remain read-only local metadata");
  if (preview.commandCenterVisible !== false) errors.push("P141.3 preview must not render directly until P141.4");
  if (!preview.modeGuard?.ok) errors.push("mode guard must pass");
  if (!Array.isArray(preview.previewRows) || preview.previewRows.length < 10) errors.push("previewRows must cover the P141.2 model");
  for (const row of preview.previewRows || []) {
    const validation = validateSecurityPrivacyCompliancePreviewRow(row);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${row.rowRef || "row"}: ${error}`));
  }
  if (!Array.isArray(preview.previewSections) || preview.previewSections.length < 4) errors.push("previewSections must cover control, privacy, evidence, and policy/data views");
  for (const section of preview.previewSections || []) {
    const validation = validateSecurityPrivacyCompliancePreviewSection(section);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${section.sectionRef || "section"}: ${error}`));
  }
  if (preview.readinessSummary?.runnableActionCount !== 0 || preview.readinessSummary?.blockedRowCount !== preview.previewRows?.length) errors.push("readiness summary must keep every row blocked");
  if (preview.authoritySummary?.allowedAuthorityCount !== 0) errors.push("authority summary must not allow authority");
  if (Object.values(preview.safetyFlags || {}).some((value) => value !== false)) errors.push("preview safety flags must be false");
  if (SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS.some((flag) => preview[flag] !== false)) errors.push("preview authority flags must be false");
  if (preview.costImpact?.estimatedUsd !== 0 || preview.costImpact?.actualUsd !== 0 || preview.costImpact?.providerSpendAllowed !== false || preview.costImpact?.networkCallsAllowed !== false) errors.push("cost impact must remain zero-spend");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs are required");
  if (!/remain blocked/i.test(preview.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (hasRawIdentifier(preview)) errors.push("preview must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyCompliancePreviewEnvelope(input = {}) {
  const preview = input.preview || buildSecurityPrivacyCompliancePreview(input);
  const validation = validateSecurityPrivacyCompliancePreview(preview);
  const envelope = createPassResult({
    phase: SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE,
    mode: "display-safe-compliance-preview",
    source: "shared/securityPrivacyCompliancePreview.js",
    summary: "Display-safe compliance, security, and privacy preview generated without enabling certification, attestation, audit export, raw log export, package creation, policy enforcement, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, network calls, or spend.",
    data: { preview },
    warnings: validation.valid ? [] : validation.errors,
    evidence: preview.evidenceRefs,
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    envelopeValid: envelopeValidation.valid,
    envelopeErrors: envelopeValidation.errors,
  };
}
