import { createAccessContextPacketPreview } from "../../../isolation/p76-4-placeholder.js";

const packet = createAccessContextPacketPreview({
  nextAction: "Keep isolation readiness display-only until tenant, project, and access mutation are explicitly approved.",
});

export function buildIsolationReadinessViewModel() {
  return {
    routeId: "isolation-readiness",
    pageTitle: "Isolation",
    whatChanged: "Tenant boundary, project scope, and access context readiness are visible in Command Center.",
    currentState: "Display-only isolation readiness; tenant, project, access, role, permission, and workspace mutation remain disabled.",
    nextAction: packet.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS Isolation Readiness",
    evidenceLocation: "reports/command-center-isolation-ux-report.md",
    activityLocation: "os-roadmap/phase-status.json isolation entry",
    costImpact: packet.costImpact,
    disabledReason: "Isolation readiness is display-only; tenant mutation, project mutation, access grants, role changes, permission changes, DB writes, network calls, and provider spend remain disabled.",
    readinessCards: [
      { label: "Tenant posture", value: "Boundary ready", tone: "teal", detail: "Tenant boundary contracts are defined without tenant mutation." },
      { label: "Project isolation", value: "Preview", tone: "amber", detail: "Project scope is visible without project mutation or cross-project access." },
      { label: "Access context", value: "Safety gated", tone: "amber", detail: "Access context packets are blocked until an explicit runtime phase." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No tenant, project, access, DB, network, or provider calls are made." },
    ],
    postureRows: [
      { label: "Tenant mutation", value: "Disabled" },
      { label: "Project mutation", value: "Disabled" },
      { label: "Cross-project access", value: "Disabled" },
      { label: "Access grants", value: "Disabled" },
      { label: "Role mutation", value: "Disabled" },
      { label: "Permission mutation", value: "Disabled" },
      { label: "DB writes", value: "Disabled" },
      { label: "Network calls", value: "Disabled" },
    ],
    accessRows: [
      { label: "Tenant boundary", currentState: "Display-only", executionState: "disabled" },
      { label: "Project scope", currentState: "Display-only", executionState: "disabled" },
      { label: "Access grants", currentState: "Disabled", executionState: "not executable" },
      { label: "Approval gate", currentState: "Required", executionState: "blocked" },
    ],
    blockers: packet.blockers.slice(0, 6),
    disabledActions: [
      { label: "Tenant mutation", reason: "Tenant creation, update, and delete are not enabled." },
      { label: "Project mutation", reason: "Project creation, update, delete, and cross-project access are not enabled." },
      { label: "Access grants", reason: "Access grants are not enabled." },
      { label: "Role or permission changes", reason: "Role, permission, and membership mutation are not enabled." },
    ],
    safety: {
      tenantMutationAllowed: packet.tenantMutationAllowed,
      projectMutationAllowed: packet.projectMutationAllowed,
      crossProjectAccessAllowed: packet.crossProjectAccessAllowed,
      accessGrantAllowed: packet.accessGrantAllowed,
      roleMutationAllowed: packet.roleMutationAllowed,
      permissionMutationAllowed: packet.permissionMutationAllowed,
      membershipMutationAllowed: packet.membershipMutationAllowed,
      dbWritesAllowed: packet.dbWritesAllowed,
      networkCallsAllowed: packet.networkCallsAllowed,
      providerSpendAllowed: packet.providerSpendAllowed,
    },
  };
}

export const isolationReadinessViewModel = buildIsolationReadinessViewModel();
