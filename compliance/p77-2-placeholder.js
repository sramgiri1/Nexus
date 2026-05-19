import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P77_2_REQUIRED_FIELDS = Object.freeze([
  "complianceEvidenceIndexId",
  "complianceScope",
  "evidenceScope",
  "auditScope",
  "redactionState",
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
  "displayFields",
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

export function createComplianceEvidenceIndex(input = {}) {
  const redaction = summarizeRedaction({
    complianceScope: input.complianceScope || "enterprise_readiness_preview",
    evidenceScope: input.evidenceScope || "redacted_report_references_only",
    auditScope: input.auditScope || "audit_pack_preview_no_export",
    sampleValue: input.sampleValue || "metadata_only_no_private_ids",
  });

  return {
    complianceEvidenceIndexId: input.complianceEvidenceIndexId || "compliance-evidence-index-preview",
    complianceScope: input.complianceScope || "enterprise readiness evidence preview",
    evidenceScope: input.evidenceScope || "redacted report and roadmap references only",
    auditScope: input.auditScope || "audit pack preview with export disabled",
    redactionState: redaction.changed ? "redacted" : "redaction_checked",
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
    displayFields: [
      "compliance scope",
      "evidence scope",
      "audit scope",
      "disabled certification state",
      "disabled export and package state",
      "evidence and activity locations",
      "next action",
      "disabled reason",
    ],
    blockedOperations: [
      "Compliance certification",
      "Legal attestation",
      "Audit export and raw log export",
      "Package creation",
      "DB writes and project mutation",
      "Tenant, access, auth, session, user, and workspace mutation",
      "Provider, tool, worker, network, deploy, release, export, and spend execution",
    ],
    disabledReason: "P77.2 records compliance evidence index metadata only; certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, runtime execution, network calls, and provider spend remain disabled.",
    blockers: [
      "Compliance certification remains disabled.",
      "Legal attestation remains disabled.",
      "Audit export, raw log export, and package creation remain disabled.",
      "DB writes and project mutation remain disabled.",
      "Tenant, access, auth, session, user, and workspace mutation remain disabled.",
      "Provider, tool, worker, network, deploy, release, export, and spend execution remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p772-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P77.2"])],
    costImpact: "No compliance service calls, DB writes, provider calls, network calls, export jobs, package jobs, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.complianceEvidenceIndexPreview",
    nextAction: input.nextAction || "Route this compliance evidence index into P77.3 audit trail export preview.",
    commandCenterVisible: true,
  };
}

export function validateComplianceEvidenceIndex(index = {}) {
  const errors = [];
  for (const field of P77_2_REQUIRED_FIELDS) {
    if (!(field in index)) errors.push(`missing ${field}`);
  }
  if (index.certificationAllowed !== false) errors.push("certification must be false");
  if (index.legalAttestationAllowed !== false) errors.push("legal attestation must be false");
  if (index.auditExportAllowed !== false || index.rawLogExportAllowed !== false) errors.push("audit/raw log export must be false");
  if (index.packageCreationAllowed !== false) errors.push("package creation must be false");
  if (index.dbWritesAllowed !== false || index.projectMutationAllowed !== false) errors.push("DB writes and project mutation must be false");
  if (index.tenantMutationAllowed !== false || index.accessMutationAllowed !== false) errors.push("tenant and access mutation must be false");
  if (index.providerDispatchAllowed !== false || index.toolExecutionAllowed !== false || index.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (index.networkCallsAllowed !== false || index.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (index.deployExecutionAllowed !== false || index.releaseExecutionAllowed !== false || index.exportExecutionAllowed !== false) errors.push("deploy/release/export execution must be false");
  if (index.authMutationAllowed !== false || index.sessionMutationAllowed !== false || index.userMutationAllowed !== false || index.workspaceMutationAllowed !== false) errors.push("auth/session/user/workspace mutation must be false");
  if (!Array.isArray(index.blockedOperations) || index.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(index.blockers) || index.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(index.forbiddenFiles) || !index.forbiddenFiles.includes("projects/**") || !index.forbiddenFiles.includes("db/**") || !index.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!index.disabledReason || /certify now|sign attestation|export audit|download package|create package|execute now/i.test(index.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(index.evidenceRefs) || index.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(index.activityRefs) || index.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildComplianceEvidenceIndexEnvelope(input = {}) {
  const index = createComplianceEvidenceIndex(input);
  return createPassResult({
    phase: "P77.2",
    mode: "preview-only",
    source: "compliance/p77-2-placeholder.js",
    summary: "Compliance evidence index recorded without enabling certification, legal attestation, audit export, package creation, DB writes, runtime execution, network calls, or provider spend.",
    data: { index },
    evidence: index.evidenceRefs,
  });
}

export const P77_2_SAMPLE_INDEXES = Object.freeze([
  createComplianceEvidenceIndex({
    evidenceRefs: ["reports/p772-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P77.2"],
  }),
]);
