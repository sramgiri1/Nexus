import { createPassResult } from "../shared/resultEnvelope.js";
import { createIdentitySessionContract } from "./p73-2-placeholder.js";
import { createRbacPermissionMatrix, validateRbacPermissionMatrix } from "./p73-3-placeholder.js";

export const P73_4_REQUIRED_FIELDS = Object.freeze([
  "workspaceBoundaryId",
  "identityContractId",
  "rbacMatrixId",
  "workspaceMode",
  "tenantBoundary",
  "isolationState",
  "workspaceMutationAllowed",
  "tenantMutationAllowed",
  "userMutationAllowed",
  "sessionMutationAllowed",
  "roleMutationAllowed",
  "permissionMutationAllowed",
  "loginAllowed",
  "identityProviderCallsAllowed",
  "tokenExchangeAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "workspaceRows",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createMultiUserWorkspaceBoundary(input = {}) {
  const identity = input.identity || createIdentitySessionContract(input);
  const matrix = input.matrix || createRbacPermissionMatrix({ ...input, identity });
  const matrixValidation = validateRbacPermissionMatrix(matrix);
  return {
    workspaceBoundaryId: input.workspaceBoundaryId || "multi-user-workspace-boundary-preview",
    identityContractId: identity.identityContractId,
    rbacMatrixId: matrix.rbacMatrixId,
    workspaceMode: "single_workspace_preview",
    tenantBoundary: "tenant_records_not_created",
    isolationState: "display_only_isolation_model",
    workspaceMutationAllowed: false,
    tenantMutationAllowed: false,
    userMutationAllowed: false,
    sessionMutationAllowed: false,
    roleMutationAllowed: false,
    permissionMutationAllowed: false,
    loginAllowed: false,
    identityProviderCallsAllowed: false,
    tokenExchangeAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    providerSpendAllowed: false,
    workspaceRows: [
      { workspace: "founder workspace", isolationPosture: "display_only", mutationAllowed: false },
      { workspace: "operator workspace", isolationPosture: "display_only", mutationAllowed: false },
      { workspace: "auditor workspace", isolationPosture: "display_only", mutationAllowed: false },
    ],
    blockedOperations: [
      "Tenant creation",
      "Workspace creation",
      "Workspace membership mutation",
      "User mutation",
      "Role assignment",
      "Permission mutation",
    ],
    disabledReason: "P73.4 records multi-user workspace boundaries only; tenant creation, workspace mutation, and membership mutation remain disabled.",
    blockers: [
      "Tenant creation is disabled.",
      "Workspace mutation is disabled.",
      "Membership, user, session, role, and permission mutation are disabled.",
      "Login, identity provider calls, and token exchange are disabled.",
      "DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
      ...(matrixValidation.valid ? [] : matrixValidation.errors),
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), ...identity.evidenceRefs, ...matrix.evidenceRefs, "reports/p734-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), ...identity.activityRefs, ...matrix.activityRefs, "os-roadmap/phase-status.json#P73.4"])],
    costImpact: "No identity provider calls, workspace writes, DB service calls, network calls, provider calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.multiUserWorkspaceBoundaryPreview",
    nextAction: input.nextAction || "Expose this workspace boundary in P73.5 Command Center auth governance UX.",
    commandCenterVisible: true,
  };
}

export function validateMultiUserWorkspaceBoundary(boundary = {}) {
  const errors = [];
  for (const field of P73_4_REQUIRED_FIELDS) {
    if (!(field in boundary)) errors.push(`missing ${field}`);
  }
  if (boundary.workspaceMutationAllowed !== false || boundary.tenantMutationAllowed !== false) errors.push("workspace and tenant mutation must be false");
  if (boundary.userMutationAllowed !== false || boundary.sessionMutationAllowed !== false || boundary.roleMutationAllowed !== false || boundary.permissionMutationAllowed !== false) errors.push("user/session/role/permission mutation must be false");
  if (boundary.loginAllowed !== false || boundary.identityProviderCallsAllowed !== false || boundary.tokenExchangeAllowed !== false) errors.push("login/provider/token exchange must be false");
  if (boundary.projectMutationAllowed !== false || boundary.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (boundary.providerDispatchAllowed !== false || boundary.toolExecutionAllowed !== false || boundary.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (boundary.networkCallsAllowed !== false || boundary.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (boundary.deployExecutionAllowed !== false || boundary.releaseExecutionAllowed !== false || boundary.exportExecutionAllowed !== false || boundary.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (!Array.isArray(boundary.workspaceRows) || boundary.workspaceRows.length < 3 || boundary.workspaceRows.some((row) => row.mutationAllowed !== false)) errors.push("workspaceRows must be display-only");
  if (!Array.isArray(boundary.blockedOperations) || boundary.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!boundary.disabledReason || /create tenant|create workspace|add member|assign role now|execute now/i.test(boundary.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(boundary.evidenceRefs) || boundary.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(boundary.activityRefs) || boundary.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildMultiUserWorkspaceBoundaryEnvelope(input = {}) {
  const boundary = createMultiUserWorkspaceBoundary(input);
  return createPassResult({
    phase: "P73.4",
    mode: "preview-only",
    source: "auth-governance/p73-4-placeholder.js",
    summary: "Multi-user workspace boundary recorded without enabling tenant, workspace, or membership mutation.",
    data: { boundary },
    evidence: boundary.evidenceRefs,
  });
}

export const P73_4_SAMPLE_BOUNDARIES = Object.freeze([
  createMultiUserWorkspaceBoundary({
    evidenceRefs: ["reports/p734-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P73.4"],
  }),
]);
