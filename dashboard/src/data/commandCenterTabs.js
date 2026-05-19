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
  database: ["Overview", "Entities", "Import Plan", "Fallback", "DB Runtime", "Developer Details"],
  evidence: ["Timeline", "By Task", "By Agent", "By Project", "Developer Details"],
  safety: ["Posture", "Policy Blocks", "Approvals", "Data & Privacy", "Developer Details"],
  projects: ["Portfolio", "Selected Project", "Stack", "Capabilities", "Milestones", "Gaps", "Evidence", "Settings / Adapter"],
  roadmap: ["Current", "Completed", "Planned", "Blocked / Risks", "History"],
  cost: ["Overview", "Budgets", "By Project", "By Agent", "Provider Spend"],
  batch: ["Overview", "Jobs", "Results", "Cost"],
};

export const API_BATCH_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Provider adapters, batch previews, and safety boundary",
    badge: "Preview",
  },
  {
    id: "providers",
    label: "Provider Adapters",
    description: "Preview-only provider adapter readiness",
    badge: "Preview",
  },
  {
    id: "batch",
    label: "Batch Jobs",
    description: "Batch job builder and JSONL preview artifacts",
    badge: "Ready",
  },
  {
    id: "cost",
    label: "Cost Estimate",
    description: "Approximate cost estimates and approval requirements",
    badge: "Ready",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    description: "Preview result mapping by custom_id",
    badge: "Preview",
  },
  {
    id: "developer-details",
    label: "Developer Details",
    description: "Preview modules and disabled runtime details",
    badge: "Read-only",
  },
];

export const AUTH_GOVERNANCE_TABS = [
  { id: "overview", label: "Overview", description: "Identity, RBAC, workspace posture, and next action", badge: "Preview" },
  { id: "governance", label: "Governance", description: "Disabled auth and role mutation posture", badge: "Blocked" },
  { id: "evidence", label: "Evidence", description: "Evidence, activity, cost, and blockers", badge: "Read-only" },
  { id: "disabled", label: "Disabled Actions", description: "Unavailable auth actions and reasons", badge: "Disabled" },
];

export const SELF_UPDATE_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Readiness, owner, blockers, and next action",
    badge: "Preview",
  },
  {
    id: "gate",
    label: "Gate",
    description: "Approval, rollback, validation, and safety posture",
    badge: "Read-only",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Evidence, activity, and validation references",
    badge: "Read-only",
  },
  {
    id: "disabled",
    label: "Disabled Actions",
    description: "Actions that remain unavailable by policy",
    badge: "Blocked",
  },
];

export const RELEASE_CONTROL_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Release state, owner, blockers, and next action",
    badge: "Preview",
  },
  {
    id: "gate",
    label: "Deploy Gate",
    description: "Approval, validation, rollback, and safety posture",
    badge: "Read-only",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Evidence, activity, cost, and blockers",
    badge: "Read-only",
  },
  {
    id: "disabled",
    label: "Disabled Actions",
    description: "Release and deploy actions that remain unavailable",
    badge: "Blocked",
  },
];

export const DEPLOY_MONITORING_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Monitor state, incident state, blockers, and next action",
    badge: "Preview",
  },
  {
    id: "gate",
    label: "Mitigation Gate",
    description: "Approval, validation, rollback, and safety posture",
    badge: "Read-only",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Evidence, activity, cost, and blockers",
    badge: "Read-only",
  },
  {
    id: "disabled",
    label: "Disabled Actions",
    description: "Monitoring and mitigation actions that remain unavailable",
    badge: "Blocked",
  },
];

export const PROJECT_SHIPPING_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Shipping state, export readiness, blockers, and next action",
    badge: "Preview",
  },
  {
    id: "gate",
    label: "Shipping Gate",
    description: "Approval, redaction, evidence, and safety posture",
    badge: "Read-only",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Evidence, activity, cost, and blockers",
    badge: "Read-only",
  },
  {
    id: "disabled",
    label: "Disabled Actions",
    description: "Package and export actions that remain unavailable",
    badge: "Blocked",
  },
];

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

