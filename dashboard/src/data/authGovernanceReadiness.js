import { createPermissionPreview } from "../../../auth-governance/p135-3-permission-preview.js";

const permissionPreview = createPermissionPreview({
  nextAction: "Review governed identity, role, tenant, and permission readiness before any live auth authority is approved.",
});

function toStatusDetail(row, stateFallback) {
  return row.previewState || row.permissionState || row.previewDecision || stateFallback;
}

export function buildAuthGovernanceReadinessViewModel() {
  const roleAccessRows = permissionPreview.rolePreviewRows.map((row) => ({
    label: row.roleLabel,
    responsibility: row.visibleResponsibility,
    state: "Visible, not assignable",
    detail: toStatusDetail(row, "display_only"),
    disabledReason: "Role assignment and role mutation remain disabled.",
  }));

  const tenantScopeRows = permissionPreview.tenantScopePreviewRows.map((row) => ({
    label: row.scopeLabel,
    state: "Visible, not authoritative",
    detail: row.isolationState,
    disabledReason: "Tenant, workspace, membership, and access mutation remain disabled.",
  }));

  const commandCenterSurfaceRows = permissionPreview.commandCenterSurfaceRows.map((row) => ({
    label: row.surfaceLabel,
    purpose: row.previewPurpose,
    state: "Display-only",
    disabledReason: "Permission grants and enforcement are not connected to this surface.",
  }));

  const sensitiveWorkflowRows = permissionPreview.sensitiveWorkflowRows.map((row) => ({
    label: row.workflowLabel,
    requiredGate: row.requiredFutureGate,
    state: "Blocked",
    disabledReason: "This workflow cannot execute until live authority gates are explicitly approved.",
  }));

  return {
    routeId: "auth-governance-readiness",
    pageTitle: "Auth Governance",
    whatChanged: "Identity, role, tenant-scope, permission, and sensitive workflow posture now use the latest local governance preview.",
    currentState: "Review-only governance posture; login, role assignment, permission grants, and access enforcement remain disabled.",
    nextAction: permissionPreview.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS Auth Governance",
    evidenceLocation: "Auth governance UX evidence report",
    activityLocation: "OS phase status auth governance record",
    costImpact: permissionPreview.costImpact,
    disabledReason: "Auth governance is display-only; login, token exchange, role changes, permission grants, tenant changes, workspace changes, session mutation, DB writes, runtime writes, provider calls, and spend remain disabled.",
    readinessCards: [
      { label: "Identity mode", value: "Local review", tone: "teal", detail: "Founder identity is visible as local operator context only." },
      { label: "Role posture", value: "Not assignable", tone: "amber", detail: "Roles explain responsibility but cannot be assigned from Command Center." },
      { label: "Workspace boundary", value: "Display-only", tone: "teal", detail: "Tenant and workspace scope is visible without creating records." },
      { label: "Permission posture", value: "Not enforced", tone: "amber", detail: "Permission rows are preview data, not live authorization decisions." },
    ],
    roleAccessRows,
    tenantScopeRows,
    commandCenterSurfaceRows,
    sensitiveWorkflowRows,
    governanceRows: [
      { label: "Login and sessions", value: "Disabled" },
      { label: "Identity provider calls", value: "Disabled" },
      { label: "Token exchange", value: "Disabled" },
      { label: "Role assignment", value: "Disabled" },
      { label: "Permission grants and revokes", value: "Disabled" },
      { label: "Permission enforcement", value: "Disabled" },
      { label: "Tenant and workspace changes", value: "Disabled" },
      { label: "DB and runtime writes", value: "Disabled" },
    ],
    blockers: permissionPreview.blockers.slice(0, 6),
    blockedOperations: permissionPreview.blockedOperations,
    disabledActions: [
      { label: "Sign in", reason: "Login and session creation are not enabled." },
      { label: "Assign role", reason: "Role assignment is not enabled." },
      { label: "Grant permission", reason: "Permission grants and revokes are not enabled." },
      { label: "Enforce access", reason: "Permission enforcement and access decisions are not live authority." },
      { label: "Create tenant", reason: "Tenant, workspace, membership, and user mutation are not enabled." },
      { label: "Connect provider", reason: "Auth provider calls and token exchange are not enabled." },
    ],
    safety: {
      loginAllowed: permissionPreview.safetyFlags.loginAllowed,
      roleMutationAllowed: permissionPreview.safetyFlags.roleAssignmentAllowed,
      roleAssignmentAllowed: permissionPreview.safetyFlags.roleAssignmentAllowed,
      permissionGrantAllowed: permissionPreview.safetyFlags.permissionGrantAllowed,
      permissionRevokeAllowed: permissionPreview.safetyFlags.permissionRevokeAllowed,
      permissionMutationAllowed: permissionPreview.safetyFlags.permissionMutationAllowed,
      permissionEnforcementAllowed: permissionPreview.safetyFlags.permissionEnforcementAllowed,
      accessDecisionAllowed: permissionPreview.safetyFlags.accessDecisionAllowed,
      workspaceMutationAllowed: permissionPreview.safetyFlags.membershipMutationAllowed,
      tenantMutationAllowed: permissionPreview.safetyFlags.tenantMutationAllowed,
      sessionMutationAllowed: permissionPreview.safetyFlags.sessionMutationAllowed,
      authProviderCallsAllowed: permissionPreview.safetyFlags.authProviderCallsAllowed,
      tokenExchangeAllowed: permissionPreview.safetyFlags.tokenExchangeAllowed,
      dbWritesAllowed: permissionPreview.safetyFlags.dbWritesAllowed,
      runtimeWritesAllowed: permissionPreview.safetyFlags.runtimeWritesAllowed,
      providerSpendAllowed: permissionPreview.safetyFlags.providerSpendAllowed,
    },
  };
}

export const authGovernanceReadinessViewModel = buildAuthGovernanceReadinessViewModel();
