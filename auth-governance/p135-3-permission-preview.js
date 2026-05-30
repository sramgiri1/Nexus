import { createPassResult } from "../shared/resultEnvelope.js";
import {
  createAuthTenantModel,
  validateAuthTenantModel,
} from "./p135-2-auth-tenant-model.js";

export const P135_3_REQUIRED_FIELDS = Object.freeze([
  "permissionPreviewId",
  "previewState",
  "authTenantModel",
  "rolePreviewRows",
  "tenantScopePreviewRows",
  "commandCenterSurfaceRows",
  "sensitiveWorkflowRows",
  "permissionPreviewPolicy",
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

export const P135_3_SAFETY_FLAG_NAMES = Object.freeze([
  "loginAllowed",
  "roleAssignmentAllowed",
  "permissionGrantAllowed",
  "permissionRevokeAllowed",
  "permissionMutationAllowed",
  "permissionEnforcementAllowed",
  "accessDecisionAllowed",
  "tenantMutationAllowed",
  "membershipMutationAllowed",
  "userMutationAllowed",
  "sessionMutationAllowed",
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

function disabledSafetyFlags() {
  return Object.fromEntries(P135_3_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

export function createPermissionPreview(input = {}) {
  const authTenantModel = input.authTenantModel || createAuthTenantModel({
    nextAction: "Route this auth and tenant model into P135.3 permission preview.",
  });
  const safetyFlags = disabledSafetyFlags();

  return {
    permissionPreviewId: input.permissionPreviewId || "permission-preview-readiness",
    previewState: "preview_defined_not_authoritative",
    authTenantModel,
    rolePreviewRows: authTenantModel.roleCatalog.map((role) => ({
      roleLabel: role.roleLabel,
      visibleResponsibility: role.visibleResponsibility,
      previewState: "display_only_not_assignable",
      assignmentAllowed: false,
      mutationAllowed: false,
      enforcementAllowed: false,
    })),
    tenantScopePreviewRows: authTenantModel.tenantScopeCatalog.map((scope) => ({
      scopeLabel: scope.scopeLabel,
      isolationState: scope.isolationState,
      previewState: "display_only_not_authoritative",
      accessDecisionAllowed: false,
      mutationAllowed: false,
      enforcementAllowed: false,
    })),
    commandCenterSurfaceRows: [
      {
        surfaceLabel: "Chat with NEXUS",
        previewPurpose: "Founder conversation visibility only.",
        permissionState: "not_enforced",
        mutationAllowed: false,
        grantAllowed: false,
        enforcementAllowed: false,
      },
      {
        surfaceLabel: "Business Build",
        previewPurpose: "Local PRD and workstream planning visibility only.",
        permissionState: "not_enforced",
        mutationAllowed: false,
        grantAllowed: false,
        enforcementAllowed: false,
      },
      {
        surfaceLabel: "Agent Flow",
        previewPurpose: "Agent lane planning visibility only.",
        permissionState: "not_enforced",
        mutationAllowed: false,
        grantAllowed: false,
        enforcementAllowed: false,
      },
      {
        surfaceLabel: "Auth Governance",
        previewPurpose: "Governance readiness visibility only.",
        permissionState: "not_enforced",
        mutationAllowed: false,
        grantAllowed: false,
        enforcementAllowed: false,
      },
    ],
    sensitiveWorkflowRows: [
      {
        workflowLabel: "Agent dispatch",
        requiredFutureGate: "operator approval and work-order runtime",
        previewDecision: "blocked",
        executionAllowed: false,
      },
      {
        workflowLabel: "Project mutation",
        requiredFutureGate: "workspace mutation approval",
        previewDecision: "blocked",
        executionAllowed: false,
      },
      {
        workflowLabel: "DB/runtime write",
        requiredFutureGate: "durable write approval and persistence gate",
        previewDecision: "blocked",
        executionAllowed: false,
      },
      {
        workflowLabel: "Deploy, release, export, or package",
        requiredFutureGate: "release pipeline approval",
        previewDecision: "blocked",
        executionAllowed: false,
      },
    ],
    permissionPreviewPolicy: {
      state: "preview_only_not_authorization",
      previewOnly: true,
      grantsAllowed: false,
      revokesAllowed: false,
      enforcementAllowed: false,
      accessDecisionAllowed: false,
    },
    safetyFlags,
    displayFields: [
      "preview state",
      "role preview rows",
      "tenant scope preview rows",
      "Command Center surface rows",
      "sensitive workflow rows",
      "blocked operations",
      "disabled reason",
      "next action",
    ],
    blockedOperations: [
      "Role assignment, role mutation, permission mutation, permission grants, and permission revokes",
      "Permission enforcement and access decisions as live authority",
      "Login, sessions, token exchange, and auth provider calls",
      "Tenant, membership, workspace, and user mutation",
      "DB writes and runtime state writes",
      "Provider, tool, worker, agent, project, deploy, release, export, package, network, and spend actions",
    ],
    disabledReason: "P135.3 records permission previews only; role assignment, permission grants, permission revokes, permission enforcement, access decisions as live authority, login, sessions, tenant writes, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain disabled.",
    blockers: [
      "Permission preview is not an authorization engine.",
      "Role assignment and permission grants remain blocked.",
      "Access decisions are not live authority.",
      "Login, sessions, token exchange, and auth provider calls remain blocked.",
      "Tenant, membership, workspace, user, DB, and runtime writes remain blocked.",
      "Provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [
      ...new Set([
        ...(Array.isArray(authTenantModel.evidenceRefs) ? authTenantModel.evidenceRefs : []),
        "reports/p1353-permission-preview-report.md",
      ]),
    ],
    activityRefs: [
      ...new Set([
        ...(Array.isArray(authTenantModel.activityRefs) ? authTenantModel.activityRefs : []),
        "os-roadmap/phase-status.json#P135.3",
      ]),
    ],
    costImpact: "No auth provider calls, permission service calls, DB service calls, provider calls, network calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.permissionPreviewReadiness",
    nextAction: input.nextAction || "Route this permission preview into P135.4 Auth Governance Command Center UX.",
    commandCenterVisible: true,
  };
}

export function validatePermissionPreview(preview = {}) {
  const errors = [];
  for (const field of P135_3_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  const authValidation = validateAuthTenantModel(preview.authTenantModel);
  if (!authValidation.valid) errors.push(...authValidation.errors.map((error) => `authTenantModel: ${error}`));
  for (const flag of P135_3_SAFETY_FLAG_NAMES) {
    if (preview.safetyFlags?.[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (preview.permissionPreviewPolicy?.previewOnly !== true) errors.push("permission preview must be explicitly preview-only");
  if (preview.permissionPreviewPolicy?.grantsAllowed !== false || preview.permissionPreviewPolicy?.revokesAllowed !== false || preview.permissionPreviewPolicy?.enforcementAllowed !== false || preview.permissionPreviewPolicy?.accessDecisionAllowed !== false) errors.push("permission preview policy must not grant, revoke, enforce, or decide access");
  if (!Array.isArray(preview.rolePreviewRows) || preview.rolePreviewRows.length < 4 || preview.rolePreviewRows.some((row) => row.assignmentAllowed !== false || row.mutationAllowed !== false || row.enforcementAllowed !== false)) errors.push("role preview rows must be display-only");
  if (!Array.isArray(preview.tenantScopePreviewRows) || preview.tenantScopePreviewRows.length < 3 || preview.tenantScopePreviewRows.some((row) => row.accessDecisionAllowed !== false || row.mutationAllowed !== false || row.enforcementAllowed !== false)) errors.push("tenant scope preview rows must be display-only");
  if (!Array.isArray(preview.commandCenterSurfaceRows) || preview.commandCenterSurfaceRows.length < 4 || preview.commandCenterSurfaceRows.some((row) => row.mutationAllowed !== false || row.grantAllowed !== false || row.enforcementAllowed !== false)) errors.push("Command Center surface rows must be display-only");
  if (!Array.isArray(preview.sensitiveWorkflowRows) || preview.sensitiveWorkflowRows.length < 4 || preview.sensitiveWorkflowRows.some((row) => row.executionAllowed !== false)) errors.push("sensitive workflow rows must remain blocked");
  if (!Array.isArray(preview.blockedOperations) || preview.blockedOperations.length < 6) errors.push("blocked operations must be visible");
  if (!Array.isArray(preview.blockers) || preview.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(preview.forbiddenFiles) || !["projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => preview.forbiddenFiles.includes(path))) errors.push("forbidden files must include project, DB, runtime, provider, tool, and worker paths");
  if (!Array.isArray(preview.evidenceRefs) || !preview.evidenceRefs.includes("reports/p1353-permission-preview-report.md")) errors.push("P135.3 evidence must be visible");
  if (!Array.isArray(preview.activityRefs) || !preview.activityRefs.includes("os-roadmap/phase-status.json#P135.3")) errors.push("P135.3 activity must be visible");
  if (!preview.costImpact?.includes("No auth provider calls")) errors.push("cost impact must be visible");
  if (!preview.disabledReason || /assign role now|grant permission now|revoke permission now|enforce permission now|allow access now|login now|execute now/i.test(preview.disabledReason)) errors.push("disabled reason must not imply runnable behavior");
  return { valid: errors.length === 0, errors };
}

export function buildPermissionPreviewEnvelope(input = {}) {
  const preview = createPermissionPreview(input);
  return createPassResult({
    phase: "P135.3",
    mode: "preview-only",
    source: "auth-governance/p135-3-permission-preview.js",
    summary: "Permission preview recorded without enabling role assignment, permission grants, permission revokes, permission enforcement, access decisions as authority, login, sessions, tenant writes, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P135_3_SAMPLE_PREVIEWS = Object.freeze([
  createPermissionPreview({
    evidenceRefs: ["reports/p1353-permission-preview-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P135.3"],
  }),
]);
