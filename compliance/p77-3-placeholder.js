import { createPassResult } from "../shared/resultEnvelope.js";
import { P77_2_SAMPLE_INDEXES, validateComplianceEvidenceIndex } from "./p77-2-placeholder.js";

export const P77_3_REQUIRED_FIELDS = Object.freeze([
  "auditTrailExportPreviewId",
  "sourceComplianceEvidenceIndexId",
  "complianceScope",
  "auditScope",
  "exportMode",
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
  "previewRows",
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

export function createAuditTrailExportPreview(input = {}) {
  const sourceIndex = input.sourceIndex || P77_2_SAMPLE_INDEXES[0];
  const sourceValidation = validateComplianceEvidenceIndex(sourceIndex);
  const sourceComplianceEvidenceIndexId = sourceValidation.valid
    ? sourceIndex.complianceEvidenceIndexId
    : "compliance-evidence-index-unavailable";

  return {
    auditTrailExportPreviewId: input.auditTrailExportPreviewId || "audit-trail-export-preview",
    sourceComplianceEvidenceIndexId,
    complianceScope: input.complianceScope || sourceIndex.complianceScope || "enterprise readiness evidence preview",
    auditScope: input.auditScope || "redacted audit trail preview only",
    exportMode: input.exportMode || "disabled_preview_no_file_export",
    approvalRequired: true,
    approvalState: input.approvalState || "required_before_future_export",
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
    previewRows: [
      {
        label: "Source evidence index",
        currentState: sourceComplianceEvidenceIndexId,
        executionState: "display-only",
      },
      {
        label: "Audit trail export",
        currentState: "disabled preview",
        executionState: "not executable",
      },
      {
        label: "Raw logs and package",
        currentState: "disabled",
        executionState: "not created",
      },
    ],
    blockedOperations: [
      "Audit export",
      "Raw log export",
      "Package creation",
      "Compliance certification and legal attestation",
      "DB writes and project mutation",
      "Tenant, access, auth, session, user, and workspace mutation",
      "Provider, tool, worker, network, deploy, release, export, and spend execution",
    ],
    disabledReason: "P77.3 records audit trail export previews only; audit export, raw log export, package creation, certification, legal attestation, DB writes, project mutation, runtime execution, network calls, and provider spend remain disabled.",
    blockers: [
      "Audit export remains disabled.",
      "Raw log export remains disabled.",
      "Package creation remains disabled.",
      "Compliance certification and legal attestation remain disabled.",
      "DB writes and project mutation remain disabled.",
      "Provider, tool, worker, network, deploy, release, export, tenant, access, auth, session, user, workspace mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p773-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P77.3"])],
    costImpact: "No audit export jobs, raw log export jobs, package jobs, DB writes, provider calls, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.auditTrailExportPreview",
    nextAction: input.nextAction || "Route this audit trail export preview into P77.4 control mapping and attestation preview.",
    commandCenterVisible: true,
  };
}

export function validateAuditTrailExportPreview(preview = {}) {
  const errors = [];
  for (const field of P77_3_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  if (preview.certificationAllowed !== false || preview.legalAttestationAllowed !== false) errors.push("certification and attestation must be false");
  if (preview.auditExportAllowed !== false || preview.rawLogExportAllowed !== false) errors.push("audit/raw log export must be false");
  if (preview.packageCreationAllowed !== false) errors.push("package creation must be false");
  if (preview.dbWritesAllowed !== false || preview.projectMutationAllowed !== false) errors.push("DB writes and project mutation must be false");
  if (preview.tenantMutationAllowed !== false || preview.accessMutationAllowed !== false) errors.push("tenant and access mutation must be false");
  if (preview.providerDispatchAllowed !== false || preview.toolExecutionAllowed !== false || preview.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (preview.networkCallsAllowed !== false || preview.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (preview.deployExecutionAllowed !== false || preview.releaseExecutionAllowed !== false || preview.exportExecutionAllowed !== false) errors.push("deploy/release/export execution must be false");
  if (preview.authMutationAllowed !== false || preview.sessionMutationAllowed !== false || preview.userMutationAllowed !== false || preview.workspaceMutationAllowed !== false) errors.push("auth/session/user/workspace mutation must be false");
  if (preview.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!Array.isArray(preview.previewRows) || preview.previewRows.length < 3) errors.push("previewRows must be visible");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(preview.forbiddenFiles) || !preview.forbiddenFiles.includes("projects/**") || !preview.forbiddenFiles.includes("db/**") || !preview.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!preview.disabledReason || /export audit|download package|create package|raw log dump|certify now|execute now/i.test(preview.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildAuditTrailExportPreviewEnvelope(input = {}) {
  const preview = createAuditTrailExportPreview(input);
  return createPassResult({
    phase: "P77.3",
    mode: "preview-only",
    source: "compliance/p77-3-placeholder.js",
    summary: "Audit trail export preview recorded without enabling audit export, raw log export, package creation, DB writes, runtime execution, network calls, or provider spend.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P77_3_SAMPLE_PREVIEWS = Object.freeze([
  createAuditTrailExportPreview({
    sourceIndex: P77_2_SAMPLE_INDEXES[0],
    evidenceRefs: ["reports/p773-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P77.3"],
  }),
]);
