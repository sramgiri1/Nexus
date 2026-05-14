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

export function getTabsForPage(pageId) {
  if (pageId === "mission") return MISSION_CONTROL_TABS;
  return (PAGE_TAB_PLANS[pageId] || []).map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    label,
    description: `${label} section planned for a future tab rollout.`,
    disabled: true,
    disabledReason: "Tabbed rollout is planned for a later P41.7 subphase.",
    badge: "Planned",
  }));
}
