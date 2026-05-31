import { createControlMappingPreview, validateControlMappingPreview } from "../compliance/p77-4-placeholder.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE = "P141.2";
export const SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION = "1.0";

export const SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES = Object.freeze([
  "credentialHandlingAllowed",
  "rawDataExposureAllowed",
  "policyEnforcementAllowed",
  "certificationAllowed",
  "legalAttestationAllowed",
  "auditExportAllowed",
  "rawLogExportAllowed",
  "compliancePackageCreationAllowed",
  "dbWritesAllowed",
  "runtimeWritesAllowed",
  "liveCrudAllowed",
  "providerModelCallsAllowed",
  "toolExecutionAllowed",
  "mcpStartupAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageAllowed",
  "networkCallsAllowed",
  "spendAllowed",
  "rawPrivateIdsVisible",
  "rawInternalPayloadsVisible",
  "credentialValuesVisible",
]);

const OWNER_CAPABILITY = "NEXUS Security Privacy Compliance Control Guard";
const DEFAULT_CREATED_AT = "2026-05-31T07:10:00.000Z";
const DISABLED_REASON = "P141.2 defines a read-only security, privacy, and compliance control model. Credential handling, raw data exposure, runtime policy enforcement, certification, legal attestation, audit export, raw log export, compliance package creation, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
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

function hasRawIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function displayRef(prefix, sequence) {
  return `${prefix}-${Number.isFinite(Number(sequence)) ? Number(sequence) : 1}`;
}

function evidenceRefs(extra = []) {
  return [...new Set(["reports/p1412-security-privacy-compliance-controls-report.md", ...asArray(extra)])];
}

