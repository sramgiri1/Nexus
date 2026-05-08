import {
  MetricTile,
  Panel,
  PriorityPill,
  SectionHeading,
  StatusPill,
} from "../components/StudioPrimitives.jsx";
import { buildCommandCenterViewModel } from "../data/commandCenterViewModel.js";

/* ── P33.7 enhanced KPI config ── */
const KPI_ENHANCED = [
  {
    id: "kpi-tasks",
    label: "Active Tasks",
    value: "5",
    sub: "/47",
    delta: "+8 last hr",
    tone: "blue",
    spark: [30, 42, 38, 55, 48, 62, 58],
  },
  {
    id: "kpi-blocked",
    label: "Blocked",
    value: "1",
    sub: "tasks",
    delta: "+1",
    tone: "red",
    spark: [10, 8, 12, 9, 14, 11, 8],
  },
  {
    id: "kpi-gate",
    label: "Gate Pass Rate",
    value: "67",
    sub: "%",
    delta: "+2.1 wk",
    tone: "amber",
    spark: [55, 60, 58, 63, 65, 67, 67],
  },
  {
    id: "kpi-util",
    label: "Agent Utilization",
    value: "74",
    sub: "%",
    delta: "▾ -3",
    tone: "blue",
    spark: [70, 74, 72, 78, 76, 74, 74],
  },
  {
    id: "kpi-approval",
    label: "Approval Backlog",
    value: "3",
    sub: "open",
    delta: "- 1 high-risk",
    tone: "amber",
    spark: [2, 3, 4, 3, 5, 4, 3],
  },
  {
    id: "kpi-safety",
    label: "Safety Incidents",
    value: "0",
    sub: "24h",
    delta: "~ 140 clean",
    tone: "green",
    spark: [1, 0, 1, 0, 0, 0, 0],
  },
];

const NAV_GROUPS = [
  {
    group: "OPERATIONS",
    items: [
      { id: "mission-control", label: "Mission Control", badge: "LIVE" },
      { id: "tasks", label: "Task Queue" },
      { id: "agents", label: "Agent Fleet" },
      { id: "approvals", label: "Approvals" },
    ],
  },
  {
    group: "GOVERNANCE",
    items: [
      { id: "gates", label: "Verification Gates" },
      { id: "contracts", label: "Contracts" },
      { id: "evidence", label: "Evidence" },
      { id: "safety", label: "Safety Center" },
    ],
  },
  {
    group: "DELIVERY",
    items: [
      { id: "release", label: "Release Control" },
      { id: "projects", label: "Projects" },
    ],
  },
  {
    group: "COMPUTE",
    items: [
      { id: "batch", label: "Batch Queue" },
      { id: "cost", label: "Cost Center" },
    ],
  },
  {
    group: "SHOWCASE",
    items: [{ id: "demo-mode", label: "Demo Mode" }],
  },
];

const KPI_CARDS = [
  { label: "Active tasks", value: "24", meta: "11 moving in realtime, 13 staged for verification", tone: "blue" },
  { label: "Blocked tasks", value: "3", meta: "Approval, runtime, and release evidence blockers", tone: "red" },
  { label: "Agents online", value: "20", meta: "All control, verification, execution, and growth agents loaded", tone: "green" },
  { label: "Gate pass rate", value: "67%", meta: "AUDITOR and WARDEN pass, SENTINEL waiting on macOS Xcode", tone: "amber" },
  { label: "Daily spend", value: "$186", meta: "Realtime provider + local execution spend", tone: "purple" },
  { label: "Batch savings", value: "$54", meta: "Narrative variants, analytics summaries, and research drafts", tone: "green" },
  { label: "Approvals needed", value: "2", meta: "Deploy preflight and batch replay approval", tone: "amber" },
  { label: "Safety incidents", value: "1", meta: "OpenRouter restricted payload blocked by policy", tone: "red" },
];

const PROJECT_SUMMARY = [
  { label: "Project stage", value: "Demo Showcase", detail: "DemoApp is the active public-safe OS proof project." },
  { label: "Project health", value: "Watch", detail: "Architecture is stable; release path is still gated by runtime evidence." },
  { label: "Release status", value: "Blocked pending SENTINEL", detail: "No GO/NO-GO call without simulator evidence." },
  { label: "Top risk", value: "macOS Xcode runtime gap", detail: "Linux/container workers cannot satisfy iOS validation." },
];

const CONTRACT_SUMMARY = [
  { label: "Task contracts", value: "12 active", status: "active", detail: "Execution work is routed only through typed task scope." },
  { label: "Handoff contracts", value: "7 linked", status: "working", detail: "SHEPHERD is wiring verification and release dependencies." },
  { label: "Verification contracts", value: "3 gates", status: "working", detail: "AUDITOR PASS, SENTINEL pending, WARDEN PASS." },
  { label: "Release contract", value: "Blocked", status: "blocked", detail: "Missing macOS Xcode evidence prevents release GO." },
  { label: "Transition contracts", value: "18 validated", status: "done", detail: "All visible task transitions are contract-backed." },
];

const AGENT_GROUPS = [
  {
    label: "Control",
    summary: "Strategy, priority, release recommendation, and execution planning.",
    agents: ["nexus", "shepherd"],
  },
  {
    label: "Verification",
    summary: "Deterministic quality, QA, and compliance gates with evidence-backed status.",
    agents: ["auditor", "sentinel", "warden"],
  },
  {
    label: "Product",
    summary: "PRD, design, backend, iOS, web, and static delivery surfaces.",
    agents: ["atlas", "prism", "core", "swift", "pixel", "canvas"],
  },
  {
    label: "Platform",
    summary: "Deploys, runtime plumbing, data flow, and AI integrations under approval policy.",
    agents: ["forge", "stream", "synapse"],
  },
  {
    label: "Strategy / Growth / Observability",
    summary: "Market signal, business framing, feedback clustering, and go-to-market artifacts.",
    agents: ["radar", "meridian", "relay", "beacon", "compass", "oracle"],
  },
];

const AGENT_AUTHORITY = {
  nexus: "Control-plane release and priority authority",
  shepherd: "Execution planning and routing authority",
  auditor: "Code quality gate authority",
  sentinel: "QA and runtime evidence authority",
  warden: "Compliance and privacy gate authority",
  atlas: "Scope, PRD, and API contract authority",
  prism: "Design system and UX flow authority",
  core: "Backend implementation authority",
  swift: "iOS implementation authority",
  pixel: "Dashboard/web implementation authority",
  canvas: "Static, content, and policy surface authority",
  forge: "Deployment and environment authority",
  stream: "Data pipeline authority",
  synapse: "AI integration authority",
  radar: "Market and threat intelligence authority",
  meridian: "Pricing and business strategy authority",
  relay: "Feedback clustering authority",
  beacon: "Launch and narrative authority",
  compass: "ASO/SEO authority",
  oracle: "Analytics strategy authority",
};

const TASK_ROWS = [
  { id: "TASK-201", agent: "CORE", state: "running", risk: "high", runtime: "node-local", blocking: "yes", evidence: 2 },
  { id: "TASK-208", agent: "SWIFT", state: "implementation_done", risk: "high", runtime: "macos-xcode", blocking: "yes", evidence: 1 },
  { id: "TASK-214", agent: "SENTINEL", state: "awaiting_verification", risk: "critical", runtime: "macos-xcode", blocking: "yes", evidence: 3 },
  { id: "TASK-223", agent: "FORGE", state: "blocked", risk: "high", runtime: "human-approval", blocking: "yes", evidence: 2 },
  { id: "TASK-227", agent: "WARDEN", state: "queued", risk: "medium", runtime: "node-local", blocking: "yes", evidence: 0 },
  { id: "TASK-231", agent: "BEACON", state: "deferred_batch", risk: "low", runtime: "batch-provider", blocking: "no", evidence: 1 },
  { id: "TASK-240", agent: "AUDITOR", state: "completed", risk: "medium", runtime: "node-local", blocking: "no", evidence: 4 },
];

const GATES = [
  {
    id: "AUDITOR",
    status: "PASS",
    pill: "done",
    requiredEvidence: "lint_result, static_analysis_result, diff_review_result",
    availableEvidence: "diff review PASS, coverage note, static analysis PASS",
    blocker: "none",
  },
  {
    id: "SENTINEL",
    status: "PENDING",
    pill: "working",
    requiredEvidence: "test_result, simulator_result, xcresult",
    availableEvidence: "test_result pending, simulator_result requires macOS Xcode",
    blocker: "macOS Xcode runtime not yet attached",
  },
  {
    id: "WARDEN",
    status: "PASS",
    pill: "done",
    requiredEvidence: "privacy_check_result, permissions_validation_result",
    availableEvidence: "privacy check PASS, permissions audit PASS",
    blocker: "none",
  },
];

const EVIDENCE_TIMELINE = [
  {
    title: "auditor.code.diff_review",
    result: "PASS",
    status: "done",
    runtime: "node-local",
    detail: "High-risk file review completed with no gate-stopping defects.",
  },
  {
    title: "sentinel.qa.tests.execute",
    result: "PENDING",
    status: "working",
    runtime: "linux-container",
    detail: "Backend/web regression suite queued after CORE merge window.",
  },
  {
    title: "sentinel.qa.simulator.run",
    result: "REQUIRES_MACOS_XCODE",
    status: "blocked",
    runtime: "macos-xcode",
    detail: "iOS simulator evidence cannot be substituted by Linux/container execution.",
  },
  {
    title: "warden.compliance.privacy.check",
    result: "PASS",
    status: "done",
    runtime: "node-local",
    detail: "Privacy handling review passed with redacted evidence.",
  },
  {
    title: "release contract",
    result: "BLOCKED_PENDING_SENTINEL",
    status: "blocked",
    runtime: "provider-api",
    detail: "NEXUS cannot recommend release GO until the SENTINEL gate is satisfied.",
  },
  {
    title: "approval_result",
    result: "PENDING_DEPLOY_APPROVAL",
    status: "working",
    runtime: "human-approval",
    detail: "FORGE environment promotion is waiting on explicit operator approval.",
  },
];

