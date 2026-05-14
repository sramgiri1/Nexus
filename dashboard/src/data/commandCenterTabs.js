export const MISSION_CONTROL_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Mission summary and next action",
    badge: "Ready",
  },
  {
    id: "workflows",
    label: "Workflows",
    description: "Plan, build, validate, govern, and release options",
    badge: "Ready",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Planned and activated work",
    badge: "Ready",
  },
  {
    id: "agents",
    label: "Agents",
    description: "Owners, assignments, and utilization",
    badge: "Ready",
  },
  {
    id: "gates",
    label: "Gates",
    description: "AUDITOR, SENTINEL, WARDEN, and release blockers",
    badge: "Ready",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Evidence timeline and proof records",
    badge: "Read-only",
  },
  {
    id: "risks",
    label: "Risks / Approvals",
    description: "Safety, blockers, approvals, and policy status",
    badge: "Ready",
  },
  {
    id: "cost",
    label: "Cost",
    description: "Spend, budget status, and cost limitations",
    badge: "Planned",
  },
];

export const PAGE_TAB_PLANS = {
  workspace: ["Overview", "Templates", "Recommendations", "Limitations"],
  tasks: ["Queue", "Activation", "Evidence", "Blocked"],
  workbench: ["Review", "Output", "Evidence", "Decision"],
  implementation: ["Proposal", "Validation", "Apply", "Rollback"],
  liveapi: ["Status", "Endpoints", "Fallbacks", "Troubleshooting"],
  database: ["Posture", "Schema", "Import Plan", "Limitations"],
  evidence: ["Timeline", "Audit", "Runtime", "Redactions"],
  safety: ["Boundary", "Policies", "Incidents", "Approvals"],
  projects: ["Progress", "Milestones", "Gaps", "Registry Planned"],
  roadmap: ["Current", "Completed", "Planned", "Open Gaps"],
};

export const WORKSPACE_TABS = [
  {
    id: "recommended",
    label: "Recommended",
    description: "Next best action, recommended workflows, and active scope",
    badge: "Ready",
  },
  {
    id: "plan",
    label: "Plan",
    description: "Mission, sprint, PRD, and product planning workflows",
    badge: "Ready",
  },
  {
    id: "build",
    label: "Build",
    description: "Scoped build and remediation workflows",
    badge: "Ready",
  },
  {
    id: "validate",
    label: "Validate",
    description: "Backend, iOS, and QA validation workflows",
    badge: "Read-only",
  },
  {
    id: "govern",
    label: "Govern",
    description: "Agent work governance, privacy review, and approvals",
    badge: "Ready",
  },
  {
    id: "release",
    label: "Release",
    description: "Release readiness and ship-gate workflows",
    badge: "Planned",
  },
  {
    id: "all",
    label: "All Workflows",
    description: "All workflow cards grouped by operator intent",
    badge: "Ready",
  },
];

export const TASK_QUEUE_TABS = [
  {
    id: "planned",
    label: "Planned",
    description: "Planned mission tasks and activation readiness",
    badge: "Ready",
  },
  {
    id: "active",
    label: "Active",
    description: "Queued, running, and active runtime tasks",
    badge: "Ready",
  },
  {
    id: "review",
    label: "Review",
    description: "Tasks awaiting operator or auditor review",
    badge: "Read-only",
  },
  {
    id: "blocked",
    label: "Blocked",
    description: "Tasks blocked by policy, approvals, or validation",
    badge: "Ready",
  },
  {
    id: "completed",
    label: "Completed",
    description: "Completed work and evidence summaries",
    badge: "Ready",
  },
  {
    id: "all",
    label: "All Tasks",
    description: "Unified planned and runtime task view",
    badge: "Ready",
  },
];

export const WORKBENCH_TABS = [
  {
    id: "task",
    label: "Task",
    description: "Selected activated task, owner, state, risk, and blockers",
    badge: "Ready",
  },
  {
    id: "review",
    label: "Review",
    description: "Human review controls and current review status",
    badge: "Ready",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Redacted task evidence and proof references",
    badge: "Read-only",
  },
  {
    id: "activity",
    label: "Activity",
    description: "Task-related audit and runtime activity",
    badge: "Read-only",
  },
  {
    id: "context",
    label: "Context",
    description: "Task contract, allowed scope, and forbidden scope",
    badge: "Ready",
  },
];

export const IMPLEMENTATION_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Implementation status, scope, owner, and next action",
    badge: "Ready",
  },
  {
    id: "proposal",
    label: "Proposal",
    description: "Proposal summary, allowed path, risk, and developer details",
    badge: "Ready",
  },
  {
    id: "apply",
    label: "Apply",
    description: "Controlled change application state and disabled reasons",
    badge: "Guarded",
  },
  {
    id: "validation",
    label: "Validation",
    description: "Validation plan, status, and evidence created by apply",
    badge: "Read-only",
  },
  {
    id: "rollback",
    label: "Rollback",
    description: "Rollback note and recovery posture",
    badge: "Read-only",
  },
  {
    id: "activity",
    label: "Activity",
    description: "Implementation events, evidence, and audit summaries",
    badge: "Read-only",
  },
];

export function getTabsForPage(pageId) {
  if (pageId === "mission") return MISSION_CONTROL_TABS;
  if (pageId === "workspace") return WORKSPACE_TABS;
  if (pageId === "tasks") return TASK_QUEUE_TABS;
  if (pageId === "workbench") return WORKBENCH_TABS;
  if (pageId === "implementation") return IMPLEMENTATION_TABS;
  return (PAGE_TAB_PLANS[pageId] || []).map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    label,
    description: `${label} section planned for a future tab rollout.`,
    disabled: true,
    disabledReason: "Tabbed rollout is planned for a later P41.7 subphase.",
    badge: "Planned",
  }));
}
