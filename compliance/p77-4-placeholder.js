import { createPassResult } from "../shared/resultEnvelope.js";
import { P77_2_SAMPLE_INDEXES, validateComplianceEvidenceIndex } from "./p77-2-placeholder.js";
import { P77_3_SAMPLE_PREVIEWS, validateAuditTrailExportPreview } from "./p77-3-placeholder.js";

export const P77_4_REQUIRED_FIELDS = Object.freeze([
  "controlMappingPreviewId",
  "sourceComplianceEvidenceIndexId",
  "sourceAuditTrailExportPreviewId",
  "controlMappingScope",
  "attestationMode",
  "approvalRequired",
  "approvalState",
  "certificationAllowed",
  "legalAttestationAllowed",
  "auditExportAllowed",
  "rawLogExportAllowed",
  "packageCreationAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "tenantMutationAllowed",
  "accessMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "authMutationAllowed",
  "sessionMutationAllowed",
  "userMutationAllowed",
  "workspaceMutationAllowed",
  "providerSpendAllowed",
  "controlRows",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "forbiddenFiles",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
  "commandCenterVisible",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
  "deploy/**",
  "release/**",
  "auth/**",
  "users/**",
  "rbac/**",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createControlMappingPreview(input = {}) {
  const sourceIndex = input.sourceIndex || P77_2_SAMPLE_INDEXES[0];
  const sourceAuditPreview = input.sourceAuditPreview || P77_3_SAMPLE_PREVIEWS[0];
  const indexValidation = validateComplianceEvidenceIndex(sourceIndex);
  const auditValidation = validateAuditTrailExportPreview(sourceAuditPreview);
  const sourceComplianceEvidenceIndexId = indexValidation.valid
    ? sourceIndex.complianceEvidenceIndexId
    : "compliance-evidence-index-unavailable";
  const sourceAuditTrailExportPreviewId = auditValidation.valid
    ? sourceAuditPreview.auditTrailExportPreviewId
    : "audit-trail-preview-unavailable";

  return {
    controlMappingPreviewId: input.controlMappingPreviewId || "control-mapping-attestation-preview",
    sourceComplianceEvidenceIndexId,
    sourceAuditTrailExportPreviewId,
    controlMappingScope: input.controlMappingScope || "enterprise readiness controls preview",
    attestationMode: input.attestationMode || "disabled_preview_no_legal_attestation",
    approvalRequired: true,
    approvalState: input.approvalState || "required_before_future_attestation",
    certificationAllowed: false,
    legalAttestationAllowed: false,
    auditExportAllowed: false,
    rawLogExportAllowed: false,
    packageCreationAllowed: false,
    dbWritesAllowed: false,
    projectMutationAllowed: false,
    tenantMutationAllowed: false,
    accessMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    authMutationAllowed: false,
    sessionMutationAllowed: false,
    userMutationAllowed: false,
    workspaceMutationAllowed: false,
    providerSpendAllowed: false,
    controlRows: [
      {
        label: "Evidence index",
        currentState: sourceComplianceEvidenceIndexId,
        executionState: "display-only",
      },
      {
        label: "Audit trail preview",
        currentState: sourceAuditTrailExportPreviewId,
        executionState: "display-only",
      },
      {
        label: "Control mapping",
        currentState: "preview only",
        executionState: "not certifying",
      },
      {
        label: "Legal attestation",
        currentState: "disabled",
        executionState: "not executable",
      },
    ],
    blockedOperations: [
      "Compliance certification",
      "Legal attestation",
      "Control attestation signing",
      "Audit export and raw log export",
      "Package creation",
      "DB writes and project mutation",
      "Provider, tool, worker, network, deploy, release, export, tenant, access, auth, session, user, workspace, and spend execution",
    ],
    disabledReason: "P77.4 records control mapping and attestation previews only; compliance certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, runtime execution, network calls, and provider spend remain disabled.",
    blockers: [
      "Compliance certification remains disabled.",
      "Legal attestation and signing remain disabled.",
      "Audit export, raw log export, and package creation remain disabled.",
      "DB writes and project mutation remain disabled.",
      "Tenant, access, auth, session, user, and workspace mutation remain disabled.",
      "Provider, tool, worker, network, deploy, release, export, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p774-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P77.4"])],
    costImpact: "No certification service calls, attestation service calls, audit export jobs, package jobs, DB writes, provider calls, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.controlMappingPreview",
    nextAction: input.nextAction || "Route this control mapping preview into P77.5 Command Center Compliance readiness UX.",
    commandCenterVisible: true,
  };
}

export function validateControlMappingPreview(preview = {}) {
  const errors = [];
  for (const field of P77_4_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  if (preview.certificationAllowed !== false || preview.legalAttestationAllowed !== false) errors.push("certification and legal attestation must be false");
  if (preview.auditExportAllowed !== false || preview.rawLogExportAllowed !== false) errors.push("audit/raw log export must be false");
  if (preview.packageCreationAllowed !== false) errors.push("package creation must be false");
  if (preview.dbWritesAllowed !== false || preview.projectMutationAllowed !== false) errors.push("DB writes and project mutation must be false");
  if (preview.tenantMutationAllowed !== false || preview.accessMutationAllowed !== false) errors.push("tenant and access mutation must be false");
  if (preview.providerDispatchAllowed !== false || preview.toolExecutionAllowed !== false || preview.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (preview.networkCallsAllowed !== false || preview.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (preview.deployExecutionAllowed !== false || preview.releaseExecutionAllowed !== false || preview.exportExecutionAllowed !== false) errors.push("deploy/release/export execution must be false");
  if (preview.authMutationAllowed !== false || preview.sessionMutationAllowed !== false || preview.userMutationAllowed !== false || preview.workspaceMutationAllowed !== false) errors.push("auth/session/user/workspace mutation must be false");
  if (preview.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!Array.isArray(preview.controlRows) || preview.controlRows.length < 4) errors.push("controlRows must be visible");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(preview.forbiddenFiles) || !preview.forbiddenFiles.includes("projects/**") || !preview.forbiddenFiles.includes("db/**") || !preview.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!preview.disabledReason || /certify now|sign attestation|legal sign|export audit|download package|create package|execute now/i.test(preview.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildControlMappingPreviewEnvelope(input = {}) {
  const preview = createControlMappingPreview(input);
  return createPassResult({
    phase: "P77.4",
    mode: "preview-only",
    source: "compliance/p77-4-placeholder.js",
    summary: "Control mapping preview recorded without enabling certification, legal attestation, audit export, package creation, DB writes, runtime execution, network calls, or provider spend.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P77_4_SAMPLE_PREVIEWS = Object.freeze([
  createControlMappingPreview({
    sourceIndex: P77_2_SAMPLE_INDEXES[0],
    sourceAuditPreview: P77_3_SAMPLE_PREVIEWS[0],
    evidenceRefs: ["reports/p774-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P77.4"],
  }),
]);