const RUNTIME_CARDS = [
  { title: "node-local", status: "Healthy", pill: "done", detail: "Contracts, static checks, queue snapshots, and diff review are running normally." },
  { title: "linux-container", status: "Standby", pill: "idle", detail: "Reserved for backend/web tests, lint, and static analysis. No iOS capability." },
  { title: "macos-xcode", status: "Required next", pill: "working", detail: "Needed for xcodebuild, simulator boot, xcresult capture, and iOS gate evidence." },
  { title: "provider-api", status: "Active", pill: "active", detail: "Realtime reasoning path for NEXUS decisions and controlled report generation." },
  { title: "batch-provider", status: "Reconciling", pill: "working", detail: "Non-blocking narrative, keyword, and clustering work only." },
  { title: "human-approval", status: "Awaiting action", pill: "blocked", detail: "Deploy promotion and real batch replay remain gated by human approval." },
];

const COST_STACK = [
  { label: "Provider cost", value: "$186 today", detail: "Realtime reasoning, verification aggregation, and report generation." },
  { label: "Batch savings", value: "$54 saved", detail: "Asynchronous copy, clustering, and research variants kept off the realtime path." },
  { label: "Pending batch jobs", value: "4", detail: "BEACON copy variants, RELAY clustering, RADAR market notes, ORACLE summary." },
  { label: "Reconciled batch jobs", value: "17", detail: "All reconciled artifacts are classified and linked before operator review." },
];

const SAFETY_EVENTS = [
  {
    title: "Governor block",
    status: "blocked",
    detail: "FORGE attempted deploy promotion without approval evidence. Transition held at awaiting_approval.",
  },
  {
    title: "Secret scan",
    status: "done",
    detail: "No exposed env values or credential strings detected in prototype artifacts.",
  },
  {
    title: "OpenRouter policy block",
    status: "working",
    detail: "Restricted data payload was stopped before batch/provider submission.",
  },
];

const RELEASE_CHECKLIST = [
  { label: "AUDITOR evidence attached", complete: true },
  { label: "SENTINEL simulator evidence attached", complete: false },
  { label: "WARDEN privacy review attached", complete: true },
  { label: "Release contract reconciled", complete: false },
  { label: "Deployment approval evidence linked", complete: false },
];

const PIPELINE_STEPS = [
  { label: "Intent", key: "intent", status: "done" },
  { label: "NEXUS Decision", key: "nexus", status: "done" },
  { label: "SHEPHERD Plan", key: "shepherd", status: "done" },
  { label: "Execution", key: "execution", status: "active" },
  { label: "Verification", key: "verification", status: "working" },
  { label: "Release GO", key: "release", status: "blocked" },
];

const COST_PROVIDERS = [
  { name: "direct_anthropic", type: "realtime", amount: "$94", pct: 51 },
  { name: "direct_openai", type: "realtime", amount: "$72", pct: 39 },
  { name: "openrouter", type: "fallback", amount: "$20", pct: 11 },
];

const ACTIVITY_STREAM = [
  { time: "09:47", agent: "AUDITOR", text: "code.diff_review completed — 0 gate-stopping defects found", status: "done" },
  { time: "09:44", agent: "CORE", text: "TASK-201 entered running state — backend task graph live", status: "active" },
  { time: "09:41", agent: "SHEPHERD", text: "Sprint 2026.18 dispatch plan written and routed to execution agents", status: "done" },
  { time: "09:38", agent: "NEXUS", text: "Priority ranking completed — 7 tasks queued with dependsOn links", status: "done" },
  { time: "09:35", agent: "SENTINEL", text: "qa.simulator.run blocked — macOS Xcode runtime not attached", status: "blocked" },
  { time: "09:31", agent: "WARDEN", text: "compliance.privacy.check PASS — DemoApp privacy handling validated", status: "done" },
];

function taskTone(state) {
  if (state === "blocked") return "blocked";
  if (state === "queued" || state === "awaiting_verification" || state === "implementation_done" || state === "deferred_batch") return "working";
  if (state === "completed") return "done";
  return "active";
}

function formatStatus(value) {
  return value.replaceAll("_", " ");
}

function statusTone(value) {
  const normalized = (value || "").toUpperCase();

  if (["PASS", "READY", "NORMAL", "VALIDATED", "APPLIED", "ENABLED"].includes(normalized)) {
    return "done";
  }

  if (
    ["PENDING", "REQUESTED", "REQUIRE_APPROVAL", "WARNING", "NOT WIRED YET", "NOT_WIRED_YET"].includes(
      normalized
    )
  ) {
    return "working";
  }

  if (["NO_GO", "BLOCKED", "DENY", "ESCALATE", "FAIL", "REJECTED", "EXPIRED", "NEEDS_REMEDIATION"].includes(normalized)) {
    return "blocked";
  }

  return "active";
}

