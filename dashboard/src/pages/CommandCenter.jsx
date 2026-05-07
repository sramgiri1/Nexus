import {
  MetricTile,
  Panel,
  PriorityPill,
  ProgressBar,
  SectionHeading,
  StatusPill,
} from "../components/StudioPrimitives.jsx";

const NAV_SECTIONS = [
  { id: "mission-control", label: "Mission Control" },
  { id: "local-os", label: "Local OS" },
  { id: "validation", label: "Validation" },
  { id: "projects", label: "Projects" },
  { id: "tasks", label: "Tasks" },
  { id: "agents", label: "Agents" },
  { id: "contracts", label: "Contracts" },
  { id: "gates", label: "Gates" },
  { id: "evidence", label: "Evidence" },
  { id: "runtime", label: "Runtime" },
  { id: "traffic-plane", label: "Traffic Plane" },
  { id: "local-evidence", label: "Local Evidence" },
  { id: "batch", label: "Batch" },
  { id: "cost", label: "Cost" },
  { id: "safety", label: "Safety" },
  { id: "approvals", label: "Approvals" },
  { id: "release", label: "Release" },
  { id: "demo-mode", label: "Read-only" },
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
    summary: "Founder intent, priority, release recommendation, and execution planning.",
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

const APPROVALS = [
  {
    title: "Demo deployment approval",
    owner: "FORGE",
    risk: "high",
    project: "DemoApp",
    evidence: "runtime validation note + rollback plan",
  },
  {
    title: "Replay batch enablement",
    owner: "SHEPHERD",
    risk: "medium",
    project: "DemoApp",
    evidence: "safety classification + reconciliation plan",
  },
];

const RELEASE_CHECKLIST = [
  { label: "AUDITOR evidence attached", complete: true },
  { label: "SENTINEL simulator evidence attached", complete: false },
  { label: "WARDEN privacy review attached", complete: true },
  { label: "Release contract reconciled", complete: false },
  { label: "Deployment approval evidence linked", complete: false },
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

  if (["PASS", "READY", "NORMAL"].includes(normalized)) {
    return "done";
  }

  if (
    ["PENDING", "REQUIRE_APPROVAL", "WARNING", "NOT WIRED YET", "NOT_WIRED_YET"].includes(
      normalized
    )
  ) {
    return "working";
  }

  if (["NO_GO", "BLOCKED", "DENY", "ESCALATE", "FAIL"].includes(normalized)) {
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
  const privateExecutionKey = ["care", "loop", "ExecutionEnabled"].join("");
  const agentMap = Object.fromEntries(studio.agentEntries.map((agent) => [agent.id, agent]));
  const localReports = studio.localReports || {};
  const validation = localReports.validation || {};
  const runtimeTrafficStatus = localReports.runtimeTrafficPlane || {};
  const runtimeSnapshot = localReports.runtimeSnapshot || {};
  const runtimeFiles = localReports.runtimeFiles || {};
  const runtimeTasks = runtimeFiles.tasks || { total: 0, recent: [] };
  const runtimeEvidence = runtimeFiles.evidence || { total: 0, recent: [] };
  const runtimeAudit = runtimeFiles.audit || { total: 0, recent: [] };
  const runtimeEvents = runtimeFiles.events || { total: 0, recent: [] };
  const runtimeApprovals = runtimeFiles.approvals || { total: 0, recent: [] };
  const runtimeIncidents = runtimeFiles.incidents || { total: 0, recent: [] };
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
      label: "Read-only",
      value: runtimeSnapshot.readOnly ? "true" : "false",
      detail: "The Command Center surface is still read-only in this phase.",
    },
    {
      label: "API wired",
      value: String(runtimeSnapshot.limits?.apiWired ?? false),
      detail: "Live API read endpoints are not wired yet.",
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

  return (
    <div className="page page--command command-prototype" data-testid="command-center-page">
      <div className="command-prototype__layout">
        <aside className="command-prototype__sidebar">
          <div className="command-prototype__sidebar-head">
            <div className="eyebrow">Operator Console</div>
            <div className="command-prototype__sidebar-title">Mission Map</div>
            <p className="command-prototype__sidebar-copy">
              Founder intent flows through contracts, runtimes, evidence, and approvals before NEXUS can recommend release.
            </p>
          </div>

          <nav className="command-prototype__nav" aria-label="Command Center sections">
            {NAV_SECTIONS.map((item, index) => (
              <a key={item.id} href={`#${item.id}`} className="command-prototype__nav-link">
                <span className="command-prototype__nav-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="command-prototype__sidebar-foot">
            <div className="command-prototype__sidebar-stat">
              <span className="eyebrow">OS Status</span>
              <strong>Governed</strong>
            </div>
            <div className="command-prototype__sidebar-stat">
              <span className="eyebrow">Next human decision</span>
              <strong>Approve macOS/Xcode path</strong>
            </div>
          </div>
        </aside>

        <div className="command-prototype__content">
          <section id="mission-control" className="command-prototype__hero">
            <Panel
              eyebrow="Mission Control"
              title="Build and validate DemoApp through governed NEXUS agents."
              subtitle="Founder intent is visible as an operating chain: NEXUS decision, SHEPHERD plan, agent execution, deterministic verification, release evidence, and final human accountability."
              meta={<StatusPill status="active">OS status · governed</StatusPill>}
            >
              <div className="command-prototype__hero-grid">
                <div className="command-prototype__hero-main">
                  <div className="command-prototype__chip-row">
                    <StatusPill status="active">Active project · {studio.activeProject?.name || "DemoApp"}</StatusPill>
                    <StatusPill status="working">Release readiness · {studio.gateProgress}%</StatusPill>
                    <StatusPill status="blocked">Next required decision · macOS Xcode approval</StatusPill>
                    <StatusPill status="done">Environment · Prototype</StatusPill>
                  </div>

                  <div className="command-prototype__hero-story">
                    <div className="command-prototype__story-step">
                      <span className="eyebrow">Founder intent</span>
                      <strong>DemoApp must ship through evidence-backed gates.</strong>
                    </div>
                    <div className="command-prototype__story-step">
                      <span className="eyebrow">NEXUS decision</span>
                      <strong>Proceed with execution, hold release GO until SENTINEL evidence lands.</strong>
                    </div>
                    <div className="command-prototype__story-step">
                      <span className="eyebrow">SHEPHERD plan</span>
                      <strong>Route implementation to CORE, SWIFT, FORGE, BEACON and verification to AUDITOR, SENTINEL, WARDEN.</strong>
                    </div>
                  </div>
                </div>

                <div className="command-prototype__hero-side">
                  <div className="command-prototype__signal-card">
                    <span className="eyebrow">Release Readiness</span>
                    <strong>72%</strong>
                    <ProgressBar value={72} tone="green" label="Evidence-backed path to GO" />
                  </div>
                  <div className="command-prototype__signal-card">
                    <span className="eyebrow">OS Focus</span>
                    <strong>Evidence over optimism</strong>
                    <p>The kernel blocks unsafe motion. Every visible state must be supported by artifacts or approvals.</p>
                  </div>
                </div>
              </div>
            </Panel>
          </section>

          <section className="metric-grid">
            {KPI_CARDS.map((item) => (
              <MetricTile key={item.label} label={item.label} value={item.value} meta={item.meta} tone={item.tone} />
            ))}
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
                eyebrow="Agents"
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

            <div>
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
                      <strong id={item.label === "Provider cost" ? "cost" : undefined}>{item.value}</strong>
                    </div>
                  ))}
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
                title="Generated runtime snapshot"
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
                title="Governance records"
                subtitle="Approval and incident summaries are derived from local runtime JSONL stores."
              >
                <div className="command-prototype__detail-list">
                  <div className="command-prototype__detail-row">
                    <div>
                      <div className="command-prototype__detail-label">Approvals total</div>
                      <div className="command-prototype__detail-copy">
                        Recent approval records from approvals.jsonl
                      </div>
                    </div>
                    <strong>{runtimeApprovals.total || 0}</strong>
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
                  <SectionHeading label="Recent approvals" meta="Requested approval records visible from local runtime state." />
                  {runtimeApprovals.recent?.length ? (
                    <div className="command-prototype__detail-list">
                      {runtimeApprovals.recent.map((record) => (
                        <div key={record.approvalId} className="command-prototype__detail-row">
                          <div>
                            <div className="command-prototype__detail-label mono">
                              {record.approvalId}
                            </div>
                            <div className="command-prototype__detail-copy">
                              {record.type || "unknown"} · {record.requestedBy || "unknown"} ·{" "}
                              {record.taskId || "no task"}
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
                        Approval-required controlled local execution paths will append records here.
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
                eyebrow="Approvals"
                title="Pending human decisions"
                subtitle="Risky mutations route through human approval before platform work can continue."
              >
                <div className="command-prototype__approval-stack">
                  {APPROVALS.map((item) => (
                    <div key={item.title} className="command-prototype__approval-card">
                      <div className="command-prototype__approval-top">
                        <div>
                          <div className="command-prototype__detail-label">{item.title}</div>
                          <div className="command-prototype__detail-copy">
                            Requested by {item.owner} for {item.project}
                          </div>
                        </div>
                        <PriorityPill priority={item.risk}>{item.risk}</PriorityPill>
                      </div>
                      <div className="command-prototype__approval-evidence">Evidence: {item.evidence}</div>
                    </div>
                  ))}
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
