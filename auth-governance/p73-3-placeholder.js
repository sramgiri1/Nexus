import { createPassResult } from "../shared/resultEnvelope.js";
import { createIdentitySessionContract, validateIdentitySessionContract } from "./p73-2-placeholder.js";

export const P73_3_REQUIRED_FIELDS = Object.freeze([
  "rbacMatrixId",
  "identityContractId",
  "roleSet",
  "permissionState",
  "assignmentState",
  "loginAllowed",
  "roleMutationAllowed",
  "permissionMutationAllowed",
  "userMutationAllowed",
  "sessionMutationAllowed",
  "tenantMutationAllowed",
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
  "permissionRows",
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

export function createRbacPermissionMatrix(input = {}) {
  const identity = input.identity || createIdentitySessionContract(input);
  const identityValidation = validateIdentitySessionContract(identity);
  return {
    rbacMatrixId: input.rbacMatrixId || "rbac-permission-matrix-preview",
    identityContractId: identity.identityContractId,
    roleSet: ["owner", "operator", "viewer", "auditor"],
    permissionState: "matrix_defined_not_enforced",
    assignmentState: "role_assignments_not_mutating",
    loginAllowed: false,
    roleMutationAllowed: false,
    permissionMutationAllowed: false,
    userMutationAllowed: false,
    sessionMutationAllowed: false,
    tenantMutationAllowed: false,
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
    permissionRows: [
      { role: "owner", posture: "display_only", allowedActions: ["review governance readiness"], mutationAllowed: false },
      { role: "operator", posture: "display_only", allowedActions: ["review assigned work"], mutationAllowed: false },
      { role: "viewer", posture: "display_only", allowedActions: ["read readiness summaries"], mutationAllowed: false },
      { role: "auditor", posture: "display_only", allowedActions: ["review evidence references"], mutationAllowed: false },
    ],
    blockedOperations: [
      "Role assignment",
      "Role mutation",
      "Permission mutation",
      "User mutation",
      "Session mutation",
      "Tenant mutation",
    ],
    disabledReason: "P73.3 records RBAC permission matrices only; role assignment, permission mutation, and user mutation remain disabled.",
    blockers: [
      "Role assignment is disabled.",
      "Permission mutation is disabled.",
      "User, session, and tenant mutation are disabled.",
      "Login, identity provider calls, and token exchange are disabled.",
      "DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
      ...(identityValidation.valid ? [] : identityValidation.errors),
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), ...identity.evidenceRefs, "reports/p733-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), ...identity.activityRefs, "os-roadmap/phase-status.json#P73.3"])],
    costImpact: "No identity provider calls, RBAC writes, DB service calls, network calls, provider calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.rbacPermissionMatrixPreview",
    nextAction: input.nextAction || "Route this RBAC matrix through P73.4 multi-user workspace boundary.",
    commandCenterVisible: true,
  };
}

export function validateRbacPermissionMatrix(matrix = {}) {
  const errors = [];
  for (const field of P73_3_REQUIRED_FIELDS) {
    if (!(field in matrix)) errors.push(`missing ${field}`);
  }
  if (matrix.roleMutationAllowed !== false || matrix.permissionMutationAllowed !== false) errors.push("role and permission mutation must be false");
  if (matrix.userMutationAllowed !== false || matrix.sessionMutationAllowed !== false || matrix.tenantMutationAllowed !== false) errors.push("user/session/tenant mutation must be false");
  if (matrix.loginAllowed !== false || matrix.identityProviderCallsAllowed !== false || matrix.tokenExchangeAllowed !== false) errors.push("login/provider/token exchange must be false");
  if (matrix.projectMutationAllowed !== false || matrix.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (matrix.providerDispatchAllowed !== false || matrix.toolExecutionAllowed !== false || matrix.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (matrix.networkCallsAllowed !== false || matrix.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (matrix.deployExecutionAllowed !== false || matrix.releaseExecutionAllowed !== false || matrix.exportExecutionAllowed !== false || matrix.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (!Array.isArray(matrix.roleSet) || matrix.roleSet.length < 4) errors.push("roleSet must be visible");
  if (!Array.isArray(matrix.permissionRows) || matrix.permissionRows.length < 4 || matrix.permissionRows.some((row) => row.mutationAllowed !== false)) errors.push("permissionRows must be display-only");
  if (!Array.isArray(matrix.blockedOperations) || matrix.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!matrix.disabledReason || /assign role now|grant permission|create user|log in now|execute now/i.test(matrix.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(matrix.evidenceRefs) || matrix.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(matrix.activityRefs) || matrix.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildRbacPermissionMatrixEnvelope(input = {}) {
  const matrix = createRbacPermissionMatrix(input);
  return createPassResult({
    phase: "P73.3",
    mode: "preview-only",
    source: "auth-governance/p73-3-placeholder.js",
    summary: "RBAC permission matrix recorded without enabling role assignment, permission mutation, or user mutation.",
    data: { matrix },
    evidence: matrix.evidenceRefs,
  });
}

export const P73_3_SAMPLE_MATRICES = Object.freeze([
  createRbacPermissionMatrix({
    evidenceRefs: ["reports/p733-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P73.3"],
  }),
]);
