import { createPassResult } from "../shared/resultEnvelope.js";
import {
  createIdentitySessionContract,
  validateIdentitySessionContract,
} from "./p73-2-placeholder.js";
import {
  createRbacPermissionMatrix,
  validateRbacPermissionMatrix,
} from "./p73-3-placeholder.js";
import {
  createTenantBoundaryContract,
  validateTenantBoundaryContract,
} from "../isolation/p76-2-placeholder.js";

export const P135_2_REQUIRED_FIELDS = Object.freeze([
  "authTenantModelId",
  "modelState",
  "identityContract",
  "tenantBoundaryContract",
  "rbacMatrix",
  "roleCatalog",
  "tenantScopeCatalog",
  "sessionPolicy",
  "authProviderPolicy",
  "permissionPolicy",
  "safetyFlags",
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

export const P135_2_SAFETY_FLAG_NAMES = Object.freeze([
  "loginAllowed",
  "sessionMutationAllowed",
  "userMutationAllowed",
  "tenantMutationAllowed",
  "membershipMutationAllowed",
  "roleMutationAllowed",
  "permissionMutationAllowed",
  "permissionGrantAllowed",
  "permissionEnforcementAllowed",
  "authProviderCallsAllowed",
  "tokenExchangeAllowed",
  "dbWritesAllowed",
  "runtimeWritesAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "generated-projects/**",
  "dashboard/src/**",
  "dashboard/tests/**",
  "db/**",
  "local-state/runtime/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
  "deploy/**",
  "release/**",
  "exports/**",
  "packages/**",
  ".env*",
]);

function collectRefs(...lists) {
  return [...new Set(lists.flatMap((value) => (Array.isArray(value) ? value.filter(Boolean).map(String) : [])))];
}

function disabledSafetyFlags() {
  return Object.fromEntries(P135_2_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

export function createAuthTenantModel(input = {}) {
  const identityContract = input.identityContract || createIdentitySessionContract({
    evidenceRefs: ["reports/p732-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P73.2"],
    nextAction: "Feed identity posture into the P135.2 auth and tenant model.",
  });
  const tenantBoundaryContract = input.tenantBoundaryContract || createTenantBoundaryContract({
    evidenceRefs: ["reports/p762-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P76.2"],
    nextAction: "Feed tenant boundary posture into the P135.2 auth and tenant model.",
  });
  const rbacMatrix = input.rbacMatrix || createRbacPermissionMatrix({
    identity: identityContract,
    evidenceRefs: ["reports/p733-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P73.3"],
    nextAction: "Feed RBAC posture into the P135.2 auth and tenant model.",
  });
  const safetyFlags = disabledSafetyFlags();

  return {
    authTenantModelId: input.authTenantModelId || "auth-tenant-model-readiness",
    modelState: "read_only_model_defined_not_executing",
    identityContract,
    tenantBoundaryContract,
    rbacMatrix,
    roleCatalog: [
      {
        roleLabel: "Owner",
        visibleResponsibility: "Review identity, tenant, and permission readiness.",
        assignmentState: "not_assignable",
        mutationAllowed: false,
      },
      {
        roleLabel: "Operator",
        visibleResponsibility: "Review governed work intake without changing access.",
        assignmentState: "not_assignable",
        mutationAllowed: false,
      },
      {
        roleLabel: "Viewer",
        visibleResponsibility: "Read readiness summaries only.",
        assignmentState: "not_assignable",
        mutationAllowed: false,
      },
      {
        roleLabel: "Auditor",
        visibleResponsibility: "Review evidence references and blocked-operation reasons.",
        assignmentState: "not_assignable",
        mutationAllowed: false,
      },
    ],
    tenantScopeCatalog: [
      {
        scopeLabel: "Organization boundary",
        isolationState: "metadata_defined_not_created",
        mutationAllowed: false,
      },
      {
        scopeLabel: "Workspace boundary",
        isolationState: "metadata_defined_not_created",
        mutationAllowed: false,
      },
      {
        scopeLabel: "Project boundary",
        isolationState: "metadata_defined_not_mutating",
        mutationAllowed: false,
      },
    ],
    sessionPolicy: {
      state: "session_policy_defined_not_active",
      loginAllowed: false,
      sessionCreationAllowed: false,
      sessionRefreshAllowed: false,
      tokenStorageAllowed: false,
    },
    authProviderPolicy: {
      state: "provider_policy_defined_not_connected",
      providerCallsAllowed: false,
      oauthAllowed: false,
      ssoAllowed: false,
      passwordFlowAllowed: false,
    },
    permissionPolicy: {
      state: "permission_model_defined_not_enforced",
      roleAssignmentAllowed: false,
      permissionGrantAllowed: false,
      permissionRevokeAllowed: false,
      permissionEnforcementAllowed: false,
    },
    safetyFlags,
    displayFields: [
      "model state",
      "identity posture",
      "tenant boundary posture",
      "role catalog",
      "session policy",
      "permission policy",
      "next action",
      "disabled reason",
    ],
    blockedOperations: [
      "Login, signup, logout, session creation, and session refresh",
      "Password, OAuth, SSO, token exchange, and auth provider calls",
      "Tenant, workspace, membership, user, role, and permission mutation",
      "Permission grants, revokes, and live enforcement",
      "DB writes and runtime state writes",
      "Provider, tool, worker, agent, project, deploy, release, export, package, network, and spend actions",
    ],
    disabledReason: "P135.2 records the auth and tenant model only; login, sessions, tenant writes, role assignment, permission grants, permission enforcement, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain disabled.",
    blockers: [
      "Auth providers are not connected.",
      "Sessions and token exchange are not active.",
      "Tenant, membership, user, role, and permission mutation remain blocked.",
      "Permission grants and enforcement remain blocked.",
      "DB/runtime writes remain blocked.",
      "Provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: collectRefs(
      identityContract.evidenceRefs,
      tenantBoundaryContract.evidenceRefs,
      rbacMatrix.evidenceRefs,
      ["reports/p1352-auth-tenant-model-report.md"],
    ),
    activityRefs: collectRefs(
      identityContract.activityRefs,
      tenantBoundaryContract.activityRefs,
      rbacMatrix.activityRefs,
      ["os-roadmap/phase-status.json#P135.2"],
    ),
    costImpact: "No auth provider calls, tenant service calls, DB service calls, provider calls, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.authTenantModelReadiness",
    nextAction: input.nextAction || "Route this read-only auth and tenant model into P135.3 Permission Preview.",
    commandCenterVisible: true,
  };
}

export function validateAuthTenantModel(model = {}) {
  const errors = [];
  for (const field of P135_2_REQUIRED_FIELDS) {
    if (!(field in model)) errors.push(`missing ${field}`);
  }

  const identityValidation = validateIdentitySessionContract(model.identityContract);
  const tenantValidation = validateTenantBoundaryContract(model.tenantBoundaryContract);
  const rbacValidation = validateRbacPermissionMatrix(model.rbacMatrix);
  if (!identityValidation.valid) errors.push(...identityValidation.errors.map((error) => `identity: ${error}`));
  if (!tenantValidation.valid) errors.push(...tenantValidation.errors.map((error) => `tenant: ${error}`));
  if (!rbacValidation.valid) errors.push(...rbacValidation.errors.map((error) => `rbac: ${error}`));

  for (const flag of P135_2_SAFETY_FLAG_NAMES) {
    if (model.safetyFlags?.[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (model.sessionPolicy?.loginAllowed !== false || model.sessionPolicy?.sessionCreationAllowed !== false || model.sessionPolicy?.sessionRefreshAllowed !== false || model.sessionPolicy?.tokenStorageAllowed !== false) errors.push("session policy must remain disabled");
  if (model.authProviderPolicy?.providerCallsAllowed !== false || model.authProviderPolicy?.oauthAllowed !== false || model.authProviderPolicy?.ssoAllowed !== false || model.authProviderPolicy?.passwordFlowAllowed !== false) errors.push("auth provider policy must remain disabled");
  if (model.permissionPolicy?.roleAssignmentAllowed !== false || model.permissionPolicy?.permissionGrantAllowed !== false || model.permissionPolicy?.permissionRevokeAllowed !== false || model.permissionPolicy?.permissionEnforcementAllowed !== false) errors.push("permission policy must remain disabled");
  if (!Array.isArray(model.roleCatalog) || model.roleCatalog.length < 4 || model.roleCatalog.some((role) => role.mutationAllowed !== false)) errors.push("role catalog must be display-only");
  if (!Array.isArray(model.tenantScopeCatalog) || model.tenantScopeCatalog.length < 3 || model.tenantScopeCatalog.some((scope) => scope.mutationAllowed !== false)) errors.push("tenant scope catalog must be display-only");
  if (!Array.isArray(model.blockedOperations) || model.blockedOperations.length < 6) errors.push("blocked operations must be visible");
  if (!Array.isArray(model.blockers) || model.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(model.forbiddenFiles) || !["projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => model.forbiddenFiles.includes(path))) errors.push("forbidden files must include project, DB, runtime, provider, tool, and worker paths");
  if (!Array.isArray(model.evidenceRefs) || model.evidenceRefs.length < 4) errors.push("evidence refs must include source and P135.2 evidence");
  if (!Array.isArray(model.activityRefs) || model.activityRefs.length < 4) errors.push("activity refs must include source and P135.2 activity");
  if (!model.costImpact?.includes("No auth provider calls")) errors.push("cost impact must be visible");
  if (!model.disabledReason || /login now|sign in now|create tenant now|assign role now|grant permission now|enforce permission now|connect provider now|execute now/i.test(model.disabledReason)) errors.push("disabled reason must not imply runnable behavior");
  return { valid: errors.length === 0, errors };
}

export function buildAuthTenantModelEnvelope(input = {}) {
  const model = createAuthTenantModel(input);
  return createPassResult({
    phase: "P135.2",
    mode: "read-only-model",
    source: "auth-governance/p135-2-auth-tenant-model.js",
    summary: "Auth and tenant model recorded without enabling login, sessions, tenant writes, role assignment, permission grants, permission enforcement, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    data: { model },
    evidence: model.evidenceRefs,
  });
}

export const P135_2_SAMPLE_MODELS = Object.freeze([
  createAuthTenantModel({
    evidenceRefs: ["reports/p1352-auth-tenant-model-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P135.2"],
  }),
]);