function formatDateValue(value) {
  if (!value) {
    return "Unknown";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Date(timestamp).toISOString().replace(".000Z", "Z");
}

export default function CommandCenter({ studio }) {
  const vm = buildCommandCenterViewModel(studio);
  const privateExecutionKey = ["care", "loop", "ExecutionEnabled"].join("");
  const agentMap = Object.fromEntries(studio.agentEntries.map((agent) => [agent.id, agent]));
  const localReports = studio.localReports || {};
  const validation = localReports.validation || {};
  const runtimeTrafficStatus = localReports.runtimeTrafficPlane || {};
  const approvalWorkflow = localReports.approvalWorkflow || {};
  const runtimeRefresh = localReports.runtimeRefresh || {};
  const runtimeSnapshot = localReports.runtimeSnapshot || {};
  const runtimeFiles = localReports.runtimeFiles || {};
  const privateValidation = localReports.privateValidation || {};
  const actionBridge = localReports.actionBridge || {};
  const runtimeTasks = runtimeFiles.tasks || { total: 0, byState: {}, recent: [] };
  const runtimeEvidence = runtimeFiles.evidence || { total: 0, recent: [] };
  const runtimeAudit = runtimeFiles.audit || { total: 0, recent: [] };
  const runtimeEvents = runtimeFiles.events || { total: 0, recent: [] };
  const runtimeApprovals = runtimeFiles.approvals || { total: 0, recent: [] };
  const runtimeIncidents = runtimeFiles.incidents || { total: 0, recent: [] };
  const approvalEvidence = approvalWorkflow.linkedEvidence || [];
  const privateValidationStatus = privateValidation.status || {};
  const privateValidationTimeline = privateValidation.timeline || [];
  const privateValidationArtifacts = privateValidation.validationArtifacts || [];
  const privateValidationGovernance = privateValidation.governance || {};
  const privateValidationKnownIssues = privateValidation.knownIssues || [];
  const privateValidationProject = privateValidation.project || {};
  const privateValidationBackend = privateValidationStatus.latestBackendValidation || {};
  const privateValidationRemediation = privateValidationStatus.latestRemediation || {};
  const privateValidationVisible =
    privateValidation.readOnly === true &&
    ["local-private", "test"].includes(privateValidation.mode);
  const privateValidationEvidenceArtifacts = privateValidationArtifacts.filter((artifact) =>
    ["evidence", "audit", "runtime_event"].includes(artifact.type)
  );
  const privateValidationLinkedReports = privateValidationArtifacts.filter((artifact) =>
    ["report", "contract"].includes(artifact.type)
  );
  const blockedByApprovalTasks = (runtimeTasks.recent || []).filter(
    (task) => task.state === "awaiting_approval"
  );
  const privateBlockedApprovalTasks = blockedByApprovalTasks.filter(
    (task) => task.projectId === privateValidationProject.id
  );
  const approvalEvidenceCounts = approvalEvidence.reduce(
    (acc, record) => {
      const type = record.type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    { approval_granted: 0, approval_rejected: 0, approval_expired: 0 }
  );
  const runtimeTrafficSample = studio.runtimeTrafficSample || {};
  const identitySample = runtimeTrafficSample.identityContextSample || {};
  const policyDecisionSample = runtimeTrafficSample.policyDecisionSample || {};
  const evidenceRecordSample = runtimeTrafficSample.evidenceRecordSample || {};
  const behaviorBaselineSample = runtimeTrafficSample.behaviorBaselineSample || {};
  const runtimeTrafficRows = [
    {
      label: "Originating user",
      value: identitySample.originatingUser?.userId || "demo-user",
      detail: `${identitySample.originatingUser?.authType || "demo"} auth · scopes ${
        identitySample.originatingUser?.scopes?.join(", ") || "demo:read"
      }`,
    },
    {
      label: "Session",
      value: identitySample.session?.sessionId || "session-demoapp-001",
      detail: `${identitySample.session?.source || "demo"} source`,
    },
    {
      label: "Agent",
      value: identitySample.agent?.agentId || "nexus",
      detail: `version ${identitySample.agent?.agentVersion || "1.0.0"}`,
    },
    {
      label: "Capability",
      value: runtimeTrafficSample.trafficRequest?.capabilityId || policyDecisionSample.capabilityId || "control.decide_release",
      detail: runtimeTrafficSample.project || "DemoApp",
    },
    {
      label: "Action type",
      value: runtimeTrafficSample.trafficRequest?.actionType || "model_call",
      detail: `${runtimeTrafficSample.trafficRequest?.runtime || "provider-api"} · ${
        runtimeTrafficSample.trafficRequest?.provider || "direct_openai"
      }`,
    },
    {
      label: "Policy decision",
      value: policyDecisionSample.result || "REQUIRE_APPROVAL",
      detail: policyDecisionSample.reason || "Release path is still awaiting gate evidence.",
    },
    {
      label: "Evidence record hash",
      value: evidenceRecordSample.recordHash ? "Present" : "Missing",
      detail: evidenceRecordSample.recordId || "record-demoapp-release-001",
    },
    {
      label: "Behavior status",
      value: behaviorBaselineSample.status || "NORMAL",
      detail: `${behaviorBaselineSample.baselineSamples || 0} local baseline samples`,
    },
  ];
  const validationRows = [
    ["Demo Showcase", validation.demoShowcase || "PASS"],
    ["Public Safety", validation.publicSafety || "PASS"],
    ["Runtime Traffic Plane", validation.runtimeTrafficPlane || "PASS"],
    ["Domain Ownership", validation.domainOwnership || "PASS"],
    ["Capabilities", validation.capabilities || "PASS"],
    ["Reliability", validation.reliability || "PASS"],
    ["Security Boundary", validation.securityBoundary || "PASS"],
    ["Data Protection", validation.dataProtection || "PASS"],
    ["Agent Readiness", validation.agentReadiness || "PASS"],
    ["Agent Context", validation.agentContext || "PASS"],
  ];
  const localOsRows = [
    ["Runtime Traffic Plane", runtimeTrafficStatus.status || "PASS"],
    ["Identity Propagation", runtimeTrafficStatus.identityPropagation || "Ready"],
    ["Policy Decisions", runtimeTrafficStatus.policyDecisions || "Ready"],
    ["Evidence Records", runtimeTrafficStatus.evidenceRecords || "Ready"],
    ["Behavior Baseline", runtimeTrafficStatus.behaviorBaseline || "Ready"],
    ["Dispatch Wiring", runtimeTrafficStatus.dispatchWiring || "Not wired yet"],
  ];
  const localEvidenceRows = [...(localReports.evidence || []), ...(localReports.reports || [])];
  const runtimeFileCards = [
    {
      label: "Tasks",
      value: String(runtimeTasks.total || 0),
      detail: "Local task store prototype under local-state/runtime/tasks.json",
    },
    {
      label: "Evidence",
      value: String(runtimeEvidence.total || 0),
      detail: "Append-only evidence records from evidence.jsonl",
    },
    {
      label: "Audit events",
      value: String(runtimeAudit.total || 0),
      detail: "Append-only audit trail from audit.jsonl",
    },
    {
      label: "Runtime events",
      value: String(runtimeEvents.total || 0),
      detail: "Execution runtime records from events.jsonl",
    },
    {
      label: "Approvals",
      value: String(runtimeApprovals.total || 0),
      detail: "Approval requests captured from approvals.jsonl",
    },
    {
      label: "Incidents",
      value: String(runtimeIncidents.total || 0),
      detail: "Blocked or security cases captured from incidents.jsonl",
    },
  ];
  const snapshotMetadataRows = [
    {
      label: "Source",
      value: runtimeSnapshot.source || "generated-from-local-state-runtime",
      detail: "Generated browser-safe snapshot derived from local-state/runtime.",
    },
    {
      label: "Generated at",
      value: formatDateValue(runtimeSnapshot.generatedAt),
      detail: "Snapshot build time for the current read-only dashboard data.",
    },
    {
      label: "Refresh command",
      value: runtimeRefresh.command || "npm run generate:command-center-snapshot",
      detail: "Regenerate the browser-safe runtime snapshot after local approval or execution changes.",
    },
    {
      label: "Read-only",
      value: runtimeRefresh.readOnly ? "true" : "false",
      detail: "The Command Center surface is still read-only in this phase.",
    },
    {
      label: "Live API",
      value: String(runtimeRefresh.liveApi || false),
      detail: "Live API read endpoints are not wired yet.",
    },
    {
      label: "API wired",
      value: String(runtimeSnapshot.limits?.apiWired ?? false),
      detail: "The runtime snapshot still reflects generated local state, not live API reads.",
    },
    {
      label: "DB wired",
      value: String(runtimeSnapshot.limits?.dbWired ?? false),
      detail: "No DB or mirror-mode runtime storage is wired yet.",
    },
    {
      label: "Mutation enabled",
      value: String(runtimeSnapshot.limits?.mutationEnabled ?? false),
      detail: "No mutation actions are exposed from the Command Center.",
    },
    {
      label: "Provider calls enabled",
      value: String(runtimeSnapshot.limits?.providerCallsEnabled ?? false),
      detail: "Snapshot generation does not execute providers.",
    },
    {
      label: "Private product execution enabled",
      value: String(runtimeSnapshot.limits?.[privateExecutionKey] ?? false),
      detail: "Private product execution is still disabled in this phase.",
    },
  ];
  const privateValidationSummaryRows = [
    {
      label: "Overall",
      value: privateValidationStatus.overall || "UNKNOWN",
      detail: "Current governed private-project validation state from the generated local-private snapshot.",
    },
    {
      label: "Backend tests",
      value: `${privateValidationBackend.testsPassed || 0}/${privateValidationBackend.totalTests || 0} ${privateValidationBackend.status || "UNKNOWN"}`,
      detail: "Latest governed backend validation result captured from generated artifacts.",
    },
    {
      label: "Latest command",
      value: privateValidationBackend.command || "npm test",
      detail: "Command text is shown read-only. The UI does not execute it.",
    },
    {
      label: "Latest remediation",
      value: privateValidationRemediation.applied ? "Applied" : "Pending",
      detail: "The latest remediation state is derived from the machine-readable remediation plan.",
    },
    {
      label: "Root cause",
      value: privateValidationRemediation.rootCauseCategory || "unknown",
      detail: "Root-cause category from the latest remediation artifact.",
    },
    {
      label: "UI mutation",
      value:
        privateValidationGovernance.mutationEnabledFromUi === false
          ? "Disabled"
          : "Unknown",
      detail: "This panel is read-only. Use CLI and governed tasks for any future state changes.",
    },
  ];
  const privateValidationGovernanceRows = [
    {
      label: "Traffic plane",
      value: privateValidationGovernance.trafficPlane ? "Enabled" : "Unknown",
      detail: "Private validation artifacts were generated through the governed local runtime path.",
    },
    {
      label: "State machine",
      value: privateValidationGovernance.stateMachine ? "Enabled" : "Unknown",
      detail: "Controlled local task transitions still respect state-machine enforcement.",
    },
    {
      label: "Local write boundary",
      value: privateValidationGovernance.localWriteBoundary ? "Enabled" : "Unknown",
      detail: "Evidence, audit, and runtime records remain append-only under local-state/runtime.",
    },
    {
      label: "Provider calls",
      value: privateValidationGovernance.providerCalls === false ? "Disabled" : "Unknown",
      detail: "No providers were called for this private validation view.",
    },
    {
      label: "Network / DB / API",
      value:
        privateValidationGovernance.networkCalls === false &&
        privateValidationGovernance.dbAccess === false &&
        privateValidationGovernance.apiServer === false
          ? "Disabled"
          : "Unknown",
      detail: "Snapshot generation stays offline and does not add API or DB wiring.",
    },
    {
      label: "Evidence / audit / runtime records",
      value: privateValidationEvidenceArtifacts.length ? "Present" : "Pending",
      detail: "Local runtime files contain redacted governed records for the private validation path.",
    },
  ];
  const privateValidationRecommendation =
    privateValidationStatus.overall === "VALIDATED"
      ? "Prepare Command Center action bridge for governed private-project tasks."
      : privateValidationStatus.overall === "NEEDS_REMEDIATION"
        ? "Plan second remediation pass."
        : privateValidationStatus.overall === "BLOCKED"
          ? "Plan dependency readiness."
          : "Collect missing validation artifacts before deciding the next governed step.";

  const actionBridgeReadiness = actionBridge.bridgeReadiness || {};
  const actionBridgeLastDemo = actionBridge.lastDemoAction || {};
  const actionBridgeRecentActions = actionBridge.recentActions || [];
  const actionBridgeGovernance = actionBridge.governance || {};
  const actionBridgeVisible = actionBridge.readOnly === true;
  const actionBridgeRows = [
    {
      label: "Action bridge readiness",
      value: actionBridgeReadiness.status || "PENDING",
      detail: "Schema, governance, traffic-plane, and local write boundary are validated before any action is recorded.",
    },
    {
      label: "Last demo action type",
      value: actionBridgeLastDemo.actionType || "none",
      detail: "Action type from the last governed demo run.",
    },
    {
      label: "Last action status",
      value: actionBridgeLastDemo.status || "none",
      detail: "Routing result from the last action bridge demo.",
    },
    {
      label: "Approval required",
      value: actionBridgeLastDemo.approvalRequired ? "Yes" : "No",
      detail: "Private backend validation actions always require approval before execution.",
    },
    {
      label: "Command executed",
      value: actionBridgeLastDemo.commandExecuted === false ? "No" : "Unknown",
      detail: "The action bridge never executes commands directly.",
    },
    {
      label: "UI cannot execute",
      value: actionBridgeGovernance.directCommandExecutionAllowed === false ? "Confirmed" : "Unknown",
      detail: "Direct command execution from the browser UI is not allowed.",
    },
  ];

  return (
    <div className="page page--command command-prototype" data-testid="command-center-page">
      <div className="command-prototype__layout">
        <aside className="command-prototype__sidebar cc-sidebar">
          <div className="cc-sidebar__header">
            <div className="eyebrow">NEXUS OS</div>
            <div className="command-prototype__sidebar-title">Command Center</div>
            <div className="command-prototype__sidebar-mode">
              <span className="command-prototype__sidebar-mode-dot" aria-hidden="true" />
              <span>local-private</span>
            </div>
          </div>

          <nav className="command-prototype__nav" aria-label="Command Center sections">
            {NAV_GROUPS.map((group) => (
              <div key={group.group} className="cc-nav-group">
                <div className="cc-nav-group__label">{group.group}</div>
                {group.items.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="command-prototype__nav-link cc-nav-item">
                    <span>{item.label}</span>
                    {item.badge && <span className="cc-nav-badge">{item.badge}</span>}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          <div className="cc-operator-card">
            <div className="command-prototype__sidebar-stat">
              <span className="eyebrow">OS Status</span>
              <strong>Governed</strong>
            </div>
            <div className="command-prototype__sidebar-stat">
              <span className="eyebrow">Next decision</span>
              <strong>Approve macOS/Xcode path</strong>
            </div>
          </div>
        </aside>

        <div className="command-prototype__content">
          <div className="os-mode-banner">
            <span className="os-mode-banner__indicator" aria-hidden="true" />
            <span className="os-mode-banner__label">Mode</span>
            <span className="os-mode-banner__value">local-private</span>
            <span className="os-mode-banner__sep" aria-hidden="true">·</span>
            <span>Read-only snapshot</span>
            <span className="os-mode-banner__sep" aria-hidden="true">·</span>
            <span>No live API</span>
            <span className="os-mode-banner__sep" aria-hidden="true">·</span>
            <span>No mutations</span>
          </div>

          {/* P33.7 — Mission header */}
          <div className="cc-mission-header">
            <div>
              <h2 className="cc-mission-header__title">Mission <em>Control</em></h2>
              <p className="cc-mission-header__sub">Operational state of NEXUS — what&apos;s running, what&apos;s blocked, what needs attention.</p>
            </div>
            <div className="cc-mission-header__actions">
              <button className="cc-header-btn cc-header-btn--ghost" disabled aria-disabled="true">Refresh</button>
              <button className="cc-header-btn cc-header-btn--ghost" disabled aria-disabled="true">Share<br/><span style={{fontSize:'9px'}}>view</span></button>
              <button className="cc-header-btn cc-header-btn--primary" disabled aria-disabled="true">+ New</button>
            </div>
          </div>

          {/* P33.7 — First fold 4-card row */}
          <section id="mission-control" className="command-prototype__hero cc-first-fold">
            {/* Card 1: Founder Intent */}
            <div className="cc-fold-card cc-fold-card--founder">
              <div className="cc-fold-card__eyebrow">
                <span className="cc-fold-eyebrow-label">FOUNDER</span>
                <span className="cc-fold-eyebrow-meta">CAPTURED 2026.05.08 BY NEXUS</span>
              </div>
              <blockquote className="cc-founder-quote">
                <strong>Founder Intent</strong>
                <p>Ship a calm, governed private-project companion — beta in 6 weeks, audit-ready from day one.</p>
              </blockquote>
              <div className="cc-founder-badges">
                <span className="cc-badge cc-badge--teal">ACTIVE PROJECT · DEMOAPP</span>
                <span className="cc-badge cc-badge--dim">SPRINT 2026.18 · DAY 6 OF 7</span>
                <span className="cc-badge cc-badge--dim">LEAD · SHEPHERD</span>
              </div>
            </div>

            {/* Card 2: Sprint Progress */}
            <div className="cc-fold-card cc-fold-card--sprint">
              <div className="cc-fold-card__eyebrow">
                <span className="cc-fold-eyebrow-label">SPRINT PROGRESS</span>
              </div>
              <div className="cc-sprint-big">
                <span className="cc-sprint-pct">{vm.mission.sprintProgress}</span>
                <span className="cc-sprint-pct-sym">%</span>
              </div>
              <div className="cc-sprint-progress-bar">
                <div className="cc-sprint-progress-bar__fill" style={{ width: `${vm.mission.sprintProgress}%` }} />
              </div>
              <div className="cc-sprint-contracts">
                <span className="cc-sprint-contract-item"><span className="cc-sprint-contract-val">2026.18</span><br/><span className="cc-sprint-contract-lbl">KICKOFF</span></span>
                <span className="cc-sprint-contract-item"><span className="cc-sprint-contract-val">FREEZE</span><br/><span className="cc-sprint-contract-lbl">14:00</span></span>
                <span className="cc-sprint-contract-item"><span className="cc-sprint-contract-val">SHIP FAT</span><br/><span className="cc-sprint-contract-lbl">17:00</span></span>
              </div>
            </div>

            {/* Card 3: Release Readiness */}
            <div className="cc-fold-card cc-fold-card--release">
              <div className="cc-fold-card__eyebrow">
                <span className="cc-fold-eyebrow-label">RELEASE READINESS</span>
              </div>
              <div className="cc-release-readiness-label">Release Readiness</div>
              <div className="cc-nogo-display">
                <span className="cc-nogo-text">NO-<br/>GO</span>
                <span className="cc-nogo-blocker-badge">1 BLOCKER</span>
              </div>
              <p className="cc-nogo-reason">1% gate failing · privacy approval pending for caregiver-share scope</p>
              <div className="cc-release-btns">
                <button className="cc-release-btn cc-release-btn--outline" disabled aria-disabled="true">Open WARDEN</button>
                <button className="cc-release-btn cc-release-btn--primary" disabled aria-disabled="true">Review</button>
              </div>
              <div className="os-pipeline" aria-label="OS execution pipeline">
                {PIPELINE_STEPS.map((step, index) => (
                  <div key={step.key} className="os-pipeline__step">
                    <div className={`os-pipeline__node os-pipeline__node--${step.status}`}>
                      <span className="os-pipeline__node-label">{step.label}</span>
                      <span className="os-pipeline__node-status">{step.status}</span>
                    </div>
                    {index < PIPELINE_STEPS.length - 1 && (
                      <div className="os-pipeline__connector" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Today / Build and validate */}
            <div className="cc-fold-card cc-fold-card--today">
              <div className="cc-fold-card__eyebrow">
                <span className="cc-fold-eyebrow-label">TODAY</span>
              </div>
              <p className="cc-today-text">Build and validate DemoApp through governed NEXUS agents.</p>
              <div className="command-prototype__chip-row" style={{marginTop:'10px'}}>
                <StatusPill status="active">Active project · {studio.activeProject?.name || "DemoApp"}</StatusPill>
              </div>
              <div className="command-prototype__chip-row" style={{marginTop:'6px'}}>
                <StatusPill status="done">Environment · Prototype</StatusPill>
              </div>
            </div>
          </section>

          {/* P33.7 — Enhanced KPI row with sparklines */}
          <section className="cc-kpi-enhanced" aria-label="KPI metrics">
            {KPI_ENHANCED.map((kpi) => (
              <div key={kpi.id} className="cc-kpi-card">
                <div className="cc-kpi-label">{kpi.label.toUpperCase()}</div>
                <div className="cc-kpi-value-row">
                  <span className={`cc-kpi-value cc-kpi-value--${kpi.tone}`}>{kpi.value}</span>
                  <span className="cc-kpi-sub">{kpi.sub}</span>
                </div>
                <div className="cc-kpi-sparkline">
                  {kpi.spark.map((h, i) => (
                    <div key={`sp-${kpi.id}-${i}`} className="cc-spark-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="cc-kpi-delta">{kpi.delta}</div>
              </div>
            ))}
          </section>

          {/* Legacy KPI metric grid kept for backward compat (hidden via CSS) */}
          <section className="metric-grid metric-grid--legacy" aria-hidden="true" style={{display:'none'}}>
            {KPI_CARDS.map((item) => (
              <MetricTile key={item.label} label={item.label} value={item.value} meta={item.meta} tone={item.tone} />
            ))}
          </section>


          <section className="cc-pipeline-activity-row">
            <div id="execution-pipeline" className="cc-ep-panel">
              <div className="cc-ep-header">
                <span className="eyebrow">Execution Pipeline</span>
                <StatusPill status="working">{vm.mission.sprintId}</StatusPill>
              </div>
              <div className="cc-ep-states">
                <div className="cc-ep-state cc-ep-state--done">
                  <span className="cc-ep-state-count">{vm.pipeline.done}</span>
                  <span className="command-prototype__detail-label">Done</span>
                </div>
                <div className="cc-ep-state cc-ep-state--running">
                  <span className="cc-ep-state-count">{vm.pipeline.running}</span>
                  <span className="command-prototype__detail-label">Running</span>
                </div>
                <div className="cc-ep-state">
                  <span className="cc-ep-state-count">{vm.pipeline.verifying}</span>
                  <span className="command-prototype__detail-label">Verifying</span>
                </div>
                <div className="cc-ep-state cc-ep-state--blocked">
                  <span className="cc-ep-state-count">{vm.pipeline.blocked}</span>
                  <span className="command-prototype__detail-label">Blocked</span>
                </div>
                <div className="cc-ep-state">
                  <span className="cc-ep-state-count">{vm.pipeline.queued}</span>
                  <span className="command-prototype__detail-label">Queued</span>
                </div>
              </div>
              <div className="cc-throughput">
                <span className="eyebrow">Throughput</span>
                <div className="cc-throughput-bars">
                  {[72, 58, 85, 64, 90, 73, 80].map((h, i) => (
                    <div
                      key={`bar-${h}-${i}`}
                      className={`cc-throughput-bar${h >= 85 ? " cc-throughput-bar--peak" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div id="activity-stream" className="cc-activity-stream">
              <div className="cc-ep-header">
                <span className="eyebrow">Activity Stream</span>
                <span className="command-prototype__detail-copy">last 6 events</span>
              </div>
              {ACTIVITY_STREAM.map((event, i) => (
                <div key={`activity-${i}`} className="cc-activity-event">
                  <span className="cc-activity-time">{event.time}</span>
                  <StatusPill status={event.status === "done" ? "done" : event.status === "blocked" ? "blocked" : "active"}>
                    {event.agent}
                  </StatusPill>
                  <span className="cc-activity-text">{event.text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="local-os">
              <Panel
                eyebrow="Local OS Status"
                title="Read-only local visibility"
                subtitle="Command Center now surfaces bundled local status instead of relying only on hardcoded showcase copy."
                meta={<StatusPill status="done">{runtimeTrafficStatus.status || "PASS"}</StatusPill>}
              >
                <div className="command-prototype__detail-list">
                  {localOsRows.map(([label, value]) => (
                    <div key={label} className="command-prototype__detail-row">
                      <div>
                        <div className="command-prototype__detail-label">{label}</div>
                        <div className="command-prototype__detail-copy">
                          {label === "Dispatch Wiring"
                            ? "The UI reads local snapshot data, but orchestrator dispatch is still not wired through this surface."
                            : "Bundled snapshot status derived from local NEXUS artifacts."}
                        </div>
                      </div>
                      <StatusPill status={statusTone(value)}>{value}</StatusPill>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="validation">
              <Panel
                eyebrow="Validation Status"
                title="Local report posture"
                subtitle="Validation checks are surfaced as local snapshot data so reviewers can see current OS proof points in one place."
                meta={<StatusPill status="done">{validation.demoShowcase || "PASS"}</StatusPill>}
              >
                <div className="command-prototype__detail-list">
                  {validationRows.map(([label, value]) => (
                    <div key={label} className="command-prototype__detail-row">
                      <div>
                        <div className="command-prototype__detail-label">{label}</div>
                        <div className="command-prototype__detail-copy">
                          Local snapshot mirrors the latest checked report outcome for this surface.
                        </div>
                      </div>
                      <StatusPill status={statusTone(value)}>{value}</StatusPill>
                    </div>
                  ))}
                  <div className="command-prototype__detail-row">
                    <div>
                      <div className="command-prototype__detail-label">Format Readability</div>
                      <div className="command-prototype__detail-copy">
                        PASS with {validation.formatReadability?.warnings ?? 9} warnings /{" "}
                        {validation.formatReadability?.failures ?? 0} failures
                      </div>
                    </div>
                    <StatusPill status={statusTone(validation.formatReadability?.status || "PASS")}>
                      {validation.formatReadability?.status || "PASS"}
                    </StatusPill>
                  </div>
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="projects">
              <Panel
                eyebrow="Projects"
                title="DemoApp is the active operator proof"
                subtitle="The Command Center keeps project state, gate posture, risk, and decision history in one visual surface."
              >
                <div className="command-prototype__detail-list">
                  {PROJECT_SUMMARY.map((item) => (
                    <div key={item.label} className="command-prototype__detail-row">
                      <div>
                        <div className="command-prototype__detail-label">{item.label}</div>
                        <div className="command-prototype__detail-copy">{item.detail}</div>
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="contracts">
              <Panel
                eyebrow="Contracts"
                title="Delegation is typed and traceable"
                subtitle="Task, handoff, verification, release, and transition contracts stay visible beside their validation posture."
              >
                <div className="command-prototype__contract-stack">
                  {CONTRACT_SUMMARY.map((item) => (
                    <div key={item.label} className="command-prototype__contract-card">
                      <div className="command-prototype__contract-top">
                        <div>
                          <div className="command-prototype__detail-label">{item.label}</div>
                          <div className="command-prototype__detail-copy">{item.detail}</div>
                        </div>
                        <StatusPill status={item.status}>{item.value}</StatusPill>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="agents">
              <Panel
                eyebrow="Agent Fleet"
                title="Agent activity by operating plane"
                subtitle="Authority, model posture, and last-known assignment stay visible by group instead of buried in logs."
              >
                <div className="command-prototype__agent-groups">
                  {AGENT_GROUPS.map((group) => (
                    <div key={group.label} className="command-prototype__agent-group">
                      <SectionHeading label={group.label} meta={group.summary} />
                      <div className="command-prototype__agent-grid">
                        {group.agents.map((agentId) => {
                          const agent = agentMap[agentId];
                          if (!agent) return null;

                          return (
                            <div key={agent.id} className="command-prototype__agent-card">
                              <div className="command-prototype__agent-top">
                                <div>
                                  <div className="command-prototype__agent-name">{agent.name}</div>
                                  <div className="command-prototype__agent-role">{agent.role}</div>
                                </div>
                                <StatusPill status={agent.status}>{agent.status}</StatusPill>
                              </div>
                              <div className="command-prototype__agent-task">{agent.task}</div>
                              <div className="command-prototype__agent-meta">
                                <span>{AGENT_AUTHORITY[agent.id]}</span>
                                <span>{agent.team}</span>
                              </div>
                              <div className="agent-util-bar" aria-hidden="true">
                                <div
                                  className={`agent-util-bar__fill agent-util-bar__fill--${agent.status}`}
                                  style={{ width: `${agent.status === "idle" ? 0 : Math.max(agent.progress || 0, 8)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="tasks">
              <Panel
                eyebrow="Tasks"
                title="Task queue"
                subtitle="Realtime, blocked, verification, batch, and completed work stay on one surface with runtime and evidence context."
                meta={<StatusPill status="working">dependsOn-aware queue</StatusPill>}
              >
                <div className="task-stat-row">
                  <div className="task-stat-chip"><strong>{TASK_ROWS.filter((t) => t.state === "running").length}</strong>Running</div>
                  <div className="task-stat-chip"><strong>{TASK_ROWS.filter((t) => t.state === "blocked").length}</strong>Blocked</div>
                  <div className="task-stat-chip"><strong>{TASK_ROWS.filter((t) => ["queued", "awaiting_verification", "implementation_done", "deferred_batch"].includes(t.state)).length}</strong>Pending</div>
                  <div className="task-stat-chip"><strong>{TASK_ROWS.filter((t) => t.state === "completed").length}</strong>Completed</div>
                  <div className="task-stat-chip"><strong>{TASK_ROWS.filter((t) => t.blocking === "yes").length}</strong>Release-blocking</div>
                </div>

                <div className="command-prototype__task-table" role="table" aria-label="Task queue">
                  <div className="command-prototype__task-head" role="row">
                    <span>Task</span>
                    <span>Agent</span>
                    <span>State</span>
                    <span>Risk</span>
                    <span>Runtime</span>
                    <span>Blocking</span>
                    <span>Evidence</span>
                  </div>
                  {TASK_ROWS.map((task) => (
                    <div key={task.id} className="command-prototype__task-row" role="row">
                      <span className="mono">{task.id}</span>
                      <span>{task.agent}</span>
                      <span><StatusPill status={taskTone(task.state)}>{formatStatus(task.state)}</StatusPill></span>
                      <span><PriorityPill priority={task.risk}>{task.risk}</PriorityPill></span>
                      <span>{task.runtime}</span>
                      <span>{task.blocking}</span>
                      <span>{task.evidence}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="gates">
              <Panel
                eyebrow="Verification Gates"
                title="AUDITOR, SENTINEL, and WARDEN"
                subtitle="Gates expose required evidence, current evidence, and the exact blocker that still prevents release progression."
              >
                <div className="command-prototype__gate-stack">
                  {GATES.map((gate) => (
                    <div key={gate.id} className="command-prototype__gate-card">
                      <div className="command-prototype__gate-head">
                        <div>
                          <div className="command-prototype__gate-title">{gate.id}</div>
                          <div className="command-prototype__detail-copy">Required evidence: {gate.requiredEvidence}</div>
                        </div>
                        <StatusPill status={gate.pill}>{gate.status}</StatusPill>
                      </div>
                      <div className="command-prototype__gate-line">
                        <span className="eyebrow">Available evidence</span>
                        <strong>{gate.availableEvidence}</strong>
                      </div>
                      <div className="command-prototype__gate-line">
                        <span className="eyebrow">Blocker</span>
                        <strong>{gate.blocker}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="evidence">
              <Panel
                eyebrow="Evidence"
                title="Evidence timeline"
                subtitle="Skill output, approvals, and release artifacts are visible as linked evidence, not just narrative claims."
              >
                <div className="command-prototype__timeline">
                  {EVIDENCE_TIMELINE.map((item) => (
                    <div key={item.title} className="command-prototype__timeline-item">
                      <div className={`command-prototype__timeline-dot command-prototype__timeline-dot--${item.status}`} />
                      <div className="command-prototype__timeline-body">
                        <div className="command-prototype__timeline-top">
                          <strong>{item.title}</strong>
                          <StatusPill status={item.status}>{item.result}</StatusPill>
                        </div>
                        <div className="command-prototype__detail-copy">{item.detail}</div>
                        <div className="command-prototype__timeline-runtime">{item.runtime}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="runtime">
              <Panel
                eyebrow="Execution Runtime"
                title="Runtime health and eligibility"
                subtitle="NEXUS schedules work by runtime capability, not by wishful thinking."
              >
                <div className="command-prototype__runtime-grid">
                  {RUNTIME_CARDS.map((runtime) => (
                    <div key={runtime.title} className="command-prototype__runtime-card">
                      <div className="command-prototype__runtime-head">
                        <strong>{runtime.title}</strong>
                        <StatusPill status={runtime.pill}>{runtime.status}</StatusPill>
                      </div>
                      <div className="command-prototype__detail-copy">{runtime.detail}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="cost">
              <Panel
                eyebrow="Batch + Cost"
                title="Cost center and batch queue"
                subtitle="Realtime work stays governed; batch is a cost lever for non-blocking output only."
              >
                <div id="batch" className="command-prototype__detail-list">
                  {COST_STACK.map((item) => (
                    <div key={item.label} className="command-prototype__detail-row">
                      <div>
                        <div className="command-prototype__detail-label">{item.label}</div>
                        <div className="command-prototype__detail-copy">{item.detail}</div>
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="command-prototype__stack-gap">
                  <div className="cost-provider-table">
                    {COST_PROVIDERS.map((provider) => (
                      <div key={provider.name} className="cost-provider-row">
                        <div className="cost-provider-row__top">
                          <div>
                            <div className="cost-provider-row__name">{provider.name}</div>
                            <div className="cost-provider-row__type">{provider.type}</div>
                          </div>
                          <div className="cost-provider-row__amount">{provider.amount}</div>
                        </div>
                        <div className="cost-provider-row__bar">
                          <div
                            className="cost-provider-row__bar-fill"
                            style={{ width: `${provider.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="traffic-plane">
              <Panel
                eyebrow="Runtime Traffic Plane"
                title="Identity Propagation and policy sample"
                subtitle="This read-only panel shows what a local traffic-plane decision looks like for the DemoApp release path."
                meta={<StatusPill status={statusTone(policyDecisionSample.result || "REQUIRE_APPROVAL")}>{policyDecisionSample.result || "REQUIRE_APPROVAL"}</StatusPill>}
              >
                <div className="command-prototype__sample-grid">
                  {runtimeTrafficRows.map((item) => (
                    <div key={item.label} className="command-prototype__sample-card">
                      <div className="command-prototype__detail-label">{item.label}</div>
                      <strong>{item.value}</strong>
                      <div className="command-prototype__detail-copy">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="local-evidence">
              <Panel
                eyebrow="Local Evidence"
                title="Reports and evidence available on disk"
                subtitle={`Source: ${localReports.lastUpdatedSource || "local snapshot"}. DemoApp evidence stays visible without any API or filesystem reads at runtime.`}
              >
                <div className="command-prototype__stack-gap">
                  <SectionHeading
                    label="Approval Evidence"
                    meta="Local approval decisions become visible after snapshot regeneration. No UI mutation yet."
                  />
                  <div className="command-prototype__sample-grid">
                    <div className="command-prototype__sample-card">
                      <div className="command-prototype__detail-label">approval_granted</div>
                      <strong>{approvalEvidenceCounts.approval_granted || 0}</strong>
                      <div className="command-prototype__detail-copy">
                        Evidence rows that can unlock awaiting_approval transitions.
                      </div>
                    </div>
                    <div className="command-prototype__sample-card">
                      <div className="command-prototype__detail-label">approval_rejected</div>
                      <strong>{approvalEvidenceCounts.approval_rejected || 0}</strong>
                      <div className="command-prototype__detail-copy">
                        Rejections remain auditable and do not unlock execution.
                      </div>
                    </div>
                    <div className="command-prototype__sample-card">
                      <div className="command-prototype__detail-label">approval_expired</div>
                      <strong>{approvalEvidenceCounts.approval_expired || 0}</strong>
                      <div className="command-prototype__detail-copy">
                        Expired approvals remain visible as redacted evidence.
                      </div>
                    </div>
                  </div>

                  {approvalEvidence.length ? (
                    <div className="command-prototype__detail-list">
                      {approvalEvidence.map((record) => (
                        <div key={record.evidenceId} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label mono">
                              {record.evidenceId}
                            </div>
                            <div className="command-prototype__detail-copy">
                              {record.type || "unknown"} · task {record.taskId || "no task"}
                            </div>
                          </div>
                          <StatusPill status={statusTone(record.result || "INFO")}>
                            {record.result || "INFO"}
                          </StatusPill>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state__title">No approval evidence yet</div>
                      <div className="empty-state__body">
                        Use CLI: <span className="mono">npm run approvals:approve -- &lt;id&gt; --reason "approved locally"</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="command-prototype__stack-gap">
                  <SectionHeading
                    label="Local Evidence"
                    meta="Demo reports and validation artifacts remain visible beside approval workflow evidence."
                  />
                </div>
                <div className="command-prototype__detail-list">
                  {localEvidenceRows.map((item) => (
                    <div key={item.id} className="command-prototype__detail-row">
                      <div>
                        <div className="command-prototype__detail-label">{item.name}</div>
                        <div className="command-prototype__detail-copy">{item.path}</div>
                      </div>
                      <StatusPill status={statusTone(item.status)}>{item.status}</StatusPill>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="runtime-files">
              <Panel
                eyebrow="Runtime Files"
                title="Local runtime store summary"
                subtitle="These counts come from the generated runtime snapshot built from local-state/runtime files."
              >
                <div className="command-prototype__sample-grid">
                  {runtimeFileCards.map((item) => (
                    <div key={item.label} className="command-prototype__sample-card">
                      <div className="command-prototype__detail-label">{item.label}</div>
                      <strong>{item.value}</strong>
                      <div className="command-prototype__detail-copy">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="runtime-snapshot">
              <Panel
                eyebrow="Snapshot Metadata"
                title="Runtime Refresh"
                subtitle="The browser consumes a generated module because it cannot safely read local files directly."
                meta={<StatusPill status="done">{runtimeSnapshot.readOnly ? "Read-only" : "Unknown"}</StatusPill>}
              >
                <div className="command-prototype__detail-list">
                  {snapshotMetadataRows.map((item) => (
                    <div key={item.label} className="command-prototype__detail-row">
                      <div>
                        <div className="command-prototype__detail-label">{item.label}</div>
                        <div className="command-prototype__detail-copy">{item.detail}</div>
                      </div>
                      <strong className="mono">{item.value}</strong>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="runtime-tasks">
              <Panel
                eyebrow="Local Task Store"
                title="Recent runtime tasks"
                subtitle="This panel reads the generated summary of local-state/runtime/tasks.json."
              >
                {runtimeTasks.recent?.length ? (
                  <div className="command-prototype__detail-list">
                    {runtimeTasks.recent.map((task) => (
                      <div key={task.taskId} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label mono">{task.taskId}</div>
                          <div className="command-prototype__detail-copy">
                            {task.projectId || "demoapp"} · {task.targetAgent || "unknown"} ·{" "}
                            {task.capabilityId || "no capability"}
                          </div>
                          <div className="command-prototype__detail-copy">
                            Updated {formatDateValue(task.updatedAt || task.createdAt)}
                          </div>
                        </div>
                        <div className="command-prototype__detail-actions">
                          <StatusPill status={taskTone(task.state || "queued")}>
                            {formatStatus(task.state || "queued")}
                          </StatusPill>
                          <PriorityPill priority={task.riskLevel || "medium"}>
                            {task.riskLevel || "medium"}
                          </PriorityPill>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">No local runtime tasks yet</div>
                    <div className="empty-state__body">
                      Run <span className="mono">npm run orchestrator:local-execute</span> to
                      generate local controlled-execution runtime records.
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            <div id="runtime-evidence">
              <Panel
                eyebrow="Evidence Store"
                title="Recent evidence records"
                subtitle="Recent evidence rows are summarized from local-state/runtime/evidence.jsonl."
              >
                {runtimeEvidence.recent?.length ? (
                  <div className="command-prototype__detail-list">
                    {runtimeEvidence.recent.map((record) => (
                      <div key={record.evidenceId} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label mono">
                            {record.evidenceId}
                          </div>
                          <div className="command-prototype__detail-copy">
                            {record.type || "unknown"} · {record.agentId || "unknown"} ·{" "}
                            {record.dataClassification || "unknown"}
                          </div>
                          <div className="command-prototype__detail-copy">
                            Created {formatDateValue(record.createdAt)}
                          </div>
                        </div>
                        <StatusPill status={statusTone(record.result || "INFO")}>
                          {record.result || "INFO"}
                        </StatusPill>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">No evidence records yet</div>
                    <div className="empty-state__body">
                      Controlled local execution will append redacted evidence records here.
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="runtime-audit">
              <Panel
                eyebrow="Audit Trail"
                title="Recent audit events"
                subtitle="Recent audit rows are summarized from local-state/runtime/audit.jsonl."
              >
                {runtimeAudit.recent?.length ? (
                  <div className="command-prototype__detail-list">
                    {runtimeAudit.recent.map((record) => (
                      <div key={record.auditId} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label mono">
                            {record.auditId}
                          </div>
                          <div className="command-prototype__detail-copy">
                            {record.eventType || "unknown"} · {record.actorId || "unknown"} ·{" "}
                            {record.taskId || "no task"}
                          </div>
                        </div>
                        <strong className="mono">{formatDateValue(record.createdAt)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">No audit events yet</div>
                    <div className="empty-state__body">
                      Controlled local execution will append audit records here.
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            <div id="runtime-governance">
              <Panel
                eyebrow="Approvals / Incidents"
                title="Approval Workflow"
                subtitle="Approval requests, decisions, and linked incidents are derived from local runtime JSONL stores."
              >
                <div className="command-prototype__sample-grid">
                  <div className="command-prototype__sample-card">
                    <div className="command-prototype__detail-label">Requested / pending</div>
                    <strong>{approvalWorkflow.requested || 0}</strong>
                    <div className="command-prototype__detail-copy">
                      Pending approvals still waiting on CLI decision.
                    </div>
                  </div>
                  <div className="command-prototype__sample-card">
                    <div className="command-prototype__detail-label">Approved</div>
                    <strong>{approvalWorkflow.approved || 0}</strong>
                    <div className="command-prototype__detail-copy">
                      Approved local decisions with linked approval evidence.
                    </div>
                  </div>
                  <div className="command-prototype__sample-card">
                    <div className="command-prototype__detail-label">Rejected / expired</div>
                    <strong>
                      {(approvalWorkflow.rejected || 0) + (approvalWorkflow.expired || 0)}
                    </strong>
                    <div className="command-prototype__detail-copy">
                      Rejected and expired approvals remain visible in the audit trail.
                    </div>
                  </div>
                </div>

                <div className="command-prototype__detail-list">
                  <div className="command-prototype__detail-row">
                    <div>
                      <div className="command-prototype__detail-label">Approvals total</div>
                      <div className="command-prototype__detail-copy">
                        Consolidated local approval workflow records from approvals.jsonl
                      </div>
                    </div>
                    <strong>{approvalWorkflow.total || runtimeApprovals.total || 0}</strong>
                  </div>
                  <div className="command-prototype__detail-row">
                    <div>
                      <div className="command-prototype__detail-label">Incidents total</div>
                      <div className="command-prototype__detail-copy">
                        Recent incident records from incidents.jsonl
                      </div>
                    </div>
                    <strong>{runtimeIncidents.total || 0}</strong>
                  </div>
                </div>

                <div className="command-prototype__stack-gap">
                  <SectionHeading label="Recent approvals" meta="Requested, approved, rejected, and expired approval records visible from local runtime state." />
                  {approvalWorkflow.recent?.length ? (
                    <div className="command-prototype__detail-list">
                      {approvalWorkflow.recent.map((record) => (
                        <div key={record.approvalId} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label mono">
                              {record.approvalId}
                            </div>
                            <div className="command-prototype__detail-copy">
                              {record.taskId || "no task"} · {record.riskLevel || "unknown"} ·{" "}
                              {record.requestedBy || "unknown"}
                            </div>
                            <div className="command-prototype__detail-copy">
                              {record.type || "unknown"} · linked evidence{" "}
                              {record.linkedEvidenceIds?.length || 0}
                            </div>
                          </div>
                          <StatusPill status={statusTone(record.decision || "requested")}>
                            {record.decision || "requested"}
                          </StatusPill>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state__title">No approval records yet</div>
                      <div className="empty-state__body">
                        Run <span className="mono">npm run orchestrator:local-execute</span> to
                        generate a local approval request, then refresh the snapshot.
                      </div>
                    </div>
                  )}
                </div>

                <div className="command-prototype__stack-gap">
                  <SectionHeading label="Recent incidents" meta="Blocked or security cases visible from local runtime state." />
                  {runtimeIncidents.recent?.length ? (
                    <div className="command-prototype__detail-list">
                      {runtimeIncidents.recent.map((record) => (
                        <div key={record.incidentId} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label mono">
                              {record.incidentId}
                            </div>
                            <div className="command-prototype__detail-copy">
                              {record.type || "unknown"} · {record.severity || "unknown"} ·{" "}
                              {record.taskId || "no task"}
                            </div>
                          </div>
                          <StatusPill status={statusTone(record.status || "open")}>
                            {record.status || "open"}
                          </StatusPill>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state__title">No incident records yet</div>
                      <div className="empty-state__body">
                        Blocked controlled local execution paths will append incidents here when needed.
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="private-validation">
              <Panel
                eyebrow="Local-private view"
                title="Private Project Validation"
                subtitle="Generated private validation snapshot for governed local-private work. Current backend posture is 58/58 PASS, and this panel is read-only and does not run backend tests from the UI."
                meta={
                  <StatusPill status={statusTone(privateValidationStatus.overall || "UNKNOWN")}>
                    {privateValidationStatus.overall || "UNKNOWN"}
                  </StatusPill>
                }
              >
                {privateValidationVisible ? (
                  <>
                    <div className="command-prototype__detail-list">
                      {privateValidationSummaryRows.map((item) => (
                        <div key={item.label} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label">{item.label}</div>
                            <div className="command-prototype__detail-copy">{item.detail}</div>
                          </div>
                          <strong className="mono">{item.value}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="cc-action-row">
                      <button className="cc-action-btn cc-action-btn--disabled" disabled aria-disabled="true">
                        Run Backend Validation
                      </button>
                      <span className="command-prototype__detail-copy">Requires governed action bridge</span>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">Private validation snapshot unavailable</div>
                    <div className="empty-state__body">
                      Run <span className="mono">npm run generate:private-validation-snapshot</span> in local-private mode to surface the governed private-project view.
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            <div id="private-validation-next">
              <Panel
                eyebrow="Read-only next step"
                title="Next Recommended Step"
                subtitle="Recommendations stay evidence-bound and do not trigger execution from the dashboard."
              >
                <div className="command-prototype__sample-grid">
                  <div className="command-prototype__sample-card">
                    <div className="command-prototype__detail-label">Recommended next</div>
                    <strong>{privateValidationRecommendation}</strong>
                    <div className="command-prototype__detail-copy">
                      This is a read-only recommendation derived from the latest private validation snapshot.
                    </div>
                  </div>
                  <div className="command-prototype__sample-card">
                    <div className="command-prototype__detail-label">Snapshot mode</div>
                    <strong>{privateValidation.mode || "demo"}</strong>
                    <div className="command-prototype__detail-copy">
                      Private validation content is generated only in local-private or test mode.
                    </div>
                  </div>
                  <div className="command-prototype__sample-card">
                    <div className="command-prototype__detail-label">Refresh path</div>
                    <strong className="mono">npm run generate:private-validation-snapshot</strong>
                    <div className="command-prototype__detail-copy">
                      Refresh the browser-safe snapshot after new governed private validation artifacts are produced.
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="private-validation-timeline">
              <Panel
                eyebrow="Governed timeline"
                title="Validation Timeline"
                subtitle="Inventory, planning, command classification, controlled validation, remediation, and post-fix validation stay visible as read-only milestones."
              >
                {privateValidationTimeline.length ? (
                  <div className="command-prototype__detail-list">
                    {privateValidationTimeline.map((item) => (
                      <div key={`${item.phase}-${item.title}`} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label">
                            {item.phase} · {item.title}
                          </div>
                          <div className="command-prototype__detail-copy">{item.summary}</div>
                        </div>
                        <StatusPill status={statusTone(item.status)}>{item.status}</StatusPill>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">Validation timeline not available</div>
                    <div className="empty-state__body">
                      Private validation artifacts have not been summarized into the dashboard snapshot yet.
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            <div id="private-validation-evidence">
              <Panel
                eyebrow="Evidence and governance"
                title="Evidence and Governance"
                subtitle="Reports, contracts, evidence, audit, and runtime event references remain visible without exposing source snippets or mutation controls."
              >
                <div className="command-prototype__detail-list">
                  {privateValidationGovernanceRows.map((item) => (
                    <div key={item.label} className="command-prototype__detail-row">
                      <div>
                        <div className="command-prototype__detail-label">{item.label}</div>
                        <div className="command-prototype__detail-copy">{item.detail}</div>
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="command-prototype__stack-gap">
                  <SectionHeading
                    label="Reports and contracts"
                    meta="Linked private validation artifacts remain read-only."
                  />
                  {privateValidationLinkedReports.length ? (
                    <div className="command-prototype__detail-list">
                      {privateValidationLinkedReports.map((artifact) => (
                        <div key={artifact.id} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label">{artifact.title}</div>
                            <div className="command-prototype__detail-copy">{artifact.path}</div>
                          </div>
                          <StatusPill status={statusTone(artifact.status)}>{artifact.status}</StatusPill>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state__title">No linked validation artifacts yet</div>
                      <div className="empty-state__body">
                        Generate the private validation snapshot after governed private validation artifacts are available.
                      </div>
                    </div>
                  )}
                </div>

                <div className="command-prototype__stack-gap">
                  <SectionHeading
                    label="Evidence / audit / runtime records"
                    meta="Redacted runtime references sourced from local-state/runtime."
                  />
                  {privateValidationEvidenceArtifacts.length ? (
                    <div className="command-prototype__detail-list">
                      {privateValidationEvidenceArtifacts.map((artifact) => (
                        <div key={artifact.id} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label">{artifact.title}</div>
                            <div className="command-prototype__detail-copy">{artifact.path}</div>
                          </div>
                          <StatusPill status={statusTone(artifact.status)}>{artifact.status}</StatusPill>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state__title">No governed runtime references yet</div>
                      <div className="empty-state__body">
                        Controlled private validation records will appear here after snapshot refresh.
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="private-validation-hygiene">
              <Panel
                eyebrow="Read-only hygiene"
                title="Known Validation Hygiene"
                subtitle="Private branch validation keeps public/demo safety strict and documents the one known non-blocking report-baseline step."
              >
                <div className="command-prototype__detail-list">
                  {privateValidationKnownIssues.length ? (
                    privateValidationKnownIssues.map((issue) => (
                      <div key={issue.id} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label">{issue.id}</div>
                          <div className="command-prototype__detail-copy">{issue.summary}</div>
                        </div>
                        <StatusPill status={issue.blocking ? "blocked" : "working"}>
                          {issue.blocking ? "blocking" : "non-blocking"}
                        </StatusPill>
                      </div>
                    ))
                  ) : null}
                  <div className="command-prototype__detail-row">
                    <div>
                      <div className="command-prototype__detail-label">Hygiene note</div>
                      <div className="command-prototype__detail-copy">
                        public/demo safety remains strict even when private validation artifacts exist locally.
                      </div>
                    </div>
                  </div>
                  <div className="command-prototype__detail-row">
                    <div>
                      <div className="command-prototype__detail-label">Public/demo safety</div>
                      <div className="command-prototype__detail-copy">
                        Public/demo surfaces remain DemoApp-only or generic private-project wording only.
                      </div>
                    </div>
                    <strong>Strict</strong>
                  </div>
                </div>
              </Panel>
            </div>

            <div id="private-validation-approval-block">
              <Panel
                eyebrow="Approval dependency"
                title="Blocked by Approval"
                subtitle="Private validation stays read-only in the dashboard. No UI mutation yet."
              >
                {privateBlockedApprovalTasks.length ? (
                  <div className="command-prototype__detail-list">
                    {privateBlockedApprovalTasks.map((task) => (
                      <div key={task.taskId} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label mono">
                            {task.taskId}
                          </div>
                          <div className="command-prototype__detail-copy">
                            {task.targetAgent || "unknown"} · {task.capabilityId || "no capability"} ·{" "}
                            {task.riskLevel || "medium"}
                          </div>
                        </div>
                        <StatusPill status={taskTone(task.state || "awaiting_approval")}>
                          {formatStatus(task.state || "awaiting_approval")}
                        </StatusPill>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">No private validation tasks are waiting on approval</div>
                    <div className="empty-state__body">
                      UI mutation is Disabled. Use CLI if a future governed private-project task requires approval.
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="governed-actions">
              <Panel
                eyebrow="Local-private action bridge"
                title="Governed Actions"
                subtitle="Action requests are validated through mode, schema, capability, and governance checks before being recorded. UI cannot execute commands directly."
                meta={
                  <StatusPill status={statusTone(actionBridgeReadiness.status || "UNKNOWN")}>
                    {actionBridgeReadiness.status || "PENDING"}
                  </StatusPill>
                }
              >
                {actionBridgeVisible ? (
                  <div className="command-prototype__detail-list">
                    {actionBridgeRows.map((item) => (
                      <div key={item.label} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label">{item.label}</div>
                          <div className="command-prototype__detail-copy">{item.detail}</div>
                        </div>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">Action bridge snapshot unavailable</div>
                    <div className="empty-state__body">
                      Run <span className="mono">npm run action:bridge-demo</span> in local-private mode to generate the action bridge snapshot.
                    </div>
                  </div>
                )}
                <div className="command-prototype__stack-gap">
                  <SectionHeading label="CLI command" meta="Run locally — not from the browser." />
                  <div className="command-prototype__sample-card">
                    <div className="command-prototype__detail-label">Refresh action bridge</div>
                    <strong className="mono">npm run action:bridge-demo</strong>
                    <div className="command-prototype__detail-copy">
                      Creates one governed action request and routes it through local governance.
                      Does not execute backend tests.
                    </div>
                  </div>
                </div>
                {actionBridgeRecentActions.length > 0 && (
                  <div className="command-prototype__stack-gap">
                    <SectionHeading label="Recent action requests" meta="Read-only." />
                    <div className="command-prototype__detail-list">
                      {actionBridgeRecentActions.map((record) => (
                        <div key={record.actionId} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label mono">
                              {record.actionId.slice(0, 8)}
                            </div>
                            <div className="command-prototype__detail-copy">
                              {record.actionType} · {record.mode}
                            </div>
                          </div>
                          <StatusPill status={statusTone(record.status)}>{record.status}</StatusPill>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            <div id="safety">
              <Panel
                eyebrow="Safety Center"
                title="Governor, policy, and approval pressure"
                subtitle="Unsafe commands, secret exposure, policy violations, and data-classification mistakes stay visible."
              >
                <div className="command-prototype__safety-stack">
                  {SAFETY_EVENTS.map((item) => (
                    <div key={item.title} className="command-prototype__safety-card">
                      <div className="command-prototype__gate-head">
                        <strong>{item.title}</strong>
                        <StatusPill status={item.status}>{item.status}</StatusPill>
                      </div>
                      <div className="command-prototype__detail-copy">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="approvals">
              <Panel
                eyebrow="Approval Blocking"
                title="Blocked by Approval"
                subtitle="Tasks waiting on approval remain read-only in the UI. No UI mutation yet."
              >
                {blockedByApprovalTasks.length ? (
                  <div className="command-prototype__detail-list">
                    {blockedByApprovalTasks.map((task) => (
                      <div key={task.taskId} className="command-prototype__detail-row">
                        <div>
                          <div className="command-prototype__detail-label mono">
                            {task.taskId}
                          </div>
                          <div className="command-prototype__detail-copy">
                            {task.projectId || "demoapp"} · {task.targetAgent || "unknown"} ·{" "}
                            {task.capabilityId || "no capability"}
                          </div>
                          <div className="command-prototype__detail-copy">
                            Waiting on local approval evidence before running.
                          </div>
                        </div>
                        <PriorityPill priority={task.riskLevel || "high"}>
                          {task.riskLevel || "high"}
                        </PriorityPill>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state__title">No local tasks are waiting on approval</div>
                    <div className="empty-state__body">
                      Use CLI: <span className="mono">npm run approvals:list</span>
                    </div>
                  </div>
                )}

                <div className="command-prototype__stack-gap">
                  <SectionHeading
                    label="Read-only operator note"
                    meta='Use CLI: npm run approvals:approve -- &lt;id&gt; --reason "approved locally"'
                  />
                  <div className="command-prototype__detail-copy">
                    Use CLI: <span className="mono">npm run approvals:reject -- &lt;id&gt; --reason "rejected locally"</span>
                  </div>
                </div>
              </Panel>
            </div>
          </section>

          <section className="command-prototype__grid command-prototype__grid--duo">
            <div id="release">
              <Panel
                eyebrow="Release Control"
                title="Release stays evidence-bound"
                subtitle="NEXUS can recommend GO or NO-GO only when the release contract and gate evidence are complete."
                meta={<StatusPill status="blocked">GO / NO-GO placeholder</StatusPill>}
              >
                <div className="go-no-go">
                  <div className="go-no-go__card go-no-go__card--go">
                    <div className="go-no-go__label">GO condition</div>
                    <div className="go-no-go__decision">GO</div>
                    <div className="go-no-go__reason">All 3 gates PASS + approval evidence linked</div>
                  </div>
                  <div className="go-no-go__card go-no-go__card--nogo">
                    <div className="go-no-go__label">Current status</div>
                    <div className="go-no-go__decision">NO-GO</div>
                    <div className="go-no-go__reason">SENTINEL pending · approval evidence missing</div>
                  </div>
                </div>

                <div className="command-prototype__release-head">
                  <div>
                    <span className="eyebrow">Current posture</span>
                    <strong>Blocked pending SENTINEL + approval evidence</strong>
                  </div>
                  <div>
                    <span className="eyebrow">Decision owner</span>
                    <strong>NEXUS with human release authority</strong>
                  </div>
                </div>

                <div className="command-prototype__release-blockers">
                  <SectionHeading label="Blocker list" meta="These must resolve before release GO can exist." />
                  <ul>
                    <li>SENTINEL simulator result is still missing a macOS/Xcode runtime.</li>
                    <li>FORGE deployment approval is pending human approval evidence.</li>
                    <li>Release contract cannot reconcile until both blocking artifacts are linked.</li>
                  </ul>
                </div>

                <div className="command-prototype__release-checklist">
                  <SectionHeading label="Evidence checklist" meta="Release evidence must be visible, linked, and auditable." />
                  {RELEASE_CHECKLIST.map((item) => (
                    <div key={item.label} className="command-prototype__check-row">
                      <span>{item.label}</span>
                      <StatusPill status={item.complete ? "done" : "blocked"}>{item.complete ? "Ready" : "Missing"}</StatusPill>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div id="demo-mode">
              <Panel
                eyebrow="Read-only status"
                title="Not Wired Yet"
                subtitle="Local visibility is real in this phase, but there is No live API, DB, or mutation path yet."
              >
                <div className="command-prototype__demo-stack">
                  {(localReports.notWiredYet || []).map((item) => (
                    <div key={item} className="command-prototype__demo-card">
                      <div className="command-prototype__detail-label">{item}</div>
                      <div className="command-prototype__detail-copy">
                        DemoApp stays in a governed local snapshot mode until future API, DB, and runtime execution wiring exists.
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
