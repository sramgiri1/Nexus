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
  liveapi: ["Overview", "Endpoints", "Action Bridges", "Diagnostics"],
  database: ["Overview", "Entities", "Import Plan", "Fallback", "Developer Details"],
  evidence: ["Timeline", "By Task", "By Agent", "By Project", "Developer Details"],
  safety: ["Posture", "Policy Blocks", "Approvals", "Data & Privacy", "Developer Details"],
  projects: ["Portfolio", "Active Project", "Adapter", "Milestones", "Gaps"],
  roadmap: ["Current", "Completed", "Planned", "Blocked / Risks", "History"],
  cost: ["Overview", "Budgets", "By Project", "By Agent", "Provider Spend"],
  batch: ["Overview", "Jobs", "Results", "Cost"],
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
    id: "all-projects",
    label: "All Projects",
    description: "Portfolio placeholder for cross-project task aggregation",
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
  {
    id: "developer-details",
    label: "Developer Details",
    description: "Raw paths, policy IDs, contract IDs, and internal metadata",
    badge: "Read-only",
  },
];

export const LIVE_API_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Online/offline state, source, last refresh, and fallback posture",
    badge: "Ready",
  },
  {
    id: "endpoints",
    label: "Endpoints",
    description: "Endpoint groups by mission, tasks, agents, evidence, runtime, safety, roadmap, and DB",
    badge: "Read-only",
  },
  {
    id: "action-bridges",
    label: "Action Bridges",
    description: "Mission, task, review, and implementation bridge readiness",
    badge: "Guarded",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    description: "Localhost, port, troubleshooting, and developer details",
    badge: "Ready",
  },
];

export const DURABLE_STATE_TABS = [
  { id: "overview", label: "Overview", description: "File-backed persistence and DB write posture", badge: "Ready" },
  { id: "entities", label: "Entities", description: "Entity coverage, mapped sources, and readiness", badge: "Read-only" },
  { id: "import-plan", label: "Import Plan", description: "Dry-run import state and missing mappings", badge: "Read-only" },
  { id: "fallback", label: "Fallback", description: "File fallback, snapshot fallback, and DB-primary limitations", badge: "Ready" },
  { id: "developer-details", label: "Developer Details", description: "Policy keys and config summaries only", badge: "Read-only" },
];

export const EVIDENCE_TABS = [
  { id: "timeline", label: "Timeline", description: "Latest evidence events", badge: "Read-only" },
  { id: "by-task", label: "By Task", description: "Evidence grouped by task and action", badge: "Read-only" },
  { id: "by-agent", label: "By Agent", description: "Evidence grouped by agent and source", badge: "Read-only" },
  { id: "by-project", label: "By Project", description: "Project-scoped evidence or start-project guidance", badge: "Read-only" },
  { id: "developer-details", label: "Developer Details", description: "IDs and linked paths only; no raw payloads", badge: "Read-only" },
];

export const SAFETY_CENTER_TABS = [
  { id: "posture", label: "Posture", description: "Current risk posture and safety boundary summary", badge: "Ready" },
  { id: "policy-blocks", label: "Policy Blocks", description: "Blocked or disabled capabilities", badge: "Ready" },
  { id: "approvals", label: "Approvals", description: "Pending, approved, and rejected approvals if available", badge: "Read-only" },
  { id: "data-privacy", label: "Data & Privacy", description: "Public, demo, and private data boundaries", badge: "Ready" },
  { id: "developer-details", label: "Developer Details", description: "Policy IDs and keys only; no raw policy JSON", badge: "Read-only" },
];

export const PROJECTS_TABS = [
  { id: "portfolio", label: "Portfolio", description: "Multi-project placeholder and summary", badge: "Planned" },
  { id: "active-project", label: "Active Project", description: "Selected project or Start Project guidance", badge: "Ready" },
  { id: "adapter", label: "Adapter", description: "Project adapter status and P42 Project Registry plan", badge: "Planned" },
  { id: "milestones", label: "Milestones", description: "Project milestones, not OS phases", badge: "Read-only" },
  { id: "gaps", label: "Gaps", description: "Open project gaps", badge: "Read-only" },
];

export const OS_ROADMAP_TABS = [
  { id: "current", label: "Current", description: "Current NEXUS OS phase and subphase", badge: "Current" },
  { id: "completed", label: "Completed", description: "Completed OS phases and subphases", badge: "Ready" },
  { id: "planned", label: "Planned", description: "Planned OS phases and subphases", badge: "Planned" },
  { id: "blocked-risks", label: "Blocked / Risks", description: "Blockers and known limitations", badge: "Read-only" },
  { id: "history", label: "History", description: "Branch, commit, and checks when available", badge: "Read-only" },
];

export const COST_CENTER_TABS = [
  { id: "overview", label: "Overview", description: "Cost enforcement status", badge: "Planned" },
  { id: "budgets", label: "Budgets", description: "Project, agent, and tool budget placeholders", badge: "Planned" },
  { id: "by-project", label: "By Project", description: "Future project cost breakdown", badge: "Planned" },
  { id: "by-agent", label: "By Agent", description: "Future agent cost breakdown", badge: "Planned" },
  { id: "provider-spend", label: "Provider Spend", description: "Provider spend status; dispatch not enabled", badge: "Disabled" },
];

export const BATCH_QUEUE_TABS = [
  { id: "overview", label: "Overview", description: "Batch status and not-enabled state", badge: "Planned" },
  { id: "jobs", label: "Jobs", description: "Future batch job list", badge: "Planned" },
  { id: "results", label: "Results", description: "Future results and reconciliation", badge: "Planned" },
  { id: "cost", label: "Cost", description: "Future batch savings and cost status", badge: "Planned" },
];

export function getTabsForPage(pageId) {
  if (pageId === "mission") return MISSION_CONTROL_TABS;
  if (pageId === "workspace") return WORKSPACE_TABS;
  if (pageId === "tasks") return TASK_QUEUE_TABS;
  if (pageId === "workbench") return WORKBENCH_TABS;
  if (pageId === "implementation") return IMPLEMENTATION_TABS;
  if (pageId === "liveapi") return LIVE_API_TABS;
  if (pageId === "database") return DURABLE_STATE_TABS;
  if (pageId === "evidence") return EVIDENCE_TABS;
  if (pageId === "safety") return SAFETY_CENTER_TABS;
  if (pageId === "projects") return PROJECTS_TABS;
  if (pageId === "roadmap") return OS_ROADMAP_TABS;
  if (pageId === "cost") return COST_CENTER_TABS;
  if (pageId === "batch") return BATCH_QUEUE_TABS;
  return (PAGE_TAB_PLANS[pageId] || []).map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    label,
    description: `${label} section planned for a future tab rollout.`,
    disabled: true,
    disabledReason: "Tabbed rollout is planned for a later P41.7 subphase.",
    badge: "Planned",
  }));
}