function buildRedactionState(input = {}) {
  const redaction = summarizeRedaction({
    sourceScope: input.sourceScope || "NEXUS OS security privacy compliance controls",
    sourceSurface: input.sourceSurface || "P141.2 control model",
    sampleValue: input.sampleValue || "display-safe metadata only; no private IDs, credential values, or raw payloads",
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

export function buildSecurityPrivacyComplianceSecurityControl(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    controlRef: normalizeText(input.controlRef, displayRef("security-control", sequence)),
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION,
    phase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    domain: normalizeText(input.domain, "policy"),
    objective: normalizeText(input.objective, "Keep enterprise control decisions deny-by-default until future approved enforcement."),
    currentState: normalizeText(input.currentState, "display_only"),
    enforcementState: "blocked",
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    blockers: [
      "Runtime policy enforcement remains blocked.",
      "Credential handling and raw data exposure remain blocked.",
      ...asArray(input.blockers),
    ],
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this control model to P141.3 compliance preview without enforcement runtime."),
  };
}

export function validateSecurityPrivacyComplianceSecurityControl(control = {}) {
  const errors = [];
  for (const field of ["controlRef", "domain", "objective", "currentState", "enforcementState", "ownerCapability", "evidenceRefs", "blockers", "disabledReason", "nextAction"]) {
    if (!(field in control)) errors.push(`${field} is required`);
  }
  if (control.phase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("phase must be P141.2");
  if (control.enforcementState !== "blocked") errors.push("enforcementState must be blocked");
  if (!Array.isArray(control.evidenceRefs) || control.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(control.blockers) || control.blockers.length === 0) errors.push("blockers are required");
  if (!/remain blocked/i.test(control.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (hasRawIdentifier(control)) errors.push("control must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyCompliancePrivacyBoundary(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    boundaryRef: normalizeText(input.boundaryRef, displayRef("privacy-boundary", sequence)),
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION,
    phase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    dataClass: normalizeText(input.dataClass, "founder_input"),
    allowedUse: normalizeText(input.allowedUse, "Summarized planning and readiness metadata only."),
    prohibitedUse: normalizeText(input.prohibitedUse, "No credential value handling, raw data exposure, external sharing, export, or provider transmission."),
    redactionState: "redacted",
    rawDataExposureAllowed: false,
    exportAllowed: false,
    retentionPolicyRef: normalizeText(input.retentionPolicyRef, "display-safe-retention-policy-reference"),
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    redaction: buildRedactionState(input),
  };
}

export function validateSecurityPrivacyCompliancePrivacyBoundary(boundary = {}) {
  const errors = [];
  for (const field of ["boundaryRef", "dataClass", "allowedUse", "prohibitedUse", "redactionState", "rawDataExposureAllowed", "exportAllowed", "retentionPolicyRef", "evidenceRefs"]) {
    if (!(field in boundary)) errors.push(`${field} is required`);
  }
  if (boundary.phase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("phase must be P141.2");
  if (boundary.redactionState !== "redacted") errors.push("redactionState must be redacted");
  if (boundary.rawDataExposureAllowed !== false || boundary.exportAllowed !== false) errors.push("raw exposure and export must remain false");
  if (boundary.redaction?.rawPrivateIdsVisible !== false || boundary.redaction?.credentialValuesVisible !== false) errors.push("redaction must hide identifiers and credentials");
  if (!Array.isArray(boundary.evidenceRefs) || boundary.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (hasRawIdentifier(boundary)) errors.push("boundary must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyComplianceEvidence(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const controlRefs = asArray(input.controlRefs).length ? asArray(input.controlRefs) : [displayRef("security-control", sequence)];
  return {
    evidenceRef: normalizeText(input.evidenceRef, displayRef("compliance-evidence", sequence)),
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION,
    phase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    framework: normalizeText(input.framework, "internal_control"),
    controlRefs,
    evidenceState: normalizeText(input.evidenceState, "indexed"),
    certificationAllowed: false,
    legalAttestationAllowed: false,
    auditExportAllowed: false,
    rawLogExportAllowed: false,
    packageCreationAllowed: false,
    disabledReason: DISABLED_REASON,
    evidenceRefs: evidenceRefs(input.evidenceRefs),
  };
}

export function validateSecurityPrivacyComplianceEvidence(evidence = {}) {
  const errors = [];
  for (const field of ["evidenceRef", "framework", "controlRefs", "evidenceState", "certificationAllowed", "legalAttestationAllowed", "auditExportAllowed", "rawLogExportAllowed", "packageCreationAllowed", "disabledReason"]) {
    if (!(field in evidence)) errors.push(`${field} is required`);
  }
  if (evidence.phase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("phase must be P141.2");
  if (!Array.isArray(evidence.controlRefs) || evidence.controlRefs.length === 0) errors.push("controlRefs are required");
  if (evidence.certificationAllowed !== false || evidence.legalAttestationAllowed !== false) errors.push("certification and attestation must remain false");
  if (evidence.auditExportAllowed !== false || evidence.rawLogExportAllowed !== false || evidence.packageCreationAllowed !== false) errors.push("audit export, raw log export, and package creation must remain false");
  if (!/remain blocked/i.test(evidence.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (hasRawIdentifier(evidence)) errors.push("evidence must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyCompliancePolicyEnforcement(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    policyRef: normalizeText(input.policyRef, displayRef("policy-enforcement", sequence)),
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION,
    phase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    decisionMode: "deny_by_default",
    appliesTo: asArray(input.appliesTo).length ? asArray(input.appliesTo) : ["ui_api", "agent", "tool_skill", "runtime", "network", "secret", "data", "approval", "audit"],
    enforcementRuntimeAllowed: false,
    overrideAllowed: false,
    approvalRequired: true,
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    disabledReason: DISABLED_REASON,
  };
}

export function validateSecurityPrivacyCompliancePolicyEnforcement(policy = {}) {
  const errors = [];
  for (const field of ["policyRef", "decisionMode", "appliesTo", "enforcementRuntimeAllowed", "overrideAllowed", "approvalRequired", "evidenceRefs", "disabledReason"]) {
    if (!(field in policy)) errors.push(`${field} is required`);
  }
  if (policy.phase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("phase must be P141.2");
  if (policy.decisionMode !== "deny_by_default") errors.push("decisionMode must be deny_by_default");
  if (policy.enforcementRuntimeAllowed !== false || policy.overrideAllowed !== false) errors.push("enforcement runtime and override must remain false");
  if (policy.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!Array.isArray(policy.appliesTo) || policy.appliesTo.length < 5) errors.push("appliesTo must cover multiple layers");
  if (hasRawIdentifier(policy)) errors.push("policy must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyComplianceDataHandlingControl(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    handlingRef: normalizeText(input.handlingRef, displayRef("data-handling", sequence)),
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION,
    phase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    dataClass: normalizeText(input.dataClass, "business_plan"),
    collectionAllowed: false,
    processingAllowed: false,
    sharingAllowed: false,
    exportAllowed: false,
    rawIdentifierAllowed: false,
    retentionState: normalizeText(input.retentionState, "policy_defined"),
    ownerCapability: OWNER_CAPABILITY,
    nextAction: normalizeText(input.nextAction, "Keep data handling display-only until future approved collection and processing authority."),
    evidenceRefs: evidenceRefs(input.evidenceRefs),
  };
}

export function validateSecurityPrivacyComplianceDataHandlingControl(handling = {}) {
  const errors = [];
  for (const field of ["handlingRef", "dataClass", "collectionAllowed", "processingAllowed", "sharingAllowed", "exportAllowed", "rawIdentifierAllowed", "retentionState", "ownerCapability", "nextAction"]) {
    if (!(field in handling)) errors.push(`${field} is required`);
  }
  if (handling.phase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("phase must be P141.2");
  for (const field of ["collectionAllowed", "processingAllowed", "sharingAllowed", "exportAllowed", "rawIdentifierAllowed"]) {
    if (handling[field] !== false) errors.push(`${field} must remain false`);
  }
  if (hasRawIdentifier(handling)) errors.push("handling control must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyComplianceControlModel(input = {}) {
  const createdAt = normalizeText(input.createdAt, DEFAULT_CREATED_AT);
  const modeGuard = buildModeGuardResult(input.mode || "public-safe", ["public-safe", "test", "local-private"]);
  const controlMappingPreview = createControlMappingPreview({
    evidenceRefs: ["reports/p1412-security-privacy-compliance-controls-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P141.2"],
    nextAction: "Route mapped controls to P141.3 display-safe compliance preview.",
  });
  const controls = [
    buildSecurityPrivacyComplianceSecurityControl({ sequence: 1, domain: "identity", objective: "Keep identity and access control decisions review-only until future approved enforcement." }),
    buildSecurityPrivacyComplianceSecurityControl({ sequence: 2, domain: "data", objective: "Keep data handling summarized and redacted before any collection, processing, sharing, or export authority." }),
    buildSecurityPrivacyComplianceSecurityControl({ sequence: 3, domain: "policy", objective: "Keep policy decisions deny-by-default without runtime enforcement or overrides." }),
  ];
  const privacyBoundaries = [
    buildSecurityPrivacyCompliancePrivacyBoundary({ sequence: 1, dataClass: "founder_input" }),
    buildSecurityPrivacyCompliancePrivacyBoundary({ sequence: 2, dataClass: "business_plan" }),
    buildSecurityPrivacyCompliancePrivacyBoundary({ sequence: 3, dataClass: "credential_reference", allowedUse: "Display-safe credential reference posture only." }),
  ];
  const complianceEvidence = [
    buildSecurityPrivacyComplianceEvidence({ sequence: 1, framework: "internal_control", controlRefs: controls.map((control) => control.controlRef) }),
    buildSecurityPrivacyComplianceEvidence({ sequence: 2, framework: "SOC2_ready", controlRefs: controls.slice(0, 2).map((control) => control.controlRef) }),
  ];
  const policyEnforcement = [
    buildSecurityPrivacyCompliancePolicyEnforcement({ sequence: 1 }),
  ];
  const dataHandlingControls = [
    buildSecurityPrivacyComplianceDataHandlingControl({ sequence: 1, dataClass: "founder_input" }),
    buildSecurityPrivacyComplianceDataHandlingControl({ sequence: 2, dataClass: "business_plan" }),
    buildSecurityPrivacyComplianceDataHandlingControl({ sequence: 3, dataClass: "credential_reference" }),
  ];
  const safetyFlags = blockedSafetyFlags();
  const redaction = summarizeRedaction({
    controls,
    privacyBoundaries,
    complianceEvidence,
    policyEnforcement,
    dataHandlingControls,
  });
  return {
    phase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    schemaVersion: SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION,
    mode: "read-only-control-model",
    modelOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    currentState: "control_model_ready_runtime_blocked",
    modeGuard,
    ownerCapability: OWNER_CAPABILITY,
    controls,
    privacyBoundaries,
    complianceEvidence,
    policyEnforcement,
    dataHandlingControls,
    controlMappingPreview: {
      controlMappingPreviewId: controlMappingPreview.controlMappingPreviewId,
      attestationMode: controlMappingPreview.attestationMode,
      approvalRequired: controlMappingPreview.approvalRequired,
      certificationAllowed: controlMappingPreview.certificationAllowed,
      legalAttestationAllowed: controlMappingPreview.legalAttestationAllowed,
      auditExportAllowed: controlMappingPreview.auditExportAllowed,
      rawLogExportAllowed: controlMappingPreview.rawLogExportAllowed,
      packageCreationAllowed: controlMappingPreview.packageCreationAllowed,
      dbWritesAllowed: controlMappingPreview.dbWritesAllowed,
      projectMutationAllowed: controlMappingPreview.projectMutationAllowed,
      networkCallsAllowed: controlMappingPreview.networkCallsAllowed,
      providerSpendAllowed: controlMappingPreview.providerSpendAllowed,
      valid: validateControlMappingPreview(controlMappingPreview).valid,
    },
    readinessSummary: {
      controlCount: controls.length,
      privacyBoundaryCount: privacyBoundaries.length,
      complianceEvidenceCount: complianceEvidence.length,
      policyEnforcementCount: policyEnforcement.length,
      dataHandlingControlCount: dataHandlingControls.length,
      runnableActionCount: 0,
      nextAction: "Route P141.2 model output to P141.3 compliance preview.",
    },
    blockers: [
      "Credential handling, raw data exposure, and secret value access remain blocked.",
      "Runtime policy enforcement and override paths remain blocked.",
      "Certification, legal attestation, audit export, raw log export, and compliance package creation remain blocked.",
      "DB/runtime writes, live CRUD, provider/model calls, tools, MCP startup, agents, project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    nextAction: "Route the read-only control model to P141.3 compliance preview before any UI or runtime authority.",
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: ["os-roadmap/phase-status.json#P141.2"],
    costImpact: {
      estimatedUsd: 0,
      actualUsd: 0,
      providerSpendAllowed: false,
      networkCallsAllowed: false,
      exportJobsAllowed: false,
      packageJobsAllowed: false,
    },
    redaction: {
      changed: redaction.changed,
      redactionCount: redaction.redactionCount,
      rawPrivateIdsVisible: false,
      rawInternalPayloadsVisible: false,
      credentialValuesVisible: false,
    },
    safetyFlags,
    ...safetyFlags,
    createdAt,
  };
}

export function validateSecurityPrivacyComplianceControlModel(model = {}) {
  const errors = [];
  if (model.phase !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE) errors.push("phase must be P141.2");
  if (model.schemaVersion !== SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION) errors.push("schemaVersion must be 1.0");
  if (model.mode !== "read-only-control-model") errors.push("mode must be read-only-control-model");
  if (model.modelOnly !== true || model.readOnly !== true || model.localOnly !== true) errors.push("model must remain local read-only metadata");
  if (model.commandCenterVisible !== false) errors.push("P141.2 model must not render directly in Command Center");
  if (!model.modeGuard?.ok) errors.push("mode guard must pass");
  if (!Array.isArray(model.controls) || model.controls.length < 3) errors.push("at least three controls are required");
  if (!Array.isArray(model.privacyBoundaries) || model.privacyBoundaries.length < 3) errors.push("at least three privacy boundaries are required");
  if (!Array.isArray(model.complianceEvidence) || model.complianceEvidence.length < 2) errors.push("at least two compliance evidence rows are required");
  if (!Array.isArray(model.policyEnforcement) || model.policyEnforcement.length < 1) errors.push("at least one policy enforcement row is required");
  if (!Array.isArray(model.dataHandlingControls) || model.dataHandlingControls.length < 3) errors.push("at least three data handling controls are required");
  for (const control of model.controls || []) {
    const validation = validateSecurityPrivacyComplianceSecurityControl(control);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${control.controlRef || "control"}: ${error}`));
  }
  for (const boundary of model.privacyBoundaries || []) {
    const validation = validateSecurityPrivacyCompliancePrivacyBoundary(boundary);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${boundary.boundaryRef || "boundary"}: ${error}`));
  }
  for (const evidence of model.complianceEvidence || []) {
    const validation = validateSecurityPrivacyComplianceEvidence(evidence);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${evidence.evidenceRef || "evidence"}: ${error}`));
  }
  for (const policy of model.policyEnforcement || []) {
    const validation = validateSecurityPrivacyCompliancePolicyEnforcement(policy);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${policy.policyRef || "policy"}: ${error}`));
  }
  for (const handling of model.dataHandlingControls || []) {
    const validation = validateSecurityPrivacyComplianceDataHandlingControl(handling);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${handling.handlingRef || "handling"}: ${error}`));
  }
  if (model.controlMappingPreview?.valid !== true) errors.push("reused control mapping preview must validate");
  if (model.readinessSummary?.runnableActionCount !== 0) errors.push("runnableActionCount must be zero");
  if (Object.values(model.safetyFlags || {}).some((value) => value !== false)) errors.push("all safety flags must be false");
  if (SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES.some((flag) => model[flag] !== false)) errors.push("top-level safety flags must be false");
  if (model.costImpact?.estimatedUsd !== 0 || model.costImpact?.actualUsd !== 0 || model.costImpact?.providerSpendAllowed !== false || model.costImpact?.networkCallsAllowed !== false) errors.push("cost impact must remain zero-spend and local-only");
  if (!Array.isArray(model.evidenceRefs) || model.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(model.activityRefs) || model.activityRefs.length === 0) errors.push("activityRefs are required");
  if (hasRawIdentifier(model)) errors.push("model must not expose raw private identifiers");
  if (!/remain blocked/i.test(model.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  return { valid: errors.length === 0, errors };
}

export function buildSecurityPrivacyComplianceControlEnvelope(input = {}) {
  const model = input.model || buildSecurityPrivacyComplianceControlModel(input);
  const validation = validateSecurityPrivacyComplianceControlModel(model);
  const envelope = createPassResult({
    phase: SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
    mode: "read-only-control-model",
    source: "shared/securityPrivacyComplianceControlModel.js",
    summary: "Read-only security, privacy, and compliance control model generated without enabling enforcement, certification, audit export, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, network calls, or spend.",
    data: { model },
    warnings: validation.valid ? [] : validation.errors,
    evidence: model.evidenceRefs,
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    envelopeValid: envelopeValidation.valid,
    envelopeErrors: envelopeValidation.errors,
  };
}