export const HOOK_REGISTRY_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Hook registry posture, safety boundaries, and readiness counts",
    badge: "Read-only",
  },
  {
    id: "hooks",
    label: "Hooks",
    description: "Registered disabled hook definitions and owner agents",
    badge: "Ready",
  },
  {
    id: "triggers",
    label: "Triggers",
    description: "Manual and planned trigger definitions without runtime execution",
    badge: "Read-only",
  },
  {
    id: "guardrails",
    label: "Guardrails",
    description: "Rate, retry, loop-risk, and fail-closed guard decisions",
    badge: "Ready",
  },
  {
    id: "kill-switches",
    label: "Kill Switches",
    description: "Global, project, and hook-level safe disable model",
    badge: "Ready",
  },
  {
    id: "developer-details",
    label: "Developer Details",
    description: "Registry files, reports, policy, and docs references",
    badge: "Read-only",
  },
];

export const TOOL_GATEWAY_TABS = [
  { id: "overview", label: "Overview", description: "Gateway posture, counts, and safety boundaries", badge: "Read-only" },
  { id: "tool-registry", label: "Tool Registry", description: "Registered tool metadata and lazy contract posture", badge: "Ready" },
  { id: "mcp-registry", label: "MCP Registry", description: "Disabled MCP placeholders and schema loading state", badge: "Disabled" },
  { id: "permissions", label: "Permissions", description: "Agent, project, scope, method, and risk decisions", badge: "Guarded" },
  { id: "contracts", label: "Contracts", description: "Selected contract loading without all-tools context", badge: "Lazy" },
  { id: "adapters", label: "Adapters", description: "Preview-only tool adapter descriptions", badge: "Preview" },
  { id: "lazy-loading", label: "Lazy Loading", description: "Context budget and schema-loading guardrails", badge: "Safety" },
  { id: "developer-details", label: "Developer Details", description: "Policy, reports, and registry artifact references", badge: "Read-only" },
];

export const TRIGGER_INTEGRATION_TABS = [
  { id: "overview", label: "Overview", description: "Trigger gateway posture, counts, and safety boundaries", badge: "Preview" },
  { id: "manual", label: "Manual", description: "Command Center and command palette manual trigger previews", badge: "Dry-run" },
  { id: "scheduled", label: "Scheduled", description: "Disabled schedule previews and scheduler posture", badge: "Preview" },
  { id: "github", label: "GitHub", description: "Repository event dry-run mappings", badge: "Preview" },
  { id: "tickets", label: "Tickets", description: "Jira and Linear placeholder event mappings", badge: "Planned" },
  { id: "chat", label: "Chat", description: "Slack and Teams command previews", badge: "Planned" },
  { id: "developer-details", label: "Developer Details", description: "Policy, reports, and disabled runtime details", badge: "Read-only" },
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
  { id: "db-runtime", label: "DB Runtime", description: "Readiness gate, blockers, and disabled DB mutation posture", badge: "Blocked" },
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
  { id: "overview", label: "Overview", description: "Cost readiness, budget posture, and disabled spend", badge: "Preview" },
  { id: "budgets", label: "Budgets", description: "Budget scopes and approval thresholds", badge: "Ready" },
  { id: "estimates", label: "Estimates", description: "Estimate-before-run preview records", badge: "Preview" },
  { id: "ledger", label: "Ledger", description: "Redacted cost ledger preview", badge: "Read-only" },
  { id: "enforcement", label: "Enforcement", description: "ALLOW, BLOCK, REQUIRE_APPROVAL, and RECORD_ONLY examples", badge: "Preview" },
  { id: "gaps", label: "Gaps / Next", description: "Remaining work before real spend capture", badge: "Actionable" },
  { id: "developer-details", label: "Developer Details", description: "Safe policy and report references only", badge: "Read-only" },
];

export const POLICY_CENTER_TABS = [
  { id: "overview", label: "Overview", description: "Policy registry status, high-risk areas, and next action", badge: "Preview" },
  { id: "registry", label: "Registry", description: "Policy families by owner area, scope, risk, and status", badge: "Ready" },
  { id: "versions", label: "Versions", description: "Version metadata and checksum summaries", badge: "Read-only" },
  { id: "diff-preview", label: "Diff Preview", description: "Policy diff risk and approval implications", badge: "Preview" },
  { id: "simulation", label: "Simulation", description: "Redacted decision scenarios without execution", badge: "Preview" },
  { id: "exceptions", label: "Exceptions", description: "Time-bound exception workflow preview", badge: "Preview" },
  { id: "break-glass", label: "Break-Glass", description: "Emergency policy model disabled by default", badge: "Disabled" },
  { id: "developer-details", label: "Developer Details", description: "Safe module, report, and policy references", badge: "Read-only" },
];

