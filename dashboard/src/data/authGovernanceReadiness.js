import { createMultiUserWorkspaceBoundary } from "../../../auth-governance/p73-4-placeholder.js";

const boundary = createMultiUserWorkspaceBoundary({
  nextAction: "Keep auth governance display-only until governed identity and role mutation are explicitly approved.",
});

export function buildAuthGovernanceReadinessViewModel() {
  return {
    routeId: "auth-governance-readiness",
    pageTitle: "Auth Governance",
    whatChanged: "Identity, RBAC, and workspace governance readiness are visible in Command Center.",
    currentState: "Display-only governance readiness; auth mutation remains disabled.",
    nextAction: boundary.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS Auth Governance",
    evidenceLocation: "reports/command-center-auth-governance-ux-report.md",
    activityLocation: "os-roadmap/phase-status.json auth governance entry",
    costImpact: boundary.costImpact,
    disabledReason: "Auth governance is display-only; login, role changes, tenant changes, workspace changes, and session mutation remain disabled.",
    readinessCards: [
      { label: "Identity mode", value: "Local preview", tone: "amber", detail: "No identity provider is connected." },
      { label: "Role posture", value: "Display-only", tone: "teal", detail: "Roles are visible for review, not assignment." },
      { label: "Workspace boundary", value: "Preview", tone: "teal", detail: "Tenant and workspace records are not created." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No provider, network, DB, or identity calls are made." },
    ],
    governanceRows: [
      { label: "Login", value: "Disabled" },
      { label: "Identity provider calls", value: "Disabled" },
      { label: "Token exchange", value: "Disabled" },
      { label: "Role and permission changes", value: "Disabled" },
      { label: "Tenant and workspace changes", value: "Disabled" },
      { label: "DB writes", value: "Disabled" },
    ],
    blockers: boundary.blockers.slice(0, 6),
    disabledActions: [
      { label: "Sign in", reason: "Login is not enabled." },
      { label: "Assign role", reason: "Role mutation is not enabled." },
      { label: "Workspace creation", reason: "Workspace mutation is not enabled." },
      { label: "User invitation", reason: "User and tenant mutation are not enabled." },
    ],
    safety: {
      loginAllowed: boundary.loginAllowed,
      roleMutationAllowed: boundary.roleMutationAllowed,
      workspaceMutationAllowed: boundary.workspaceMutationAllowed,
      tenantMutationAllowed: boundary.tenantMutationAllowed,
      dbWritesAllowed: boundary.dbWritesAllowed,
      providerSpendAllowed: boundary.providerSpendAllowed,
    },
  };
}

export const authGovernanceReadinessViewModel = buildAuthGovernanceReadinessViewModel();
