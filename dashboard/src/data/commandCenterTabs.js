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
  projects: ["Portfolio", "Selected Project", "Stack", "Capabilities", "Milestones", "Gaps", "Evidence", "Settings / Adapter"],
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

export const SKILL_REGISTRY_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Registry posture, safety boundaries, and current counts",
    badge: "Read-only",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Registered skill definitions and owner agents",
    badge: "Ready",
  },
  {
    id: "by-agent",
    label: "By Agent",
    description: "Skill ownership grouped by NEXUS agent",
    badge: "Read-only",
  },
  {
    id: "by-project-stack",
    label: "By Project / Stack",
    description: "Stack-specific compatibility profiles",
    badge: "Read-only",
  },
  {
    id: "test-requirements",
    label: "Test Requirements",
    description: "Static, contract, UI, evidence, and future runtime checks",
    badge: "Ready",
  },
  {
    id: "developer-details",
    label: "Developer Details",
    description: "Registry files, reports, policy, and docs references",
    badge: "Read-only",
  },
];

export const AGENT_ROOMS_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Governed mesh posture, safety boundaries, and coordination summary",
    badge: "Read-only",
  },
  {
    id: "rooms",
    label: "Rooms",
    description: "Mission, task, validation, implementation review, release, and OS update rooms",
    badge: "Ready",
  },
  {
    id: "messages",
    label: "Messages",
    description: "Redacted scoped mesh message summaries",
    badge: "Read-only",
  },
  {
    id: "handoffs",
    label: "Handoffs",
    description: "Governed handoff requests and decisions",
    badge: "Read-only",
  },
  {
    id: "context",
    label: "Context Sync",
    description: "Allowed, excluded, and stale trusted context summaries",
    badge: "Read-only",
  },
  {
    id: "policy",
    label: "Policy",
    description: "Dispatch-disabled posture and governance decisions",
    badge: "Guarded",
  },
];

export const DATA_CONTEXT_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Trusted context posture and safety boundaries",
    badge: "Read-only",
  },
  {
    id: "data-sources",
    label: "Data Sources",
    description: "Registered OS, project, runtime, and safety sources",
    badge: "Ready",
  },
  {
    id: "system-of-record",
    label: "System of Record",
    description: "Authoritative source per context domain",
    badge: "Ready",
  },
  {
    id: "trust-scores",
    label: "Trust Scores",
    description: "High, medium, low, and unavailable source bands",
    badge: "Ready",
  },
  {
    id: "freshness-lineage",
    label: "Freshness & Lineage",
    description: "Freshness states and redacted lineage summary",
    badge: "Read-only",
  },
  {
    id: "packet-preview",
    label: "Context Packet Preview",
    description: "Summaries-only packet preview for active scope",
    badge: "Preview",
  },
  {
    id: "exclusions",
    label: "Exclusions / Blocks",
    description: "Sources excluded by mode, scope, policy, or packet limit",
    badge: "Safety",
  },
];

export const AGENT_REGISTRY_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Known agents, roles, statuses, and registry posture",
    badge: "Ready",
  },
  {
    id: "capabilities",
    label: "Capabilities",
    description: "Allowed capabilities and separation-of-duties summary",
    badge: "Read-only",
  },
  {
    id: "boundaries",
    label: "Boundaries",
    description: "Path, tool, data, and approval boundary summaries",
    badge: "Read-only",
  },
  {
    id: "projects",
    label: "Projects",
    description: "Active project context and registry scope",
    badge: "Ready",
  },
  {
    id: "evidence",
    label: "Evidence Requirements",
    description: "Evidence expected from each agent handoff",
    badge: "Read-only",
  },
  {
    id: "definition-updates",
    label: "Definition Updates",
    description: "Proposal-first agent definition update workflow",
    badge: "Read-only",
  },
  {
    id: "developer-details",
    label: "Developer Details",
    description: "Envelope preview metadata without raw JSON dumps",
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
  { id: "portfolio", label: "Portfolio", description: "Known workloads, portfolio posture, and next project actions", badge: "Ready" },
  { id: "selected-project", label: "Selected Project", description: "Selected project, mission, readiness, and actions", badge: "Ready" },
  { id: "stack", label: "Stack", description: "Backend, web, mobile, DB, test, and tooling profile", badge: "Available" },
  { id: "capabilities", label: "Capabilities", description: "Project capability matrix and next actions", badge: "Read-only" },
  { id: "milestones", label: "Milestones", description: "Project milestones, not OS phases", badge: "Read-only" },
  { id: "gaps", label: "Gaps", description: "Open project gaps and action-oriented next steps", badge: "Actionable" },
  { id: "evidence", label: "Evidence", description: "Project-scoped evidence and validation proof summaries", badge: "Read-only" },
  { id: "settings-adapter", label: "Settings / Adapter", description: "Adapter posture, safety settings, and developer details", badge: "Disabled" },
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

export const MEMORY_CENTER_TABS = [
  { id: "overview", label: "Overview", description: "Scoped memory posture and safety summary", badge: "Ready" },
  { id: "os-memory", label: "OS Memory", description: "NEXUS OS scoped memory summaries", badge: "Read-only" },
  { id: "project-memory", label: "Project Memory", description: "Active project scoped memory summaries", badge: "Read-only" },
  { id: "agent-memory", label: "Agent Memory", description: "Agent-visible memory metadata", badge: "Read-only" },
  { id: "task-memory", label: "Task Memory", description: "Task and evidence-linked memory", badge: "Read-only" },
  { id: "session-memory", label: "Session Memory", description: "Temporary session memory and expiration state", badge: "Read-only" },
  { id: "stale-memory", label: "Stale Memory", description: "Stale, expired, invalidated, or unknown memory", badge: "Ready" },
  { id: "promotion-candidates", label: "Promotion Candidates", description: "Memory promotion proposals requiring approval", badge: "Read-only" },
  { id: "packets", label: "Packets", description: "Scoped memory packet preview and exclusions", badge: "Read-only" },
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
  if (pageId === "memory") return MEMORY_CENTER_TABS;
  return (PAGE_TAB_PLANS[pageId] || []).map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    label,
    description: `${label} section planned for a future tab rollout.`,
    disabled: true,
    disabledReason: "Tabbed rollout is planned for a later P41.7 subphase.",
    badge: "Planned",
  }));
}
