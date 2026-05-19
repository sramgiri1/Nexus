import { createPassResult } from "../shared/resultEnvelope.js";
import { P76_2_SAMPLE_CONTRACTS, validateTenantBoundaryContract } from "./p76-2-placeholder.js";
import { P76_3_SAMPLE_PREVIEWS, validateProjectScopeIsolationPreview } from "./p76-3-placeholder.js";

export const P76_4_REQUIRED_FIELDS = Object.freeze([
  "accessContextPacketId",
  "sourceTenantBoundaryId",
  "sourceProjectScopePreviewId",
  "accessContextMode",
  "tenantBoundary",
  "projectScope",
  "approvalRequired",
  "approvalState",
  "accessGrantAllowed",
  "roleMutationAllowed",
  "permissionMutationAllowed",
  "membershipMutationAllowed",
  "tenantMutationAllowed",
  "projectMutationAllowed",
  "crossProjectAccessAllowed",
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
  "accessPacketRows",
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

export function createAccessContextPacketPreview(input = {}) {
  const tenantBoundary = input.tenantBoundaryContract || P76_2_SAMPLE_CONTRACTS[0];
  const projectScopePreview = input.projectScopePreview || P76_3_SAMPLE_PREVIEWS[0];
  const tenantValidation = validateTenantBoundaryContract(tenantBoundary);
  const projectValidation = validateProjectScopeIsolationPreview(projectScopePreview);
  const sourceTenantBoundaryId = tenantValidation.valid ? tenantBoundary.tenantBoundaryId : "tenant-boundary-unavailable";
  const sourceProjectScopePreviewId = projectValidation.valid
    ? projectScopePreview.projectScopePreviewId
    : "project-scope-unavailable";

  return {
    accessContextPacketId: input.accessContextPacketId || "access-context-packet-preview",
    sourceTenantBoundaryId,
    sourceProjectScopePreviewId,
    accessContextMode: input.accessContextMode || "metadata_only_no_access_mutation",
    tenantBoundary: input.tenantBoundary || tenantBoundary.tenantBoundary || "nexus_os_tenant_boundary_preview",
    projectScope: input.projectScope || projectScopePreview.projectScope || "nexus_os_project_scope_preview",
    approvalRequired: true,
    approvalState: input.approvalState || "required_before_future_access_runtime",
    accessGrantAllowed: false,
    roleMutationAllowed: false,
    permissionMutationAllowed: false,
    membershipMutationAllowed: false,
    tenantMutationAllowed: false,
    projectMutationAllowed: false,
    crossProjectAccessAllowed: false,
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
    accessPacketRows: [
      {
        label: "Tenant boundary",
        currentState: sourceTenantBoundaryId,
        executionState: "display-only",
      },
      {
        label: "Project scope",
        currentState: sourceProjectScopePreviewId,
        executionState: "display-only",
      },
      {
        label: "Access grants",
        currentState: "disabled",
        executionState: "not executable",
      },
      {
        label: "Approval gate",
        currentState: "required",
        executionState: "blocked",
      },
    ],
    blockedOperations: [
      "Access grants",
      "Role, permission, and membership mutation",
      "Tenant mutation",
      "Project mutation and cross-project access",
      "DB writes",
      "Provider, tool, worker, or network execution",
      "Deploy, release, export, package, auth, session, user, or workspace mutation",
    ],
    disabledReason: "P76.4 records access context packet previews only; access grants, role mutation, permission mutation, tenant mutation, project mutation, DB writes, runtime execution, network calls, and provider spend remain disabled.",
    blockers: [
      "Access grants remain disabled.",
      "Role, permission, and membership mutation remain disabled.",
      "Tenant mutation remains disabled.",
      "Project mutation and cross-project access remain disabled.",
      "DB writes remain disabled.",
      "Provider, tool, worker, network, deploy, release, export, package, auth, session, user, workspace mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p764-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P76.4"])],
    costImpact: "No access service calls, tenant service calls, project service calls, DB service calls, provider calls, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.accessContextPacketPreview",
    nextAction: input.nextAction || "Route this access context packet preview through P76.5 Command Center Isolation readiness UX.",
    commandCenterVisible: true,
  };
}

export function validateAccessContextPacketPreview(packet = {}) {
  const errors = [];
  for (const field of P76_4_REQUIRED_FIELDS) {
    if (!(field in packet)) errors.push(`missing ${field}`);
  }
  if (packet.accessGrantAllowed !== false) errors.push("access grants must be false");
  if (packet.roleMutationAllowed !== false || packet.permissionMutationAllowed !== false || packet.membershipMutationAllowed !== false) errors.push("role, permission, and membership mutation must be false");
  if (packet.tenantMutationAllowed !== false) errors.push("tenant mutation must be false");
  if (packet.projectMutationAllowed !== false || packet.crossProjectAccessAllowed !== false) errors.push("project mutation and cross-project access must be false");
  if (packet.dbWritesAllowed !== false) errors.push("DB writes must be false");
  if (packet.providerDispatchAllowed !== false || packet.toolExecutionAllowed !== false || packet.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (packet.networkCallsAllowed !== false || packet.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (packet.deployExecutionAllowed !== false || packet.releaseExecutionAllowed !== false || packet.exportExecutionAllowed !== false || packet.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (packet.authMutationAllowed !== false || packet.sessionMutationAllowed !== false || packet.userMutationAllowed !== false || packet.workspaceMutationAllowed !== false) errors.push("auth/session/user/workspace mutation must be false");
  if (packet.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!Array.isArray(packet.accessPacketRows) || packet.accessPacketRows.length < 4) errors.push("accessPacketRows must be visible");
  if (!Array.isArray(packet.blockedOperations) || packet.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(packet.blockers) || packet.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(packet.forbiddenFiles) || !packet.forbiddenFiles.includes("projects/**") || !packet.forbiddenFiles.includes("db/**") || !packet.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!packet.disabledReason || /grant access|assign role|change permission|create user|login now|execute now/i.test(packet.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(packet.evidenceRefs) || packet.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(packet.activityRefs) || packet.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildAccessContextPacketPreviewEnvelope(input = {}) {
  const packet = createAccessContextPacketPreview(input);
  return createPassResult({
    phase: "P76.4",
    mode: "preview-only",
    source: "isolation/p76-4-placeholder.js",
    summary: "Access context packet preview recorded without enabling access grants, role mutation, DB writes, runtime execution, network calls, or provider spend.",
    data: { packet },
    evidence: packet.evidenceRefs,
  });
}

export const P76_4_SAMPLE_PACKETS = Object.freeze([
  createAccessContextPacketPreview({
    tenantBoundaryContract: P76_2_SAMPLE_CONTRACTS[0],
    projectScopePreview: P76_3_SAMPLE_PREVIEWS[0],
    evidenceRefs: ["reports/p764-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P76.4"],
  }),
]);