export const SECRETS_BOUNDARY_TABS = [
  { id: "overview", label: "Overview", description: "Reference-only credential boundary status", badge: "Ready" },
  { id: "providers", label: "Provider Credentials", description: "Provider credential reference readiness", badge: "Metadata only" },
  { id: "project", label: "Project Credentials", description: "Project-scoped credential categories and blockers", badge: "Blocked" },
  { id: "database-deploy", label: "DB / Deploy", description: "Database, deploy, and mobile signing posture", badge: "Disabled" },
  { id: "integrations", label: "Integrations", description: "Webhook, chat, OAuth, and notification references", badge: "Future phase" },
  { id: "developer-details", label: "Developer Details", description: "Reference IDs and safe report links only", badge: "Read-only" },
];

export const BATCH_QUEUE_TABS = [
  { id: "overview", label: "Overview", description: "Batch status and not-enabled state", badge: "Planned" },
  { id: "jobs", label: "Jobs", description: "Future batch job list", badge: "Planned" },
  { id: "results", label: "Results", description: "Future results and reconciliation", badge: "Planned" },
  { id: "cost", label: "Cost", description: "Future batch savings and cost status", badge: "Planned" },
];

export const WORKER_RUNTIME_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Worker runtime primitive status and execution-disabled posture",
    badge: "Preview",
  },
  {
    id: "queue",
    label: "Queue",
    description: "Queue schema and preview-only work item state",
    badge: "Modeled",
  },
  {
    id: "leases",
    label: "Leases",
    description: "Task lease preview records for future workers",
    badge: "Preview",
  },
  {
    id: "heartbeats",
    label: "Heartbeats",
    description: "Heartbeat record model and stale detection preview",
    badge: "Preview",
  },
  {
    id: "retries",
    label: "Retries / DLQ",
    description: "Retry, timeout, and dead-letter queue primitives",
    badge: "Modeled",
  },
  {
    id: "concurrency",
    label: "Concurrency",
    description: "Locks, duplicate work, priority, and cancellation previews",
    badge: "Preview",
  },
  {
    id: "developer-details",
    label: "Developer Details",
    description: "Policy and local artifact references",
    badge: "Read-only",
  },
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

export const TEST_CENTER_TABS = [
  { id: "overview", label: "Overview", description: "Test Suite Manager overview and policy posture", badge: "Ready" },
  { id: "project-tests", label: "Project Tests", description: "Project-scoped test suite previews", badge: "Preview" },
  { id: "os-tests", label: "OS Tests", description: "NEXUS OS test suite previews", badge: "Preview" },
  { id: "selection-preview", label: "Selection Preview", description: "Changed-file to test suite mapping", badge: "Preview" },
  { id: "evidence-model", label: "Evidence Model", description: "Test result evidence preview schema", badge: "Ready" },
  { id: "gaps", label: "Gaps", description: "Test coverage gaps and next actions", badge: "Actionable" },
];

export const QUALITY_INTELLIGENCE_TABS = [
  { id: "overview", label: "Overview", description: "Quality Intelligence summary and safety posture", badge: "Preview" },
  { id: "prd-mapping", label: "PRD Mapping", description: "Requirement-to-test coverage preview", badge: "Preview" },
  { id: "coverage-gaps", label: "Coverage Gaps", description: "Coverage gaps classified without test execution", badge: "Preview" },
  { id: "recommendations", label: "Recommendations", description: "Risk-based test suite recommendations", badge: "Preview" },
  { id: "flaky-signals", label: "Flaky Signals", description: "Flaky-test signals from metadata only", badge: "Read-only" },
  { id: "test-proposals", label: "Test Proposals", description: "Governed proposal workflow for missing tests", badge: "Proposal" },
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
  if (pageId === "policies") return POLICY_CENTER_TABS;
  if (pageId === "secrets") return SECRETS_BOUNDARY_TABS;
  if (pageId === "batch") return BATCH_QUEUE_TABS;
  if (pageId === "memory") return MEMORY_CENTER_TABS;
  if (pageId === "triggers") return TRIGGER_INTEGRATION_TABS;
  if (pageId === "tests") return TEST_CENTER_TABS;
  if (pageId === "quality") return QUALITY_INTELLIGENCE_TABS;
  return (PAGE_TAB_PLANS[pageId] || []).map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    label,
    description: `${label} section planned for a future tab rollout.`,
    disabled: true,
    disabledReason: "Tabbed rollout is planned for a later P41.7 subphase.",
    badge: "Planned",
  }));
}
