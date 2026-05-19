import { createPassResult } from "../shared/resultEnvelope.js";
import { P76_2_SAMPLE_CONTRACTS, validateTenantBoundaryContract } from "./p76-2-placeholder.js";

export const P76_3_REQUIRED_FIELDS = Object.freeze([
  "projectScopePreviewId",
  "sourceTenantBoundaryId",
  "sourceTenantBoundary",
  "projectScope",
  "isolationMode",
  "approvalRequired",
  "approvalState",
  "projectMutationAllowed",
  "crossProjectAccessAllowed",
  "tenantMutationAllowed",
  "membershipMutationAllowed",
  "permissionMutationAllowed",
  "roleMutationAllowed",
  "accessGrantAllowed",
  "dbWritesAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
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

export function createProjectScopeIsolationPreview(input = {}) {
  const tenantBoundary = input.tenantBoundary || P76_2_SAMPLE_CONTRACTS[0];
  const tenantValidation = validateTenantBoundaryContract(tenantBoundary);
  const sourceTenantBoundaryId = tenantValidation.valid
    ? tenantBoundary.tenantBoundaryId
    : "tenant-boundary-unavailable";

  return {
    projectScopePreviewId: input.projectScopePreviewId || "project-scope-isolation-preview",
    sourceTenantBoundaryId,
    sourceTenantBoundary: input.sourceTenantBoundary || tenantBoundary.tenantBoundary || "nexus_os_tenant_boundary_preview",
    projectScope: input.projectScope || "nexus_os_project_scope_preview",
    isolationMode: input.isolationMode || "metadata_only_no_project_mutation",
    approvalRequired: true,
    approvalState: input.approvalState || "required_before_future_runtime",
    projectMutationAllowed: false,
    crossProjectAccessAllowed: false,
    tenantMutationAllowed: false,
    membershipMutationAllowed: false,
    permissionMutationAllowed: false,
    roleMutationAllowed: false,
    accessGrantAllowed: false,
    dbWritesAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    authMutationAllowed: false,
    sessionMutationAllowed: false,
    userMutationAllowed: false,
    workspaceMutationAllowed: false,
    providerSpendAllowed: false,
    previewRows: [
      {
        label: "Source tenant boundary",
        currentState: sourceTenantBoundaryId,
        executionState: "display-only",
      },
      {
        label: "Project scope",
        currentState: "metadata-only preview",
        executionState: "disabled",
      },
      {
        label: "Approval gate",
        currentState: "required",
        executionState: "not executable",
      },
    ],
    blockedOperations: [
      "Project creation, update, or delete",
      "Cross-project access",
      "Tenant mutation",
      "Access grants and role mutation",
      "DB writes",
      "Provider, tool, worker, or network execution",
      "Deploy, release, export, package, auth, session, user, or workspace mutation",
    ],
    disabledReason: "P76.3 records project scope isolation previews only; project mutation, cross-project access, tenant mutation, access grants, DB writes, runtime execution, network calls, and provider spend remain disabled.",
    blockers: [
      "Project creation, update, and delete remain disabled.",
      "Cross-project access remains disabled.",
      "Tenant mutation remains disabled.",
      "Access grants, permission mutation, and role mutation remain disabled.",
      "DB writes remain disabled.",
      "Provider, tool, worker, network, deploy, release, export, package, auth, session, user, workspace mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p763-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P76.3"])],
    costImpact: "No project service calls, tenant service calls, DB service calls, provider calls, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.projectScopeIsolationPreview",
    nextAction: input.nextAction || "Route this project scope isolation preview through P76.4 access context packet preview.",
    commandCenterVisible: true,
  };
}

export function validateProjectScopeIsolationPreview(preview = {}) {
  const errors = [];
  for (const field of P76_3_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  if (preview.projectMutationAllowed !== false || preview.crossProjectAccessAllowed !== false) errors.push("project mutation and cross-project access must be false");
  if (preview.tenantMutationAllowed !== false) errors.push("tenant mutation must be false");
  if (preview.membershipMutationAllowed !== false || preview.permissionMutationAllowed !== false || preview.roleMutationAllowed !== false) errors.push("membership, permission, and role mutation must be false");
  if (preview.accessGrantAllowed !== false) errors.push("access grants must be false");
  if (preview.dbWritesAllowed !== false) errors.push("DB writes must be false");
  if (preview.providerDispatchAllowed !== false || preview.toolExecutionAllowed !== false || preview.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (preview.networkCallsAllowed !== false || preview.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (preview.deployExecutionAllowed !== false || preview.releaseExecutionAllowed !== false || preview.exportExecutionAllowed !== false || preview.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (preview.authMutationAllowed !== false || preview.sessionMutationAllowed !== false || preview.userMutationAllowed !== false || preview.workspaceMutationAllowed !== false) errors.push("auth/session/user/workspace mutation must be false");
  if (preview.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!Array.isArray(preview.previewRows) || preview.previewRows.length < 3) errors.push("previewRows must be visible");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(preview.forbiddenFiles) || !preview.forbiddenFiles.includes("projects/**") || !preview.forbiddenFiles.includes("db/**") || !preview.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!preview.disabledReason || /create project|update project|delete project|grant access|cross-project now|execute now/i.test(preview.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildProjectScopeIsolationPreviewEnvelope(input = {}) {
  const preview = createProjectScopeIsolationPreview(input);
  return createPassResult({
    phase: "P76.3",
    mode: "preview-only",
    source: "isolation/p76-3-placeholder.js",
    summary: "Project scope isolation preview recorded without enabling project mutation, cross-project access, DB writes, runtime execution, network calls, or provider spend.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P76_3_SAMPLE_PREVIEWS = Object.freeze([
  createProjectScopeIsolationPreview({
    tenantBoundary: P76_2_SAMPLE_CONTRACTS[0],
    evidenceRefs: ["reports/p763-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P76.3"],
  }),
]);
