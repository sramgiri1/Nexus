import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P76_2_REQUIRED_FIELDS = Object.freeze([
  "tenantBoundaryId",
  "tenantBoundary",
  "isolationMode",
  "redactionState",
  "tenantMutationAllowed",
  "membershipMutationAllowed",
  "permissionMutationAllowed",
  "roleMutationAllowed",
  "accessGrantAllowed",
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

export function createTenantBoundaryContract(input = {}) {
  const redaction = summarizeRedaction({
    tenantBoundary: input.tenantBoundary || "nexus_os_tenant_boundary_preview",
    isolationMode: input.isolationMode || "metadata_only_no_runtime_mutation",
    sampleValue: input.sampleValue || "metadata_only_no_private_ids",
  });

  return {
    tenantBoundaryId: input.tenantBoundaryId || "tenant-boundary-contract-preview",
    tenantBoundary: input.tenantBoundary || "nexus_os_tenant_boundary_preview",
    isolationMode: input.isolationMode || "metadata_only_no_runtime_mutation",
    redactionState: redaction.changed ? "redacted" : "redaction_checked",
    tenantMutationAllowed: false,
    membershipMutationAllowed: false,
    permissionMutationAllowed: false,
    roleMutationAllowed: false,
    accessGrantAllowed: false,
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
    displayFields: [
      "tenant boundary",
      "isolation mode",
      "tenant mutation state",
      "membership and permission state",
      "project isolation state",
      "next action",
      "disabled reason",
    ],
    blockedOperations: [
      "Tenant creation, update, or delete",
      "Membership, permission, and role mutation",
      "Access grants",
      "Project mutation or cross-project access",
      "DB writes",
      "Provider, tool, worker, or network execution",
      "Deploy, release, export, package, auth, session, user, or workspace mutation",
    ],
    disabledReason: "P76.2 records tenant boundary contracts only; tenant mutation, membership mutation, permission mutation, role mutation, access grants, project mutation, DB writes, runtime execution, network calls, and provider spend remain disabled.",
    blockers: [
      "Tenant creation, update, and delete remain disabled.",
      "Membership, permission, role, and access grant mutation remain disabled.",
      "Project mutation and cross-project access remain disabled.",
      "DB writes remain disabled.",
      "Provider, tool, worker, and network execution remain disabled.",
      "Deploy, release, export, package, auth, session, user, workspace mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p762-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P76.2"])],
    costImpact: "No tenant service calls, DB service calls, provider calls, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.tenantBoundaryPreview",
    nextAction: input.nextAction || "Route this tenant boundary contract through P76.3 project scope isolation preview.",
    commandCenterVisible: true,
  };
}

export function validateTenantBoundaryContract(contract = {}) {
  const errors = [];
  for (const field of P76_2_REQUIRED_FIELDS) {
    if (!(field in contract)) errors.push(`missing ${field}`);
  }
  if (contract.tenantMutationAllowed !== false) errors.push("tenant mutation must be false");
  if (contract.membershipMutationAllowed !== false || contract.permissionMutationAllowed !== false || contract.roleMutationAllowed !== false) errors.push("membership, permission, and role mutation must be false");
  if (contract.accessGrantAllowed !== false) errors.push("access grants must be false");
  if (contract.projectMutationAllowed !== false || contract.crossProjectAccessAllowed !== false) errors.push("project mutation and cross-project access must be false");
  if (contract.dbWritesAllowed !== false) errors.push("DB writes must be false");
  if (contract.providerDispatchAllowed !== false || contract.toolExecutionAllowed !== false || contract.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (contract.networkCallsAllowed !== false || contract.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (contract.deployExecutionAllowed !== false || contract.releaseExecutionAllowed !== false || contract.exportExecutionAllowed !== false || contract.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (contract.authMutationAllowed !== false || contract.sessionMutationAllowed !== false || contract.userMutationAllowed !== false || contract.workspaceMutationAllowed !== false) errors.push("auth/session/user/workspace mutation must be false");
  if (!Array.isArray(contract.blockedOperations) || contract.blockedOperations.length < 7) errors.push("blockedOperations must be visible");
  if (!Array.isArray(contract.blockers) || contract.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(contract.forbiddenFiles) || !contract.forbiddenFiles.includes("projects/**") || !contract.forbiddenFiles.includes("db/**") || !contract.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!contract.disabledReason || /create tenant|update tenant|delete tenant|grant access|assign role|execute now/i.test(contract.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(contract.evidenceRefs) || contract.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(contract.activityRefs) || contract.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildTenantBoundaryContractEnvelope(input = {}) {
  const contract = createTenantBoundaryContract(input);
  return createPassResult({
    phase: "P76.2",
    mode: "preview-only",
    source: "isolation/p76-2-placeholder.js",
    summary: "Tenant boundary contract recorded without enabling tenant mutation, access grants, project mutation, DB writes, runtime execution, network calls, or provider spend.",
    data: { contract },
    evidence: contract.evidenceRefs,
  });
}

export const P76_2_SAMPLE_CONTRACTS = Object.freeze([
  createTenantBoundaryContract({
    evidenceRefs: ["reports/p762-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P76.2"],
  }),
]);
